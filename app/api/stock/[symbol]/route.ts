import { NextResponse } from "next/server";

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
    const yahooSymbol = `${symbol.toUpperCase()}.NS`;

    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Unable to fetch market data",
          status: response.status,
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();
    const quote = data.quoteResponse?.result?.[0];

    if (!quote) {
      return NextResponse.json(
        {
          error: "Stock data not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      yahooSymbol,
      companyName: quote.longName ?? quote.shortName,
      currency: quote.currency,
      exchange: quote.fullExchangeName,
      currentPrice: quote.regularMarketPrice,
      previousClose: quote.regularMarketPreviousClose,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      marketState: quote.marketState,
      marketTime: quote.regularMarketTime,
      marketCap: quote.marketCap,
      week52High: quote.fiftyTwoWeekHigh,
      week52Low: quote.fiftyTwoWeekLow,
      source: "Yahoo Finance",
    });
  } catch (error) {
    console.error("Stock API error:", error);

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