import { NextResponse } from "next/server";

import {
  getUpstoxReadOnlyAccessToken,
} from "@/lib/upstox/accessToken";

type UpstoxIndexQuote = {
  last_price?: number;
  net_change?: number;
  timestamp?: string;

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
};

type UpstoxQuoteResponse = {
  data?: Record<
    string,
    UpstoxIndexQuote
  >;
};

type IndexCategory =
  | "BENCHMARK"
  | "BROAD_MARKET"
  | "SECTOR";

type IndexConfiguration = {
  symbol: string;
  displayName: string;
  instrumentKey: string;
  category: IndexCategory;
  showInHeader: boolean;
  displayOrder: number;
};

const INDEX_CONFIGURATIONS:
  IndexConfiguration[] = [
    {
      symbol: "NIFTY50",
      displayName: "NIFTY 50",
      instrumentKey:
        "NSE_INDEX|Nifty 50",
      category: "BENCHMARK",
      showInHeader: true,
      displayOrder: 1,
    },
    {
      symbol: "BANKNIFTY",
      displayName: "BANK NIFTY",
      instrumentKey:
        "NSE_INDEX|Nifty Bank",
      category: "BENCHMARK",
      showInHeader: true,
      displayOrder: 2,
    },
    {
      symbol: "NIFTYNEXT50",
      displayName: "NIFTY NEXT 50",
      instrumentKey:
        "NSE_INDEX|Nifty Next 50",
      category: "BROAD_MARKET",
      showInHeader: false,
      displayOrder: 3,
    },
    {
      symbol: "NIFTYMIDCAP100",
      displayName: "NIFTY MIDCAP 100",
      instrumentKey:
        "NSE_INDEX|NIFTY MIDCAP 100",
      category: "BROAD_MARKET",
      showInHeader: false,
      displayOrder: 4,
    },
    {
      symbol: "NIFTYSMALLCAP100",
      displayName:
        "NIFTY SMALLCAP 100",
      instrumentKey:
        "NSE_INDEX|NIFTY SMLCAP 100",
      category: "BROAD_MARKET",
      showInHeader: false,
      displayOrder: 5,
    },
    {
      symbol: "NIFTYAUTO",
      displayName: "NIFTY AUTO",
      instrumentKey:
        "NSE_INDEX|Nifty Auto",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 6,
    },
    {
      symbol: "NIFTYIT",
      displayName: "NIFTY IT",
      instrumentKey:
        "NSE_INDEX|Nifty IT",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 7,
    },
    {
      symbol: "NIFTYFIN",
      displayName:
        "NIFTY FINANCIAL SERVICES",
      instrumentKey:
        "NSE_INDEX|Nifty Fin Service",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 8,
    },
    {
      symbol: "NIFTYFMCG",
      displayName: "NIFTY FMCG",
      instrumentKey:
        "NSE_INDEX|Nifty FMCG",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 9,
    },
    {
      symbol: "NIFTYPHARMA",
      displayName: "NIFTY PHARMA",
      instrumentKey:
        "NSE_INDEX|Nifty Pharma",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 10,
    },
    {
      symbol: "NIFTYMETAL",
      displayName: "NIFTY METAL",
      instrumentKey:
        "NSE_INDEX|Nifty Metal",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 11,
    },
    {
      symbol: "NIFTYREALTY",
      displayName: "NIFTY REALTY",
      instrumentKey:
        "NSE_INDEX|Nifty Realty",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 12,
    },
    {
      symbol: "NIFTYPSUBANK",
      displayName: "NIFTY PSU BANK",
      instrumentKey:
        "NSE_INDEX|Nifty PSU Bank",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 13,
    },
    {
      symbol: "NIFTYPVTBANK",
      displayName:
        "NIFTY PRIVATE BANK",
      instrumentKey:
        "NSE_INDEX|Nifty Pvt Bank",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 14,
    },
    {
      symbol: "NIFTYOILGAS",
      displayName:
        "NIFTY OIL & GAS",
      instrumentKey:
        "NSE_INDEX|Nifty Oil and Gas",
      category: "SECTOR",
      showInHeader: false,
      displayOrder: 15,
    },
  ];

async function fetchIndexQuote(
  configuration:
    IndexConfiguration,

  accessToken: string
) {
  const quoteUrl =
    "https://api.upstox.com/v2/market-quote/quotes" +
    `?instrument_key=${encodeURIComponent(
      configuration.instrumentKey
    )}`;

  const response =
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

  const responseData =
    (await response.json()) as
      UpstoxQuoteResponse;

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}`
    );
  }

  const quote =
    Object.values(
      responseData.data ?? {}
    )[0];

  if (!quote) {
    throw new Error(
      "Quote was not found"
    );
  }

  const currentPrice =
    typeof quote.last_price ===
      "number" &&
    Number.isFinite(
      quote.last_price
    )
      ? quote.last_price
      : null;

  const change =
    typeof quote.net_change ===
      "number" &&
    Number.isFinite(
      quote.net_change
    )
      ? quote.net_change
      : null;

  const ohlcClose =
    typeof quote.ohlc?.close ===
      "number" &&
    Number.isFinite(
      quote.ohlc.close
    )
      ? quote.ohlc.close
      : null;

  const previousClose =
    currentPrice !== null &&
    change !== null
      ? currentPrice - change
      : ohlcClose;

  const changePercent =
    change !== null &&
    previousClose !== null &&
    previousClose !== 0
      ? (
          change /
          previousClose
        ) *
        100
      : null;

  return {
    symbol:
      configuration.symbol,

    displayName:
      configuration.displayName,

    instrumentKey:
      configuration.instrumentKey,

    category:
      configuration.category,

    showInHeader:
      configuration.showInHeader,

    displayOrder:
      configuration.displayOrder,

    currentPrice,

    previousClose,

    change,

    changePercent,

    open:
      quote.ohlc?.open ??
      null,

    high:
      quote.ohlc?.high ??
      null,

    low:
      quote.ohlc?.low ??
      null,

    lastUpdated:
      quote.timestamp ??
      null,

    source:
      "Upstox",
  };
}

export async function GET(
  request: Request
) {
  try {
    const requestUrl =
      new URL(request.url);

    const scope =
      requestUrl.searchParams
        .get("scope")
        ?.toLowerCase();

    /*
     * The navigation header needs only
     * Nifty 50 and Bank Nifty.
     *
     * The Market Intelligence page uses
     * scope=all to request the complete
     * configured index collection.
     */
    const selectedConfigurations =
      scope === "all"
        ? INDEX_CONFIGURATIONS
        : INDEX_CONFIGURATIONS.filter(
            (configuration) =>
              configuration
                .showInHeader
          );

    const tokenResult =
      await getUpstoxReadOnlyAccessToken();

    if (!tokenResult) {
      return NextResponse.json(
        {
          status:
            "unavailable",

          error:
            "Upstox read-only access token is missing.",

          indices: [],
          errors: [],
        },
        {
          status: 401,
        }
      );
    }

    const results =
      await Promise.allSettled(
        selectedConfigurations.map(
          (configuration) =>
            fetchIndexQuote(
              configuration,
              tokenResult.accessToken
            )
        )
      );

    const indices =
      results
        .flatMap(
          (result) =>
            result.status ===
            "fulfilled"
              ? [result.value]
              : []
        )
        .sort(
          (first, second) =>
            first.displayOrder -
            second.displayOrder
        );

    const errors =
      results.flatMap(
        (
          result,
          index
        ) =>
          result.status ===
          "rejected"
            ? [
                `${
                  selectedConfigurations[
                    index
                  ].displayName
                }: ${
                  result.reason instanceof
                  Error
                    ? result.reason
                        .message
                    : "Unknown error"
                }`,
              ]
            : []
      );

    return NextResponse.json({
      status:
        indices.length ===
        selectedConfigurations.length
          ? "success"
          : indices.length > 0
            ? "partial"
            : "unavailable",

      scope:
        scope === "all"
          ? "all"
          : "header",

      requestedCount:
        selectedConfigurations.length,

      availableCount:
        indices.length,

      indices,

      errors,

      lastUpdated:
        new Date().toISOString(),

      source:
        "Upstox",

      authenticationSource:
        tokenResult.source,
    });
  } catch (error) {
    console.error(
      "Upstox indices route error:",
      error
    );

    return NextResponse.json(
      {
        status:
          "unavailable",

        error:
          "Unable to load index market data.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",

        indices: [],
        errors: [],
      },
      {
        status: 500,
      }
    );
  }
}