import { NextResponse } from "next/server";

import {
  getNseFinancialResultFilings,
} from "@/lib/fundamental/providers/nseFinancialResults";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export const dynamic =
  "force-dynamic";

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } =
      await params;

    const stockSymbol =
      decodeURIComponent(symbol)
        .trim()
        .toUpperCase();

    if (!stockSymbol) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "A valid company symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getNseFinancialResultFilings(
        stockSymbol
      );

    return NextResponse.json(
      result,
      {
        status:
          result.status ===
          "unavailable"
            ? 404
            : 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Fundamental filing route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "Unable to retrieve company financial filings.",

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