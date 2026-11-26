"use client";

import DrawingTools from "@/components/charts/DrawingTools";
import ChartToolbar from "@/components/charts/ChartToolbar";
import PriceChart from "@/components/charts/PriceChart";
import CompanySearch from "@/components/search/CompanySearch";
import VedhaAnalysisPanel from "@/components/vedha/VedhaAnalysisPanel";
import MarketSnapshotCard from "@/components/company/MarketSnapshotCard";
import TechnicalsCard from "@/components/company/TechnicalsCard";

import type {
  CompanyResearch,
} from "@/lib/types/research";

import Link from "next/link";


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
  | "clearDrawings"
  | "undoDrawing"
  | "redoDrawing";

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

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const [
    isCrosshairActive,
    setIsCrosshairActive,
  ] = useState(true);

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

  useEffect(() => {
    setResearch(null);
  }, [symbol, exchange, timeframe]);

  const settingsKey = `stfl:chart-settings:v1:${exchange}:${symbol}`;
  const [settingsReadyKey, setSettingsReadyKey] = useState("");
  useEffect(() => {
    let savedTimeframe = "D";
    let savedIndicators: string[] = [];
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || "null");
      if (["1m","5m","15m","30m","1H","4H","D","W","M"].includes(saved?.timeframe)) savedTimeframe = saved.timeframe;
      if (Array.isArray(saved?.indicators)) savedIndicators = [...new Set<string>(saved.indicators.filter((v: unknown): v is string => typeof v === "string" && ["SMA20","SMA50","SMA100","SMA200","EMA20","EMA50","EMA100","EMA200","RSI","MACD"].includes(v)))];
    } catch {}
    // Resume only an explicit Vedha login request, after reading saved chart settings.
    const resumeUrl = new URL(window.location.href);
    if (resumeUrl.searchParams.get("vedha") === "1") {
      const requestedTimeframe = resumeUrl.searchParams.get("vedhaTimeframe");
      if (requestedTimeframe && ["1m","5m","15m","30m","1H","4H","D","W","M"].includes(requestedTimeframe)) {
        savedTimeframe = requestedTimeframe;
      }
      setIsSummaryOpen(true);
      resumeUrl.searchParams.delete("vedha");
      resumeUrl.searchParams.delete("vedhaTimeframe");
      window.history.replaceState(window.history.state, "", resumeUrl.pathname + resumeUrl.search + resumeUrl.hash);
    }
    setTimeframe(savedTimeframe); setActiveIndicators(savedIndicators); setSettingsReadyKey(settingsKey);
    setActiveDrawingTool(null);
  }, [settingsKey]);
  useEffect(() => {
    if (settingsReadyKey !== settingsKey) return;
    try { localStorage.setItem(settingsKey, JSON.stringify({version:1,timeframe,indicators:activeIndicators})); } catch {}
  }, [settingsKey, settingsReadyKey, timeframe, activeIndicators]);

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
    const cancelDrawing = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveDrawingTool(null);
    };
    window.addEventListener("keydown", cancelDrawing);
    return () => window.removeEventListener("keydown", cancelDrawing);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setMarketData(null);
    async function fetchMarketData() {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/upstox/quote/${encodeURIComponent(symbol)}?exchange=${encodeURIComponent(exchange)}`,
            {
              cache: "no-store",
              signal: controller.signal,
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

        if (active) setMarketData(data);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
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
        if (active) setIsLoading(false);
      }
    }

    fetchMarketData();
    return () => { active = false; controller.abort(); };
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
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-900">
        <p className="text-lg text-slate-600">
          Loading live market data...
        </p>
      </main>
    );
  }

  if (error || !marketData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-900">
        <div className="max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            STFL Company Research
          </p>

          <h2 className="mt-5 text-4xl font-bold">
            Market Data Unavailable
          </h2>

          <p className="mt-4 text-slate-600">
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
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 px-6 py-5">
        <section className="border-b border-slate-200 bg-white px-5 py-5">
          <div className="mx-auto max-w-7xl">
            
            <Link
              href="/company-research"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700"
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

      <section className="mx-auto max-w-[1600px] px-3 py-6 sm:px-6">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">
              STFL Live Market Dashboard
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <h2 className="text-5xl font-bold">
                {marketData.symbol}
              </h2>

              <span className="rounded-full border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {marketData.exchange}
              </span>
            </div>

            <p className="mt-5 text-lg font-medium text-slate-700">
              {marketData.companyName}
            </p>

            <p className="mt-2 text-slate-600">
              Live market overview
              powered by Upstox
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 lg:min-w-96">
            <p className="text-sm text-slate-600">
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
                    ? "text-emerald-700"
                    : "text-red-700"
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
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">
                STFL Research Terminal
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Price chart & technical analysis
              </h2>

              <p className="mt-2 text-slate-600">
                Upstox candles · STFL technical research
              </p>
            </div>


          </div>

          <div
  ref={chartContainerRef}
  className={
    isChartFullscreen
      ? "h-screen overflow-auto bg-white p-3"
      : "mt-3"
  }
>
            <ChartToolbar
              symbol={symbol}
              isSummaryOpen={isSummaryOpen}
              onAnalyse={() => setIsSummaryOpen((open) => !open)}
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
      ? "mt-2 grid grid-cols-1"
      : "mt-2 grid grid-cols-1 items-start gap-3"
  }
>
              {/* Left side */}
              <div
  className={
    isChartFullscreen
      ? "min-w-0"
      : "min-w-0"
  }
>
                <div className={isSummaryOpen ? "grid min-w-0 grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_390px]" : "min-w-0"}>
                <div className="flex min-w-0 flex-col items-stretch gap-0 md:flex-row">
  <DrawingTools activeTool={activeDrawingTool} onSelect={setActiveDrawingTool} />

  <div className="min-w-0 flex-1">
    <PriceChart
      onDrawingComplete={() => setActiveDrawingTool(null)}
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

              {/* Collapsible research below the chart */}
{isSummaryOpen && (
  <aside id="stfl-chart-summary" className="min-w-0 xl:sticky xl:top-3">
    <div className="rounded-xl border border-slate-200">
      <VedhaAnalysisPanel research={research} symbol={symbol} exchange={exchange} timeframe={timeframe} />
    </div>
  </aside>
)}

                </div>

                {/* Market Snapshot now follows the chart */}
                <div className="mt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                    Market Snapshot
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
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
    <p className="font-semibold text-emerald-800">
      Explore Detailed Fundamental Research
    </p>

    <p className="mt-2 leading-7 text-slate-600">
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
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 font-semibold text-slate-900 ${
          small
            ? "break-all text-xs"
            : "text-base"
        }`}
      >
        {value}
      </p>
    </div>
  );
}