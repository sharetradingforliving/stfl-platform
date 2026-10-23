"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  fetchMarketSnapshot,
} from "@/lib/market/marketSnapshotCache";

type StockItem = {
  companyName: string;
  symbol: string;
  isin: string;
  instrumentKey: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  tradedValue: number;
  yearHigh: number | null;
  yearLow: number | null;
  distanceFromYearHighPercent: number | null;
  distanceFromYearLowPercent: number | null;
  tradeDate: string | null;
  lastUpdated: string | null;
};

type AllStocksResponse = {
  status?: "success";
  marketDataStatus?:
    | "live"
    | "previous_session"
    | "unavailable";
  universe?: {
    eligibleInstruments: number;
    quotedInstruments: number;
    stocksTraded: number;
    marketSessionDate: string | null;
  };
  topGainers?: StockItem[];
  topLosers?: StockItem[];
  top52WeekHigh?: StockItem[];
  top52WeekLow?: StockItem[];
  mostActiveVolume?: StockItem[];
  mostActiveValue?: StockItem[];
  source?: string;
  fetchedAt?: string;
  error?: string;
  details?: string;
};

type MovementSection =
  | "GAINERS"
  | "LOSERS"
  | "52W_HIGH"
  | "52W_LOW"
  | "VOLUME"
  | "VALUE";

const sectionOptions: Array<{
  id: MovementSection;
  label: string;
}> = [
  {
    id: "GAINERS",
    label: "Top Gainers",
  },
  {
    id: "LOSERS",
    label: "Top Losers",
  },
  {
    id: "52W_HIGH",
    label: "52-Week High",
  },
  {
    id: "52W_LOW",
    label: "52-Week Low",
  },
  {
    id: "VOLUME",
    label: "Volume Leaders",
  },
  {
    id: "VALUE",
    label: "Value Leaders",
  },
];

function isValidNumber(
  value: number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function formatPrice(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "\u2014";
  }

  return `\u20B9${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatSignedPrice(
  value: number
): string {
  if (!isValidNumber(value)) {
    return "\u2014";
  }

  const prefix = value > 0 ? "+" : "";

  return `${prefix}\u20B9${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatPercent(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "\u2014";
  }

  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(2)}%`;
}

function formatVolume(
  value: number
): string {
  if (!isValidNumber(value)) {
    return "\u2014";
  }

  if (value >= 10_000_000) {
    return `${(value / 10_000_000).toFixed(2)} Cr`;
  }

  if (value >= 100_000) {
    return `${(value / 100_000).toFixed(2)} L`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)} K`;
  }

  return value.toLocaleString("en-IN");
}

function formatTradedValue(
  value: number
): string {
  if (!isValidNumber(value)) {
    return "\u2014";
  }

  return `\u20B9${(
    value / 10_000_000
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} Cr`;
}

function formatSessionDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "Latest market session";
  }

  const date = new Date(
    `${value}T00:00:00+05:30`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function movementTone(
  change: number
): string {
  if (change > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (change < 0) {
    return "text-red-600 dark:text-red-400";
  }

  return "text-slate-600 dark:text-slate-400";
}

function directionSymbol(
  change: number
): string {
  if (change > 0) {
    return "\u25B2";
  }

  if (change < 0) {
    return "\u25BC";
  }

  return "\u2022";
}

function sectionMetric(
  stock: StockItem,
  section: MovementSection
): {
  label: string;
  value: string;
} | null {
  if (section === "52W_HIGH") {
    return {
      label: "52W High",
      value: formatPrice(stock.yearHigh),
    };
  }

  if (section === "52W_LOW") {
    return {
      label: "52W Low",
      value: formatPrice(stock.yearLow),
    };
  }

  if (section === "VOLUME") {
    return {
      label: "Volume",
      value: formatVolume(stock.volume),
    };
  }

  if (section === "VALUE") {
    return {
      label: "Traded Value",
      value: formatTradedValue(
        stock.tradedValue
      ),
    };
  }

  return null;
}

function proximityText(
  stock: StockItem,
  section: MovementSection
): string | null {
  if (
    section === "52W_HIGH" &&
    isValidNumber(
      stock.distanceFromYearHighPercent
    )
  ) {
    if (
      stock.distanceFromYearHighPercent < 0.01
    ) {
      return "At 52-week high";
    }

    return `${stock.distanceFromYearHighPercent.toFixed(
      2
    )}% below 52-week high`;
  }

  if (
    section === "52W_LOW" &&
    isValidNumber(
      stock.distanceFromYearLowPercent
    )
  ) {
    if (
      stock.distanceFromYearLowPercent < 0.01
    ) {
      return "At 52-week low";
    }

    return `${stock.distanceFromYearLowPercent.toFixed(
      2
    )}% above 52-week low`;
  }

  return null;
}

function MovementTable({
  stocks,
  section,
}: {
  stocks: StockItem[];
  section: MovementSection;
}) {
  if (stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60">
        No equity-market data is currently available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {stocks.map((stock, index) => {
          const metric =
            sectionMetric(stock, section);

          const proximity =
            proximityText(stock, section);

          return (
            <Link
              key={stock.instrumentKey}
              href={`/company/${encodeURIComponent(
                stock.symbol
              )}?exchange=NSE`}
              className="grid gap-4 bg-white p-4 transition hover:bg-slate-50 dark:bg-slate-950/60 dark:hover:bg-slate-900 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {index + 1}
              </span>

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950 dark:text-white">
                  {stock.symbol}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {stock.companyName}
                </p>

                <p
                  className={`mt-2 text-sm font-bold ${movementTone(
                    stock.change
                  )}`}
                >
                  <span aria-hidden="true">
                    {directionSymbol(stock.change)}{" "}
                  </span>
                  {formatSignedPrice(stock.change)}{" "}
                  ({formatPercent(stock.changePercent)})
                </p>

                {proximity && (
                  <p className="mt-1 text-xs font-medium text-cyan-700 dark:text-cyan-400">
                    {proximity}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Current Price
                </p>

                <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                  {formatPrice(stock.price)}
                </p>

                {metric && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      {metric.label}
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                      {metric.value}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function StocksOnTheMovePanel() {
  const [data, setData] =
    useState<AllStocksResponse | null>(null);

  const [selectedSection, setSelectedSection] =
    useState<MovementSection>("GAINERS");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let requestIsActive = true;

    async function loadStocks() {
      try {
        const result =
          await fetchMarketSnapshot<AllStocksResponse>();

        if (
          !result.universe ||
          !result.topGainers ||
          !result.topLosers
        ) {
          throw new Error(
            result.error ??
              result.details ??
              "Market movement data is unavailable"
          );
        }

        if (requestIsActive) {
          setData(result);
          setError("");
        }
      } catch (requestError) {
        console.error(
          "Stocks on the move error:",
          requestError
        );

        if (requestIsActive) {
          setError(
            "Stocks-on-the-move data is temporarily unavailable."
          );
        }
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadStocks();

    const refreshTimer =
      window.setInterval(
        loadStocks,
        60_000
      );

    return () => {
      requestIsActive = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const selectedStocks =
    selectedSection === "GAINERS"
      ? data?.topGainers
      : selectedSection === "LOSERS"
        ? data?.topLosers
        : selectedSection === "52W_HIGH"
          ? data?.top52WeekHigh
          : selectedSection === "52W_LOW"
            ? data?.top52WeekLow
            : selectedSection === "VOLUME"
              ? data?.mostActiveVolume
              : data?.mostActiveValue;

  const isPreviousSession =
    data?.marketDataStatus ===
    "previous_session";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-none md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-400">
            NSE equity scanner
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">
            Stocks on the Move
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            Track NSE equity gainers, losers, stocks nearest
            their 52-week extremes and the most actively
            traded shares. Debt securities, NCDs, ETFs and
            funds are excluded.
          </p>
        </div>

        <div className="text-right">
          <span
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              isPreviousSession
                ? "border-amber-500/40 bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                : "border-emerald-500/40 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {isPreviousSession
              ? "PREVIOUS SESSION"
              : "LIVE \u00B7 AUTO REFRESH"}
          </span>

          <p className="mt-3 text-xs text-slate-500">
            {formatSessionDate(
              data?.universe?.marketSessionDate
            )}
          </p>
        </div>
      </div>

            <div className="mt-7 flex flex-wrap gap-3">
        {sectionOptions.map((option) => {
          const isSelected =
            selectedSection === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                setSelectedSection(option.id)
              }
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                isSelected
                  ? "border-cyan-600 bg-cyan-50 text-cyan-800 dark:border-cyan-500 dark:bg-cyan-500/10 dark:text-cyan-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {isLoading && !data ? (
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
        ) : error && !data ? (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-50 p-6 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            {error}
          </div>
        ) : (
          <MovementTable
            stocks={(
              selectedStocks ?? []
            ).slice(0, 10)}
            section={selectedSection}
          />
        )}
      </div>

      <p className="mt-5 text-xs leading-6 text-slate-500">
        Rankings use the latest available Upstox V3 market
        quote for ordinary NSE equity shares. The 52-week tabs
        rank shares closest to their trailing-year high or low;
        they are not buy or sell recommendations.
      </p>
    </section>
  );
}
