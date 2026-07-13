"use client";
import { useRef, useState } from "react";

type ChartCommand =
  | "moveLeft"
  | "moveRight"
  | "zoomIn"
  | "zoomOut"
  | "reset";

type ChartToolbarProps = {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  activeIndicators: string[];
  onIndicatorToggle: (indicator: string) => void;
  onChartCommand: (action: ChartCommand) => void;
};
const timeframes = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "4H",
  "D",
  "W",
  "M",
];

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
  activeIndicators,
  onIndicatorToggle,
  onChartCommand,
}: ChartToolbarProps) {
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] =
    useState(false);

  const indicatorCloseTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  function keepIndicatorMenuOpen() {
    if (indicatorCloseTimer.current) {
      clearTimeout(indicatorCloseTimer.current);
      indicatorCloseTimer.current = null;
    }
  }

  function closeIndicatorMenuWithDelay() {
    indicatorCloseTimer.current = setTimeout(() => {
      setIsIndicatorMenuOpen(false);
    }, 1000);
  }

  function handleIndicatorSelection(
    indicator: string
  ) {
    onIndicatorToggle(indicator);
    keepIndicatorMenuOpen();
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">

      <div className="flex flex-wrap gap-2">

        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              timeframe === tf
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tf}
          </button>
        ))}

      </div>

      <div className="flex flex-wrap gap-2">

        <div
  className="relative"
  onMouseEnter={keepIndicatorMenuOpen}
  onMouseLeave={closeIndicatorMenuWithDelay}
>
  <button
    type="button"
    onClick={() =>
      setIsIndicatorMenuOpen(
        (currentValue) => !currentValue
      )
    }
    className="rounded-xl border border-slate-700 px-5 py-3 transition hover:border-emerald-500 hover:text-emerald-400"
  >
    📊 Indicators
  </button>

  {isIndicatorMenuOpen && (
    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Chart Indicators
      </p>

<p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
  Simple Moving Average
</p>

      <button
  type="button"
  onClick={() =>
  handleIndicatorSelection("SMA20")
}
  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
    activeIndicators.includes("SMA20")
      ? "bg-emerald-500/15 text-emerald-400"
      : "text-slate-200 hover:bg-slate-800"
  }`}
>
  <span>SMA 20</span>

  {activeIndicators.includes("SMA20") && (
    <span>✓</span>
  )}
</button>

      {/* Simple Moving Averages */}


{[
  { label: "SMA 50", value: "SMA50" },
  { label: "SMA 100", value: "SMA100" },
  { label: "SMA 200", value: "SMA200" },
].map((indicator) => (
  <button
    key={indicator.value}
    type="button"
    onClick={() =>
  handleIndicatorSelection(indicator.value)
}
    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
      activeIndicators.includes(indicator.value)
        ? "bg-emerald-500/15 text-emerald-400"
        : "text-slate-200 hover:bg-slate-800"
    }`}
  >
    <span>{indicator.label}</span>

    {activeIndicators.includes(
      indicator.value
    ) && <span>✓</span>}
  </button>
))}

<div className="my-2 border-t border-slate-800" />

{/* Exponential Moving Averages */}

<p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
  Exponential Moving Average
</p>

{[
  { label: "EMA 20", value: "EMA20" },
  { label: "EMA 50", value: "EMA50" },
  { label: "EMA 100", value: "EMA100" },
  { label: "EMA 200", value: "EMA200" },
].map((indicator) => (
  <button
    key={indicator.value}
    type="button"
    onClick={() =>
  handleIndicatorSelection(indicator.value)
}
    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
      activeIndicators.includes(indicator.value)
        ? "bg-emerald-500/15 text-emerald-400"
        : "text-slate-200 hover:bg-slate-800"
    }`}
  >
    <span>{indicator.label}</span>

    {activeIndicators.includes(
      indicator.value
    ) && <span>✓</span>}
  </button>
))}
      <div className="my-2 border-t border-slate-800" />

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500"
      >
        RSI — Coming next
      </button>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500"
      >
        MACD — Coming next
      </button>
    </div>
  )}
</div>

                  
<button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          ✏ Drawing
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          🔍 Compare
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          ⭐ Watchlist
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          ⛶ Fullscreen
        </button>

      </div>

    </div>
  );
}