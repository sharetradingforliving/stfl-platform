"use client";

import { useEffect, useState } from "react";

type MarketStock = {
  companyName: string;
  industry: string;
  symbol: string;
  isin: string;
  instrumentKey: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number | null;
  lastUpdated: string | null;
};

type MarketOverviewResponse = {
  status?: string;
  marketDataStatus?: string;

  universe?: {
    name: string;
    expectedCount: number;
    resolvedCount: number;
    quotedCount: number;
    unresolvedConstituents: string[];
  };

  breadth?: {
    advances: number;
    declines: number;
    unchanged: number;
    advancePercentage: number;
    declinePercentage: number;
  };

  topGainers?: MarketStock[];
  topLosers?: MarketStock[];

  source?: {
    constituents: string;
    marketData: string;
  };

  fetchedAt?: string;
  error?: string;
};

type InstitutionalFlowValues = {
  gross_buy: number;
  gross_sell: number;
  net: number;
};

type FiiDiiData = {
  latest_day: {
    date: string;
    fii_fpi: InstitutionalFlowValues;
    dii: InstitutionalFlowValues;
    is_provisional: boolean;
  };

  month_to_date: {
    month: string;
    through_date: string;
    trading_days: number;
    fii_fpi_net: number;
    dii_net: number;
  };

  source: string;
  updated_at: string | null;
};

type FiiDiiResponse = {
  status?: string;
  marketDataStatus?: string;
  data?: FiiDiiData;
  error?: string;
  details?: string;
};

type DataStatus =
  | "loading"
  | "live"
  | "stale"
  | "unavailable";

const MARKET_REFRESH_INTERVAL = 60_000;

const FII_DII_REFRESH_INTERVAL =
  5 * 60_000;

function formatPercentage(
  value: number
): string {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(2)}%`;
}

function formatCrores(
  value: number
): string {
  const sign =
    value > 0
      ? "+"
      : value < 0
        ? "-"
        : "";

  return `${sign}₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Cr`;
}

function getFlowColor(
  value: number
): string {
  if (value > 0) {
    return "text-emerald-400";
  }

  if (value < 0) {
    return "text-red-400";
  }

  return "text-slate-300";
}

function formatTradingDate(
  value: string
): string {
  const parsedDate = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return value;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function LiveMarketOverview() {
  const [overview, setOverview] =
    useState<MarketOverviewResponse | null>(
      null
    );

  const [status, setStatus] =
    useState<DataStatus>("loading");

  const [fiiDiiData, setFiiDiiData] =
    useState<FiiDiiData | null>(null);

  const [fiiDiiStatus, setFiiDiiStatus] =
    useState<DataStatus>("loading");

  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    const loadMarketOverview =
      async () => {
        if (requestInProgress) {
          return;
        }

        requestInProgress = true;

        try {
          const response = await fetch(
            "/api/market/overview",
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const result =
            (await response.json()) as MarketOverviewResponse;

          if (
            !response.ok ||
            result.status !== "success" ||
            !result.universe ||
            !result.breadth ||
            !Array.isArray(
              result.topGainers
            ) ||
            !Array.isArray(
              result.topLosers
            )
          ) {
            throw new Error(
              result.error ??
                "Market overview data is unavailable"
            );
          }

          if (!isMounted) {
            return;
          }

          setOverview(result);
          setStatus("live");
        } catch (error) {
          console.error(
            "Live market overview error:",
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

    void loadMarketOverview();

    const intervalId =
      window.setInterval(() => {
        void loadMarketOverview();
      }, MARKET_REFRESH_INTERVAL);

    return () => {
      isMounted = false;

      window.clearInterval(
        intervalId
      );
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    const loadFiiDiiData =
      async () => {
        if (requestInProgress) {
          return;
        }

        requestInProgress = true;

        try {
          const response = await fetch(
            "/api/market/fii-dii",
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const result =
            (await response.json()) as FiiDiiResponse;

          if (
            !response.ok ||
            result.status !== "success" ||
            !result.data
          ) {
            throw new Error(
              result.details ??
                result.error ??
                "FII/DII data is unavailable"
            );
          }

          if (!isMounted) {
            return;
          }

          setFiiDiiData(result.data);
          setFiiDiiStatus("live");
        } catch (error) {
          console.error(
            "FII/DII data error:",
            error
          );

          if (!isMounted) {
            return;
          }

          setFiiDiiStatus(
            (currentStatus) => {
              if (
                currentStatus === "live" ||
                currentStatus === "stale"
              ) {
                return "stale";
              }

              return "unavailable";
            }
          );
        } finally {
          requestInProgress = false;
        }
      };

    void loadFiiDiiData();

    const intervalId =
      window.setInterval(() => {
        void loadFiiDiiData();
      }, FII_DII_REFRESH_INTERVAL);

    return () => {
      isMounted = false;

      window.clearInterval(
        intervalId
      );
    };
  }, []);

  const statusText =
    status === "live"
      ? "LIVE DATA"
      : status === "stale"
        ? "UPDATE DELAYED"
        : status === "unavailable"
          ? "DATA UNAVAILABLE"
          : "CONNECTING";

  const statusStyle =
    status === "live"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : status === "stale"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : status === "unavailable"
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : "border-slate-600 bg-slate-800 text-slate-300";

  const breadth =
    overview?.breadth;

  const universe =
    overview?.universe;

  const topGainers =
    overview?.topGainers?.slice(0, 3) ??
    [];

  const topLosers =
    overview?.topLosers?.slice(0, 3) ??
    [];

  const hasData =
    Boolean(breadth && universe);

  const latestFlow =
    fiiDiiData?.latest_day;

  const monthToDate =
    fiiDiiData?.month_to_date;

  const flowDate = latestFlow
    ? formatTradingDate(
        latestFlow.date
      )
    : null;

  const storedTradingDays =
    monthToDate?.trading_days ?? 0;

  return (
    <section
      id="markets"
      className="scroll-mt-28 bg-slate-950 px-6 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Live Market Snapshot
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Today&apos;s Market Snapshot
            </h2>

            <p className="mt-3 text-slate-400">
              Live market breadth and leading
              stocks across the Nifty 500
              universe.
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${statusStyle}`}
          >
            {statusText}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {/* Market Breadth */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
            <h3 className="text-lg font-bold">
              Market Breadth
            </h3>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Advances
                </span>

                <span className="font-bold text-emerald-400">
                  {hasData
                    ? breadth?.advances
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Declines
                </span>

                <span className="font-bold text-red-400">
                  {hasData
                    ? breadth?.declines
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Unchanged
                </span>

                <span className="font-bold text-white">
                  {hasData
                    ? breadth?.unchanged
                    : "—"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${
                    breadth
                      ?.advancePercentage ??
                    0
                  }%`,
                }}
              />

              <div
                className="bg-red-500 transition-all duration-500"
                style={{
                  width: `${
                    breadth
                      ?.declinePercentage ??
                    0
                  }%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Based on{" "}
              {universe?.quotedCount ?? 0}{" "}
              live Nifty 500 stocks
            </p>
          </div>

          {/* Top Gainers */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
            <h3 className="text-lg font-bold">
              Top Gainers
            </h3>

            <div className="mt-6 space-y-5">
              {topGainers.length > 0 ? (
                topGainers.map((item) => (
                  <div
                    key={item.instrumentKey}
                    className="flex justify-between gap-4"
                  >
                    <span className="truncate">
                      {item.symbol}
                    </span>

                    <span className="shrink-0 font-semibold text-emerald-400">
                      {formatPercentage(
                        item.changePercent
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  {status === "loading"
                    ? "Loading live gainers..."
                    : "No advancing stocks available."}
                </p>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
            <h3 className="text-lg font-bold">
              Top Losers
            </h3>

            <div className="mt-6 space-y-5">
              {topLosers.length > 0 ? (
                topLosers.map((item) => (
                  <div
                    key={item.instrumentKey}
                    className="flex justify-between gap-4"
                  >
                    <span className="truncate">
                      {item.symbol}
                    </span>

                    <span className="shrink-0 font-semibold text-red-400">
                      {formatPercentage(
                        item.changePercent
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  {status === "loading"
                    ? "Loading live losers..."
                    : "No declining stocks available."}
                </p>
              )}
            </div>
          </div>

          {/* FII / DII Activity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold">
                FII / DII Activity
              </h3>

              {latestFlow && (
                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-400">
                  {latestFlow.is_provisional
                    ? "PROVISIONAL"
                    : "FINAL"}
                </span>
              )}
            </div>

            {latestFlow &&
            monthToDate ? (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">
                      FII/FPI Net
                    </span>

                    <span
                      className={`text-right font-bold ${getFlowColor(
                        latestFlow.fii_fpi.net
                      )}`}
                    >
                      {formatCrores(
                        latestFlow.fii_fpi.net
                      )}
                    </span>
                  </div>

                  </div>

                <div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">
                      DII Net
                    </span>

                    <span
                      className={`text-right font-bold ${getFlowColor(
                        latestFlow.dii.net
                      )}`}
                    >
                      {formatCrores(
                        latestFlow.dii.net
                      )}
                    </span>
                  </div>

                  </div>

                <div className="border-t border-slate-800 pt-3 text-xs text-slate-500">
                  <p>
                    Latest session:{" "}
                    {flowDate}
                  </p>

                  <p className="mt-1">
                    MTD currently includes{" "}
                    {storedTradingDays} stored{" "}
                    {storedTradingDays === 1
                      ? "day"
                      : "days"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  {fiiDiiStatus ===
                  "loading"
                    ? "Loading institutional flows..."
                    : "Institutional-flow data is unavailable."}
                </p>
              </div>
            )}

            {fiiDiiStatus === "stale" && (
              <p className="mt-3 text-xs text-amber-400">
                Latest refresh was delayed.
                Previously loaded data is shown.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}