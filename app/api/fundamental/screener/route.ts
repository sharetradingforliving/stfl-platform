/**
 * ================================================================
 * STFL Fundamental Screener API Proxy
 * Route: /api/fundamental/screener
 *
 * Proxies validated discovery filters to the FastAPI/Neon screener
 * service. No financial values are calculated in this route.
 * ================================================================
 */

import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";


const BACKEND_BASE_URL =
  (
    process.env.STFL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8001"
  ).replace(/\/$/, "");


const ALLOWED_QUERY_PARAMETERS = [
  "sector",
  "industry",
  "marketCap",
  "investmentStyle",
  "valuationMethod",
  "limit",
] as const;


export async function GET(
  request: Request
) {
  try {
    const requestUrl =
      new URL(request.url);

    const backendUrl = new URL(
      "/api/fundamental/screener",
      BACKEND_BASE_URL
    );

    for (
      const parameter
      of ALLOWED_QUERY_PARAMETERS
    ) {
      const value =
        requestUrl.searchParams.get(
          parameter
        );

      if (value !== null) {
        backendUrl.searchParams.set(
          parameter,
          value
        );
      }
    }

    const response = await fetch(
      backendUrl.toString(),
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const payload =
      (await response.json()) as {
        detail?: string;
        error?: string;
        [key: string]: unknown;
      };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload.error ??
            payload.detail ??
            "Unable to run the stock screener.",
        },
        {
          status: response.status,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      payload,
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
      "Fundamental screener proxy error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The fundamental screener service is temporarily unavailable.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

