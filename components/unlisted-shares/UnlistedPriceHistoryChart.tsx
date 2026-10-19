"use client";

import {
  ColorType,
  LineSeries,
  createChart,
  type Time,
} from "lightweight-charts";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PriceObservation = {
  observation_date: string;
  indicative_price: number | null;
  source?: string | null;
};

type PriceRange =
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "2Y"
  | "ALL";

type Props = {
  observations: PriceObservation[];
};

const RANGES: PriceRange[] = [
  "1M",
  "3M",
  "6M",
  "1Y",
  "2Y",
  "ALL",
];

function rangeStart(
  latestDate: string,
  range: PriceRange
): Date | null {
  if (range === "ALL") return null;

  const latest = new Date(
    `${latestDate}T00:00:00Z`
  );

  const start = new Date(latest);

  if (range === "1M") {
    start.setUTCMonth(start.getUTCMonth() - 1);
  } else if (range === "3M") {
    start.setUTCMonth(start.getUTCMonth() - 3);
  } else if (range === "6M") {
    start.setUTCMonth(start.getUTCMonth() - 6);
  } else if (range === "1Y") {
    start.setUTCFullYear(start.getUTCFullYear() - 1);
  } else {
    start.setUTCFullYear(start.getUTCFullYear() - 2);
  }

  return start;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function UnlistedPriceHistoryChart({
  observations,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(
    null
  );
  const [range, setRange] =
    useState<PriceRange>("1Y");

  const normalized = useMemo(() => {
    const byDate = new Map<string, number>();

    for (const observation of observations) {
      const price = observation.indicative_price;

      if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price <= 0 ||
        byDate.has(observation.observation_date)
      ) {
        continue;
      }

      byDate.set(observation.observation_date, price);
    }

    return Array.from(byDate.entries())
      .map(([date, price]) => ({ date, price }))
      .sort((left, right) =>
        left.date.localeCompare(right.date)
      );
  }, [observations]);

  const visible = useMemo(() => {
    if (normalized.length === 0) return [];

    const latest = normalized.at(-1)!;
    const start = rangeStart(latest.date, range);

    if (start === null) return normalized;

    return normalized.filter(
      (point) =>
        new Date(`${point.date}T00:00:00Z`) >=
        start
    );
  }, [normalized, range]);

  const summary = useMemo(() => {
    if (visible.length === 0) return null;

    const first = visible[0].price;
    const last = visible[visible.length - 1].price;
    const prices = visible.map((point) => point.price);
    const change = last - first;
    const changePercent =
      first === 0 ? null : (change / first) * 100;

    return {
      first,
      last,
      change,
      changePercent,
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }, [visible]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || visible.length < 2) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 340,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "transparent",
        },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#334155",
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: "#64748b" },
        horzLine: { color: "#64748b" },
      },
    });

    const line = chart.addSeries(LineSeries, {
      color: "#34d399",
      lineWidth: 3,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    line.setData(
      visible.map((point) => ({
        time: point.date as Time,
        value: point.price,
      }))
    );

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [visible]);

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Price movement
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              Indicative price trend
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Based only on dated observations received from identified sources.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  range === item
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                {item === "ALL" ? "All" : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-px bg-slate-800 md:grid-cols-4">
          <Metric label="Latest" value={formatPrice(summary.last)} />
          <Metric label="Period high" value={formatPrice(summary.high)} />
          <Metric label="Period low" value={formatPrice(summary.low)} />
          <Metric
            label="Period movement"
            value={
  visible.length < 2 ||
  summary.changePercent === null
    ? "Not available"
    : `${summary.changePercent >= 0 ? "+" : ""}${summary.changePercent.toFixed(2)}%`
}
            tone={summary.change >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      <div className="p-5 md:p-6">
        {visible.length >= 2 ? (
          <div ref={containerRef} className="w-full" />
        ) : (
          <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
            <div>
              <p className="font-semibold text-slate-200">
                More price observations are required
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                A price trend will appear after at least two dated indicative-price observations are available for this period.
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Indicative observations are not exchange closing prices or executable quotations. Missing dates are not interpolated.
        </p>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="bg-slate-900 px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 font-bold ${
          tone === "negative"
            ? "text-red-300"
            : tone === "positive"
              ? "text-emerald-300"
              : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
