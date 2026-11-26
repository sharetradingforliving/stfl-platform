"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Crosshair, Maximize2, Minimize2, PencilRuler, Undo2, Redo2, Sparkles } from "lucide-react";

type ChartCommand = "moveLeft" | "moveRight" | "zoomIn" | "zoomOut" | "reset" | "clearDrawings" | "undoDrawing" | "redoDrawing";
type ChartToolbarProps = {
  symbol?: string;
  isSummaryOpen?: boolean;
  onAnalyse?: () => void;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  activeIndicators: string[];
  onIndicatorToggle: (indicator: string) => void;
  onChartCommand: (action: ChartCommand) => void;
  onDrawingToolSelect: (tool: string) => void;
  isChartFullscreen: boolean;
  onFullscreenToggle: () => void;
  isCrosshairActive: boolean;
  onCrosshairToggle: () => void;
};
const timeframes = ["1m", "5m", "15m", "30m", "1H", "4H", "D", "W", "M"];
const indicators = ["SMA20", "SMA50", "SMA100", "SMA200", "EMA20", "EMA50", "EMA100", "EMA200", "RSI", "MACD"];
const buttonClass = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600";

export default function ChartToolbar(props: ChartToolbarProps) {
  const [indicatorSearch, setIndicatorSearch] = useState("");
  const [menu, setMenu] = useState<"indicators" | "drawings" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative border-y border-slate-200 bg-white text-slate-800">
      <div className="flex flex-wrap items-center gap-1 py-1">
        {props.symbol && <span className="mr-1 border-r border-slate-200 px-2 py-2 text-xs font-bold text-slate-900">{props.symbol}</span>}
        <div role="group" aria-label="Candle timeframe" className="flex max-w-full items-center overflow-x-auto border-r border-slate-200 pr-2">
          {timeframes.map((tf) => (
            <button key={tf} type="button" aria-pressed={props.timeframe === tf}
              onClick={() => props.onTimeframeChange(tf)}
              className={`${buttonClass} ${props.timeframe === tf ? "bg-emerald-100 font-semibold text-emerald-900" : ""}`}>
              {tf === "D" ? "1D" : tf === "W" ? "1W" : tf === "M" ? "1M" : tf}
            </button>
          ))}
        </div>
        <button type="button" className={buttonClass} aria-expanded={menu === "indicators"}
          onClick={() => setMenu(menu === "indicators" ? null : "indicators")}>
          <BarChart3 size={15} /> Indicators{props.activeIndicators.length > 0 ? ` (${props.activeIndicators.length})` : ""}
        </button>
        <button type="button" className={buttonClass} aria-expanded={menu === "drawings"}
          onClick={() => setMenu(menu === "drawings" ? null : "drawings")}>
          <PencilRuler size={15} /> Draw
        </button>
        <button type="button" className={`${buttonClass} ${props.isCrosshairActive ? "bg-emerald-50 text-emerald-800" : ""}`}
          aria-label="Toggle crosshair" title="Toggle crosshair" aria-pressed={props.isCrosshairActive} onClick={props.onCrosshairToggle}>
          <Crosshair size={16} />
        </button>
        <button type="button" className={buttonClass} onClick={() => props.onChartCommand("reset")} title="Fit all available candles">Fit</button>
        <div role="group" aria-label="Drawing history" className="flex border-l border-slate-200 pl-1">
          <button type="button" className={buttonClass} title="Undo last drawing" aria-label="Undo last drawing" onClick={() => props.onChartCommand("undoDrawing")}><Undo2 size={16} /></button>
          <button type="button" className={buttonClass} title="Redo drawing" aria-label="Redo drawing" onClick={() => props.onChartCommand("redoDrawing")}><Redo2 size={16} /></button>
        </div>
        {props.onAnalyse && <button type="button" onClick={props.onAnalyse} aria-expanded={props.isSummaryOpen} aria-controls="stfl-chart-summary" className={`${buttonClass} ml-auto border border-orange-400 bg-orange-50 text-slate-900 hover:bg-orange-100`}><Sparkles size={14} />{props.isSummaryOpen ? "Hide analysis" : "Analyse with Vedha"}</button>}
        <button type="button" className={buttonClass} onClick={props.onFullscreenToggle}
          title={props.isChartFullscreen ? "Exit fullscreen" : "Fullscreen"} aria-label={props.isChartFullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {props.isChartFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
      {menu && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-[65vh] w-72 max-w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{menu === "indicators" ? "Indicators" : "Drawing tools"}</p>
            <button type="button" onClick={() => setMenu(null)} className={buttonClass} aria-label="Close tools">×</button>
          </div>
          {menu === "indicators" ? (
            <div>
              <input aria-label="Search indicators" placeholder="Search SMA, EMA, RSI, MACD" value={indicatorSearch} onChange={e=>setIndicatorSearch(e.target.value)} className="mb-2 w-full rounded border border-slate-300 px-2 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-1">
              {indicators.filter(indicator => indicator.toLowerCase().includes(indicatorSearch.replace(/\s/g, "").toLowerCase())).map((indicator) => (
                <label key={indicator} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-slate-50">
                  <input type="checkbox" className="accent-emerald-600" checked={props.activeIndicators.includes(indicator)} onChange={() => props.onIndicatorToggle(indicator)} />
                  {indicator.replace(/(SMA|EMA)(\d+)/, "$1 $2")}
                </label>
              ))}
            </div>
            </div>
          ) : (
            <div className="flex flex-col items-stretch">
              {[
                ["trendline", "Trend line"], ["ray", "Ray"], ["extended-line", "Extended line"],
                ["horizontal-line", "Horizontal level"], ["vertical-line", "Vertical line"],
                ["rectangle", "Rectangle / zone"], ["ellipse", "Ellipse"], ["fibonacci", "Fibonacci retracement"],
                ["measure", "Price and date range"], ["text", "Text annotation"],
              ].map(([tool,label]) => <button key={tool} type="button" className={buttonClass} onClick={() => {props.onDrawingToolSelect(tool);setMenu(null);}}>{label}</button>)}
              <button type="button" className={buttonClass} onClick={() => { props.onChartCommand("clearDrawings"); setMenu(null); }}>Clear all drawings</button>
              <p className="mt-2 text-xs text-slate-500">Press Escape to stop drawing. Completed drawings remain.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
