import { NextResponse } from "next/server";

import {
  getUpstoxInstruments,
} from "@/lib/upstox/instrumentMaster";

import {
  getUpstoxReadOnlyAccessToken,
} from "@/lib/upstox/accessToken";

type TickerInstrument = {
  name: string;
  symbol: string;
  instrumentKey: string;
};

type UpstoxQuote = {
  last_price?: number;
  net_change?: number;
  timestamp?: string;
  instrument_token?: string;

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
};

const indexInstruments:
  TickerInstrument[] = [
    {
      name: "NIFTY 50",
      symbol: "NIFTY 50",
      instrumentKey:
        "NSE_INDEX|Nifty 50",
    },
    {
      name: "BANK NIFTY",
      symbol: "BANK NIFTY",
      instrumentKey:
        "NSE_INDEX|Nifty Bank",
    },
    {
      name: "SENSEX",
      symbol: "SENSEX",
      instrumentKey:
        "BSE_INDEX|SENSEX",
    },
    {
      name: "INDIA VIX",
      symbol: "INDIA VIX",
      instrumentKey:
        "NSE_INDEX|India VIX",
    },
  ];

const stockSymbols = [
  "ADANIENT",
  "ADANIPORTS",
  "APOLLOHOSP",
  "ASIANPAINT",
  "AXISBANK",
  "BAJAJ-AUTO",
  "BAJFINANCE",
  "BAJAJFINSV",
  "BEL",
  "BHARTIARTL",
  "CIPLA",
  "COALINDIA",
  "DRREDDY",
  "EICHERMOT",
  "ETERNAL",
  "GRASIM",
  "HCLTECH",
  "HDFCBANK",
  "HDFCLIFE",
  "HEROMOTOCO",
  "HINDALCO",
  "HINDUNILVR",
  "ICICIBANK",
  "INDUSINDBK",
  "INFY",
  "ITC",
  "JIOFIN",
  "JSWSTEEL",
  "KOTAKBANK",
  "LT",
  "M&M",
  "MARUTI",
  "MAXHEALTH",
  "NESTLEIND",
  "NTPC",
  "ONGC",
  "POWERGRID",
  "RELIANCE",
  "SBILIFE",
  "SBIN",
  "SHRIRAMFIN",
  "SUNPHARMA",
  "TATACONSUM",
  "TMPV",
  "TMCV",
  "TATASTEEL",
  "TCS",
  "TECHM",
  "TRENT",
  "ULTRACEMCO",
  "WIPRO",
];

function normalizeKey(
  value: string
): string {
  return value
    .replace("|", ":")
    .trim()
    .toUpperCase();
}

function findQuote(
  quoteData:
    Record<string, UpstoxQuote>,

  instrumentKey: string
): UpstoxQuote | null {
  const normalizedRequestedKey =
    normalizeKey(
      instrumentKey
    );

  const directQuote =
    quoteData[instrumentKey] ??
    quoteData[
      instrumentKey.replace(
        "|",
        ":"
      )
    ];

  if (directQuote) {
    return directQuote;
  }

  const matchingEntry =
    Object.entries(
      quoteData
    ).find(
      (
        [
          responseKey,
          quote,
        ]
      ) => {
        const responseKeyMatches =
          normalizeKey(
            responseKey
          ) ===
          normalizedRequestedKey;

        const instrumentTokenMatches =
          quote.instrument_token
            ? normalizeKey(
                quote
                  .instrument_token
              ) ===
              normalizedRequestedKey
            : false;

        return (
          responseKeyMatches ||
          instrumentTokenMatches
        );
      }
    );

  return (
    matchingEntry?.[1] ??
    null
  );
}

export async function GET() {
  try {
    /*
     * Prefer the one-year, read-only
     * Analytics Token. The daily OAuth
     * cookie remains a development
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

    const instruments =
      await getUpstoxInstruments();

    const requiredSymbols =
      new Set(
        stockSymbols.map(
          (symbol) =>
            symbol.toUpperCase()
        )
      );

    const resolvedStocks =
      instruments
        .filter(
          (instrument) => {
            const symbol =
              instrument
                .trading_symbol
                ?.toUpperCase() ??
              "";

            const segment =
              instrument.segment
                ?.toUpperCase() ??
              "";

            const instrumentType =
              instrument
                .instrument_type
                ?.toUpperCase() ??
              "";

            return (
              requiredSymbols.has(
                symbol
              ) &&
              segment ===
                "NSE_EQ" &&
              instrumentType ===
                "EQ" &&
              Boolean(
                instrument
                  .instrument_key
              )
            );
          }
        )
        .map(
          (instrument) => ({
            name:
              instrument
                .trading_symbol ??
              "",

            symbol:
              instrument
                .trading_symbol ??
              "",

            instrumentKey:
              instrument
                .instrument_key ??
              "",
          })
        );

    const resolvedSymbolSet =
      new Set(
        resolvedStocks.map(
          (stock) =>
            stock.symbol
              .toUpperCase()
        )
      );

    const missingSymbols =
      stockSymbols.filter(
        (symbol) =>
          !resolvedSymbolSet.has(
            symbol.toUpperCase()
          )
      );

    const tickerInstruments = [
      ...indexInstruments,
      ...resolvedStocks,
    ];

    const uniqueTickerInstruments =
      tickerInstruments.filter(
        (
          instrument,
          index,
          array
        ) =>
          array.findIndex(
            (item) =>
              item.instrumentKey ===
              instrument
                .instrumentKey
          ) === index
      );

    const instrumentKeys =
      uniqueTickerInstruments.map(
        (instrument) =>
          instrument.instrumentKey
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
        "Upstox ticker quote error:",
        upstoxData
      );

      return NextResponse.json(
        {
          error:
            "Unable to fetch live ticker quotes",

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

    const tickerData =
      uniqueTickerInstruments
        .map(
          (instrument) => {
            const quote =
              findQuote(
                quoteData,
                instrument
                  .instrumentKey
              );

            if (!quote) {
              return null;
            }

            const currentPrice =
              Number(
                quote.last_price
              ) || 0;

            const change =
              Number(
                quote.net_change
              ) || 0;

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

            return {
              name:
                instrument.name,

              symbol:
                instrument.symbol,

              instrumentKey:
                instrument
                  .instrumentKey,

              price:
                currentPrice,

              previousClose,

              change,

              changePercent,

              isUp:
                change >= 0,

              lastUpdated:
                quote.timestamp ??
                null,
            };
          }
        )
        .filter(
          (
            item
          ): item is NonNullable<
            typeof item
          > =>
            item !== null
        );

    return NextResponse.json({
      status:
        "success",

      marketDataStatus:
        "live",

      /*
       * This reveals only which secure
       * authentication method was used.
       * The token itself is never sent.
       */
      authenticationSource,

      count:
        tickerData.length,

      requestedCount:
        uniqueTickerInstruments
          .length,

      missingSymbols,

      data:
        tickerData,

      source:
        "Upstox",

      fetchedAt:
        new Date()
          .toISOString(),
    });
  } catch (error) {
    console.error(
      "Live market ticker route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to prepare live market ticker data",
      },
      {
        status: 500,
      }
    );
  }
}