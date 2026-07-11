import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

const instrumentKeys: Record<string, string> = {
  RELIANCE: "NSE_EQ|INE002A01018",
  TCS: "NSE_EQ|INE467B01029",
  INFY: "NSE_EQ|INE009A01021",
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } = await params;
    const stockSymbol = symbol.toUpperCase();

    const instrumentKey = instrumentKeys[stockSymbol];

    if (!instrumentKey) {
      return NextResponse.json(
        {
          error: "Instrument is not configured",
          supportedSymbols: Object.keys(instrumentKeys),
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

    return NextResponse.json({
      symbol: stockSymbol,
      instrumentKey,
      source: "Upstox",
      data: upstoxData.data,
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