"use client";

import { useEffect, useState } from "react";

type LivePriceCardProps = {
  symbol: string;
  companyName: string;
  sector: string;
  fallbackPrice: number;
  fallbackChange: number;
  fallbackChangePercent: number;
};

type MarketData = {
  currentPrice: number;
  change: number;
  changePercent: number;
  source: string;
};

export default function LivePriceCard({
  symbol,
  companyName,
  sector,
  fallbackPrice,
  fallbackChange,
  fallbackChangePercent,
}: LivePriceCardProps) {
  const [marketData, setMarketData] = useState<MarketData>({
    currentPrice: fallbackPrice,
    change: fallbackChange,
    changePercent: fallbackChangePercent,
    source: "Fallback Data",
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        const response = await fetch(
          `/api/upstox/quote/${symbol}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to fetch Upstox market data");
        }

        const data = await response.json();

        setMarketData({
          currentPrice: data.currentPrice,
          change: data.change,
          changePercent: data.changePercent,
          source: data.source,
        });
      } catch (error) {
        console.error(
          "Using fallback market data:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarketData();
  }, [symbol]);

  const isPositive = marketData.change >= 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        Current Market Price
      </p>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <p className="text-4xl font-bold text-white">
          ₹
          {marketData.currentPrice.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </p>

        <p
  className={`pb-1 font-semibold ${
    isPositive
      ? "text-emerald-400"
      : "text-red-400"
  }`}
>
  {isPositive ? "▲" : "▼"} ₹
  {Math.abs(marketData.change).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}{" "}
  ({isPositive ? "+" : "-"}
  {Math.abs(marketData.changePercent).toFixed(2)}
  %)
</p>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {companyName} • {sector}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {isLoading
          ? "Loading market data..."
          : `Market data: ${marketData.source}`}
      </p>

      <button className="mt-5 w-full rounded-xl border border-emerald-400 px-4 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-400 hover:text-slate-950">
        + Add to Watchlist
      </button>
    </div>
  );
}