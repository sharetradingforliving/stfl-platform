"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type StockMovement = {
  symbol: string;
  companyName: string;
  instrumentKey: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
};

type SectorMoversResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

  sector?: string;
  indexName?: string;

  movers?: StockMovement[];
  draggers?: StockMovement[];

  constituentCount?: number;
  matchedInstrumentCount?: number;
  availableQuoteCount?: number;

  errors?: string[];

  lastUpdated?: string;
  constituentSource?: string;
  marketDataSource?: string;

  error?: string;
  details?: string;
};

type SectorMoversPanelProps = {
  sector: string;
  onClose: () => void;
};

function isValidNumber(
  value: number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function formatPrice(
  value: number | null
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

function formatChange(
  value: number | null
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

function MovementList({
  title,
  movements,
  type,
}: {
  title: string;
  movements: StockMovement[];
  type: "mover" | "dragger";
}) {
  const isMover =
    type === "mover";

  const colour =
    isMover
      ? "text-emerald-400"
      : "text-red-400";

  const background =
    isMover
      ? "border-emerald-500/20 bg-emerald-500/5"
      : "border-red-500/20 bg-red-500/5";

  return (
    <div
      className={`rounded-2xl border p-5 ${background}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h4 className="font-bold text-white">
          {title}
        </h4>

        <span
          className={`text-xs font-semibold uppercase tracking-wider ${colour}`}
        >
          {isMover
            ? "Positive"
            : "Negative"}
        </span>
      </div>

      {movements.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          No stocks are currently
          available in this category.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {movements.map(
            (
              movement,
              index
            ) => (
              <Link
                key={
                  movement.instrumentKey
                }
                href={`/company/${encodeURIComponent(
                  movement.symbol
                )}?exchange=NSE`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {movement.symbol}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {movement.companyName}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-200">
                    {formatPrice(
                      movement.currentPrice
                    )}
                  </p>

                  <p
                    className={`mt-1 text-xs font-bold ${colour}`}
                  >
                    {formatChange(
                      movement.changePercent
                    )}
                  </p>
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function SectorMoversPanel({
  sector,
  onClose,
}: SectorMoversPanelProps) {
  const [
    data,
    setData,
  ] =
    useState<SectorMoversResponse | null>(
      null
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

    async function loadMovers() {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/upstox/sectors/${encodeURIComponent(
              sector
            )}/movers`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          (await response.json()) as
            SectorMoversResponse;

        if (!response.ok) {
          throw new Error(
            result.error ??
              result.details ??
              "Unable to load sector movements"
          );
        }

        if (requestIsActive) {
          setData(result);
        }
      } catch (requestError) {
        console.error(
          "Sector movers panel error:",
          requestError
        );

        if (requestIsActive) {
          setData(null);

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Sector movements are temporarily unavailable."
          );
        }
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadMovers();

    return () => {
      requestIsActive = false;
    };
  }, [sector]);

  return (
    <section className="mt-6 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Sector stock movement
          </p>

          <h3 className="mt-2 text-xl font-bold text-white">
            {data?.indexName ??
              sector}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Top five constituent stocks
            ranked by daily percentage
            movement.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-red-500/40 hover:text-red-400"
        >
          Close
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-950" />

          <div className="h-80 animate-pulse rounded-2xl bg-slate-950" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <MovementList
              title="Movers"
              movements={
                data?.movers ?? []
              }
              type="mover"
            />

            <MovementList
              title="Draggers"
              movements={
                data?.draggers ?? []
              }
              type="dragger"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
            <span>
              Constituents:{" "}
              {data?.constituentCount ??
                "—"}
            </span>

            <span>
              Live quotes:{" "}
              {data?.availableQuoteCount ??
                "—"}
            </span>

            <span>
              Constituents:{" "}
              {data?.constituentSource ??
                "NSE Indices"}
            </span>

            <span>
              Prices:{" "}
              {data?.marketDataSource ??
                "Upstox"}
            </span>
          </div>
        </>
      )}
    </section>
  );
}