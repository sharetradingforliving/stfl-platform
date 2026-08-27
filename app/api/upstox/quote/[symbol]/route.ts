import { NextResponse } from "next/server";

import {
  getUpstoxReadOnlyAccessToken,
} from "@/lib/upstox/accessToken";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

type InstrumentSearchResult = {
  symbol?: string;
  companyName?: string;
  exchange?: string;
  instrumentKey?: string;
};

type InstrumentSearchResponse = {
  results?: InstrumentSearchResult[];
};

type UpstoxQuote = {
  last_price?: number;
  net_change?: number;
  volume?: number;
  average_price?: number;
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
    UpstoxQuote
  >;
};

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
          error:
            "Stock symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const requestUrl =
      new URL(request.url);

    const { searchParams } =
      requestUrl;

    const requestedExchange:
      "NSE" | "BSE" =
        searchParams
          .get("exchange")
          ?.toUpperCase() ===
        "BSE"
          ? "BSE"
          : "NSE";

    /*
     * Instrument discovery uses the
     * Upstox instrument master and does
     * not require daily authentication.
     */
    const searchUrl =
      new URL(
        "/api/upstox/instruments/search",
        requestUrl.origin
      );

    searchUrl.searchParams.set(
      "q",
      stockSymbol
    );

    const searchResponse =
      await fetch(
        searchUrl.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache: "no-store",
        }
      );

    if (!searchResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Unable to search the Upstox instrument master",
        },
        {
          status:
            searchResponse.status,
        }
      );
    }

    const searchData =
      (await searchResponse.json()) as
        InstrumentSearchResponse;

    const exactMatch =
      searchData.results?.find(
        (instrument) =>
          instrument.symbol
            ?.toUpperCase() ===
            stockSymbol &&
          instrument.exchange
            ?.toUpperCase() ===
            requestedExchange
      );

    const instrumentKey =
      exactMatch
        ?.instrumentKey;

    const companyName =
      exactMatch
        ?.companyName ??
      stockSymbol;

    if (!instrumentKey) {
      return NextResponse.json(
        {
          error:
            `${requestedExchange} equity instrument was not found`,

          symbol:
            stockSymbol,

          exchange:
            requestedExchange,
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Prefer the one-year Analytics
     * Token. Retain the daily OAuth
     * cookie only as a development
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

    const quoteUrl =
      "https://api.upstox.com/v2/market-quote/quotes" +
      `?instrument_key=${encodeURIComponent(
        instrumentKey
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
      (await upstoxResponse.json()) as
        UpstoxQuoteResponse;

    if (!upstoxResponse.ok) {
      console.error(
        "Upstox quote error:",
        upstoxData
      );

      return NextResponse.json(
        {
          error:
            "Unable to fetch Upstox market quote",

          details:
            upstoxData,
        },
        {
          status:
            upstoxResponse.status,
        }
      );
    }

    const quote =
      Object.values(
        upstoxData.data ?? {}
      )[0];

    if (!quote) {
      return NextResponse.json(
        {
          error:
            "Quote data was not found in the Upstox response",
        },
        {
          status: 404,
        }
      );
    }

    const currentPrice =
      typeof quote.last_price ===
        "number"
        ? quote.last_price
        : 0;

    const change =
      typeof quote.net_change ===
        "number"
        ? quote.net_change
        : 0;

    const previousClose =
      currentPrice -
      change;

    const changePercent =
      previousClose !== 0
        ? (
            change /
            previousClose
          ) *
          100
        : 0;

    return NextResponse.json({
      symbol:
        stockSymbol,

      companyName,

      exchange:
        requestedExchange,

      instrumentKey,

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

      volume:
        quote.volume ??
        null,

      averagePrice:
        quote.average_price ??
        null,

      lastUpdated:
        quote.timestamp ??
        null,

      source:
        "Upstox",

      /*
       * Only the authentication method
       * is returned. The secret token is
       * never exposed.
       */
      authenticationSource,
    });
  } catch (error) {
    console.error(
      "Upstox quote route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal server error",

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