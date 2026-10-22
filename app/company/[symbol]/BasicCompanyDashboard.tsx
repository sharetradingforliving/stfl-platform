"use client";

import ChartToolbar from "@/components/charts/ChartToolbar";
import PriceChart from "@/components/charts/PriceChart";
import CompanySearch from "@/components/search/CompanySearch";
import InvestmentSummary from "@/components/company/InvestmentSummary";
import MarketSnapshotCard from "@/components/company/MarketSnapshotCard";
import TechnicalsCard from "@/components/company/TechnicalsCard";

import type {
  CompanyResearch,
} from "@/lib/types/research";

import Link from "next/link";
import {
  MousePointer2,
  Minus,
  MoveVertical,
  Ratio,
  Square,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type BasicCompanyDashboardProps = {
  symbol: string;
  exchange: "NSE" | "BSE";
};

type MarketData = {
  symbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  averagePrice: number | null;
  lastUpdated: string | null;
  source: string;
};

type ChartCommand =
  | "moveLeft"
  | "moveRight"
  | "zoomIn"
  | "zoomOut"
  | "reset"
  | "clearDrawings";

export default function BasicCompanyDashboard({
  symbol,
  exchange,
}: BasicCompanyDashboardProps) {
    const chartContainerRef =
    useRef<HTMLDivElement | null>(null);
  const [
    marketData,
    setMarketData,
  ] = useState<MarketData | null>(
    null
  );

  const [
    research,
    setResearch,
  ] = useState<CompanyResearch | null>(
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

  const [
    timeframe,
    setTimeframe,
  ] = useState("D");

  const [
    activeIndicators,
    setActiveIndicators,
  ] = useState<string[]>([]);

  const [
    isCrosshairActive,
    setIsCrosshairActive,
  ] = useState(false);

  const [
    activeDrawingTool,
    setActiveDrawingTool,
  ] = useState<string | null>(null);

  const [
    isChartFullscreen,
    setIsChartFullscreen,
  ] = useState(false);

  const [
    chartCommand,
    setChartCommand,
  ] = useState<{
    action: ChartCommand;
    id: number;
  } | null>(null);

  function handleIndicatorToggle(
    indicator: string
  ) {
    setActiveIndicators(
      (currentIndicators) =>
        currentIndicators.includes(
          indicator
        )
          ? currentIndicators.filter(
              (currentIndicator) =>
                currentIndicator !==
                indicator
            )
          : [
              ...currentIndicators,
              indicator,
            ]
    );
  }

  function handleChartCommand(
    action: ChartCommand
  ) {
    setChartCommand({
      action,
      id: Date.now(),
    });
  }

    async function handleChartFullscreen() {
    const chartContainer =
      chartContainerRef.current;

    if (!chartContainer) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await chartContainer.requestFullscreen();
      }
    } catch (fullscreenError) {
      console.error(
        "Unable to change chart fullscreen mode:",
        fullscreenError
      );
    }
  }
    useEffect(() => {
    function handleFullscreenChange() {
      setIsChartFullscreen(
        document.fullscreenElement ===
          chartContainerRef.current
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    async function fetchMarketData() {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/upstox/quote/${symbol}?exchange=${exchange}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Unable to load market data"
          );
        }

        setMarketData(data);
      } catch (error) {
        console.error(
          "Basic company dashboard error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load market data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarketData();
  }, [symbol, exchange]);

  function formatPrice(
  value:
    | number
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
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
  function formatVolume(
    value:
      | number
      | null
      | undefined
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return value.toLocaleString(
      "en-IN"
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg text-slate-400">
          Loading live market data...
        </p>
      </main>
    );
  }

  if (error || !marketData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            STFL Company Research
          </p>

          <h1 className="mt-5 text-4xl font-bold">
            Market Data Unavailable
          </h1>

          <p className="mt-4 text-slate-400">
            {error}
          </p>

          <a
            href="/api/upstox/login"
            className="mt-8 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950"
          >
            Connect Upstox
          </a>
        </div>
      </main>
    );
  }

  const isPositive =
    marketData.change >= 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <section className="border-b border-slate-800 bg-[#020817] px-5 py-5">
          <div className="mx-auto max-w-7xl">
            
            <Link
              href="/company-research"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-emerald-400"
            >
              <span>←</span>

              <span>
                Company Research
              </span>
            </Link>

            <CompanySearch variant="compact" />
          </div>
        </section>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
              STFL Live Market Dashboard
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-bold">
                {marketData.symbol}
              </h1>

              <span className="rounded-full border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-400">
                {marketData.exchange}
              </span>
            </div>

            <p className="mt-5 text-lg font-medium text-slate-300">
              {marketData.companyName}
            </p>

            <p className="mt-2 text-slate-400">
              Live market overview
              powered by Upstox
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:min-w-96">
            <p className="text-sm text-slate-400">
              Current Market Price
            </p>

            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-bold">
                {formatPrice(
                  marketData.currentPrice
                )}
              </p>

              <p
                className={`pb-1 font-semibold ${
                  isPositive
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {isPositive
                  ? "▲"
                  : "▼"}{" "}
                {formatPrice(
                  Math.abs(
                    marketData.change
                  )
                )}{" "}
                (
                {isPositive ? "+" : "-"}
                {Math.abs(
                  marketData.changePercent
                ).toFixed(2)}
                %)
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Market data:{" "}
              {marketData.source}
            </p>
          </div>
        </div>

        {/* STFL Research Terminal */}
        <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
                STFL Research Terminal
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Interactive Professional
                Chart
              </h2>

              <p className="mt-2 text-slate-400">
                Professional market
                analysis powered by
                Upstox data and STFL AI
                research.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400"
              >
                🧠 STFL AI Research
              </button>
            </div>
          </div>

          <div
  ref={chartContainerRef}
  className={
    isChartFullscreen
      ? "h-screen overflow-auto bg-slate-950 p-6"
      : "mt-8"
  }
>
            <ChartToolbar
              timeframe={timeframe}
              onTimeframeChange={
                setTimeframe
              }
              activeIndicators={
                activeIndicators
              }
              onIndicatorToggle={
                handleIndicatorToggle
              }
              onDrawingToolSelect={
                setActiveDrawingTool
              }
              isCrosshairActive={
                isCrosshairActive
              }
              isChartFullscreen={
                isChartFullscreen
              }
              onFullscreenToggle={
                handleChartFullscreen
              }
              onCrosshairToggle={() =>
                setIsCrosshairActive(
                  (currentValue) =>
                    !currentValue
                )
              }
              onChartCommand={
                handleChartCommand
              }
            />

            <div
  className={
    isChartFullscreen
      ? "mt-6 grid grid-cols-1"
      : "mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-10"
  }
>
              {/* Left side */}
              <div
  className={
    isChartFullscreen
      ? "min-w-0"
      : "min-w-0 xl:col-span-7"
  }
>
                <div className="flex min-w-0 items-start gap-2">
  {/* Desktop sticky drawing rail */}
  <aside
    className={`hidden shrink-0 md:block ${
      isChartFullscreen
        ? "sticky top-4"
        : "sticky top-24"
    } z-40`}
  >
    <div className="flex w-12 flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/95 p-1.5 shadow-xl backdrop-blur">
      <button
        type="button"
        title="Pointer / Stop drawing"
        aria-label="Pointer / Stop drawing"
        onClick={() =>
          setActiveDrawingTool(null)
        }
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          activeDrawingTool === null
            ? "bg-emerald-500 text-slate-950"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <MousePointer2
          className="h-4 w-4"
          aria-hidden="true"
        />
      </button>

      <div className="my-1 h-px w-7 bg-slate-800" />

      <button
        type="button"
        title="Horizontal Line"
        aria-label="Horizontal Line"
        onClick={() =>
          setActiveDrawingTool(
            (currentTool) =>
              currentTool === "horizontal-line"
                ? null
                : "horizontal-line"
          )
        }
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          activeDrawingTool === "horizontal-line"
            ? "bg-cyan-500 text-slate-950"
            : "text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
        }`}
      >
        <Minus
          className="h-5 w-5"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        title="Fibonacci Retracement"
        aria-label="Fibonacci Retracement"
        onClick={() =>
          setActiveDrawingTool(
            (currentTool) =>
              currentTool === "fibonacci"
                ? null
                : "fibonacci"
          )
        }
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
          activeDrawingTool === "fibonacci"
            ? "bg-emerald-500 text-slate-950"
            : "text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
        }`}
      >
        <span className="text-[10px] font-bold tracking-wide">
  FIB
</span>
      </button>

      <div className="my-1 h-px w-7 bg-slate-800" />

      <button
        type="button"
        disabled
        title="Vertical Line — coming next"
        aria-label="Vertical Line — coming next"
        className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-slate-600"
      >
        <MoveVertical
          className="h-5 w-5"
          aria-hidden="true"
        />
      </button>

      <button
  type="button"
  disabled
  title="Rectangle / Zone — coming next"
  aria-label="Rectangle / Zone — coming next"
  className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-slate-600"
>
  <Square
    className="h-5 w-5"
    aria-hidden="true"
  />
</button>

<div className="my-1 h-px w-7 bg-slate-800" />

<button
  type="button"
  title="Clear all drawings"
  aria-label="Clear all drawings"
  onClick={() => {
    handleChartCommand(
      "clearDrawings"
    );
    setActiveDrawingTool(null);
  }}
  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-500/15 hover:text-red-400"
>
  <Trash2
    className="h-4 w-4"
    aria-hidden="true"
  />
</button>
    </div>
  </aside>

  {/* Mobile drawing rail */}
  <div className="mb-2 flex gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1.5 md:hidden">
    <button
      type="button"
      title="Pointer / Stop drawing"
      onClick={() =>
        setActiveDrawingTool(null)
      }
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        activeDrawingTool === null
          ? "bg-emerald-500 text-slate-950"
          : "text-slate-300"
      }`}
    >
      <MousePointer2 className="h-4 w-4" />
    </button>

    <button
      type="button"
      title="Horizontal Line"
      onClick={() =>
        setActiveDrawingTool(
          (currentTool) =>
            currentTool === "horizontal-line"
              ? null
              : "horizontal-line"
        )
      }
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        activeDrawingTool === "horizontal-line"
          ? "bg-cyan-500 text-slate-950"
          : "text-slate-300"
      }`}
    >
      <Minus className="h-5 w-5" />
    </button>

    <button
      type="button"
      title="Fibonacci Retracement"
      onClick={() =>
        setActiveDrawingTool(
          (currentTool) =>
            currentTool === "fibonacci"
              ? null
              : "fibonacci"
        )
      }
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        activeDrawingTool === "fibonacci"
          ? "bg-emerald-500 text-slate-950"
          : "text-slate-300"
      }`}
    >
      <span className="text-[10px] font-bold tracking-wide">
  FIB
</span>
    </button>
  </div>

  <div className="min-w-0 flex-1">
    <PriceChart
      symbol={symbol}
      exchange={exchange}
      instrumentKey={
        marketData.instrumentKey
      }
      timeframe={timeframe}
      activeIndicators={
        activeIndicators
      }
      activeDrawingTool={
        activeDrawingTool
      }
      isCrosshairActive={
        isCrosshairActive
      }
      isFullscreen={
        isChartFullscreen
      }
      chartCommand={
        chartCommand
      }
      onResearchReady={
        setResearch
      }
    />
  </div>
</div>

                {/* Market Snapshot now follows the chart */}
                <div className="mt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                    Market Snapshot
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <MetricCard
                      label="Previous Close"
                      value={formatPrice(
                        marketData.previousClose
                      )}
                    />

                    <MetricCard
                      label="Open"
                      value={formatPrice(
                        marketData.open
                      )}
                    />

                    <MetricCard
                      label="Day High"
                      value={formatPrice(
                        marketData.high
                      )}
                    />

                    <MetricCard
                      label="Day Low"
                      value={formatPrice(
                        marketData.low
                      )}
                    />

                    <MetricCard
                      label="Volume"
                      value={formatVolume(
                        marketData.volume
                      )}
                    />

                    <MetricCard
                      label="Average Price"
                      value={formatPrice(
                        marketData.averagePrice
                      )}
                    />

                    <MetricCard
                      label="Instrument Key"
                      value={
                        marketData.instrumentKey
                      }
                      small
                    />

                    <MetricCard
                      label="Data Source"
                      value={
                        marketData.source
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right side — hidden in chart fullscreen */}
{!isChartFullscreen && (
  <aside className="min-w-0 xl:col-span-3">
    <div className="xl:sticky xl:top-6">
      <InvestmentSummary
        research={research}
      />
    </div>
  </aside>
)}
          </div>
        </div>
      </div>

        {research && (
          <>
            <div className="mt-5">
              <MarketSnapshotCard
                research={research}
              />
            </div>

            <div className="mt-6">
              <TechnicalsCard
                research={research}
              />
            </div>
          </>
        )}

        <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 md:flex md:items-center md:justify-between md:gap-8">
  <div>
    <p className="font-semibold text-emerald-300">
      Explore Detailed Fundamental Research
    </p>

    <p className="mt-2 leading-7 text-slate-400">
      Review verified annual financial statements,
      growth, profitability, banking metrics,
      valuation methods and peer comparisons for{" "}
      {marketData.companyName}.
    </p>
  </div>

  <Link
    href={`/fundamental-research/${encodeURIComponent(
      symbol
    )}?exchange=${encodeURIComponent(
      exchange
    )}&method=composite`}
    className="mt-5 inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 md:mt-0"
  >
    Open Fundamental Research
    <span className="ml-2">→</span>
  </Link>
</div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 font-bold text-white ${
          small
            ? "break-all text-sm"
            : "text-xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}