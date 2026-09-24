import {
  auth,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import type {
  MarketSnapshot,
} from "@/lib/fundamental/types";

import {
  getFundamentalAnalytics,
} from "@/lib/fundamental/services/fundamentalAnalytics";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

type UpstoxQuoteResponse = {
  currentPrice?: number | null;
  previousClose?: number | null;
  change?: number | null;
  changePercent?: number | null;
  lastUpdated?: string | null;
  source?: string | null;
};

type SubscriptionStatusResponse = {
  authenticated?: boolean;
  entitlement?: string;
  is_premium?: boolean;
};

async function hasPremiumValuationAccess(): Promise<boolean> {
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
        "STFL_BACKEND_URL is missing. Valuation access was denied."
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
      "Valuation entitlement check failed:",
      error
    );

    /*
     * Fail closed. Public financial data
     * remains available, but Premium
     * valuation output is not exposed.
     */
    return false;
  }
}

async function getMarketSnapshot(
  request: Request,
  symbol: string,
  exchange: "NSE" | "BSE"
): Promise<MarketSnapshot | null> {
  try {
    const requestUrl =
      new URL(request.url);

    const quoteUrl =
      new URL(
        `/api/upstox/quote/${encodeURIComponent(
          symbol
        )}`,
        requestUrl.origin
      );

    quoteUrl.searchParams.set(
  "exchange",
  exchange
);

    /*
     * Forward the browser cookie because
     * the Upstox quote route reads the
     * access token from cookies.
     */
    const cookieHeader =
      request.headers.get("cookie");

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (cookieHeader) {
      headers.Cookie =
        cookieHeader;
    }

    const response =
      await fetch(
        quoteUrl.toString(),
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.warn(
        "Fundamental market quote unavailable:",
        response.status
      );

      return null;
    }

    const quote =
      (await response.json()) as
        UpstoxQuoteResponse;

    if (
      typeof quote.currentPrice !==
        "number" ||
      !Number.isFinite(
        quote.currentPrice
      )
    ) {
      return null;
    }

    return {
      currentPrice:
        quote.currentPrice,

      previousClose:
        quote.previousClose ??
        null,

      change:
        quote.change ?? null,

      changePercent:
        quote.changePercent ??
        null,

      /*
       * The verified NSE annual share
       * count is preferred later by the
       * valuation calculator.
       */
      sharesOutstanding: null,

      /*
       * These are calculated from the
       * verified share count and financial
       * statement values by the valuation
       * engine.
       */
      marketCapitalization: null,
      enterpriseValue: null,

      lastUpdated:
        quote.lastUpdated ??
        null,

      source:
        quote.source ??
        "Upstox",
    };
  } catch (error) {
    console.warn(
      "Unable to prepare market snapshot:",
      error
    );

    /*
     * Fundamental analysis must continue
     * even if live market data is
     * temporarily unavailable.
     */
    return null;
  }
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

      const selectedExchange:
  | "NSE"
  | "BSE" =
  searchParams
    .get("exchange")
    ?.trim()
    .toUpperCase() === "BSE"
    ? "BSE"
    : "NSE";

    /*
     * Invalid or unavailable assumptions
     * remain null. The valuation engines
     * must not invent missing values.
     */
    const parseAssumption = (
      name: string
    ): number | null => {
      const rawValue =
        searchParams.get(name);

      if (
        rawValue === null ||
        rawValue.trim() === ""
      ) {
        return null;
      }

      const parsedValue =
        Number(rawValue);

      return Number.isFinite(
        parsedValue
      )
        ? parsedValue
        : null;
    };

    const parseWeight = (
      name: string
    ): number => {
      const value =
        parseAssumption(name);

      if (
        value === null ||
        value <= 0
      ) {
        return 0;
      }

      return value;
    };

    /*
     * WACC assumptions.
     */
    const waccAssumptions = {
      riskFreeRate:
        parseAssumption(
          "riskFreeRate"
        ),

      beta:
        parseAssumption(
          "beta"
        ),

      equityRiskPremium:
        parseAssumption(
          "equityRiskPremium"
        ),
    };

    /*
     * DCF assumptions.
     */
    const forecastYearsValue =
      parseAssumption(
        "forecastYears"
      );

    const dcfAssumptions = {
      forecastYears:
        forecastYearsValue !== null
          ? Math.trunc(
              forecastYearsValue
            )
          : null,

      freeCashFlowGrowthRate:
        parseAssumption(
          "freeCashFlowGrowthRate"
        ),

      terminalGrowthRate:
        parseAssumption(
          "terminalGrowthRate"
        ),
    };

    /*
     * Relative valuation benchmarks.
     *
     * Historical medians should come
     * from the company's verified
     * historical trading multiples.
     *
     * Industry medians should come from
     * the selected industry or verified
     * peer group.
     *
     * No benchmark is estimated here.
     */
    const relativeBenchmarks = {
      priceToEarnings: {
        historicalMedian:
          parseAssumption(
            "historicalPe"
          ),

        industryMedian:
          parseAssumption(
            "industryPe"
          ),

        weight:
          parseWeight(
            "peWeight"
          ),
      },

      priceToBook: {
        historicalMedian:
          parseAssumption(
            "historicalPb"
          ),

        industryMedian:
          parseAssumption(
            "industryPb"
          ),

        weight:
          parseWeight(
            "pbWeight"
          ),
      },

      enterpriseValueToEbitda: {
        historicalMedian:
          parseAssumption(
            "historicalEvEbitda"
          ),

        industryMedian:
          parseAssumption(
            "industryEvEbitda"
          ),

        weight:
          parseWeight(
            "evEbitdaWeight"
          ),
      },

      enterpriseValueToSales: {
        historicalMedian:
          parseAssumption(
            "historicalEvSales"
          ),

        industryMedian:
          parseAssumption(
            "industryEvSales"
          ),

        weight:
          parseWeight(
            "evSalesWeight"
          ),
      },
    };

    const marketSnapshot =
  await getMarketSnapshot(
    request,
    stockSymbol,
    selectedExchange
  );

    const analytics =
  await getFundamentalAnalytics(
    stockSymbol,
    marketSnapshot,
    waccAssumptions,
    dcfAssumptions,
    relativeBenchmarks
  );

const hasPremiumAccess =
  await hasPremiumValuationAccess();

/*
 * Public financial statements remain
 * available to everyone. Detailed
 * valuation calculations are returned
 * only to an active Premium subscriber.
 */
const responseAnalytics =
  hasPremiumAccess
    ? {
        ...analytics,

        valuationAccess: {
          available: true,
          entitlement: "PREMIUM",
          reason:
            "ACTIVE_PAID_SUBSCRIPTION",
        },
      }
    : {
        ...analytics,

        valuation: null,

        valuationAccess: {
          available: false,
          entitlement: "FREE",
          reason:
            "PREMIUM_REQUIRED",
        },
      };

return NextResponse.json(
  responseAnalytics,
  {
    status:
      analytics.status ===
      "unavailable"
        ? 404
        : 200,

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
      "Fundamental analytics route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to calculate fundamental analytics.",

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