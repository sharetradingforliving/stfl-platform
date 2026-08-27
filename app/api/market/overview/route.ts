import { NextResponse } from "next/server";

import {
  getNifty500Constituents,
} from "@/lib/market/nifty500";

import {
  getUpstoxInstruments,
} from "@/lib/upstox/instrumentMaster";

import {
  getUpstoxReadOnlyAccessToken,
} from "@/lib/upstox/accessToken";

type ResolvedConstituent = {
  companyName: string;
  industry: string;
  symbol: string;
  isin: string;
  instrumentKey: string;
};

type UpstoxQuote = {
  last_price?: number;
  net_change?: number;
  timestamp?: string;
  instrument_token?: string;
  volume?: number;
  average_price?: number;

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
};

type MarketStock = {
  companyName: string;
  industry: string;
  symbol: string;
  isin: string;
  instrumentKey: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number | null;
  lastUpdated: string | null;
};

function normalizeKey(
  value: string
): string {
  return value
    .replace("|", ":")
    .trim()
    .toUpperCase();
}

function createQuoteLookup(
  quoteData:
    Record<string, UpstoxQuote>
): Map<string, UpstoxQuote> {
  const lookup =
    new Map<
      string,
      UpstoxQuote
    >();

  Object.entries(
    quoteData
  ).forEach(
    (
      [
        responseKey,
        quote,
      ]
    ) => {
      lookup.set(
        normalizeKey(
          responseKey
        ),
        quote
      );

      if (
        quote.instrument_token
      ) {
        lookup.set(
          normalizeKey(
            quote
              .instrument_token
          ),
          quote
        );
      }
    }
  );

  return lookup;
}

function formatStock(
  constituent:
    ResolvedConstituent,

  quote:
    UpstoxQuote
): MarketStock {
  const price =
    Number(
      quote.last_price
    ) || 0;

  const change =
    Number(
      quote.net_change
    ) || 0;

  const previousClose =
    price - change;

  const changePercent =
    previousClose !== 0
      ? (
          change /
          previousClose
        ) *
        100
      : 0;

  return {
    companyName:
      constituent.companyName,

    industry:
      constituent.industry,

    symbol:
      constituent.symbol,

    isin:
      constituent.isin,

    instrumentKey:
      constituent.instrumentKey,

    price,
    previousClose,
    change,
    changePercent,

    volume:
      typeof quote.volume ===
        "number"
        ? quote.volume
        : null,

    lastUpdated:
      quote.timestamp ??
      null,
  };
}

export async function GET() {
  try {
    /*
     * Prefer the one-year, read-only
     * Analytics Token. Retain the daily
     * OAuth cookie as a development
     * fallback.
     */
    const tokenResult =
      await getUpstoxReadOnlyAccessToken();

    if (!tokenResult) {
      return NextResponse.json(
        {
          error:
            "Upstox read-only access token is missing",

          instruction:
            "Add UPSTOX_ANALYTICS_TOKEN to frontend/.env.local or authorize Upstox through /api/upstox/login.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      accessToken,
      source:
        authenticationSource,
    } = tokenResult;

    const [
      constituents,
      upstoxInstruments,
    ] = await Promise.all([
      getNifty500Constituents(),
      getUpstoxInstruments(),
    ]);

    const nseEquitiesByIsin =
      new Map<
        string,
        {
          instrumentKey: string;
          symbol: string;
        }
      >();

    upstoxInstruments.forEach(
      (instrument) => {
        const segment =
          instrument.segment
            ?.toUpperCase() ??
          "";

        const instrumentType =
          instrument
            .instrument_type
            ?.toUpperCase() ??
          "";

        const isin =
          instrument.isin
            ?.trim()
            .toUpperCase() ??
          "";

        const instrumentKey =
          instrument
            .instrument_key ??
          "";

        const symbol =
          instrument
            .trading_symbol ??
          "";

        if (
          segment === "NSE_EQ" &&
          instrumentType ===
            "EQ" &&
          isin &&
          instrumentKey
        ) {
          nseEquitiesByIsin.set(
            isin,
            {
              instrumentKey,
              symbol,
            }
          );
        }
      }
    );

    const resolvedConstituents:
      ResolvedConstituent[] = [];

    const unresolvedConstituents:
      string[] = [];

    constituents.forEach(
      (constituent) => {
        const matchedInstrument =
          nseEquitiesByIsin.get(
            constituent.isin
          );

        if (!matchedInstrument) {
          unresolvedConstituents.push(
            constituent.symbol
          );

          return;
        }

        resolvedConstituents.push({
          companyName:
            constituent.companyName,

          industry:
            constituent.industry,

          symbol:
            matchedInstrument
              .symbol ||
            constituent.symbol,

          isin:
            constituent.isin,

          instrumentKey:
            matchedInstrument
              .instrumentKey,
        });
      }
    );

    if (
      resolvedConstituents
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No Nifty 500 companies could be matched with the Upstox instrument master",
        },
        {
          status: 500,
        }
      );
    }

    if (
      resolvedConstituents
        .length > 500
    ) {
      return NextResponse.json(
        {
          error:
            "The resolved market universe exceeds the Upstox limit of 500 instruments",

          resolvedCount:
            resolvedConstituents
              .length,
        },
        {
          status: 500,
        }
      );
    }

    const instrumentKeys =
      resolvedConstituents.map(
        (constituent) =>
          constituent
            .instrumentKey
      );

    const quoteUrl =
      "https://api.upstox.com/v2/market-quote/quotes" +
      `?instrument_key=${encodeURIComponent(
        instrumentKeys.join(",")
      )}`;

    const upstoxResponse =
      await fetch(
        quoteUrl,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const upstoxData =
      await upstoxResponse.json();

    if (
      !upstoxResponse.ok
    ) {
      console.error(
        "Nifty 500 quote error:",
        upstoxData
      );

      return NextResponse.json(
        {
          error:
            "Unable to fetch Nifty 500 live quotes",

          details:
            upstoxData,
        },
        {
          status:
            upstoxResponse.status,
        }
      );
    }

    const quoteData = (
      upstoxData.data ?? {}
    ) as Record<
      string,
      UpstoxQuote
    >;

    const quoteLookup =
      createQuoteLookup(
        quoteData
      );

    const marketStocks =
      resolvedConstituents
        .map(
          (constituent) => {
            const quote =
              quoteLookup.get(
                normalizeKey(
                  constituent
                    .instrumentKey
                )
              );

            if (!quote) {
              return null;
            }

            return formatStock(
              constituent,
              quote
            );
          }
        )
        .filter(
          (
            stock
          ): stock is MarketStock =>
            stock !== null
        );

    const advances =
      marketStocks.filter(
        (stock) =>
          stock.change > 0
      );

    const declines =
      marketStocks.filter(
        (stock) =>
          stock.change < 0
      );

    const unchanged =
      marketStocks.filter(
        (stock) =>
          stock.change === 0
      );

    const topGainers = [
      ...advances,
    ]
      .sort(
        (first, second) =>
          second.changePercent -
          first.changePercent
      )
      .slice(0, 5);

    const topLosers = [
      ...declines,
    ]
      .sort(
        (first, second) =>
          first.changePercent -
          second.changePercent
      )
      .slice(0, 5);

    const directionalTotal =
      advances.length +
      declines.length;

    const advancePercentage =
      directionalTotal > 0
        ? (
            advances.length /
            directionalTotal
          ) *
          100
        : 0;

    const declinePercentage =
      directionalTotal > 0
        ? (
            declines.length /
            directionalTotal
          ) *
          100
        : 0;

    return NextResponse.json({
      status:
        "success",

      marketDataStatus:
        "live",

      authenticationSource,

      universe: {
        name:
          "NIFTY 500",

        expectedCount:
          constituents.length,

        resolvedCount:
          resolvedConstituents
            .length,

        quotedCount:
          marketStocks.length,

        unresolvedConstituents,
      },

      breadth: {
        advances:
          advances.length,

        declines:
          declines.length,

        unchanged:
          unchanged.length,

        advancePercentage,
        declinePercentage,
      },

      topGainers,
      topLosers,

      source: {
        constituents:
          "Nifty Indices",

        marketData:
          "Upstox",
      },

      fetchedAt:
        new Date()
          .toISOString(),
    });
  } catch (error) {
    console.error(
      "Nifty 500 market overview error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to prepare the Nifty 500 market overview",

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