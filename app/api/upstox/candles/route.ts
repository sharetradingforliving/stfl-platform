    import { NextRequest, NextResponse } from "next/server";

const timeframeMap: Record<
  string,
  { unit: string; interval: string; days: number }
> = {
  "1m": {
    unit: "minutes",
    interval: "1",
    days: 7,
  },
  "5m": {
    unit: "minutes",
    interval: "5",
    days: 7,
  },
  "15m": {
    unit: "minutes",
    interval: "15",
    days: 7,
  },
  "30m": {
    unit: "minutes",
    interval: "30",
    days: 7,
  },
  "1H": {
    unit: "hours",
    interval: "1",
    days: 30,
  },
  "4H": {
    unit: "hours",
    interval: "4",
    days: 30,
  },
  D: {
    unit: "days",
    interval: "1",
    days: 1500,
  },
  W: {
    unit: "weeks",
    interval: "1",
    days: 1095,
  },
  M: {
    unit: "months",
    interval: "1",
    days: 1825,
  },
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const instrumentKey = searchParams.get("instrumentKey");
    const timeframe = searchParams.get("timeframe") ?? "D";

    if (!instrumentKey) {
      return NextResponse.json(
        {
          error: "Instrument key is required",
        },
        {
          status: 400,
        }
      );
    }

    const timeframeConfig =
      timeframeMap[timeframe] ?? timeframeMap.D;

    const toDate = new Date();

    const fromDate = new Date();

    fromDate.setDate(
      toDate.getDate() - timeframeConfig.days
    );

    const encodedInstrumentKey =
      encodeURIComponent(instrumentKey);

    const upstoxUrl =
      `https://api.upstox.com/v3/historical-candle/` +
      `${encodedInstrumentKey}/` +
      `${timeframeConfig.unit}/` +
      `${timeframeConfig.interval}/` +
      `${formatDate(toDate)}/` +
      `${formatDate(fromDate)}`;

    const response = await fetch(upstoxUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Upstox historical candle error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.errors?.[0]?.message ??
            "Unable to fetch historical candles",
          details: data,
        },
        {
          status: response.status,
        }
      );
    }

    const candles = data?.data?.candles ?? [];

    return NextResponse.json({
      timeframe,
      instrumentKey,
      candles,
      source: "Upstox",
    });
  } catch (error) {
    console.error(
      "STFL candle API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to fetch historical candle data",
      },
      {
        status: 500,
      }
    );
  }
}