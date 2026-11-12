import {
  auth,
} from "@clerk/nextjs/server";
import {
  after,
  NextResponse,
} from "next/server";
import {
  synchronizeNseAnnualArchive,
} from "@/lib/fundamental/services/synchronizeNseAnnualArchive";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

type SubscriptionStatusResponse = {
  authenticated?: boolean;
  entitlement?: string;
  is_premium?: boolean;
};

type PremiumAccessResult = {
  authenticated: boolean;
  premium: boolean;
};

async function checkPremiumAccess():
  Promise<PremiumAccessResult> {
  try {
    const {
      userId,
      getToken,
    } = await auth();

    if (!userId) {
      return {
        authenticated: false,
        premium: false,
      };
    }

    const clerkToken =
      await getToken();

    if (!clerkToken) {
      return {
        authenticated: true,
        premium: false,
      };
    }

    const backendUrl =
      process.env.STFL_BACKEND_URL;

    if (!backendUrl) {
      console.error(
        "STFL_BACKEND_URL is missing."
      );

      return {
        authenticated: true,
        premium: false,
      };
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
            `Bearer ${clerkToken}`,
        },

        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        authenticated: true,
        premium: false,
      };
    }

    const subscription =
      (await response.json()) as
        SubscriptionStatusResponse;

    const premium =
      subscription.is_premium ===
        true ||
      subscription.entitlement
        ?.trim()
        .toUpperCase() ===
        "PREMIUM";

    return {
      authenticated: true,
      premium,
    };
  } catch (error) {
    console.error(
      "Financial-history entitlement "
        + "check failed:",
      error
    );

    return {
      authenticated: false,
      premium: false,
    };
  }
}

function privateHeaders():
  Record<string, string> {
  return {
    "Cache-Control":
      "private, no-store, max-age=0",

    Vary:
      "Cookie, Authorization",
  };
}

const archiveRefreshes = new Map<
  string,
  {
    nextCheckAt: number;
    pending: Promise<boolean> | null;
  }
>();

async function refreshAnnualArchive(
  symbol: string,
  exchange: string,
  backendUrl: string
): Promise<boolean> {
  const key = JSON.stringify([
    backendUrl,
    exchange,
    symbol,
  ]);

  const existing = archiveRefreshes.get(key);

  if (existing?.pending) {
    return existing.pending;
  }

  if (
    existing &&
    Date.now() < existing.nextCheckAt
  ) {
    return false;
  }

  const state = {
    nextCheckAt: 0,
    pending: null as Promise<boolean> | null,
  };

  archiveRefreshes.set(key, state);

  state.pending = synchronizeNseAnnualArchive(
    symbol,
    exchange,
    backendUrl
  )
    .then((changed) => {
      state.nextCheckAt =
        Date.now() + 60 * 60 * 1000;

      return changed;
    })
    .catch((error) => {
      archiveRefreshes.delete(key);
      throw error;
    })
    .finally(() => {
      state.pending = null;
    });

  return state.pending;
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } =
      await params;

    const stockSymbol =
      symbol.trim().toUpperCase();

    if (
      !stockSymbol ||
      !/^[A-Z0-9&._-]{1,30}$/.test(
        stockSymbol
      )
    ) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "A valid stock symbol is required.",
        },
        {
          status: 400,
          headers: privateHeaders(),
        }
      );
    }

    const access =
      await checkPremiumAccess();

    if (!access.authenticated) {
      return NextResponse.json(
        {
          status: "unauthorized",

          error:
            "Please sign in to access "
            + "historical financial data.",

          access: {
            available: false,
            entitlement: "SIGNED_OUT",
            reason:
              "AUTHENTICATION_REQUIRED",
          },
        },
        {
          status: 401,
          headers: privateHeaders(),
        }
      );
    }

    if (!access.premium) {
      return NextResponse.json(
        {
          status: "forbidden",

          error:
            "An active STFL Premium "
            + "subscription is required "
            + "to access detailed "
            + "historical financial data.",

          access: {
            available: false,
            entitlement: "FREE",
            reason: "PREMIUM_REQUIRED",
          },
        },
        {
          status: 403,
          headers: privateHeaders(),
        }
      );
    }

    const requestUrl =
      new URL(request.url);

    const requestedExchange =
      (
        requestUrl.searchParams.get(
          "exchange"
        ) ?? "NSE"
      )
        .trim()
        .toUpperCase();

    if (
      requestedExchange !== "NSE" &&
      requestedExchange !== "BSE"
    ) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "Exchange must be NSE or BSE.",
        },
        {
          status: 400,
          headers: privateHeaders(),
        }
      );
    }

    const requestedYearsValue =
      Number(
        requestUrl.searchParams.get(
          "years"
        ) ?? "5"
      );

    const requestedYears =
      Number.isInteger(
        requestedYearsValue
      )
        ? Math.max(
            5,
            Math.min(
              requestedYearsValue,
              10
            )
          )
        : 5;

    const backendUrl =
      (
        process.env
          .STFL_FINANCIAL_BACKEND_URL ??
        process.env
          .STFL_BACKEND_URL
      );

    const readToken =
      process.env
        .FINANCIAL_HISTORY_READ_TOKEN;

    if (
      !backendUrl ||
      !readToken
    ) {
      console.error(
        "Financial-history backend "
          + "configuration is missing."
      );

      return NextResponse.json(
        {
          status: "unavailable",
          error:
            "Historical financial data "
            + "is temporarily unavailable.",
        },
        {
          status: 503,
          headers: privateHeaders(),
        }
      );
    }

    const historyUrl = new URL(
      `${
        backendUrl.replace(
          /\/$/,
          ""
        )
      }/api/fundamental/history/company/${
        encodeURIComponent(
          stockSymbol
        )
      }`
    );

    historyUrl.searchParams.set(
      "exchange",
      requestedExchange
    );

    historyUrl.searchParams.set(
      "years",
      String(requestedYears)
    );

    const backendResponse =
      await fetch(
        historyUrl.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "X-STFL-Read-Token":
              readToken,
          },

          cache: "no-store",
        }
      );

    let responseBody =
      await backendResponse
        .json()
        .catch(() => ({
          status: "error",
          error:
            "The financial-history "
            + "service returned an "
            + "invalid response.",
        }));

        /*
     * A missing company history is eligible for
     * initial synchronization. Other backend
     * errors must retain their original response.
     */
    if (
      !backendResponse.ok &&
      backendResponse.status !== 404
    ) {
      return NextResponse.json(
        responseBody,
        {
          status: backendResponse.status,
          headers: privateHeaders(),
        }
      );
    }

    const initiallyMissing =
      backendResponse.status === 404;

      let historyAvailable =
      backendResponse.ok;

            const hasStoredRecords =
      backendResponse.ok &&
      Array.isArray(responseBody.records) &&
      responseBody.records.length > 0;

    if (
      hasStoredRecords &&
      process.env.FINANCIAL_HISTORY_SYNC_TOKEN
    ) {
      after(async () => {
        try {
          await refreshAnnualArchive(
            stockSymbol,
            requestedExchange,
            backendUrl
          );
        } catch (syncError) {
          console.error(
            "Background financial-history sync failed:",
            stockSymbol,
            syncError
          );
        }
      });
    }

    if (
      !hasStoredRecords &&
      process.env.FINANCIAL_HISTORY_SYNC_TOKEN
    ) {
      try {
                const changed =
          await refreshAnnualArchive(
            stockSymbol,
            requestedExchange,
            backendUrl
          );

        /*
         * Re-read an initially empty history
         * even if another simultaneous request
         * performed the insertion.
         */
        if (changed || initiallyMissing) {
          const refreshedResponse =
            await fetch(
              historyUrl.toString(),
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "X-STFL-Read-Token":
                    readToken,
                },
                cache: "no-store",
              }
            );

          if (refreshedResponse.ok) {
            responseBody =
              await refreshedResponse.json();

            historyAvailable = true;
          } else {
            console.warn(
              "History refresh failed:",
              stockSymbol,
              refreshedResponse.status
            );
          }
        }
      } catch (syncError) {
        console.error(
          "Automatic financial-history sync failed:",
          stockSymbol,
          syncError
        );
      }
    }

    if (!historyAvailable) {
      return NextResponse.json(
        responseBody,
        {
          status: backendResponse.status,
          headers: privateHeaders(),
        }
      );
    }

    return NextResponse.json(
      {
        ...responseBody,

        access: {
          available: true,
          entitlement: "PREMIUM",
          reason:
            "ACTIVE_PAID_SUBSCRIPTION",
        },
      },
      {
        status: 200,
        headers: privateHeaders(),
      }
    );
  } catch (error) {
    console.error(
      "Historical financial route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "Unable to retrieve historical "
          + "financial data.",
      },
      {
        status: 500,
        headers: privateHeaders(),
      }
    );
  }
}