import {
  NextResponse,
} from "next/server";

import {
  getNseCorporateActions,
} from "@/lib/fundamental/providers/nseCorporateActions";

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
    const { symbol } =
      await params;

    const stockSymbol =
      symbol
        .trim()
        .toUpperCase();

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

    const result =
      await getNseCorporateActions(
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
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "NSE corporate-actions route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to retrieve NSE corporate actions.",

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