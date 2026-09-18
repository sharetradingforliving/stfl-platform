/**
 * ================================================================
 * STFL Fundamental Screener Snapshot Publisher
 * Route: /api/fundamental/screener/publish
 *
 * Processes a small, resumable batch of NSE company equities,
 * converts existing verified analytics into screener snapshots and
 * synchronizes them with FastAPI/Neon.
 * ================================================================
 */

import "server-only";

import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { getAllNseEquities } from
  "@/lib/market/allNseEquities";

import type {
  FundamentalResearchResponse,
  ValuationLabel,
} from "@/lib/fundamental/types";


export const dynamic = "force-dynamic";
export const maxDuration = 300;


const BACKEND_BASE_URL =
  (
    process.env.STFL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8001"
  ).replace(/\/$/, "");

const DEFAULT_BATCH_SIZE = 5;
const MAXIMUM_BATCH_SIZE = 20;


type PublishRequest = {
  cursor?: number;
  limit?: number;
};

type ValuationSnapshot = {
  currentPrice: number | null;
  fairValue: number | null;
  upsidePercent: number | null;
  classification: ValuationLabel | null;
};

type ScreenerSnapshot = {
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  subIndustry: string | null;
  marketCapCr: number | null;
  marketCapCategory: string | null;
  latestAnnualPeriod: string | null;
  revenueCagrPercent: number | null;
  patCagrPercent: number | null;
  roePercent: number | null;
  rocePercent: number | null;
  debtToEquity: number | null;
  operatingCashFlowToPat: number | null;
  priceToEarnings: number | null;
  priceToBook: number | null;
  dividendYieldPercent: number | null;
  dividendPayoutPercent: number | null;
  dividendConsistencyYears: number;
  dataQualityScore: number;
  valuations: Record<string, ValuationSnapshot>;
  sourceFingerprint: string;
  sourceUpdatedAt: string;
};


function finiteNumber(
  value: unknown
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}


function calculateUpside(
  currentPrice: number | null,
  fairValue: number | null
): number | null {
  if (
    currentPrice === null ||
    fairValue === null ||
    currentPrice <= 0
  ) {
    return null;
  }

  return (
    (fairValue - currentPrice) /
    currentPrice
  ) * 100;
}


function newestAnnualPeriod(
  analytics: FundamentalResearchResponse
) {
  return analytics.annualFinancials
    .filter((period) => period.endDate)
    .slice()
    .sort((first, second) =>
      (second.endDate ?? "").localeCompare(
        first.endDate ?? ""
      )
    )[0] ?? null;
}


function makeValuation(
  currentPrice: number | null,
  fairValue: number | null,
  suppliedUpside: number | null,
  classification: ValuationLabel | null
): ValuationSnapshot {
  return {
    currentPrice,
    fairValue,
    upsidePercent:
      suppliedUpside ??
      calculateUpside(
        currentPrice,
        fairValue
      ),
    classification,
  };
}


function buildValuations(
  analytics: FundamentalResearchResponse
): Record<string, ValuationSnapshot> {
  const currentPrice = finiteNumber(
    analytics.market?.currentPrice
  );

  const valuations:
    Record<string, ValuationSnapshot> = {};

  const { valuation } = analytics;

  if (valuation.composite) {
    valuations.composite = makeValuation(
      currentPrice,
      finiteNumber(
        valuation.composite
          .compositeFairValue
      ),
      finiteNumber(
        valuation.composite
          .upsideDownsidePercent
      ),
      valuation.composite.valuationLabel
    );
  }

  if (valuation.dcf?.applicable) {
    valuations.dcf = makeValuation(
      currentPrice,
      finiteNumber(
        valuation.dcf.selectedFairValue
      ),
      null,
      valuation.dcf.valuationLabel
    );
  }

  if (valuation.relative?.applicable) {
    valuations.relative = makeValuation(
      currentPrice,
      finiteNumber(
        valuation.relative
          .weightedFairValue
      ),
      finiteNumber(
        valuation.relative
          .upsideDownsidePercent
      ),
      valuation.relative.valuationLabel
    );
  }

  if (valuation.peer?.applicable) {
    valuations.peer = makeValuation(
      currentPrice,
      finiteNumber(
        valuation.peer.impliedFairValue
      ),
      null,
      valuation.peer.valuationLabel
    );
  }

  if (valuation.graham?.applicable) {
    valuations.graham = makeValuation(
      currentPrice,
      finiteNumber(
        valuation.graham
          .fairValuePerShare
      ),
      finiteNumber(
        valuation.graham
          .upsideDownsidePercent
      ),
      valuation.graham.valuationLabel
    );
  }

  return valuations;
}


function buildDataQualityScore(
  values: unknown[]
): number {
  const available = values.filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      (
        typeof value !== "number" ||
        Number.isFinite(value)
      )
  ).length;

  return Number(
    (
      available /
      Math.max(values.length, 1) *
      100
    ).toFixed(2)
  );
}


function buildSnapshot(
  analytics: FundamentalResearchResponse
): ScreenerSnapshot | null {
  if (
    analytics.status === "unavailable" ||
    !analytics.company?.symbol
  ) {
    return null;
  }

  const metrics = analytics.metrics;
  const latestAnnual =
    newestAnnualPeriod(analytics);

  const revenueCagr = finiteNumber(
    metrics?.growth.revenueCagr3Y
  ) ?? finiteNumber(
    metrics?.growth.revenueCagrAvailable
  );

  const patCagr = finiteNumber(
    metrics?.growth.patCagr3Y
  ) ?? finiteNumber(
    metrics?.growth.patCagrAvailable
  );

  const roe = finiteNumber(
    metrics?.profitability.returnOnEquity
  );

  const roce = finiteNumber(
    metrics?.profitability
      .returnOnCapitalEmployed
  );

  const debtToEquity = finiteNumber(
    metrics?.balanceSheet.debtToEquity
  );

  const ocfToPat = finiteNumber(
    metrics?.cashFlow
      .operatingCashFlowToPat
  );

  const pe = finiteNumber(
    metrics?.valuation.priceToEarnings
  );

  const pb = finiteNumber(
    metrics?.valuation.priceToBook
  );

  const dividendYield = finiteNumber(
    metrics?.valuation.dividendYield
  );

  const latestDps = finiteNumber(
    latestAnnual?.dividendPerShare
  );

  const latestEps = finiteNumber(
    latestAnnual?.epsDiluted
  ) ?? finiteNumber(
    latestAnnual?.epsBasic
  );

  const dividendPayout =
    latestDps !== null &&
    latestEps !== null &&
    latestEps > 0
      ? latestDps / latestEps * 100
      : null;

  const dividendConsistencyYears =
    analytics.annualFinancials
      .slice()
      .sort((first, second) =>
        (second.endDate ?? "").localeCompare(
          first.endDate ?? ""
        )
      )
      .slice(0, 5)
      .filter((period) => {
        const dividend = finiteNumber(
          period.dividendPerShare
        );
        return dividend !== null &&
          dividend > 0;
      }).length;

  const valuations =
    buildValuations(analytics);

  const marketCap = finiteNumber(
    analytics.market?.marketCapitalization
  );

  const latestPeriod =
    latestAnnual?.endDate ?? null;

  const dataQualityScore =
    buildDataQualityScore([
      analytics.company.classification.sector,
      analytics.company.classification.industry,
      marketCap,
      latestPeriod,
      revenueCagr,
      patCagr,
      roe,
      roce,
      debtToEquity,
      ocfToPat,
      pe,
      pb,
      Object.keys(valuations).length > 0
        ? true
        : null,
    ]);

  const fingerprintSource = JSON.stringify({
    symbol: analytics.company.symbol,
    generatedAt: analytics.generatedAt,
    latestPeriod,
    marketCap,
    revenueCagr,
    patCagr,
    roe,
    roce,
    debtToEquity,
    ocfToPat,
    pe,
    pb,
    valuations,
  });

  return {
    symbol:
      analytics.company.symbol
        .trim()
        .toUpperCase(),
    companyName:
      analytics.company.companyName.trim(),
    exchange: analytics.company.exchange,
    sector:
      analytics.company.classification.sector,
    industry:
      analytics.company.classification.industry,
    subIndustry:
      analytics.company.classification
        .subIndustry,
    marketCapCr: marketCap,
    marketCapCategory:
      analytics.company.classification
        .marketCapCategory,
    latestAnnualPeriod: latestPeriod,
    revenueCagrPercent: revenueCagr,
    patCagrPercent: patCagr,
    roePercent: roe,
    rocePercent: roce,
    debtToEquity,
    operatingCashFlowToPat: ocfToPat,
    priceToEarnings: pe,
    priceToBook: pb,
    dividendYieldPercent: dividendYield,
    dividendPayoutPercent: dividendPayout,
    dividendConsistencyYears,
    dataQualityScore,
    valuations,
    sourceFingerprint:
      createHash("sha256")
        .update(fingerprintSource)
        .digest("hex"),
    sourceUpdatedAt: analytics.generatedAt,
  };
}


function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.trunc(value))
  );
}


async function pause(
  milliseconds: number
) {
  await new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}


export async function POST(
  request: Request
) {
  const configuredToken =
    process.env.STFL_SCREENER_SYNC_TOKEN;

  if (!configuredToken) {
    return NextResponse.json(
      {
        error:
          "STFL_SCREENER_SYNC_TOKEN is not configured.",
      },
      { status: 503 }
    );
  }

  const suppliedToken = request.headers.get(
    "X-STFL-Screener-Sync-Token"
  );

  if (suppliedToken !== configuredToken) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 }
    );
  }

  let body: PublishRequest = {};

  try {
    body = await request.json() as
      PublishRequest;
  } catch {
    body = {};
  }

  const cursor = boundedInteger(
    body.cursor,
    0,
    0,
    Number.MAX_SAFE_INTEGER
  );

  const limit = boundedInteger(
    body.limit,
    DEFAULT_BATCH_SIZE,
    1,
    MAXIMUM_BATCH_SIZE
  );

  try {
    const universe =
      await getAllNseEquities();

    const companyEquities =
      universe.equities.filter(
        (instrument) =>
          instrument.instrumentType ===
            "EQ" &&
          instrument.exchange === "NSE"
      );

    const batch = companyEquities.slice(
      cursor,
      cursor + limit
    );

    const snapshots: ScreenerSnapshot[] = [];
    const skipped: Array<{
      symbol: string;
      reason: string;
    }> = [];

    const cookie =
      request.headers.get("cookie");

    for (const instrument of batch) {
      try {
        const analyticsUrl = new URL(
          `/api/fundamental/analytics/${encodeURIComponent(
            instrument.symbol
          )}`,
          request.url
        );

        const headers = new Headers({
          Accept: "application/json",
        });

        if (cookie) {
          headers.set("Cookie", cookie);
        }

        const response = await fetch(
          analyticsUrl,
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          skipped.push({
            symbol: instrument.symbol,
            reason:
              `Analytics returned ${response.status}.`,
          });
          continue;
        }

        const analytics =
          await response.json() as
            FundamentalResearchResponse;

        const snapshot =
          buildSnapshot(analytics);

        if (!snapshot) {
          skipped.push({
            symbol: instrument.symbol,
            reason:
              "Verified analytics were unavailable.",
          });
          continue;
        }

        snapshots.push(snapshot);
      } catch (error) {
        skipped.push({
          symbol: instrument.symbol,
          reason:
            error instanceof Error
              ? error.message
              : "Unknown analytics error.",
        });
      } finally {
        await pause(250);
      }
    }

    let synchronization = {
      inserted: 0,
      updated: 0,
      total: 0,
    };

    if (snapshots.length > 0) {
      const syncResponse = await fetch(
        `${BACKEND_BASE_URL}/api/fundamental/screener/snapshots/sync`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-STFL-Screener-Sync-Token":
              configuredToken,
          },
          body: JSON.stringify({
            snapshots,
          }),
        }
      );

      const syncPayload =
        await syncResponse.json() as {
          inserted?: number;
          updated?: number;
          total?: number;
          detail?: string;
        };

      if (!syncResponse.ok) {
        throw new Error(
          syncPayload.detail ??
          `Snapshot synchronization returned ${syncResponse.status}.`
        );
      }

      synchronization = {
        inserted:
          syncPayload.inserted ?? 0,
        updated:
          syncPayload.updated ?? 0,
        total:
          syncPayload.total ?? 0,
      };
    }

    const nextCursor = cursor + batch.length;
    const complete =
      nextCursor >= companyEquities.length;

    return NextResponse.json(
      {
        status: "success",
        universeTotal:
          companyEquities.length,
        cursor,
        batchSize: batch.length,
        nextCursor:
          complete ? null : nextCursor,
        remaining: Math.max(
          companyEquities.length -
            nextCursor,
          0
        ),
        complete,
        synchronized: synchronization,
        skipped,
        generatedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Fundamental screener publisher error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to publish screener snapshots.",
      },
      { status: 500 }
    );
  }
}
