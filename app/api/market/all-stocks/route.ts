import { NextResponse } from "next/server";
import {
  getAllNseEquities,
  type NseCashEquity,
} from "@/lib/market/allNseEquities";
import {
  getUpstoxReadOnlyAccessToken,
  type UpstoxAccessTokenSource,
} from "@/lib/upstox/accessToken";

type UpstoxQuote = {
  last_price?: number;
  net_change?: number;
  volume?: number;
  timestamp?: string;
  last_trade_time?: string | number;
  instrument_token?: string;
  symbol?: string;
  lower_circuit_limit?: number;
  upper_circuit_limit?: number;
  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
};

type AllStockItem = {
  companyName: string;
  symbol: string;
  isin: string;
  instrumentKey: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  tradedValue: number;
  open: number | null;
  high: number | null;
  low: number | null;
  lowerCircuitLimit: number | null;
  upperCircuitLimit: number | null;
  tradeDate: string | null;
  lastUpdated: string | null;
};

type AllStocksSnapshot = {
  status: "success";
  marketDataStatus: "live";
  authenticationSource:
    UpstoxAccessTokenSource;
  universe: {
    eligibleInstruments: number;
    quotedInstruments: number;
    stocksTraded: number;
    marketSessionDate: string | null;
  };
  breadth: {
    advances: number;
    declines: number;
    unchanged: number;
    advancePercentage: number;
    declinePercentage: number;
  };
  circuits: {
    upperCircuit: number;
    lowerCircuit: number;
  };
  topGainers: AllStockItem[];
  topLosers: AllStockItem[];
  mostActiveVolume: AllStockItem[];
  mostActiveValue: AllStockItem[];
  source: string;
  fetchedAt: string;
};

const BATCH_SIZE = 500;
const CACHE_DURATION = 60_000;

let cachedSnapshot:
  | AllStocksSnapshot
  | null = null;

let cacheTimestamp = 0;

let snapshotPromise:
  | Promise<AllStocksSnapshot>
  | null = null;

function normalizeKey(value: string): string {
  return value
    .replace("|", ":")
    .trim()
    .toUpperCase();
}

function splitIntoBatches<T>(
  items: T[],
  batchSize: number
): T[][] {
  const batches: T[][] = [];

  for (
    let index = 0;
    index < items.length;
    index += batchSize
  ) {
    batches.push(
      items.slice(
        index,
        index + batchSize
      )
    );
  }

  return batches;
}

function formatIndiaDate(
  date: Date
): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(date);

  const year =
    parts.find(
      (part) => part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) => part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) => part.type === "day"
    )?.value;

  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function parseTradeDate(
  quote: UpstoxQuote
): string | null {
  const lastTradeTime =
    quote.last_trade_time;

  if (
    typeof lastTradeTime === "number" ||
    typeof lastTradeTime === "string"
  ) {
    const numericTime =
      Number(lastTradeTime);

    if (
      Number.isFinite(numericTime) &&
      numericTime > 0
    ) {
      const milliseconds =
        numericTime < 1_000_000_000_000
          ? numericTime * 1000
          : numericTime;

      const date =
        new Date(milliseconds);

      if (!Number.isNaN(date.getTime())) {
        return formatIndiaDate(date);
      }
    }
  }

  if (quote.timestamp) {
    const timestampDate =
      new Date(quote.timestamp);

    if (
      !Number.isNaN(
        timestampDate.getTime()
      )
    ) {
      return formatIndiaDate(
        timestampDate
      );
    }
  }

  return null;
}

function createQuoteLookup(
  quoteData: Record<string, UpstoxQuote>
): Map<string, UpstoxQuote> {
  const lookup =
    new Map<string, UpstoxQuote>();

  Object.entries(quoteData).forEach(
    ([responseKey, quote]) => {
      lookup.set(
        normalizeKey(responseKey),
        quote
      );

      if (quote.instrument_token) {
        lookup.set(
          normalizeKey(
            quote.instrument_token
          ),
          quote
        );
      }
    }
  );

  return lookup;
}

async function fetchQuoteBatch(
  batch: NseCashEquity[],
  accessToken: string
): Promise<
  Map<string, UpstoxQuote>
> {
  const instrumentKeys =
    batch.map(
      (instrument) =>
        instrument.instrumentKey
    );

  const quoteUrl =
    "https://api.upstox.com/v2/market-quote/quotes" +
    `?instrument_key=${encodeURIComponent(
      instrumentKeys.join(",")
    )}`;

  const response = await fetch(
    quoteUrl,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const responseData =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `Upstox quote batch failed with status ${response.status}: ${JSON.stringify(
        responseData
      )}`
    );
  }

  return createQuoteLookup(
    (responseData.data ?? {}) as Record<
      string,
      UpstoxQuote
    >
  );
}

function createStockItem(
  instrument: NseCashEquity,
  quote: UpstoxQuote
): AllStockItem {
  const price =
    Number(quote.last_price) || 0;

  const change =
    Number(quote.net_change) || 0;

  const previousClose =
    price - change;

  const changePercent =
    previousClose !== 0
      ? (change / previousClose) * 100
      : 0;

  const volume =
    Number(quote.volume) || 0;

  const tradedValue =
    price * volume;

  const lowerCircuitLimit =
    typeof quote.lower_circuit_limit ===
    "number"
      ? quote.lower_circuit_limit
      : null;

  const upperCircuitLimit =
    typeof quote.upper_circuit_limit ===
    "number"
      ? quote.upper_circuit_limit
      : null;

  return {
    companyName:
      instrument.companyName,

    symbol:
      instrument.symbol,

    isin:
      instrument.isin,

    instrumentKey:
      instrument.instrumentKey,

    price,
    previousClose,
    change,
    changePercent,
    volume,
    tradedValue,

    open:
      typeof quote.ohlc?.open ===
      "number"
        ? quote.ohlc.open
        : null,

    high:
      typeof quote.ohlc?.high ===
      "number"
        ? quote.ohlc.high
        : null,

    low:
      typeof quote.ohlc?.low ===
      "number"
        ? quote.ohlc.low
        : null,

    lowerCircuitLimit,
    upperCircuitLimit,

    tradeDate:
      parseTradeDate(quote),

    lastUpdated:
      quote.timestamp ?? null,
  };
}

async function buildAllStocksSnapshot(
  accessToken: string,
  authenticationSource:
    UpstoxAccessTokenSource
): Promise<AllStocksSnapshot> {
  const universe =
    await getAllNseEquities();

  const batches =
    splitIntoBatches(
      universe.equities,
      BATCH_SIZE
    );

  const batchLookups =
    await Promise.all(
      batches.map((batch) =>
        fetchQuoteBatch(
          batch,
          accessToken
        )
      )
    );

  const quoteLookup =
    new Map<string, UpstoxQuote>();

  batchLookups.forEach((lookup) => {
    lookup.forEach((quote, key) => {
      quoteLookup.set(key, quote);
    });
  });

  const quotedStocks =
    universe.equities
      .map((instrument) => {
        const quote =
          quoteLookup.get(
            normalizeKey(
              instrument.instrumentKey
            )
          );

        if (!quote) {
          return null;
        }

        return createStockItem(
          instrument,
          quote
        );
      })
      .filter(
        (
          stock
        ): stock is AllStockItem =>
          stock !== null
      );

  const availableTradeDates =
    quotedStocks
      .map((stock) => stock.tradeDate)
      .filter(
        (
          tradeDate
        ): tradeDate is string =>
          Boolean(tradeDate)
      )
      .sort();

  const marketSessionDate =
    availableTradeDates.length > 0
      ? availableTradeDates[
          availableTradeDates.length - 1
        ]
      : null;

  const tradedStocks =
    quotedStocks.filter(
      (stock) =>
        stock.volume > 0 &&
        stock.price > 0 &&
        Boolean(
          marketSessionDate &&
          stock.tradeDate ===
            marketSessionDate
        )
    );

  const advances =
    tradedStocks.filter(
      (stock) => stock.change > 0
    );

  const declines =
    tradedStocks.filter(
      (stock) => stock.change < 0
    );

  const unchanged =
    tradedStocks.filter(
      (stock) => stock.change === 0
    );

  const upperCircuitStocks =
    tradedStocks.filter((stock) => {
      if (
        !stock.upperCircuitLimit ||
        stock.upperCircuitLimit <= 0
      ) {
        return false;
      }

      return (
        stock.price >=
        stock.upperCircuitLimit - 0.001
      );
    });

  const lowerCircuitStocks =
    tradedStocks.filter((stock) => {
      if (
        !stock.lowerCircuitLimit ||
        stock.lowerCircuitLimit <= 0
      ) {
        return false;
      }

      return (
        stock.price <=
        stock.lowerCircuitLimit + 0.001
      );
    });

  const directionalTotal =
    advances.length +
    declines.length;

  const advancePercentage =
    directionalTotal > 0
      ? (advances.length /
          directionalTotal) *
        100
      : 0;

  const declinePercentage =
    directionalTotal > 0
      ? (declines.length /
          directionalTotal) *
        100
      : 0;

  const topGainers = [...advances]
    .sort(
      (a, b) =>
        b.changePercent -
        a.changePercent
    )
    .slice(0, 10);

  const topLosers = [...declines]
    .sort(
      (a, b) =>
        a.changePercent -
        b.changePercent
    )
    .slice(0, 10);

  const mostActiveVolume = [
    ...tradedStocks,
  ]
    .sort(
      (a, b) =>
        b.volume - a.volume
    )
    .slice(0, 10);

  const mostActiveValue = [
    ...tradedStocks,
  ]
    .sort(
      (a, b) =>
        b.tradedValue -
        a.tradedValue
    )
    .slice(0, 10);

  return {
    status: "success",
    marketDataStatus: "live",
    authenticationSource,

    universe: {
      eligibleInstruments:
        universe.total,

      quotedInstruments:
        quotedStocks.length,

      stocksTraded:
        tradedStocks.length,

      marketSessionDate,
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

    circuits: {
      upperCircuit:
        upperCircuitStocks.length,

      lowerCircuit:
        lowerCircuitStocks.length,
    },

    topGainers,
    topLosers,
    mostActiveVolume,
    mostActiveValue,

    source: "Upstox",

    fetchedAt:
      new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const now = Date.now();

    const cacheIsValid =
      cachedSnapshot !== null &&
      now - cacheTimestamp <
        CACHE_DURATION;

    if (
      cacheIsValid &&
      cachedSnapshot
    ) {
      return NextResponse.json({
        ...cachedSnapshot,
        cacheStatus: "hit",
      });
    }

    const tokenResult =
      await getUpstoxReadOnlyAccessToken();

    if (!tokenResult) {
      if (cachedSnapshot) {
        return NextResponse.json({
          ...cachedSnapshot,
          marketDataStatus:
            "live",
          cacheStatus: "stale",
        });
      }

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

    if (!snapshotPromise) {
      snapshotPromise =
        buildAllStocksSnapshot(
          accessToken,
          authenticationSource
        );
    }

    try {
      const snapshot =
        await snapshotPromise;

      cachedSnapshot = snapshot;
      cacheTimestamp =
        Date.now();

      return NextResponse.json({
        ...snapshot,
        cacheStatus: "miss",
      });
    } finally {
      snapshotPromise = null;
    }
  } catch (error) {
    console.error(
      "All NSE stocks snapshot error:",
      error
    );

    if (cachedSnapshot) {
      return NextResponse.json({
        ...cachedSnapshot,
        marketDataStatus: "live",
        cacheStatus: "stale",
        warning:
          "The latest refresh failed. Showing the last available snapshot.",
      });
    }

    return NextResponse.json(
      {
        error:
          "Unable to prepare the all-NSE market snapshot",

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
