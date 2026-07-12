import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } = await params;
    const stockSymbol = symbol.toUpperCase();

    const searchResponse = await fetch(
  `${new URL(request.url).origin}/api/upstox/instruments/search?q=${encodeURIComponent(
    stockSymbol
  )}`,
  {
    cache: "no-store",
  }
);

if (!searchResponse.ok) {
  return NextResponse.json(
    {
      error: "Unable to search the Upstox instrument master",
    },
    {
      status: searchResponse.status,
    }
  );
}

const searchData = await searchResponse.json();

const exactMatch = searchData.results?.find(
  (instrument: {
    symbol?: string;
    exchange?: string;
    instrumentKey?: string;
  }) =>
    instrument.symbol?.toUpperCase() === stockSymbol &&
    instrument.exchange?.toUpperCase() === "NSE"
);

const instrumentKey = exactMatch?.instrumentKey;
const companyName =
  exactMatch?.companyName ?? stockSymbol;

if (!instrumentKey) {
  return NextResponse.json(
    {
      error: "NSE equity instrument was not found",
      symbol: stockSymbol,
    },
    {
      status: 404,
    }
  );

    }

    const cookieStore = await cookies();

    const accessToken = cookieStore.get(
      "upstox_access_token"
    )?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Upstox access token is missing",
          instruction:
            "Open /api/upstox/login and authorize Upstox again.",
        },
        {
          status: 401,
        }
      );
    }

    const quoteUrl =
      "https://api.upstox.com/v2/market-quote/quotes" +
      `?instrument_key=${encodeURIComponent(instrumentKey)}`;

    const upstoxResponse = await fetch(quoteUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const upstoxData = await upstoxResponse.json();

    if (!upstoxResponse.ok) {
      console.error("Upstox quote error:", upstoxData);
      
      return NextResponse.json(
        {
          error: "Unable to fetch Upstox market quote",
          details: upstoxData,
        },
        {
          status: upstoxResponse.status,
        }
      );
    }

   const quote = Object.values(
  upstoxData.data ?? {}
)[0] as any;

if (!quote) {
  return NextResponse.json(
    {
      error: "Quote data was not found in the Upstox response",
    },
    {
      status: 404,
    }
  );
}

const currentPrice = quote.last_price ?? 0;
const change = quote.net_change ?? 0;
const previousClose = currentPrice - change;

const changePercent =
  previousClose !== 0
    ? (change / previousClose) * 100
    : 0;

return NextResponse.json({
  symbol: stockSymbol,
  companyName,
  exchange: "NSE",
  instrumentKey,

  currentPrice,
  previousClose,
  change,
  changePercent,

  open: quote.ohlc?.open ?? null,
  high: quote.ohlc?.high ?? null,
  low: quote.ohlc?.low ?? null,

  volume: quote.volume ?? null,
  averagePrice: quote.average_price ?? null,

  lastUpdated: quote.timestamp ?? null,
  source: "Upstox",
});

} catch (error) {
  console.error("Upstox quote route error:", error);

  return NextResponse.json(
    {
      error: "Internal server error",
    },
    {
      status: 500,
    }
  );
}
}