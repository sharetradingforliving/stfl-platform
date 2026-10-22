"use client";
import { useRef, useState } from "react";
import {
  BarChart3,
  Check,
  Crosshair,
  Expand,
  FileText,
  GitCompareArrows,
  LineChart,
  Maximize2,
  Minimize2,
  Minus,
  MoveVertical,
  PencilRuler,
  Ratio,
  Square,
  Star,
  Timer,
} from "lucide-react";

type ChartCommand =
  | "moveLeft"
  | "moveRight"
  | "zoomIn"
  | "zoomOut"
  | "reset"
  | "clearDrawings";

type ChartToolbarProps = {
  timeframe: string;
  onTimeframeChange: (
    timeframe: string
  ) => void;
  activeIndicators: string[];
  onIndicatorToggle: (
    indicator: string
  ) => void;
  onChartCommand: (
    action: ChartCommand
  ) => void;
  onDrawingToolSelect: (
    tool: string
  ) => void;
  isChartFullscreen: boolean;
  onFullscreenToggle: () => void;
  isCrosshairActive: boolean;
  onCrosshairToggle: () => void;
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
  onDrawingToolSelect,
  isCrosshairActive,
onCrosshairToggle,
  onChartCommand,
  isChartFullscreen,
onFullscreenToggle,
}: ChartToolbarProps) {
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] =
    useState(false);

    const [isDrawingMenuOpen, setIsDrawingMenuOpen] =
  useState(false);

  const drawingCloseTimer =
  useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const indicatorCloseTimer =
  useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

function keepDrawingMenuOpen() {
  if (drawingCloseTimer.current) {
    clearTimeout(drawingCloseTimer.current);
    drawingCloseTimer.current = null;
  }
}

function closeDrawingMenuWithDelay() {
  if (drawingCloseTimer.current) {
    clearTimeout(drawingCloseTimer.current);
  }

  drawingCloseTimer.current = setTimeout(() => {
    setIsDrawingMenuOpen(false);
    drawingCloseTimer.current = null;
  }, 2500);
}

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
    <span className="flex items-center gap-2">
  <BarChart3
    className="h-4 w-4"
    aria-hidden="true"
  />
  Indicators
</span>
  </button>

  {isIndicatorMenuOpen && (
  <div className="absolute left-0 top-full z-[1000] mt-2 max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl">
    <p className="pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      Chart Indicators
    </p>

    <p className="pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
      Simple Moving Average
    </p>

    <div className="grid grid-cols-2 gap-2">
      {[
        {
          label: "SMA 20",
          value: "SMA20",
        },
        {
          label: "SMA 50",
          value: "SMA50",
        },
        {
          label: "SMA 100",
          value: "SMA100",
        },
        {
          label: "SMA 200",
          value: "SMA200",
        },
      ].map((indicator) => (
        <button
          key={indicator.value}
          type="button"
          onClick={() =>
            handleIndicatorSelection(
              indicator.value
            )
          }
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
            activeIndicators.includes(
              indicator.value
            )
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          <span>{indicator.label}</span>

          {activeIndicators.includes(
            indicator.value
          ) && (
            <Check
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>

    <div className="my-3 border-t border-slate-800" />

    <p className="pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
      Exponential Moving Average
    </p>

    <div className="grid grid-cols-2 gap-2">
      {[
        {
          label: "EMA 20",
          value: "EMA20",
        },
        {
          label: "EMA 50",
          value: "EMA50",
        },
        {
          label: "EMA 100",
          value: "EMA100",
        },
        {
          label: "EMA 200",
          value: "EMA200",
        },
      ].map((indicator) => (
        <button
          key={indicator.value}
          type="button"
          onClick={() =>
            handleIndicatorSelection(
              indicator.value
            )
          }
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
            activeIndicators.includes(
              indicator.value
            )
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          <span>{indicator.label}</span>

          {activeIndicators.includes(
            indicator.value
          ) && (
            <Check
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>

    <div className="my-3 border-t border-slate-800" />

    <p className="pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
      Oscillators
    </p>

    <div className="grid grid-cols-2 gap-2">
      {[
        {
          label: "RSI 14",
          value: "RSI",
        },
        {
          label: "MACD",
          value: "MACD",
        },
      ].map((indicator) => (
        <button
          key={indicator.value}
          type="button"
          onClick={() =>
            handleIndicatorSelection(
              indicator.value
            )
          }
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
            activeIndicators.includes(
              indicator.value
            )
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          <span>{indicator.label}</span>

          {activeIndicators.includes(
            indicator.value
          ) && (
            <Check
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  </div>
)}
</div>

                  
{/* Drawing Tools */}
<div
  className="relative"
  onMouseEnter={keepDrawingMenuOpen}
  onMouseLeave={closeDrawingMenuWithDelay}
>
  <button
    type="button"
    onClick={() => {
  keepDrawingMenuOpen();

  setIsDrawingMenuOpen(
    (currentValue) => !currentValue
  );
}}
    className="rounded-xl border border-slate-700 px-5 py-3 transition hover:border-emerald-500 hover:bg-slate-800 hover:text-emerald-400"
  >
   <span className="flex items-center gap-2">
  <PencilRuler
    className="h-4 w-4"
    aria-hidden="true"
  />
  Drawing
</span>
  </button>

  {isDrawingMenuOpen && (
    <div className="absolute right-0 top-full z-[1000] mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Drawing Tools
      </p>

      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        Fibonacci Tools
      </p>

      <button
        type="button"
        onClick={() => {
  onDrawingToolSelect("fibonacci");
  setIsDrawingMenuOpen(false);
}}
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        <span className="flex items-center gap-2">
  <Ratio className="h-4 w-4" />
  Fibonacci Retracement
</span>
      </button>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        <span className="flex items-center gap-2">
  <LineChart className="h-4 w-4" />
  Fibonacci Extension
</span>
      </button>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        <span className="flex items-center gap-2">
  <Timer className="h-4 w-4" />
  Fibonacci Time Zones
</span>
      </button>

      <div className="my-2 border-t border-slate-800" />

      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        Lines
      </p>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        ╱ Trend Line
      </button>

      <button
  type="button"
  onClick={() => {
    onDrawingToolSelect("horizontal-line");
    setIsDrawingMenuOpen(false);
  }}
  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
>
  <span className="flex items-center gap-2">
    <Minus className="h-4 w-4" />
    Horizontal Line
  </span>
</button>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        <span className="flex items-center gap-2">
  <MoveVertical className="h-4 w-4" />
  Vertical Line
</span>
      </button>

      <div className="my-2 border-t border-slate-800" />

      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        Shapes & Notes
      </p>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        <span className="flex items-center gap-2">
  <Square className="h-4 w-4" />
  Rectangle / Zone
</span>
      </button>

      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        <span className="flex items-center gap-2">
  <FileText className="h-4 w-4" />
  Text / Note
</span>
      </button>
    </div>
  )}
</div>
<button
  type="button"
  onClick={onCrosshairToggle}
  title={
    isCrosshairActive
      ? "Disable crosshair"
      : "Enable crosshair"
  }
  className={`rounded-xl border px-5 py-3 transition ${
    isCrosshairActive
      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
      : "border-slate-700 hover:border-emerald-500 hover:bg-slate-800 hover:text-emerald-400"
  }`}
>
  <span className="flex items-center gap-2">
  <Crosshair className="h-4 w-4" />
  Crosshair
</span>
</button>
        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          <span className="flex items-center gap-2">
  <GitCompareArrows className="h-4 w-4" />
  Compare
</span>
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          <span className="flex items-center gap-2">
  <Star className="h-4 w-4" />
  Watchlist
</span>
        </button>

        <button
  type="button"
  onClick={onFullscreenToggle}
  className={`rounded-xl border px-5 py-3 transition ${
    isChartFullscreen
      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
      : "border-slate-700 hover:border-emerald-500 hover:text-emerald-400"
  }`}   
>
  <span className="flex items-center gap-2">
  {isChartFullscreen ? (
    <Minimize2
      className="h-4 w-4"
      aria-hidden="true"
    />
  ) : (
    <Maximize2
      className="h-4 w-4"
      aria-hidden="true"
    />
  )}

  {isChartFullscreen
    ? "Exit Fullscreen"
    : "Fullscreen"}
</span>
</button>

      </div>

    </div>
  );
}