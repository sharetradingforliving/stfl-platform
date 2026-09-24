"use client";

import {
  useEffect,
  useState,
} from "react";

type IndexQuote = {
  symbol: string;
  displayName: string;
  instrumentKey: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
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

function formatIndexPrice(
  value: number | null
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
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

function formatChangePercent(
  value: number | null
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${Math.abs(value).toFixed(
    2
  )}%`;
}

function IndexPrice({
  quote,
}: {
  quote: IndexQuote;
}) {
  const change =
    quote.change ?? 0;

  const changePercent =
    quote.changePercent ?? 0;

  const isPositive =
    change > 0;

  const isNegative =
    change < 0;

  const movementColour =
    isPositive
      ? "text-emerald-400"
      : isNegative
        ? "text-red-400"
        : "text-slate-400";

  const movementArrow =
    isPositive
      ? "▲"
      : isNegative
        ? "▼"
        : "•";

  return (
    <div className="min-w-0 border-l border-slate-800 pl-4">
      <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {quote.displayName}
      </p>

      <div className="mt-1 flex items-center gap-2 whitespace-nowrap">
        <span className="text-sm font-bold text-white">
          {formatIndexPrice(
            quote.currentPrice
          )}
        </span>

        <span
          className={`text-xs font-semibold ${movementColour}`}
        >
          {movementArrow}{" "}
          {formatChangePercent(
            changePercent
          )}
        </span>
      </div>
    </div>
  );
}

export default function HeaderIndexPrices() {
  const [
    indices,
    setIndices,
  ] = useState<IndexQuote[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  useEffect(() => {
    let requestIsActive = true;

    async function loadIndices() {
      try {
        const response =
  await fetch(
    "/api/upstox/indices",
    {
      method: "GET",
      cache: "no-store",
    }
  );

if (!response.ok) {
  console.warn(
    "Header index prices unavailable:",
    response.status
  );

  return;
}

const contentType =
  response.headers.get(
    "content-type"
  ) ?? "";

if (
  !contentType.includes(
    "application/json"
  )
) {
  console.warn(
    "Header index prices returned a non-JSON response."
  );

  return;
}

const data =
  (await response.json()) as
    IndexApiResponse;

if (
  !Array.isArray(
    data.indices
  )
) {
  console.warn(
    "Header index prices response did not contain an indices array."
  );

  return;
}

if (requestIsActive) {
  setIndices(
    data.indices
  );
}
} catch (error) {
  console.warn(
    "Header index prices unavailable:",
    error
  );

        /*
         * Retain the most recent valid
         * values if a refresh fails.
         */
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadIndices();

    /*
     * Refresh the displayed indices
     * every 30 seconds while this
     * header remains mounted.
     */
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

  if (
    isLoading &&
    indices.length === 0
  ) {
    return (
      <div className="hidden items-center gap-5 xl:flex">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-800" />

        <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-800" />
      </div>
    );
  }

  if (indices.length === 0) {
    return null;
  }

  return (
    <div
      className="hidden items-center gap-5 xl:flex"
      aria-label="Live market indices"
    >
      {indices.map(
        (quote) => (
          <IndexPrice
            key={
              quote.instrumentKey
            }
            quote={quote}
          />
        )
      )}
    </div>
  );
}