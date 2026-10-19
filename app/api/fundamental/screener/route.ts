import {
  auth,
} from "@clerk/nextjs/server";

import {
  NextResponse,
} from "next/server";


export const dynamic =
  "force-dynamic";


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
  "page",
  "pageSize",
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


function parseJsonPayload(
  responseText: string
): ScreenerPayload | null {
  if (!responseText.trim()) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(responseText) as
        unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return null;
    }

    return parsed as
      ScreenerPayload;
  } catch {
    return null;
  }
}


async function hasPremiumScreenerAccess():
Promise<boolean> {
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

    const responseText =
      await response.text();

    const subscription =
      parseJsonPayload(
        responseText
      ) as
        SubscriptionStatusResponse |
        null;

    if (!subscription) {
      return false;
    }

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
          Accept:
            "application/json",
        },
      }
    );

    const responseText =
      await response.text();

    const payload =
      parseJsonPayload(
        responseText
      );

    if (!payload) {
      console.error(
        "Fundamental screener backend returned a non-JSON response:",
        {
          status:
            response.status,

          contentType:
            response.headers.get(
              "content-type"
            ),

          preview:
            responseText
              .slice(0, 300),
        }
      );

      return NextResponse.json(
        {
          error:
            response.ok
              ? (
                  "The screener backend " +
                  "returned an invalid response."
                )
              : (
                  "The screener backend " +
                  `is unavailable (${response.status}).`
                ),
        },
        {
          status:
            response.ok
              ? 502
              : response.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

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
            "Cache-Control":
              "no-store",
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
          error instanceof Error
            ? (
                "The fundamental screener " +
                `service is unavailable: ${error.message}`
              )
            : (
                "The fundamental screener " +
                "service is temporarily unavailable."
              ),
      },
      {
        status: 503,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}