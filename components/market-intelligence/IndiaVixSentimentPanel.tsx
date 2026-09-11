"use client";

import {
  ColorType,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type RangeOption = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y";

type ChartPoint = {
  date: string;
  value: number | null;
};

type HistoricalResult = {
  sessions: number;
  observations: number;
  advanceProbability: number | null;
  declineProbability: number | null;
  averageReturn: number | null;
  medianReturn: number | null;
};

type VixSentimentResponse = {
  status: "success" | "unavailable";
  marketDataStatus: "live" | "previous_session" | "historical";
  range: RangeOption;
  current: {
    value: number | null;
    change: number | null;
    changePercent: number | null;
    lastUpdated: string | null;
    sessionDate: string | null;
  };
  volatility: {
    percentileRank: number | null;
    zone: {
      key: "CALM" | "NORMAL" | "ELEVATED" | "HIGH" | "EXTREME";
      label: string;
      colour: string;
      explanation: string;
    };
    twentyDayAverage: number | null;
    historicalBands: {
      p20: number | null;
      p50: number | null;
      p75: number | null;
      p90: number | null;
    };
    expectedMove: {
      dailyPercent: number | null;
      thirtyDayPercent: number | null;
      explanation: string;
    };
  };
  direction: {
    label: string;
    interpretation: string;
    vixFiveSessionChangePercent: number | null;
    niftyTwentySessionChangePercent: number | null;
  };
  historicalEvidence: {
    methodology: string;
    results: HistoricalResult[];
  };
  chart: {
    indiaVix: ChartPoint[];
    nifty50: ChartPoint[];
  };
  sample: {
    from: string | null;
    to: string | null;
    vixObservations: number;
    niftyObservations: number;
  };
  source: string;
  fetchedAt: string;
  disclaimer: string;
  error?: string;
  details?: string;
};

const ranges: RangeOption[] = ["1M", "3M", "6M", "1Y", "3Y", "5Y"];

function validNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number | null | undefined, digits = 2): string {
  return validNumber(value) ? value.toFixed(digits) : "—";
}

function formatPercent(
  value: number | null | undefined,
  includeSign = false
): string {
  if (!validNumber(value)) return "—";
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const date = new Date(`${value}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function movingAverage(points: ChartPoint[], period: number) {
  const result: { time: Time; value: number }[] = [];

  for (let index = period - 1; index < points.length; index += 1) {
    const window = points.slice(index - period + 1, index + 1);
    const values = window
      .map((point) => point.value)
      .filter(validNumber);

    if (values.length !== period) continue;

    result.push({
      time: points[index].date as Time,
      value: values.reduce((sum, value) => sum + value, 0) / period,
    });
  }

  return result;
}

function zoneClasses(zone: string | undefined): string {
  if (zone === "CALM") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (zone === "NORMAL") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  if (zone === "ELEVATED") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (zone === "HIGH") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function directionClasses(label: string | undefined): string {
  if (label === "CONSTRUCTIVE") return "text-emerald-300";
  if (label === "RISK-OFF") return "text-red-300";
  if (label === "UNSTABLE RALLY") return "text-amber-300";
  return "text-cyan-300";
}

function VixChart({ data }: { data: VixSentimentResponse }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const vixSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const chartData = useMemo(() => {
    const vix = data.chart.indiaVix
      .filter((point) => validNumber(point.value))
      .map((point) => ({ time: point.date as Time, value: point.value as number }));

    const firstNifty = data.chart.nifty50.find((point) => validNumber(point.value))?.value;
    const nifty = validNumber(firstNifty)
      ? data.chart.nifty50
          .filter((point) => validNumber(point.value))
          .map((point) => ({
            time: point.date as Time,
            value: (((point.value as number) - firstNifty) / firstNifty) * 100,
          }))
      : [];

    return { vix, nifty, average: movingAverage(data.chart.indiaVix, 20) };
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 390,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(51, 65, 85, 0.35)" },
        horzLines: { color: "rgba(51, 65, 85, 0.35)" },
      },
      rightPriceScale: { borderColor: "#334155" },
      leftPriceScale: { visible: true, borderColor: "#334155" },
      timeScale: { borderColor: "#334155", timeVisible: false },
      crosshair: {
        vertLine: { color: "#64748b", labelBackgroundColor: "#0f172a" },
        horzLine: { color: "#64748b", labelBackgroundColor: "#0f172a" },
      },
    });

    const vixSeries = chart.addSeries(LineSeries, {
      title: "India VIX",
      color: "#f59e0b",
      lineWidth: 3,
      priceScaleId: "right",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    const averageSeries = chart.addSeries(LineSeries, {
      title: "VIX 20-session average",
      color: "#22d3ee",
      lineWidth: 2,
      lineStyle: 2,
      priceScaleId: "right",
    });

    const niftySeries = chart.addSeries(LineSeries, {
      title: "Nifty change %",
      color: "#a78bfa",
      lineWidth: 2,
      priceScaleId: "left",
      priceFormat: { type: "custom", formatter: (value: number) => `${value.toFixed(1)}%` },
    });

    vixSeries.setData(chartData.vix);
    averageSeries.setData(chartData.average);
    niftySeries.setData(chartData.nifty);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    vixSeriesRef.current = vixSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      vixSeriesRef.current = null;
    };
  }, [chartData]);

  return <div ref={containerRef} className="w-full" />;
}

function MetricCard({
  label,
  value,
  description,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  description: string;
  valueClass?: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}

export default function IndiaVixSentimentPanel() {
  const [selectedRange, setSelectedRange] = useState<RangeOption>("1Y");
  const [data, setData] = useState<VixSentimentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/market/vix-sentiment?range=${selectedRange}`,
          { method: "GET", cache: "no-store" }
        );
        const result = (await response.json()) as VixSentimentResponse;

        if (!response.ok || result.status !== "success") {
          throw new Error(result.error ?? result.details ?? "India VIX analysis is unavailable");
        }

        if (active) {
          setData(result);
          setError("");
        }
      } catch (requestError) {
        console.error("India VIX panel error:", requestError);
        if (active) setError("India VIX and market-sentiment analysis is temporarily unavailable.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();
    const timer = window.setInterval(loadData, 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedRange]);

  const rank = Math.max(0, Math.min(100, data?.volatility.percentileRank ?? 0));
  const isPrevious = data?.marketDataStatus === "previous_session";
  const vixChangePositive = (data?.current.changePercent ?? 0) > 0;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Volatility and risk environment
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            India VIX &amp; Market Sentiment
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Understand expected market movement, the historical volatility regime and how Nifty behaved after similar conditions.
          </p>
        </div>

        <div className="text-right">
          <span className={`rounded-full border px-4 py-2 text-xs font-semibold ${
            isPrevious
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}>
            {isPrevious ? "PREVIOUS SESSION" : "LIVE · AUTO REFRESH"}
          </span>
          <p className="mt-3 text-xs text-slate-500">
            {formatDate(data?.current.sessionDate)}
          </p>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="mt-8 h-[520px] animate-pulse rounded-2xl bg-slate-900" />
      ) : error && !data ? (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          {error}
        </div>
      ) : data ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="India VIX"
              value={formatNumber(data.current.value)}
              description={`${formatPercent(data.current.changePercent, true)} versus previous close`}
              valueClass={vixChangePositive ? "text-amber-300" : "text-emerald-300"}
            />
            <MetricCard
              label="Volatility zone"
              value={data.volatility.zone.label}
              description={`${formatNumber(data.volatility.percentileRank, 1)}th percentile of the five-year sample`}
              valueClass={zoneClasses(data.volatility.zone.key).split(" ").at(-1) ?? "text-white"}
            />
            <MetricCard
              label="Expected daily move"
              value={`±${formatPercent(data.volatility.expectedMove.dailyPercent)}`}
              description="Estimated one-session movement range, not direction."
              valueClass="text-cyan-300"
            />
            <MetricCard
              label="Expected 30-day move"
              value={`±${formatPercent(data.volatility.expectedMove.thirtyDayPercent)}`}
              description="Approximate volatility-implied range in either direction."
              valueClass="text-violet-300"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Historical volatility meter
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Current VIX is above {formatNumber(data.volatility.percentileRank, 1)}% of observations in the five-year sample.
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${zoneClasses(data.volatility.zone.key)}`}>
                {data.volatility.zone.key}
              </span>
            </div>

            <div className="relative mt-6">
              <div className="h-4 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
              <div
                className="absolute top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                style={{ left: `${rank}%` }}
              />
              <div className="mt-3 grid grid-cols-5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <span>Calm</span><span>Normal</span><span>Elevated</span><span>High</span><span>Extreme</span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              {data.volatility.zone.explanation}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-xs font-semibold">
                <span className="text-amber-300">● India VIX</span>
                <span className="text-cyan-300">● VIX 20-session average</span>
                <span className="text-violet-300">● Nifty change %</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ranges.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setSelectedRange(range)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      selectedRange === range
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                        : "border-slate-800 bg-slate-900 text-slate-500 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl">
              <VixChart data={data} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Directional environment
              </p>
              <p className={`mt-3 text-xl font-bold ${directionClasses(data.direction.label)}`}>
                {data.direction.label}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {data.direction.interpretation}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-950/70 p-3 text-slate-400">
                  VIX 5-session trend
                  <strong className="mt-1 block text-white">
                    {formatPercent(data.direction.vixFiveSessionChangePercent, true)}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3 text-slate-400">
                  Nifty 20-session trend
                  <strong className="mt-1 block text-white">
                    {formatPercent(data.direction.niftyTwentySessionChangePercent, true)}
                  </strong>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-400">
                STFL automated interpretation
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                India VIX is in the <strong>{data.volatility.zone.label.toLowerCase()}</strong> zone at {formatNumber(data.current.value)}. The options market is implying an approximate daily Nifty movement of <strong>±{formatPercent(data.volatility.expectedMove.dailyPercent)}</strong>. This describes probable movement size—not whether the market must rise or fall. The combined VIX and Nifty trend currently indicates <strong>{data.direction.label.toLowerCase()}</strong> conditions.
              </p>
            </article>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
            <div className="border-b border-slate-800 bg-slate-900/60 p-5">
              <h3 className="font-semibold text-white">What happened after similar VIX conditions?</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {data.historicalEvidence.methodology}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Forward period</th>
                    <th className="px-5 py-3 text-right">Observations</th>
                    <th className="px-5 py-3 text-right">Advanced</th>
                    <th className="px-5 py-3 text-right">Declined</th>
                    <th className="px-5 py-3 text-right">Median return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                  {data.historicalEvidence.results.map((result) => (
                    <tr key={result.sessions}>
                      <td className="px-5 py-4 font-semibold text-white">{result.sessions} session{result.sessions > 1 ? "s" : ""}</td>
                      <td className="px-5 py-4 text-right text-slate-300">{result.observations.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 text-right text-emerald-300">{formatPercent(result.advanceProbability)}</td>
                      <td className="px-5 py-4 text-right text-red-300">{formatPercent(result.declineProbability)}</td>
                      <td className={`px-5 py-4 text-right font-semibold ${(result.medianReturn ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                        {formatPercent(result.medianReturn, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500">
            <span>Sample: {formatDate(data.sample.from)}–{formatDate(data.sample.to)}</span>
            <span>Source: {data.source}</span>
            <span>{data.disclaimer}</span>
          </div>
        </>
      ) : null}
    </section>
  );
}
