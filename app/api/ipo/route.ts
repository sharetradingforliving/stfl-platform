/**
 * ================================================================
 * STFL IPO API
 * Route: /api/ipo
 *
 * Purpose:
 * Expose normalized IPO Engine information to the STFL frontend.
 * ================================================================
 */

import { NextResponse } from "next/server";

import { runIPOEngine } from "@/lib/ipo/ipoEngine";


export const dynamic = "force-dynamic";


export async function GET() {

  try {

    const result =
      await runIPOEngine();


    return NextResponse.json(
      result,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );

  } catch (error) {

    console.error(
      "IPO API Error:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Unable to load IPO data.",
      },
      {
        status: 500,
      }
    );
  }
}