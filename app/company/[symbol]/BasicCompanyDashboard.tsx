"use client";
import ChartToolbar from "@/components/charts/ChartToolbar";
import PriceChart from "@/components/charts/PriceChart";
import CompanySearch from "@/components/search/CompanySearch";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  | "reset";

export default function BasicCompanyDashboard({
  symbol,
  exchange,
}: BasicCompanyDashboardProps) {  const [marketData, setMarketData] =
    useState<MarketData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

const [timeframe, setTimeframe] = useState("D");
const [activeIndicators, setActiveIndicators] =
  useState<string[]>([]);
  const [isCrosshairActive, setIsCrosshairActive] =
  useState(false);
  const [activeDrawingTool, setActiveDrawingTool] =
  useState<string | null>(null);
  const [isChartFullscreen, setIsChartFullscreen] =
  useState(false);
  const [chartCommand, setChartCommand] =
  useState<{
    action: ChartCommand;
    id: number;
  } | null>(null);
  function handleIndicatorToggle(indicator: string) {
  setActiveIndicators((currentIndicators) =>
    currentIndicators.includes(indicator)
      ? currentIndicators.filter(
          (currentIndicator) =>
            currentIndicator !== indicator
        )
      : [...currentIndicators, indicator]
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
  useEffect(() => {
    async function fetchMarketData() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
  `/api/upstox/quote/${symbol}?exchange=${exchange}`,
  {
    cache: "no-store",
  }
  );
        const data = await response.json();

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

  function handleChartFullscreen() {
  setIsChartFullscreen(
    (currentValue) => !currentValue
  );
}

  function formatPrice(
    value: number | null | undefined
  ) {
    if (value === null || value === undefined) {
      return "—";
    }

    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatVolume(
    value: number | null | undefined
  ) {
    if (value === null || value === undefined) {
      return "—";
    }

    return value.toLocaleString("en-IN");
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

  const isPositive = marketData.change >= 0;

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
      <span>Company Research</span>
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
  Live market overview powered by Upstox
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
                {isPositive ? "▲" : "▼"}{" "}
                {formatPrice(
                  Math.abs(marketData.change)
                )}{" "}
                ({isPositive ? "+" : "-"}
                {Math.abs(
                  marketData.changePercent
                ).toFixed(2)}
                %)
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Market data: {marketData.source}
            </p>
          </div>
        </div>

        <div className="mt-12">
            {/* ===================== STFL Research Terminal ===================== */}

<div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

    <div>

      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
        STFL Research Terminal
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        Interactive Professional Chart
      </h2>

      <p className="mt-2 text-slate-400">
        Professional market powered by Upstox data and STFL AI research.
      </p>

    </div>

    <div className="flex flex-wrap gap-3">

      <button className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400">
        🧠 STFL AI Research
      </button>

      
    </div>

  </div>

  <div className="mt-8">

    <ChartToolbar
  timeframe={timeframe}
  onTimeframeChange={setTimeframe}
  activeIndicators={activeIndicators}
  onIndicatorToggle={handleIndicatorToggle}
  onDrawingToolSelect={setActiveDrawingTool}
  isCrosshairActive={isCrosshairActive}
  isChartFullscreen={isChartFullscreen}
onFullscreenToggle={handleChartFullscreen}
onCrosshairToggle={() =>
  setIsCrosshairActive(
    (currentValue) => !currentValue
  )
}
  onChartCommand={handleChartCommand}
/>

<PriceChart
  symbol={symbol}
  instrumentKey={marketData.instrumentKey}
  timeframe={timeframe}
  activeIndicators={activeIndicators}
  activeDrawingTool={activeDrawingTool}
  isCrosshairActive={isCrosshairActive}
  chartCommand={chartCommand}
/>
  </div>

</div>

{/* =============================================================== */}
          <p className="mt-12 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Market Snapshot
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Key Trading Metrics
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              value={marketData.instrumentKey}
              small
            />

            <MetricCard
              label="Data Source"
              value={marketData.source}
            />
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <p className="font-semibold text-amber-300">
            Detailed company research is being added
          </p>

          <p className="mt-2 leading-7 text-slate-400">
            Financial statements, valuation,
            shareholding, technical analysis, news,
            and AI research are not yet available for
            this company. Live market information is
            provided through Upstox.
          </p>
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`mt-3 font-bold ${
          small
            ? "break-all text-sm"
            : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}