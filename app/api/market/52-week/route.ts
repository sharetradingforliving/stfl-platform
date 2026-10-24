import {
  NextRequest,
  NextResponse,
} from "next/server";

type Candle = [
  string,
  number,
  number,
  number,
  number,
  number,
  number?
];

type UpstoxHistoricalResponse = {
  status?: string;
  data?: {
    candles?: Candle[];
  };
  errors?: Array<{
    message?: string;
  }>;
};

type WeekRange = {
  instrumentKey: string;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  observations: number;
};

type CachedRange = {
  value: WeekRange;
  expiresAt: number;
};

const CACHE_DURATION =
  12 * 60 * 60 * 1000;

const MAX_INSTRUMENTS = 12;

const rangeCache =
  new Map<string, CachedRange>();

function formatDate(
  date: Date
): string {
  return date
    .toISOString()
    .split("T")[0];
}

function normalizedInstrumentKey(
  value: string
): string {
  return value
    .trim()
    .replace(":", "|");
}

function isValidPrice(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

async function fetchWeekRange(
  instrumentKey: string
): Promise<WeekRange> {
  const cached =
    rangeCache.get(instrumentKey);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return cached.value;
  }

  const toDate = new Date();

  const fromDate = new Date(
    toDate
  );

  fromDate.setDate(
    fromDate.getDate() - 366
  );

  const encodedInstrumentKey =
    encodeURIComponent(
      instrumentKey
    );

  const url =
    "https://api.upstox.com/v3/historical-candle/" +
    `${encodedInstrumentKey}/days/1/` +
    `${formatDate(toDate)}/` +
    `${formatDate(fromDate)}`;

  try {
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
        next: {
          revalidate: 43_200,
        },
      }
    );

    const payload =
      await response.json() as
        UpstoxHistoricalResponse;

    if (!response.ok) {
      console.error(
        "52-week candle request failed:",
        instrumentKey,
        response.status,
        payload.errors
      );

      return {
        instrumentKey,
        fiftyTwoWeekHigh: null,
        fiftyTwoWeekLow: null,
        observations: 0,
      };
    }

    const candles =
      payload.data?.candles ?? [];

    const highs =
      candles
        .map(
          (candle) => candle[2]
        )
        .filter(isValidPrice);

    const lows =
      candles
        .map(
          (candle) => candle[3]
        )
        .filter(isValidPrice);

    const value: WeekRange = {
      instrumentKey,
      fiftyTwoWeekHigh:
        highs.length > 0
          ? Math.max(...highs)
          : null,
      fiftyTwoWeekLow:
        lows.length > 0
          ? Math.min(...lows)
          : null,
      observations:
        candles.length,
    };

    rangeCache.set(
      instrumentKey,
      {
        value,
        expiresAt:
          Date.now() +
          CACHE_DURATION,
      }
    );

    return value;
  } catch (error) {
    console.error(
      "52-week range error:",
      instrumentKey,
      error
    );

    return {
      instrumentKey,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      observations: 0,
    };
  }
}

export async function GET(
  request: NextRequest
) {
  const instrumentKeys =
    request.nextUrl.searchParams
      .getAll("instrumentKey")
      .map(
        normalizedInstrumentKey
      )
      .filter(Boolean);

  const uniqueInstrumentKeys =
    [...new Set(instrumentKeys)]
      .slice(
        0,
        MAX_INSTRUMENTS
      );

  if (
    uniqueInstrumentKeys.length ===
    0
  ) {
    return NextResponse.json(
      {
        status: "error",
        error:
          "At least one instrumentKey is required.",
      },
      {
        status: 400,
      }
    );
  }

  const ranges =
    await Promise.all(
      uniqueInstrumentKeys.map(
        fetchWeekRange
      )
    );

  return NextResponse.json(
    {
      status: "success",
      ranges,
      source:
        "Upstox daily historical candles",
      generatedAt:
        new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=43200, stale-while-revalidate=86400",
      },
    }
  );
}
