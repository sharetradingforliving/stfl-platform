/**
 * ================================================================
 * STFL Fundamental Screener API Proxy
 * Route: /api/fundamental/screener
 *
 * Proxies validated discovery filters to the FastAPI/Neon screener
 * service. No financial values are calculated in this route.
 * ================================================================
 */

import {
  auth,
} from "@clerk/nextjs/server";

import {
  NextResponse,
} from "next/server";


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


type SubscriptionStatusResponse = {
  entitlement?: string;
  is_premium?: boolean;
};


type ScreenerPayload = {
  detail?: string;
  error?: string;
  results?: unknown;
  [key: string]: unknown;
};


async function hasPremiumScreenerAccess(): Promise<boolean> {
  try {
    const {
      userId,
      getToken,
    } = await auth();

    if (!userId) {
      return false;
    }

    const token =
      await getToken();

    if (!token) {
      return false;
    }

    const backendUrl =
      process.env.STFL_BACKEND_URL;

    if (!backendUrl) {
      console.error(
        "STFL_BACKEND_URL is missing. Premium screener access was denied."
      );

      return false;
    }

    const response = await fetch(
      `${backendUrl.replace(
        /\/$/,
        ""
      )}/api/subscription/status`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

    if (!response.ok) {
      return false;
    }

    const subscription =
      (await response.json()) as
        SubscriptionStatusResponse;

    return (
      subscription.is_premium ===
        true ||
      subscription.entitlement
        ?.trim()
        .toUpperCase() ===
        "PREMIUM"
    );
  } catch (error) {
    console.error(
      "Premium screener entitlement check failed:",
      error
    );

    return false;
  }
}


function redactPremiumValuations(
  payload: ScreenerPayload
): ScreenerPayload {
  return {
    ...payload,

    results:
      Array.isArray(payload.results)
        ? payload.results.map(
            (result) => {
              if (
                typeof result !==
                  "object" ||
                result === null
              ) {
                return result;
              }

              return {
                ...result,
                valuation: null,
              };
            }
          )
        : payload.results,

    valuationAccess: {
      available: false,
      entitlement: "FREE",
      reason: "PREMIUM_REQUIRED",
    },
  };
}


export async function GET(
  request: Request
) {
  try {
    const hasPremiumAccess =
      await hasPremiumScreenerAccess();

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
      if (
        parameter ===
          "valuationMethod" &&
        !hasPremiumAccess
      ) {
        continue;
      }

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
      (await response.json()) as
        ScreenerPayload;

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

    const securedPayload =
      hasPremiumAccess
        ? payload
        : redactPremiumValuations(
            payload
          );

    return NextResponse.json(
      securedPayload,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store, max-age=0",
          Vary:
            "Cookie, Authorization",
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
