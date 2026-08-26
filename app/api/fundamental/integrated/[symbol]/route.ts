import { NextResponse } from "next/server";

import {
  getNseIntegratedFinancialFilings,
} from "@/lib/fundamental/providers/nseIntegratedFinancialResults";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } = await params;

    const stockSymbol = symbol
      .trim()
      .toUpperCase();

    if (!stockSymbol) {
      return NextResponse.json(
        {
          status: "error",
          error: "Stock symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getNseIntegratedFinancialFilings(
        stockSymbol
      );

    return NextResponse.json(
      {
        status: "success",
        symbol: stockSymbol,
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "NSE integrated financial filings route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "Unable to retrieve NSE integrated financial filings.",
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