import {
  NextResponse,
} from "next/server";

import type {
  PeerCompany,
} from "@/lib/fundamental/types";

import type {
  FundamentalAnalyticsResponse,
} from "@/lib/fundamental/services/fundamentalAnalytics";

import type {
  CompositeValuationWeights,
} from "@/lib/fundamental/services/compositeValuationCalculator";

import {
  getNifty500PeerUniverse,
} from "@/lib/fundamental/services/nifty500PeerUniverse";

import {
  selectNifty500Peers,
} from "@/lib/fundamental/services/nifty500PeerSelection";

import {
  calculatePeerValuation,
} from "@/lib/fundamental/services/peerValuationCalculator";

import {
  calculateCompositeValuation,
} from "@/lib/fundamental/services/compositeValuationCalculator";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

type LoadedAnalytics = {
  symbol: string;

  analytics:
    FundamentalAnalyticsResponse | null;

  error: string | null;
};

function parsePeerSymbols(
  searchParams: URLSearchParams
): string[] {
  const peerValues =
    searchParams.getAll(
      "peers"
    );

  return peerValues
    .flatMap(
      (value) =>
        value.split(",")
    )
    .map(
      (symbol) =>
        symbol
          .trim()
          .toUpperCase()
    )
    .filter(
      (symbol) =>
        symbol.length > 0
    );
}

function parseWeight(
  searchParams:
    URLSearchParams,

  parameterName: string
): number | null {
  const rawValue =
    searchParams.get(
      parameterName
    );

  if (
    rawValue === null ||
    rawValue.trim().length === 0
  ) {
    return null;
  }

  const parsedValue =
    Number(rawValue);

  if (
    !Number.isFinite(
      parsedValue
    ) ||
    parsedValue < 0
  ) {
    return null;
  }

  return parsedValue;
}

function parseCompositeWeights(
  searchParams:
    URLSearchParams
): Partial<
  CompositeValuationWeights
> {
  const dcfWeight =
    parseWeight(
      searchParams,
      "dcfWeight"
    );

  const relativeWeight =
    parseWeight(
      searchParams,
      "relativeWeight"
    );

  const peerWeight =
    parseWeight(
      searchParams,
      "peerWeight"
    );

  const grahamWeight =
    parseWeight(
      searchParams,
      "grahamWeight"
    );

  return {
    ...(dcfWeight !== null
      ? {
          dcf: dcfWeight,
        }
      : {}),

    ...(relativeWeight !== null
      ? {
          relative:
            relativeWeight,
        }
      : {}),

    ...(peerWeight !== null
      ? {
          peer: peerWeight,
        }
      : {}),

    ...(grahamWeight !== null
      ? {
          graham:
            grahamWeight,
        }
      : {}),
  };
}

async function loadFundamentalAnalytics(
  request: Request,
  symbol: string
): Promise<LoadedAnalytics> {
  try {
    const requestUrl =
      new URL(request.url);

    const analyticsUrl =
      new URL(
        `/api/fundamental/analytics/${encodeURIComponent(
          symbol
        )}`,
        requestUrl.origin
      );

      /*
 * Forward fundamental valuation
 * assumptions and benchmarks to the
 * underlying analytics endpoint.
 *
 * Peer-selection and composite-weight
 * parameters are excluded because they
 * do not belong to that endpoint.
 */
const excludedParameters =
  new Set([
    "peers",
    "dcfWeight",
    "relativeWeight",
    "peerWeight",
    "grahamWeight",
  ]);

requestUrl.searchParams.forEach(
  (value, key) => {
    if (
      !excludedParameters.has(
        key
      )
    ) {
      analyticsUrl.searchParams.append(
        key,
        value
      );
    }
  }
);

    const cookieHeader =
      request.headers.get(
        "cookie"
      );

    const headers: HeadersInit = {
      Accept:
        "application/json",
    };

    /*
     * Forward browser cookies so the
     * analytics endpoint can retain its
     * OAuth fallback. The centralized
     * Upstox service will prefer the
     * long-lived Analytics Token.
     */
    if (cookieHeader) {
      headers.Cookie =
        cookieHeader;
    }

    const response =
      await fetch(
        analyticsUrl.toString(),
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return {
        symbol,

        analytics: null,

        error:
          `Fundamental analytics returned HTTP ${response.status}.`,
      };
    }

    const analytics =
      (await response.json()) as
        FundamentalAnalyticsResponse;

    if (
      !Array.isArray(
        analytics
          .annualFinancials
      )
    ) {
      return {
        symbol,

        analytics: null,

        error:
          "The fundamental analytics response had an unexpected structure.",
      };
    }

    return {
      symbol,

      analytics,

      error: null,
    };
  } catch (error) {
    return {
      symbol,

      analytics: null,

      error:
        error instanceof Error
          ? error.message
          : "Unknown analytics error",
    };
  }
}

function analyticsToPeerCompany(
  requestedSymbol: string,

  analytics:
    FundamentalAnalyticsResponse
): PeerCompany {
  const metrics =
    analytics.metrics;

  return {
    symbol:
      requestedSymbol,

    companyName:
      analytics.companyName ??
      requestedSymbol,

    revenueGrowth:
      metrics
        ?.growth
        .revenueGrowth1Y ??
      null,

    patGrowth:
      metrics
        ?.growth
        .patGrowth1Y ??
      null,

    ebitdaMargin:
      metrics
        ?.profitability
        .ebitdaMargin ??
      null,

    returnOnEquity:
      metrics
        ?.profitability
        .returnOnEquity ??
      null,

    returnOnCapitalEmployed:
      metrics
        ?.profitability
        .returnOnCapitalEmployed ??
      null,

    debtToEquity:
      metrics
        ?.balanceSheet
        .debtToEquity ??
      null,

    priceToEarnings:
      metrics
        ?.valuation
        .priceToEarnings ??
      null,

    priceToBook:
      metrics
        ?.valuation
        .priceToBook ??
      null,

    enterpriseValueToEbitda:
      metrics
        ?.valuation
        .enterpriseValueToEbitda ??
      null,
  };
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } =
      await params;

    const stockSymbol =
      symbol
        .trim()
        .toUpperCase();

    if (!stockSymbol) {
      return NextResponse.json(
        {
          status: "error",

          error:
            "Stock symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedPeers =
      parsePeerSymbols(
        searchParams
      );

    const compositeWeights =
      parseCompositeWeights(
        searchParams
      );

    const [
      peerUniverse,
      peerSelection,
    ] = await Promise.all([
      getNifty500PeerUniverse(
        stockSymbol
      ),

      selectNifty500Peers(
        stockSymbol,
        requestedPeers
      ),
    ]);

    /*
     * Return candidate information when
     * the user has not selected enough
     * valid peers.
     */
    if (
      !peerSelection.available
    ) {
      return NextResponse.json(
        {
          status:
            peerUniverse.available
              ? "selection_required"
              : "unavailable",

          symbol:
            stockSymbol,

          requestedPeers,

          compositeWeights,

          peerUniverse,
          peerSelection,

          peerCompanies: [],

          peerValuation: null,

          compositeValuation:
            null,

          analyticsWarnings:
            peerSelection.warnings,

          generatedAt:
            new Date()
              .toISOString(),
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * Load the selected company's
     * fundamental analytics.
     */
    const companyAnalyticsResult =
      await loadFundamentalAnalytics(
        request,
        stockSymbol
      );

    /*
     * Load selected peers sequentially.
     * Each peer may require NSE filing
     * discovery and XBRL processing.
     */
    const peerAnalyticsResults:
      LoadedAnalytics[] = [];

    for (
      const selectedPeer
      of peerSelection
        .selectedPeers
    ) {
      const result =
        await loadFundamentalAnalytics(
          request,
          selectedPeer.symbol
        );

      peerAnalyticsResults.push(
        result
      );
    }

    const peerCompanies:
      PeerCompany[] = [];

    for (
      const result
      of peerAnalyticsResults
    ) {
      if (!result.analytics) {
        continue;
      }

      peerCompanies.push(
        analyticsToPeerCompany(
          result.symbol,
          result.analytics
        )
      );
    }

    const analyticsWarnings =
      [
        companyAnalyticsResult.error
          ? `${stockSymbol}: ${companyAnalyticsResult.error}`
          : null,

        ...peerAnalyticsResults.map(
          (result) =>
            result.error
              ? `${result.symbol}: ${result.error}`
              : null
        ),
      ].filter(
        (
          warning
        ): warning is string =>
          warning !== null
      );

    const companyAnalytics =
      companyAnalyticsResult
        .analytics;

    const peerValuation =
      companyAnalytics
        ? calculatePeerValuation(
            companyAnalytics
              .annualFinancials,

            companyAnalytics
              .metrics,

            companyAnalytics
              .market,

            peerCompanies
          )
        : null;

    /*
     * Combine DCF, relative, peer and
     * Graham valuations only after the
     * peer result has been calculated.
     */
    const compositeValuation =
      companyAnalytics
        ? calculateCompositeValuation(
            {
              currentPrice:
                companyAnalytics
                  .market
                  ?.currentPrice ??
                null,

              dcf:
                companyAnalytics
                  .valuation
                  .dcf,

              relative:
                companyAnalytics
                  .valuation
                  .relative,

              peer:
                peerValuation,

              graham:
                companyAnalytics
                  .valuation
                  .graham,

              weights:
                compositeWeights,
            }
          )
        : null;

    const peerComparisonAvailable =
      peerValuation
        ?.applicable === true;

    const compositeAvailable =
      compositeValuation
        ?.compositeFairValue !==
        null;

    return NextResponse.json(
      {
        status:
          peerComparisonAvailable &&
          compositeAvailable
            ? "success"
            : "partial",

        symbol:
          stockSymbol,

        requestedPeers,

        compositeWeights,

        peerUniverse,
        peerSelection,

        peerCompanies,

        peerValuation,

        compositeValuation,

        analyticsWarnings,

        generatedAt:
          new Date()
            .toISOString(),
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Nifty 500 peer-comparison route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to prepare the Nifty 500 peer comparison and composite valuation.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}