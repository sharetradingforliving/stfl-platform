"use client";

import { useEffect, useState } from "react";

type LiveTickerItem = {
  name: string;
  symbol: string;
  instrumentKey: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  lastUpdated: string | null;
};

type TickerApiResponse = {
  status?: string;
  marketDataStatus?: string;
  count?: number;
  requestedCount?: number;
  missingSymbols?: string[];
  data?: LiveTickerItem[];
  source?: string;
  fetchedAt?: string;
  error?: string;
  instruction?: string;
};

type TickerStatus =
  | "loading"
  | "live"
  | "stale"
  | "unavailable";

const REFRESH_INTERVAL = 15_000;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatChangePercent(
  changePercent: number
): string {
  const direction =
    changePercent > 0
      ? "▲"
      : changePercent < 0
        ? "▼"
        : "•";

  return `${direction} ${Math.abs(
    changePercent
  ).toFixed(2)}%`;
}

function getStatusText(
  status: TickerStatus
): string {
  if (status === "live") {
    return "Live Market Data • Upstox";
  }

  if (status === "stale") {
    return "Live Update Delayed • Showing Last Available Data";
  }

  if (status === "unavailable") {
    return "Market Data Temporarily Unavailable";
  }

  return "Connecting to Live Market";
}

function getStatusColour(
  status: TickerStatus
): string {
  if (status === "live") {
    return "text-emerald-400";
  }

  if (status === "stale") {
    return "text-amber-400";
  }

  if (status === "unavailable") {
    return "text-red-400";
  }

  return "text-slate-400";
}

export default function LiveMarketTicker() {
  const [tickerData, setTickerData] =
    useState<LiveTickerItem[]>([]);

  const [status, setStatus] =
    useState<TickerStatus>("loading");

  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    const loadTickerData = async () => {
      if (requestInProgress) {
        return;
      }

      requestInProgress = true;

      try {
        const response = await fetch(
          "/api/market/ticker",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as TickerApiResponse;

        if (
          !response.ok ||
          result.status !== "success" ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            result.error ??
              "Live market data is unavailable"
          );
        }

        if (!isMounted) {
          return;
        }

        setTickerData(result.data);
        setStatus("live");
      } catch (error) {
        console.error(
          "Live market ticker error:",
          error
        );

        if (!isMounted) {
          return;
        }

        setStatus((currentStatus) => {
          if (
            currentStatus === "live" ||
            currentStatus === "stale"
          ) {
            return "stale";
          }

          return "unavailable";
        });
      } finally {
        requestInProgress = false;
      }
    };

    void loadTickerData();

    const intervalId = window.setInterval(
      () => {
        void loadTickerData();
      },
      REFRESH_INTERVAL
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const scrollingData =
    tickerData.length > 0
      ? [...tickerData, ...tickerData]
      : [];

  return (
    <section className="overflow-hidden border-y border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-4 py-1 text-right">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${getStatusColour(
            status
          )}`}
        >
          {getStatusText(status)}
        </span>
      </div>

      {scrollingData.length > 0 ? (
        <div className="market-ticker-track py-4 text-sm">
          {scrollingData.map(
            (item, index) => (
              <div
                key={`${item.instrumentKey}-${index}`}
                className="flex shrink-0 items-center whitespace-nowrap border-r border-slate-700 px-7"
              >
                <span className="text-slate-400">
                  {item.name}
                </span>

                <span className="ml-2 font-bold text-white">
                  {formatPrice(item.price)}
                </span>

                <span
                  className={`ml-2 font-semibold ${
                    item.change > 0
                      ? "text-emerald-400"
                      : item.change < 0
                        ? "text-red-400"
                        : "text-slate-400"
                  }`}
                >
                  {formatChangePercent(
                    item.changePercent
                  )}
                </span>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="flex min-h-14 items-center justify-center px-4 py-4 text-sm text-slate-400">
          {status === "unavailable"
            ? "Live market prices are temporarily unavailable."
            : "Loading live market prices..."}
        </div>
      )}
    </section>
  );
}