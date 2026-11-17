import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { MarketSnapshot } from "@/lib/fundamental/types";
import { getStoredFundamentalAnalytics as getFundamentalAnalytics } from "@/lib/fundamental/services/storedFundamentalAnalytics";

type RouteContext = { params: Promise<{ symbol: string }> };
const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Authorization",
};

async function hasPremiumValuationAccess(): Promise<boolean> {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return false;
    const token = await getToken();
    const base = process.env.STFL_BACKEND_URL?.replace(/\/+$/, "");
    if (!token || !base) return false;
    const response = await fetch(`${base}/api/subscription/status`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const subscription = await response.json() as {
      is_premium?: boolean; entitlement?: string;
    };
    return subscription.is_premium === true ||
      subscription.entitlement?.trim().toUpperCase() === "PREMIUM";
  } catch (error) {
    console.error("Valuation entitlement check failed:", error);
    return false;
  }
}

async function getMarketSnapshot(request: Request, symbol: string, exchange: "NSE" | "BSE"): Promise<MarketSnapshot | null> {
  try {
    const url = new URL(`/api/upstox/quote/${encodeURIComponent(symbol)}`, new URL(request.url).origin);
    url.searchParams.set("exchange", exchange);
    const headers: Record<string, string> = { Accept: "application/json" };
    const cookie = request.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(url, {
      headers, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const quote = await response.json() as Partial<MarketSnapshot>;
    if (typeof quote.currentPrice !== "number" || !Number.isFinite(quote.currentPrice)) return null;
    return {
      currentPrice: quote.currentPrice,
      previousClose: quote.previousClose ?? null,
      change: quote.change ?? null,
      changePercent: quote.changePercent ?? null,
      lastUpdated: quote.lastUpdated ?? null,
      source: quote.source ?? "Upstox",
      sharesOutstanding: null,
      marketCapitalization: null,
      enterpriseValue: null,
    };
  } catch (error) {
    console.warn("Market snapshot unavailable:", error);
    return null;
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const symbol = (await params).symbol.trim().toUpperCase();
    if (!symbol) return NextResponse.json({ status: "error", error: "Stock symbol is required." }, { status: 400, headers: responseHeaders });
    const query = new URL(request.url).searchParams;
    const exchange = query.get("exchange")?.trim().toUpperCase() === "BSE" ? "BSE" : "NSE";
    const assumption = (name: string): number | null => {
      const raw = query.get(name);
      if (raw === null || !raw.trim()) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    };
    const weight = (name: string): number => Math.max(0, assumption(name) ?? 0);
    const forecastYears = assumption("forecastYears");
    const [market, premium] = await Promise.all([
      getMarketSnapshot(request, symbol, exchange),
      hasPremiumValuationAccess(),
    ]);
    const analytics = await getFundamentalAnalytics(symbol, market, {
      riskFreeRate: assumption("riskFreeRate"), beta: assumption("beta"),
      equityRiskPremium: assumption("equityRiskPremium"),
    }, {
      forecastYears: forecastYears === null ? null : Math.trunc(forecastYears),
      freeCashFlowGrowthRate: assumption("freeCashFlowGrowthRate"),
      terminalGrowthRate: assumption("terminalGrowthRate"),
    }, {
      priceToEarnings: { historicalMedian: assumption("historicalPe"), industryMedian: assumption("industryPe"), weight: weight("peWeight") },
      priceToBook: { historicalMedian: assumption("historicalPb"), industryMedian: assumption("industryPb"), weight: weight("pbWeight") },
      enterpriseValueToEbitda: { historicalMedian: assumption("historicalEvEbitda"), industryMedian: assumption("industryEvEbitda"), weight: weight("evEbitdaWeight") },
      enterpriseValueToSales: { historicalMedian: assumption("historicalEvSales"), industryMedian: assumption("industryEvSales"), weight: weight("evSalesWeight") },
    });
    return NextResponse.json({
      ...analytics,
      valuation: premium ? analytics.valuation : null,
      valuationAccess: {
        available: premium,
        entitlement: premium ? "PREMIUM" : "FREE",
        reason: premium ? "ACTIVE_PAID_SUBSCRIPTION" : "PREMIUM_REQUIRED",
      },
    }, { status: analytics.status === "unavailable" ? 404 : 200, headers: responseHeaders });
  } catch (error) {
    console.error("Fundamental analytics route error:", error);
    return NextResponse.json({ status: "error", error: "Financial research is temporarily unavailable. Please try again shortly." }, {
      status: 503, headers: responseHeaders,
    });
  }
}
