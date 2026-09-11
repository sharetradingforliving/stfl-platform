import { NextResponse } from "next/server";

type CueDirection = "positive" | "negative" | "neutral";

type InstrumentDefinition = {
  id: string;
  name: string;
  symbol: string;
  category: "US" | "ASIA" | "EUROPE" | "CURRENCY" | "COMMODITY" | "RATES";
  unit: "index" | "currency" | "usd" | "percent";
  indiaImpact: "same" | "inverse" | "context";
  scoreWeight: number;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        symbol?: string;
        exchangeName?: string;
        fullExchangeName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketTime?: number;
        exchangeTimezoneName?: string;
        marketState?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

const instruments: InstrumentDefinition[] = [
  {
    id: "SP500",
    name: "S&P 500",
    symbol: "^GSPC",
    category: "US",
    unit: "index",
    indiaImpact: "same",
    scoreWeight: 10,
  },
  {
    id: "NASDAQ",
    name: "Nasdaq Composite",
    symbol: "^IXIC",
    category: "US",
    unit: "index",
    indiaImpact: "same",
    scoreWeight: 10,
  },
  {
    id: "DOW",
    name: "Dow Jones",
    symbol: "^DJI",
    category: "US",
    unit: "index",
    indiaImpact: "same",
    scoreWeight: 8,
  },
  {
    id: "NIKKEI",
    name: "Nikkei 225",
    symbol: "^N225",
    category: "ASIA",
    unit: "index",
    indiaImpact: "same",
    scoreWeight: 9,
  },
  {
    id: "HANG_SENG",
    name: "Hang Seng",
    symbol: "^HSI",
    category: "ASIA",
    unit: "index",
    indiaImpact: "same",
    scoreWeight: 9,
  },
  {
    id: "FTSE",
    name: "FTSE 100",
    symbol: "^FTSE",
    category: "EUROPE",
    unit: "index",
    indiaImpact: "same",
    scoreWeight: 6,
  },
  {
    id: "DOLLAR_INDEX",
    name: "US Dollar Index",
    symbol: "DX-Y.NYB",
    category: "CURRENCY",
    unit: "index",
    indiaImpact: "inverse",
    scoreWeight: 10,
  },
  {
    id: "USD_INR",
    name: "USD/INR",
    symbol: "INR=X",
    category: "CURRENCY",
    unit: "currency",
    indiaImpact: "inverse",
    scoreWeight: 14,
  },
  {
    id: "BRENT",
    name: "Brent Crude",
    symbol: "BZ=F",
    category: "COMMODITY",
    unit: "usd",
    indiaImpact: "inverse",
    scoreWeight: 12,
  },
  {
    id: "GOLD",
    name: "Gold",
    symbol: "GC=F",
    category: "COMMODITY",
    unit: "usd",
    indiaImpact: "context",
    scoreWeight: 0,
  },
  {
    id: "US10Y",
    name: "US 10-Year Yield",
    symbol: "^TNX",
    category: "RATES",
    unit: "percent",
    indiaImpact: "inverse",
    scoreWeight: 12,
  },
];

function round(value: number | null, digits = 2): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function cueDirection(
  changePercent: number,
  impact: InstrumentDefinition["indiaImpact"]
): CueDirection {
  if (impact === "context" || Math.abs(changePercent) < 0.1) {
    return "neutral";
  }

  const marketDirection = changePercent > 0 ? "positive" : "negative";

  if (impact === "same") return marketDirection;
  return marketDirection === "positive" ? "negative" : "positive";
}

    async function fetchInstrument(
  definition: InstrumentDefinition
) {
  const valueScale =
    definition.id === "US10Y"
      ? 0.1
      : 1;

 const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    `${encodeURIComponent(definition.symbol)}?interval=1d&range=1mo`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 STFL-Market-Intelligence/1.0",
    },
    next: { revalidate: 300 },
  });

  const payload = (await response.json()) as YahooChartResponse;

  if (!response.ok || payload.chart?.error) {
    throw new Error(
      payload.chart?.error?.description ??
        `${definition.name} request failed with status ${response.status}`
    );
  }

  const result = payload.chart?.result?.[0];
  const meta = result?.meta;

  if (!result || !meta) {
    throw new Error(`${definition.name} returned no market data`);
  }

  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  const history = timestamps
    .map((timestamp, index) => ({
      timestamp,
      value: closes[index],
    }))
    .filter(
      (point): point is { timestamp: number; value: number } =>
        typeof point.value === "number" && Number.isFinite(point.value)
    )
    .map((point) => ({
      date: new Date(point.timestamp * 1000).toISOString().slice(0, 10),
      value: round(
  point.value * valueScale
),
    }));

  const currentPrice =
  Number(
    meta.regularMarketPrice
  ) > 0
    ? Number(
        meta.regularMarketPrice
      ) * valueScale
    : history.at(-1)?.value ??
      0;

const previousClose =
  Number(meta.previousClose) > 0
    ? Number(
        meta.previousClose
      ) * valueScale
    : history.at(-2)?.value ??
      0;

const change =
  currentPrice -
  previousClose;

const changePercent =
  previousClose > 0
    ? (
        change /
        previousClose
      ) * 100
    : 0;

  return {
    ...definition,
    price: round(currentPrice),
    previousClose: round(previousClose),
    change: round(change),
    changePercent: round(changePercent),
    cue: cueDirection(changePercent, definition.indiaImpact),
    currency: meta.currency ?? null,
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? null,
    marketState: meta.marketState ?? null,
    lastUpdated: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null,
    history,
    status: "available" as const,
  };
}

function sentimentLabel(score: number) {
  if (score >= 70) {
    return {
      key: "RISK_ON",
      label: "Global Risk-On",
      colour: "emerald",
      interpretation:
        "Most available global signals are supportive for Indian risk assets.",
    };
  }
  if (score >= 55) {
    return {
      key: "POSITIVE",
      label: "Moderately Positive",
      colour: "cyan",
      interpretation:
        "Global cues have a positive bias, although confirmation from domestic price action is still required.",
    };
  }
  if (score >= 45) {
    return {
      key: "MIXED",
      label: "Mixed",
      colour: "amber",
      interpretation:
        "Global signals are balanced and do not provide a strong directional advantage.",
    };
  }
  if (score >= 30) {
    return {
      key: "CAUTIOUS",
      label: "Cautious",
      colour: "orange",
      interpretation:
        "Several global indicators are creating headwinds for Indian risk assets.",
    };
  }
  return {
    key: "RISK_OFF",
    label: "Global Risk-Off",
    colour: "red",
    interpretation:
      "Most available global signals indicate an elevated risk-off environment.",
  };
}

export async function GET() {
  try {
    const settled = await Promise.allSettled(
      instruments.map((instrument) => fetchInstrument(instrument))
    );

    const data = settled.map((result, index) => {
      if (result.status === "fulfilled") return result.value;

      console.error(
        `Global cue failed for ${instruments[index].name}:`,
        result.reason
      );

      return {
        ...instruments[index],
        price: null,
        previousClose: null,
        change: null,
        changePercent: null,
        cue: "neutral" as CueDirection,
        currency: null,
        exchange: null,
        marketState: null,
        lastUpdated: null,
        history: [],
        status: "unavailable" as const,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown provider error",
      };
    });

    const scored = data.filter(
      (item) => item.status === "available" && item.scoreWeight > 0
    );
    const availableWeight = scored.reduce(
      (sum, item) => sum + item.scoreWeight,
      0
    );
    const achievedWeight = scored.reduce((sum, item) => {
      if (item.cue === "positive") return sum + item.scoreWeight;
      if (item.cue === "neutral") return sum + item.scoreWeight * 0.5;
      return sum;
    }, 0);
    const score =
      availableWeight > 0 ? (achievedWeight / availableWeight) * 100 : 50;
    const sentiment = sentimentLabel(score);

    const positives = data
      .filter((item) => item.status === "available" && item.cue === "positive")
      .map((item) => item.name);
    const negatives = data
      .filter((item) => item.status === "available" && item.cue === "negative")
      .map((item) => item.name);

    return NextResponse.json({
      status: "success",
      marketDataStatus: "latest_available",
      sentiment: {
        score: round(score, 1),
        ...sentiment,
        positiveDrivers: positives,
        negativeDrivers: negatives,
        methodology:
          "Transparent weighted heuristic based on daily direction. Equity indices move with risk appetite; USD/INR, Dollar Index, Brent and US yields are treated as inverse India-risk cues. Gold is contextual and excluded from the score.",
      },
      groups: {
        us: data.filter((item) => item.category === "US"),
        asia: data.filter((item) => item.category === "ASIA"),
        europe: data.filter((item) => item.category === "EUROPE"),
        currencies: data.filter((item) => item.category === "CURRENCY"),
        commodities: data.filter((item) => item.category === "COMMODITY"),
        rates: data.filter((item) => item.category === "RATES"),
      },
      coverage: {
        requested: data.length,
        available: data.filter((item) => item.status === "available").length,
        unavailable: data.filter((item) => item.status === "unavailable").length,
        giftNifty: {
          status: "planned_licensed_feed",
          explanation:
            "GIFT Nifty is intentionally not substituted with Nifty 50. An NSE IX or licensed vendor feed will be integrated separately.",
        },
      },
      source: "Aggregated market data via Yahoo Finance chart feed",
      sourceType: "aggregated_delayed_or_latest_available",
      fetchedAt: new Date().toISOString(),
      disclaimer:
        "Global cues are contextual indicators, not a forecast or investment recommendation. Market timestamps and delays vary by exchange.",
    });
  } catch (error) {
    console.error("Global market cues route error:", error);

    return NextResponse.json(
      {
        status: "unavailable",
        error: "Unable to prepare global market cues",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
