import { NextResponse } from "next/server";

import {
  getNseFinancialSeries,
} from "@/lib/fundamental/services/nseFinancialSeries";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

function readLimit(
  value: string | null,
  fallback: number,
  maximum: number
): number {
  if (!value) {
    return fallback;
  }

  const parsedValue =
    Number.parseInt(value, 10);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return Math.min(
    parsedValue,
    maximum
  );
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } = await params;

    const stockSymbol =
      symbol.trim().toUpperCase();

    if (!stockSymbol) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "Stock symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const quarterlyLimit =
      readLimit(
        searchParams.get(
          "quarterly"
        ),
        4,
        12
      );

    const annualLimit =
      readLimit(
        searchParams.get(
          "annual"
        ),
        3,
        10
      );

    const series =
      await getNseFinancialSeries(
        stockSymbol,
        {
          quarterlyLimit,
          annualLimit,
        }
      );

    return NextResponse.json(
      series,
      {
        status:
          series.status ===
          "unavailable"
            ? 404
            : 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "NSE financial series route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to prepare the NSE financial series.",

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