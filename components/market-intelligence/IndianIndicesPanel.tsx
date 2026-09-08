"use client";

import SectorMoversPanel from "./SectorMoversPanel";

import {
  Fragment,
  useEffect,
  useState,
} from "react";

type IndexCategory =
  | "BENCHMARK"
  | "BROAD_MARKET"
  | "SECTOR";

type IndexQuote = {
  symbol: string;
  displayName: string;
  instrumentKey: string;
  category: IndexCategory;
  showInHeader: boolean;
  displayOrder: number;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  lastUpdated: string | null;
  source: string;
};

type IndexApiResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

  indices?: IndexQuote[];
  errors?: string[];
};

function isValidNumber(
  value: number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function formatNumber(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  return value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatSignedNumber(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const prefix =
    value > 0 ? "+" : "";

  return `${prefix}${value.toLocaleString(
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
    return "—";
  }

  const prefix =
    value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(
    2
  )}%`;
}

function formatUpdatedTime(
  value: string | null
): string {
  if (!value) {
    return "Update time unavailable";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Update time unavailable";
  }

  return `Updated ${date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  )}`;
}

function getMovementStyle(
  change:
    number | null | undefined
) {
  const validChange =
    isValidNumber(change)
      ? change
      : 0;

  if (validChange > 0) {
    return {
      colour:
        "text-emerald-400",
      border:
        "border-emerald-500/25",
      background:
        "bg-emerald-500/5",
      arrow: "▲",
    };
  }

  if (validChange < 0) {
    return {
      colour:
        "text-red-400",
      border:
        "border-red-500/25",
      background:
        "bg-red-500/5",
      arrow: "▼",
    };
  }

  return {
    colour:
      "text-slate-400",
    border:
      "border-slate-800",
    background:
      "bg-slate-900/50",
    arrow: "•",
  };
}

function BenchmarkCard({
  quote,
}: {
  quote: IndexQuote;
}) {
  const movement =
    getMovementStyle(
      quote.change
    );

  return (
    <article
      className={`rounded-2xl border p-6 ${movement.border} ${movement.background}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            {quote.displayName}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {formatNumber(
              quote.currentPrice
            )}
          </p>
        </div>

        <span
          className={`rounded-full border border-current/20 px-3 py-1.5 text-sm font-semibold ${movement.colour}`}
        >
          {movement.arrow}{" "}
          {formatPercent(
            quote.changePercent
          )}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Change
          </p>

          <p
            className={`mt-1 font-semibold ${movement.colour}`}
          >
            {formatSignedNumber(
              quote.change
            )}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Previous close
          </p>

          <p className="mt-1 font-semibold text-slate-200">
            {formatNumber(
              quote.previousClose
            )}
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs text-slate-500">
        {formatUpdatedTime(
          quote.lastUpdated
        )} · {quote.source}
      </p>
    </article>
  );
}

function CompactIndexCard({
  quote,
  showRank = false,
  rank,
  isSelected = false,
  onSelect,
}: {
  quote: IndexQuote;
  showRank?: boolean;
  rank?: number;
  isSelected?: boolean;
  onSelect?: (
    symbol: string
  ) => void;
}) {
  const movement =
    getMovementStyle(
      quote.change
    );

  return (
    <article
  className={`group rounded-2xl border p-5 ${movement.background} ${
    isSelected
      ? "border-cyan-400 ring-1 ring-cyan-400/40"
      : movement.border
  } ${
    showRank
      ? "transition hover:-translate-y-0.5 hover:border-cyan-500/40"
      : ""
  }`}
>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {showRank &&
              rank !== undefined && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-400">
                  {rank}
                </span>
              )}

            <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {quote.displayName}
            </p>
          </div>

          <p className="mt-3 text-xl font-bold text-white">
            {formatNumber(
              quote.currentPrice
            )}
          </p>
        </div>

        <span
          className={`shrink-0 text-sm font-semibold ${movement.colour}`}
        >
          {movement.arrow}{" "}
          {formatPercent(
            quote.changePercent
          )}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
  <span className="text-slate-500">
    Change
  </span>

  <span
    className={`font-semibold ${movement.colour}`}
  >
    {formatSignedNumber(
      quote.change
    )}
  </span>
</div>

{showRank && (
  <div className="mt-4 border-t border-slate-800 pt-4">
    <button
      type="button"
      onClick={() =>
        onSelect?.(
          quote.symbol
        )
      }
      className="text-left text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
    >
      {isSelected
        ? "Hide movers & draggers ↑"
        : "View top movers & draggers →"}
    </button>
  </div>
)}
    </article>
  );
}

export default function IndianIndicesPanel() {
  const [
    indices,
    setIndices,
  ] = useState<IndexQuote[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
  selectedSector,
  setSelectedSector,
] = useState<string | null>(
  null
);

  useEffect(() => {
    let requestIsActive = true;

    async function loadIndices() {
      try {
        const response =
          await fetch(
            "/api/upstox/indices?scope=all",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as
            IndexApiResponse;

        if (
          !response.ok ||
          !Array.isArray(
            data.indices
          )
        ) {
          throw new Error(
            data.errors?.[0] ??
              "Index data is unavailable"
          );
        }

        if (requestIsActive) {
          setIndices(
            data.indices
          );

          setError("");
        }
      } catch (requestError) {
        console.error(
          "Market intelligence index error:",
          requestError
        );

        if (requestIsActive) {
          setError(
            "Live index information is temporarily unavailable."
          );
        }
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadIndices();

    const refreshTimer =
      window.setInterval(
        loadIndices,
        30_000
      );

    return () => {
      requestIsActive = false;

      window.clearInterval(
        refreshTimer
      );
    };
  }, []);

  function handleSectorSelect(
  sectorSymbol: string
) {
  setSelectedSector(
    (currentSector) =>
      currentSector ===
      sectorSymbol
        ? null
        : sectorSymbol
  );
}

  const benchmarkIndices =
    indices
      .filter(
        (quote) =>
          quote.category ===
          "BENCHMARK"
      )
      .sort(
        (first, second) =>
          first.displayOrder -
          second.displayOrder
      );

  const broadMarketIndices =
    indices
      .filter(
        (quote) =>
          quote.category ===
          "BROAD_MARKET"
      )
      .sort(
        (first, second) =>
          first.displayOrder -
          second.displayOrder
      );

  const sectorIndices =
    indices
      .filter(
        (quote) =>
          quote.category ===
          "SECTOR"
      )
      .sort(
        (first, second) =>
          (
            second.changePercent ??
            Number.NEGATIVE_INFINITY
          ) -
          (
            first.changePercent ??
            Number.NEGATIVE_INFINITY
          )
      );

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Live market data
          </p>

          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Indian Indices & Sector Intelligence
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Benchmark, broad-market and sector
            performance compared with the previous
            trading-day close.
          </p>
        </div>

        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
          AUTO REFRESH · 30 SEC
        </span>
      </div>

      {isLoading &&
      indices.length === 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-900" />

          <div className="h-56 animate-pulse rounded-2xl bg-slate-900" />
        </div>
      ) : error &&
        indices.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {benchmarkIndices.map(
              (quote) => (
                <BenchmarkCard
                  key={
                    quote.instrumentKey
                  }
                  quote={quote}
                />
              )
            )}
          </div>

          {broadMarketIndices.length >
            0 && (
            <div className="mt-10">
              <h3 className="text-lg font-bold text-white">
                Broader Market
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Participation beyond the main benchmark indices.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {broadMarketIndices.map(
                  (quote) => (
                    <CompactIndexCard
                      key={
                        quote.instrumentKey
                      }
                      quote={quote}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {sectorIndices.length >
            0 && (
            <div className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Sector Performance
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Ranked from the strongest to weakest daily sector movement.
                  </p>
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Daily ranking
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {sectorIndices.map(
    (
      quote,
      index
    ) => {
      const isSelected =
        selectedSector ===
        quote.symbol;

      return (
        <Fragment
          key={
            quote.instrumentKey
          }
        >
          <CompactIndexCard
            quote={quote}
            showRank
            rank={
              index + 1
            }
            isSelected={
              isSelected
            }
            onSelect={
              handleSectorSelect
            }
          />

          {isSelected && (
            <div className="col-span-full">
              <SectorMoversPanel
                sector={
                  quote.symbol
                }
                onClose={() =>
                  setSelectedSector(
                    null
                  )
                }
              />
            </div>
          )}
        </Fragment>
      );
    }
  )}
</div>
            </div>
          )}
        </>
      )}
    </section>
  );
}