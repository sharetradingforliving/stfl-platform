import { NextResponse } from "next/server";

import { getFiiDiiSummary } from "@/lib/market/fiiDii";


export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const summary =
      await getFiiDiiSummary();

    return NextResponse.json(
      {
        status: "success",
        marketDataStatus: "live",
        data: summary,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "FII/DII market route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        marketDataStatus: "unavailable",
        error:
          "Unable to retrieve FII/DII data",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 503,
      }
    );
  }
}