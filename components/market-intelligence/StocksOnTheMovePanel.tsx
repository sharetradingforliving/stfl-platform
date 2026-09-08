"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

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
  tradeDate: string | null;
  lastUpdated: string | null;
};

type AllStocksResponse = {
  status?: "success";

  marketDataStatus?:
    | "live"
    | "unavailable";

  universe?: {
    eligibleInstruments: number;
    quotedInstruments: number;
    stocksTraded: number;
    marketSessionDate: string | null;
  };

  topGainers?: StockItem[];
  topLosers?: StockItem[];
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
  | "VOLUME"
  | "VALUE";

const sectionOptions: {
  id: MovementSection;
  label: string;
}[] = [
  {
    id: "GAINERS",
    label: "Top Gainers",
  },
  {
    id: "LOSERS",
    label: "Top Losers",
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
  value: number
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatPercent(
  value: number
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const prefix =
    value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(
    2
  )}%`;
}

function formatVolume(
  value: number
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  if (value >= 10_000_000) {
    return `${(
      value / 10_000_000
    ).toFixed(2)} Cr`;
  }

  if (value >= 100_000) {
    return `${(
      value / 100_000
    ).toFixed(2)} L`;
  }

  if (value >= 1_000) {
    return `${(
      value / 1_000
    ).toFixed(2)} K`;
  }

  return value.toLocaleString(
    "en-IN"
  );
}

function formatTradedValue(
  value: number
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const valueInCrore =
    value / 10_000_000;

  return `₹${valueInCrore.toLocaleString(
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

  const date =
    new Date(
      `${value}T00:00:00+05:30`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function MovementTable({
  stocks,
  section,
}: {
  stocks: StockItem[];
  section: MovementSection;
}) {
  if (stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
        No market-movement data is currently available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <div className="divide-y divide-slate-800">
        {stocks.map(
          (
            stock,
            index
          ) => {
            const isPositive =
              stock.changePercent > 0;

            const isNegative =
              stock.changePercent < 0;

            const movementColour =
              isPositive
                ? "text-emerald-400"
                : isNegative
                  ? "text-red-400"
                  : "text-slate-400";

            return (
              <Link
                key={
                  stock.instrumentKey
                }
                href={`/company/${encodeURIComponent(
                  stock.symbol
                )}?exchange=NSE`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 bg-slate-950/60 p-4 transition hover:bg-slate-900"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {stock.symbol}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {stock.companyName}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-semibold text-white">
                    {formatPrice(
                      stock.price
                    )}
                  </p>

                  {section ===
                  "VOLUME" ? (
                    <p className="mt-1 text-xs font-semibold text-cyan-400">
                      {formatVolume(
                        stock.volume
                      )}
                    </p>
                  ) : section ===
                    "VALUE" ? (
                    <p className="mt-1 text-xs font-semibold text-cyan-400">
                      {formatTradedValue(
                        stock.tradedValue
                      )}
                    </p>
                  ) : (
                    <p
                      className={`mt-1 text-xs font-bold ${movementColour}`}
                    >
                      {formatPercent(
                        stock.changePercent
                      )}
                    </p>
                  )}
                </div>
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}

export default function StocksOnTheMovePanel() {
  const [
    data,
    setData,
  ] =
    useState<AllStocksResponse | null>(
      null
    );

  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState<MovementSection>(
      "GAINERS"
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let requestIsActive = true;

    async function loadStocks() {
      try {
        const response =
          await fetch(
            "/api/market/all-stocks",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          (await response.json()) as
            AllStocksResponse;

        if (!response.ok) {
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
            "Live stocks-on-the-move data is temporarily unavailable."
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

      window.clearInterval(
        refreshTimer
      );
    };
  }, []);

  const selectedStocks =
    selectedSection === "GAINERS"
      ? data?.topGainers
      : selectedSection ===
          "LOSERS"
        ? data?.topLosers
        : selectedSection ===
            "VOLUME"
          ? data?.mostActiveVolume
          : data?.mostActiveValue;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Live NSE scanner
          </p>

          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Stocks on the Move
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Track the strongest price
            movers and the most actively
            traded NSE stocks during the
            latest market session.
          </p>
        </div>

        <div className="text-right">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
            LIVE · AUTO REFRESH
          </span>

          <p className="mt-3 text-xs text-slate-500">
            {formatSessionDate(
              data?.universe
                ?.marketSessionDate
            )}
          </p>
        </div>
      </div>

      {data?.universe && (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Eligible equities
            </p>

            <p className="mt-2 text-xl font-bold text-white">
              {data.universe.eligibleInstruments.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Live quotes
            </p>

            <p className="mt-2 text-xl font-bold text-white">
              {data.universe.quotedInstruments.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Stocks traded
            </p>

            <p className="mt-2 text-xl font-bold text-white">
              {data.universe.stocksTraded.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        {sectionOptions.map(
          (option) => {
            const isSelected =
              selectedSection ===
              option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setSelectedSection(
                    option.id
                  )
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          }
        )}
      </div>

      <div className="mt-6">
        {isLoading &&
        !data ? (
          <div className="h-96 animate-pulse rounded-2xl bg-slate-900" />
        ) : error &&
          !data ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">
            {error}
          </div>
        ) : (
          <MovementTable
            stocks={
              (
                selectedStocks ??
                []
              ).slice(0, 5)
            }
            section={
              selectedSection
            }
          />
        )}
      </div>

      <p className="mt-5 text-xs leading-6 text-slate-500">
        Volume and traded-value rankings
        represent absolute market activity.
        Historical relative-volume and
        breakout analysis will be added
        separately.
      </p>
    </section>
  );
}