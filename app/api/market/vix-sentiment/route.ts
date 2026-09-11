import { NextRequest, NextResponse } from "next/server";

import {
  getUpstoxReadOnlyAccessToken,
} from "@/lib/upstox/accessToken";

const INDIA_VIX_KEY = "NSE_INDEX|India VIX";
const NIFTY_50_KEY = "NSE_INDEX|Nifty 50";
const ANALYSIS_DAYS = 1827;

const rangeDays: Record<string, number> = {
  "1M": 31,
  "3M": 93,
  "6M": 186,
  "1Y": 366,
  "3Y": 1096,
  "5Y": ANALYSIS_DAYS,
};

type RawCandle = [
  string,
  number,
  number,
  number,
  number,
  number?,
  number?,
];

type Candle = {
  date: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type UpstoxQuote = {
  last_price?: number;
  net_change?: number;
  timestamp?: string;
  instrument_token?: string;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}
function isIndianMarketOpen(): boolean {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(new Date());

  const weekday =
    parts.find(
      (part) =>
        part.type === "weekday"
    )?.value;

  const hour =
    Number(
      parts.find(
        (part) =>
          part.type === "hour"
      )?.value ?? 0
    );

  const minute =
    Number(
      parts.find(
        (part) =>
          part.type === "minute"
      )?.value ?? 0
    );

  const currentMinutes =
    hour * 60 + minute;

  const marketOpenMinutes =
    9 * 60 + 15;

  const marketCloseMinutes =
    15 * 60 + 30;

  return (
    weekday !== "Sat" &&
    weekday !== "Sun" &&
    currentMinutes >=
      marketOpenMinutes &&
    currentMinutes <=
      marketCloseMinutes
  );
}

function normalizeKey(value: string): string {
  return value.replace("|", ":").trim().toUpperCase();
}

function findQuote(
  data: Record<string, UpstoxQuote>,
  instrumentKey: string
): UpstoxQuote | null {
  const requested = normalizeKey(instrumentKey);

  for (const [key, quote] of Object.entries(data)) {
    if (
      normalizeKey(key) === requested ||
      (quote.instrument_token &&
        normalizeKey(quote.instrument_token) === requested)
    ) {
      return quote;
    }
  }

  return null;
}

function parseCandles(rawCandles: unknown): Candle[] {
  if (!Array.isArray(rawCandles)) {
    return [];
  }

  return (rawCandles as RawCandle[])
    .filter(
      (item) =>
        Array.isArray(item) &&
        typeof item[0] === "string" &&
        Number.isFinite(Number(item[4]))
    )
    .map((item) => ({
      date: item[0].slice(0, 10),
      timestamp: item[0],
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchDailyCandles(
  instrumentKey: string,
  fromDate: string,
  toDate: string
): Promise<Candle[]> {
  const url =
    "https://api.upstox.com/v3/historical-candle/" +
    `${encodeURIComponent(instrumentKey)}/days/1/` +
    `${toDate}/${fromDate}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      body?.errors?.[0]?.message ??
        `Historical candle request failed with status ${response.status}`
    );
  }

  return parseCandles(body?.data?.candles);
}

function percentile(sortedValues: number[], fraction: number): number {
  if (sortedValues.length === 0) return 0;

  const position = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;

  return (
    sortedValues[lower] * (1 - weight) +
    sortedValues[upper] * weight
  );
}

function percentileRank(values: number[], current: number): number {
  if (values.length === 0) return 0;
  const atOrBelow = values.filter((value) => value <= current).length;
  return (atOrBelow / values.length) * 100;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

function round(value: number | null, digits = 2): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function getZone(rank: number) {
  if (rank < 20) {
    return {
      key: "CALM",
      label: "Calm",
      colour: "emerald",
      explanation: "Expected volatility is unusually low versus its five-year history.",
    };
  }
  if (rank < 50) {
    return {
      key: "NORMAL",
      label: "Normal",
      colour: "cyan",
      explanation: "Expected volatility is within the lower half of its historical range.",
    };
  }
  if (rank < 75) {
    return {
      key: "ELEVATED",
      label: "Elevated",
      colour: "amber",
      explanation: "Expected market movement is above its recent historical norm.",
    };
  }
  if (rank < 90) {
    return {
      key: "HIGH",
      label: "High",
      colour: "orange",
      explanation: "Large price swings are more likely than under normal conditions.",
    };
  }
  return {
    key: "EXTREME",
    label: "Extreme",
    colour: "red",
    explanation: "Volatility is in an exceptional historical zone and event risk is high.",
  };
}

function zoneForValue(
  value: number,
  bands: { p20: number; p50: number; p75: number; p90: number }
): string {
  if (value < bands.p20) return "CALM";
  if (value < bands.p50) return "NORMAL";
  if (value < bands.p75) return "ELEVATED";
  if (value < bands.p90) return "HIGH";
  return "EXTREME";
}

function calculateForwardStatistics(
  vixCandles: Candle[],
  niftyCandles: Candle[],
  currentZone: string,
  bands: { p20: number; p50: number; p75: number; p90: number }
) {
  const niftyByDate = new Map(
    niftyCandles.map((candle, index) => [candle.date, { candle, index }])
  );

  function horizonStatistics(horizon: number) {
    const returns: number[] = [];

    for (const vix of vixCandles) {
      if (zoneForValue(vix.close, bands) !== currentZone) continue;

      const matched = niftyByDate.get(vix.date);
      if (!matched) continue;

      const future = niftyCandles[matched.index + horizon];
      if (!future || matched.candle.close <= 0) continue;

      returns.push(
        ((future.close - matched.candle.close) / matched.candle.close) * 100
      );
    }

    const advances = returns.filter((value) => value > 0).length;
    const declines = returns.filter((value) => value < 0).length;

    return {
      sessions: horizon,
      observations: returns.length,
      advanceProbability:
        returns.length > 0 ? round((advances / returns.length) * 100) : null,
      declineProbability:
        returns.length > 0 ? round((declines / returns.length) * 100) : null,
      averageReturn: round(average(returns)),
      medianReturn: round(median(returns)),
    };
  }

  return [
    horizonStatistics(1),
    horizonStatistics(5),
    horizonStatistics(20),
  ];
}

function calculateDirectionalView(
  vixCandles: Candle[],
  niftyCandles: Candle[]
) {
  const latestVix = vixCandles.at(-1)?.close ?? 0;
  const vixFiveSessionsAgo = vixCandles.at(-6)?.close ?? latestVix;
  const latestNifty = niftyCandles.at(-1)?.close ?? 0;
  const niftyTwentySessionsAgo = niftyCandles.at(-21)?.close ?? latestNifty;

  const vixTrendPercent =
    vixFiveSessionsAgo > 0
      ? ((latestVix - vixFiveSessionsAgo) / vixFiveSessionsAgo) * 100
      : 0;

  const niftyTrendPercent =
    niftyTwentySessionsAgo > 0
      ? ((latestNifty - niftyTwentySessionsAgo) / niftyTwentySessionsAgo) * 100
      : 0;

  let label = "NEUTRAL";
  let interpretation =
    "Volatility and index direction are not producing a strong combined signal.";

  if (vixTrendPercent > 5 && niftyTrendPercent < 0) {
    label = "RISK-OFF";
    interpretation =
      "India VIX is rising while Nifty is weakening, indicating increasing downside pressure and risk aversion.";
  } else if (vixTrendPercent < -5 && niftyTrendPercent > 0) {
    label = "CONSTRUCTIVE";
    interpretation =
      "India VIX is falling while Nifty is strengthening, indicating a more constructive risk-on environment.";
  } else if (vixTrendPercent > 5 && niftyTrendPercent >= 0) {
    label = "UNSTABLE RALLY";
    interpretation =
      "Nifty is firm but India VIX is rising, so event risk and the probability of larger swings are increasing.";
  } else if (vixTrendPercent < -5 && niftyTrendPercent <= 0) {
    label = "CONTROLLED WEAKNESS";
    interpretation =
      "Nifty is weak but India VIX is declining, suggesting limited panic despite soft price action.";
  }

  return {
    label,
    interpretation,
    vixFiveSessionChangePercent: round(vixTrendPercent),
    niftyTwentySessionChangePercent: round(niftyTrendPercent),
  };
}

export async function GET(request: NextRequest) {
  try {
    const requestedRange = (
      request.nextUrl.searchParams.get("range") ?? "1Y"
    ).toUpperCase();
    const range = rangeDays[requestedRange] ? requestedRange : "1Y";

    const to = new Date();
    const analysisFrom = subtractDays(to, ANALYSIS_DAYS);
    const displayFrom = subtractDays(to, rangeDays[range]);

    const [vixCandles, niftyCandles] = await Promise.all([
      fetchDailyCandles(
        INDIA_VIX_KEY,
        formatDate(analysisFrom),
        formatDate(to)
      ),
      fetchDailyCandles(
        NIFTY_50_KEY,
        formatDate(analysisFrom),
        formatDate(to)
      ),
    ]);

    if (vixCandles.length < 20 || niftyCandles.length < 20) {
      throw new Error("Insufficient India VIX or Nifty historical data");
    }

    const historicalVixValues = vixCandles.map((candle) => candle.close);
    const sortedVixValues = [...historicalVixValues].sort((a, b) => a - b);
    const historicalClose = vixCandles.at(-1)?.close ?? 0;

    let currentVix = historicalClose;
    let currentChange: number | null = null;
    let currentChangePercent: number | null = null;
    let liveLastUpdated: string | null = null;
    let marketDataStatus:
  | "live"
  | "previous_session"
  | "historical" =
  "historical";
    let authenticationSource: string | null = null;

    const tokenResult = await getUpstoxReadOnlyAccessToken();

    if (tokenResult) {
      authenticationSource = tokenResult.source;
      const quoteUrl =
        "https://api.upstox.com/v2/market-quote/quotes" +
        `?instrument_key=${encodeURIComponent(INDIA_VIX_KEY)}`;

      const quoteResponse = await fetch(quoteUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
        cache: "no-store",
      });

      if (quoteResponse.ok) {
        const quoteBody = await quoteResponse.json();
        const quote = findQuote(
          (quoteBody?.data ?? {}) as Record<string, UpstoxQuote>,
          INDIA_VIX_KEY
        );

        if (quote && Number(quote.last_price) > 0) {
          currentVix = Number(quote.last_price);
          currentChange = Number(quote.net_change) || 0;
          const previousClose = currentVix - currentChange;
          currentChangePercent =
            previousClose > 0
              ? (currentChange / previousClose) * 100
              : null;
          liveLastUpdated = quote.timestamp ?? null;
          marketDataStatus =
  isIndianMarketOpen()
    ? "live"
    : "previous_session";
        }
      }
    }

    const bands = {
      p20: percentile(sortedVixValues, 0.2),
      p50: percentile(sortedVixValues, 0.5),
      p75: percentile(sortedVixValues, 0.75),
      p90: percentile(sortedVixValues, 0.9),
    };

    const rank = percentileRank(historicalVixValues, currentVix);
    const zone = getZone(rank);
    const vix20DayAverage = average(
      vixCandles.slice(-20).map((candle) => candle.close)
    );
    const currentZone = zoneForValue(currentVix, bands);
    const direction = calculateDirectionalView(vixCandles, niftyCandles);
    const forwardStatistics = calculateForwardStatistics(
      vixCandles,
      niftyCandles,
      currentZone,
      bands
    );

    const displayFromDate = formatDate(displayFrom);
    const displayedVix = vixCandles.filter(
      (candle) => candle.date >= displayFromDate
    );
    const displayedNifty = niftyCandles.filter(
      (candle) => candle.date >= displayFromDate
    );

    return NextResponse.json({
      status: "success",
      marketDataStatus,
      authenticationSource,
      range,
      current: {
        value: round(currentVix),
        change: round(currentChange),
        changePercent: round(currentChangePercent),
        lastUpdated: liveLastUpdated,
        sessionDate: vixCandles.at(-1)?.date ?? null,
      },
      volatility: {
        percentileRank: round(rank),
        zone,
        twentyDayAverage: round(vix20DayAverage),
        historicalBands: {
          p20: round(bands.p20),
          p50: round(bands.p50),
          p75: round(bands.p75),
          p90: round(bands.p90),
        },
        expectedMove: {
          dailyPercent: round(currentVix / Math.sqrt(252)),
          thirtyDayPercent: round(currentVix / Math.sqrt(12)),
          explanation:
            "Expected movement is a volatility range in either direction, not a directional forecast.",
        },
      },
      direction,
      historicalEvidence: {
        methodology:
          "Nifty forward returns observed when India VIX was in the same five-year percentile zone.",
        results: forwardStatistics,
      },
      chart: {
        indiaVix: displayedVix.map((candle) => ({
          date: candle.date,
          value: round(candle.close),
        })),
        nifty50: displayedNifty.map((candle) => ({
          date: candle.date,
          value: round(candle.close),
        })),
      },
      sample: {
        from: vixCandles[0]?.date ?? null,
        to: vixCandles.at(-1)?.date ?? null,
        vixObservations: vixCandles.length,
        niftyObservations: niftyCandles.length,
      },
      source: "Upstox historical candles and market quotes",
      fetchedAt: new Date().toISOString(),
      disclaimer:
        "Volatility statistics describe historical behaviour and expected movement, not guaranteed market direction or investment advice.",
    });
  } catch (error) {
    console.error("India VIX sentiment route error:", error);

    return NextResponse.json(
      {
        status: "unavailable",
        error: "Unable to prepare India VIX sentiment analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
