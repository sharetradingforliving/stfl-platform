"use client";
import {
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from "@/lib/indicators";

import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CrosshairMode,
  type Time,
} from "lightweight-charts";

import DrawingWorkspace from "./DrawingWorkspace";
import TechnicalStudies from "./TechnicalStudies";

import { buildPriceHistory } from "@/lib/technical/builders/buildPriceHistory";
import { buildTechnicalInput } from "@/lib/technical/builders/technicalInputBuilder";

import { runResearchEngine } from "@/lib/services/researchEngine";

import type { CompanyResearch } from "@/lib/types/research";

import { useEffect, useRef, useState } from "react";

type ChartCommand =
  | "moveLeft"
  | "moveRight"
  | "zoomIn"
  | "zoomOut"
  | "reset"
  | "clearDrawings"
  | "undoDrawing"
  | "redoDrawing";

type PriceChartProps = {
  symbol: string;
  exchange: "NSE" | "BSE";
  instrumentKey: string;
  timeframe: string;
  activeIndicators: string[];
  activeDrawingTool: string | null;
  isCrosshairActive: boolean;
  isFullscreen: boolean;
   chartCommand: {
    action: ChartCommand;
    id: number;
  } | null;
  onDrawingComplete?: () => void;
  onResearchReady?: (
    research: CompanyResearch
  ) => void;
};

type CrosshairData = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} | null;
type FibonacciPoint = {
  time: number;
  price: number;
};
type ChartCandle = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function formatVolume(volume: number) {
  if (volume >= 10_000_000) {
    return `${(volume / 10_000_000).toFixed(2)} Cr`;
  }

  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)} M`;
  }

  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)} K`;
  }

  return volume.toString();
}

export default function PriceChart({
  symbol,
  exchange,
  instrumentKey,
  timeframe,
  activeIndicators,
    activeDrawingTool,
    isCrosshairActive,
    isFullscreen,
    chartCommand,
  onResearchReady,
  onDrawingComplete,
  }: PriceChartProps) {
      const chartRef = useRef<HTMLDivElement>(null);
      const chartInstanceRef = useRef<ReturnType<
  typeof createChart
> | null>(null);

  type Style = "candles" | "line" | "area" | "bars";
  const [chartStyle, setChartStyle] = useState<Style>("candles");
  const [styleReadyKey, setStyleReadyKey] = useState("");
  const styleKey = `stfl:chart-style:v1:${exchange}:${symbol}`;
  const styleSeriesRef = useRef<{ candles: ISeriesApi<"Candlestick">; line: ISeriesApi<"Line">; area: ISeriesApi<"Area">; bars: ISeriesApi<"Bar"> } | null>(null);
  const [drawingContext, setDrawingContext] = useState<{chart:IChartApi;series:ISeriesApi<"Candlestick">;element:HTMLDivElement;candles:ChartCandle[];key:string;asOf:number} | null>(null);
  const completeRef = useRef(onDrawingComplete);
  completeRef.current = onDrawingComplete;
  useEffect(() => {
    let value: Style = "candles";
    try { const saved = localStorage.getItem(styleKey); if (["candles", "line", "area", "bars"].includes(saved ?? "")) value = saved as Style; } catch {}
    setChartStyle(value); setStyleReadyKey(styleKey);
  }, [styleKey]);
  useEffect(() => {
    if (styleReadyKey !== styleKey) return;
    try { localStorage.setItem(styleKey, chartStyle); } catch {}
  }, [chartStyle, styleReadyKey, styleKey]);
  const candlesRef = useRef<ChartCandle[]>([]);
  const [candleRevision, setCandleRevision] = useState(0);
  const [latestCandle, setLatestCandle] = useState<ChartCandle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");

const [crosshairData, setCrosshairData] =
  useState<CrosshairData>(null);

  const [, setFibonacciPoints] =
  useState<FibonacciPoint[]>([]);

const activeDrawingToolRef =
  useRef<string | null>(activeDrawingTool);

const fibonacciPointsRef =
  useRef<FibonacciPoint[]>([]);

  useEffect(() => {
    if (!chartRef.current) return;

    let active = true;
    const controller = new AbortController();
    candlesRef.current = [];
    fibonacciPointsRef.current = [];
    setFibonacciPoints([]);
    setCrosshairData(null);
    setLatestCandle(null);

    const chart = createChart(chartRef.current, {
  width: chartRef.current.clientWidth,
  height: 540,
  
  crosshair: {
  mode: isCrosshairActive
    ? CrosshairMode.Normal
    : CrosshairMode.Hidden,
},
  layout: {
  background: {
    type: ColorType.Solid,
    color: "#ffffff",
  },
  textColor: "#475569",
  attributionLogo: false,
},

  grid: {
    vertLines: {
      color: "#edf1f5",
    },
    horzLines: {
      color: "#edf1f5",
    },
  },

  rightPriceScale: {
    borderColor: "#e2e8f0",
  },

  timeScale: {
    borderColor: "#e2e8f0",
  },
});
chartInstanceRef.current = chart;
const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: "#36bd93",
    downColor: "#f87171",
    borderVisible: true,
    borderUpColor: "#15803d",
    borderDownColor: "#dc2626",
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
});
candleSeries.priceScale().applyOptions({scaleMargins:{top:0.08,bottom:0.22}});
const lineStyle = chart.addSeries(LineSeries, {color:"#2563eb",lineWidth:2,visible:false});
const areaStyle = chart.addSeries(AreaSeries, {lineColor:"#2563eb",topColor:"rgba(37,99,235,.20)",bottomColor:"rgba(37,99,235,0)",visible:false});
const barStyle = chart.addSeries(BarSeries, {upColor:"#059669",downColor:"#dc2626",visible:false});
styleSeriesRef.current = {candles:candleSeries,line:lineStyle,area:areaStyle,bars:barStyle};
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceFormat: {
    type: "volume",
  },

  priceScaleId: "volume",
});
volumeSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.8,
    bottom: 0,
  },
});

async function loadCandles() {
  try {
    setIsLoading(true);
    setError("");

    const response = await fetch(
      `/api/upstox/candles?instrumentKey=${encodeURIComponent(
        instrumentKey
      )}&timeframe=${encodeURIComponent(timeframe)}`,
      { signal: controller.signal }
    );

    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(`Chart request failed (HTTP ${response.status}). Please retry.`);
    }
    const data = await response.json();
    if (!active) return;
    if (!Array.isArray(data.candles) || data.candles.length === 0) {
      throw new Error(data?.error ?? "No candles are available for this timeframe.");
    }

    if (!response.ok) {
      throw new Error(
        data?.error ?? "Unable to load historical candles"
      );
    }
    
    const formattedCandles: ChartCandle[] = data.candles
      .map(
  (
    candle: [
      string,
      number,
      number,
      number,
      number,
      number,
      number
    ]
  ) => ({
    time: Math.floor(
  new Date(candle[0]).getTime() / 1000
) as Time,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5],
  })
)
.sort(
  (
    a: { time: number },
    b: { time: number }
  ) => a.time - b.time
);
    const formattedVolume =
  formattedCandles.map(
  (candle) => ({
    time: candle.time,
    value: candle.volume,
    color:
      candle.close >= candle.open
        ? "rgba(34, 197, 94, 0.45)"
        : "rgba(239, 68, 68, 0.45)",
  })
);
candleSeries.setData(formattedCandles);
lineStyle.setData(formattedCandles.map(c => ({time:c.time,value:c.close})));
areaStyle.setData(formattedCandles.map(c => ({time:c.time,value:c.close})));
barStyle.setData(formattedCandles);
setDrawingContext({chart,series:candleSeries,element:chartRef.current!,candles:formattedCandles,key:`stfl:drawings:v1:${exchange}:${symbol}:${timeframe}`,asOf:Number.isFinite(Date.parse(data.asOf))?Math.min(Date.parse(data.asOf),Date.now()):Date.now()});
volumeSeries.setData(formattedVolume);
candlesRef.current = formattedCandles;
setLatestCandle(formattedCandles[formattedCandles.length - 1]);
setCandleRevision((revision) => revision + 1);

chart.subscribeCrosshairMove((param) => {
  if (!param.time) {
    setCrosshairData(null);
    return;
  }

  const matchingCandle = formattedCandles.find(item => item.time === param.time);
  setCrosshairData(matchingCandle ?? null);
});
    const visibleCandleCount = Math.max(40, Math.min(110, Math.floor((chartRef.current?.clientWidth ?? 900) / 10)));

chart.timeScale().setVisibleLogicalRange({
  from: Math.max(
    formattedCandles.length - visibleCandleCount,
    0
  ),
  to: formattedCandles.length + 5,
});

    setIsLoading(false);
    void (async () => {
      try {
const priceHistory =
  buildPriceHistory(
    formattedCandles
  );

/*
 * Use the live Upstox quote for the
 * technical summary.
 *
 * The latest historical candle close
 * remains a safe fallback when the
 * quote endpoint is unavailable.
 */
const historicalClose =
  formattedCandles[
    formattedCandles.length - 1
  ].close;

let currentPrice =
  historicalClose;

try {
  const quoteResponse =
    await fetch(
      `/api/upstox/quote/${encodeURIComponent(
        symbol
      )}?exchange=${encodeURIComponent(
        exchange
      )}`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }
    );

  if (
    quoteResponse.ok
  ) {
    const quoteData =
      await quoteResponse.json();

    if (
      typeof quoteData
        ?.currentPrice ===
        "number" &&
      Number.isFinite(
        quoteData.currentPrice
      ) &&
      quoteData.currentPrice > 0
    ) {
      currentPrice =
        quoteData.currentPrice;
    }
  } else {
    console.warn(
      "Live quote unavailable. Using latest historical close."
    );
  }
} catch (quoteError) {
  console.warn(
    "Unable to retrieve the live quote. Using latest historical close:",
    quoteError
  );
}

const technicalInput =
  buildTechnicalInput({
    symbol,

    exchange,

    currentPrice,

    priceHistory,
  });

const research =
  await runResearchEngine(
    technicalInput
  );

if (active) onResearchReady?.(research);


      } catch (researchError) {
        if (active) console.warn("Technical research unavailable:", researchError);
      }
    })();

  } catch (error) {
    if (!active || controller.signal.aborted) return;
    console.error("STFL chart error:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Unable to load chart data"
    );
  } finally {
    if (active) setIsLoading(false);
  }
}

loadCandles();

chart.timeScale().fitContent();

const chartContainer =
  chartRef.current;

const resizeObserver =
  new ResizeObserver((entries) => {
    const entry = entries[0];

    if (!entry) {
      return;
    }

    const width = Math.floor(
      entry.contentRect.width
    );

    const height = Math.floor(
      entry.contentRect.height
    );

    if (width > 0 && height > 0) {
      chart.resize(
        width,
        height
      );
    }
  });

resizeObserver.observe(
  chartContainer
);

return () => {
  active = false;
  setDrawingContext(null);
  styleSeriesRef.current = null;
  controller.abort();
  resizeObserver.disconnect();
  chartInstanceRef.current = null;
  chart.remove();
};

  }, [symbol, exchange, instrumentKey, timeframe]);
  useEffect(() => {
    const series = styleSeriesRef.current;
    if (!series) return;
    series.candles.applyOptions({visible:chartStyle === "candles"});
    series.line.applyOptions({visible:chartStyle === "line"});
    series.area.applyOptions({visible:chartStyle === "area"});
    series.bars.applyOptions({visible:chartStyle === "bars"});
  }, [chartStyle, candleRevision]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    const formattedCandles = candlesRef.current;
    if (!chart || !formattedCandles.length) return;
    const indicatorSeries: Array<Parameters<typeof chart.removeSeries>[0]> = [];
const movingAverageConfigs = [
  {
    key: "SMA20",
    title: "SMA 20",
    type: "SMA",
    period: 20,
    color: "#f59e0b",
  },
  {
    key: "SMA50",
    title: "SMA 50",
    type: "SMA",
    period: 50,
    color: "#3b82f6",
  },
  {
    key: "SMA100",
    title: "SMA 100",
    type: "SMA",
    period: 100,
    color: "#a855f7",
  },
  {
    key: "SMA200",
    title: "SMA 200",
    type: "SMA",
    period: 200,
    color: "#ef4444",
  },
  {
    key: "EMA20",
    title: "EMA 20",
    type: "EMA",
    period: 20,
    color: "#22c55e",
  },
  {
    key: "EMA50",
    title: "EMA 50",
    type: "EMA",
    period: 50,
    color: "#06b6d4",
  },
  {
    key: "EMA100",
    title: "EMA 100",
    type: "EMA",
    period: 100,
    color: "#ec4899",
  },
  {
    key: "EMA200",
    title: "EMA 200",
    type: "EMA",
    period: 200,
    color: "#f97316",
  },
];

movingAverageConfigs.forEach((indicator) => {
  if (!activeIndicators.includes(indicator.key)) {
    return;
  }

  const movingAverageSeries = chart.addSeries(
    LineSeries,
    {
      color: indicator.color,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: indicator.title,
    }
  );
    indicatorSeries.push(movingAverageSeries);

  const movingAverageData =
    indicator.type === "SMA"
      ? calculateSMA(
          formattedCandles,
          indicator.period
        )
      : calculateEMA(
          formattedCandles,
          indicator.period
        );

  movingAverageSeries.setData(
    movingAverageData
  );
});

let nextOscillatorPane = 1;

if (activeIndicators.includes("RSI")) {
  const rsiPane = nextOscillatorPane;
  nextOscillatorPane += 1;

  const rsiData = calculateRSI(
    formattedCandles,
    14
  );

  const rsiSeries = chart.addSeries(
    LineSeries,
    {
      title: "RSI 14",
      color: "#a855f7",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    },
    rsiPane
  );
    indicatorSeries.push(rsiSeries);

  rsiSeries.setData(rsiData);

  const rsiUpperBand =
    chart.addSeries(
      LineSeries,
      {
        title: "RSI 70",
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      rsiPane
    );
    indicatorSeries.push(rsiUpperBand);

  rsiUpperBand.setData(
    rsiData.map((point) => ({
      time: point.time,
      value: 70,
    }))
  );

  const rsiLowerBand =
    chart.addSeries(
      LineSeries,
      {
        title: "RSI 30",
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      rsiPane
    );
    indicatorSeries.push(rsiLowerBand);

  rsiLowerBand.setData(
    rsiData.map((point) => ({
      time: point.time,
      value: 30,
    }))
  );

  chart.panes()[rsiPane]?.setHeight(
    160
  );
}

if (activeIndicators.includes("MACD")) {
  const macdPane = nextOscillatorPane;
  nextOscillatorPane += 1;

  const macdData = calculateMACD(
    formattedCandles
  );

  const macdSeries = chart.addSeries(
    LineSeries,
    {
      title: "MACD",
      color: "#38bdf8",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    },
    macdPane
  );
    indicatorSeries.push(macdSeries);

  macdSeries.setData(
    macdData.map((point) => ({
      time: point.time,
      value: point.macd,
    }))
  );

  const signalSeries = chart.addSeries(
    LineSeries,
    {
      title: "Signal",
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    },
    macdPane
  );
    indicatorSeries.push(signalSeries);

  signalSeries.setData(
    macdData.map((point) => ({
      time: point.time,
      value: point.signal,
    }))
  );

  const histogramSeries =
    chart.addSeries(
      HistogramSeries,
      {
        title: "MACD Histogram",
        priceLineVisible: false,
        lastValueVisible: false,
      },
      macdPane
    );
    indicatorSeries.push(histogramSeries);

  histogramSeries.setData(
    macdData.map((point) => ({
      time: point.time,
      value: point.histogram,
      color:
        point.histogram >= 0
          ? "rgba(34, 197, 94, 0.65)"
          : "rgba(239, 68, 68, 0.65)",
    }))
  );

  chart.panes()[macdPane]?.setHeight(
    160
  );
}


    return () => {
      if (chartInstanceRef.current !== chart) return;
      for (const series of indicatorSeries) chart.removeSeries(series);
    };
  }, [activeIndicators, candleRevision]);

  useEffect(() => {
  if (!chartInstanceRef.current) return;

  chartInstanceRef.current.applyOptions({
    crosshair: {
      mode: isCrosshairActive
        ? CrosshairMode.Normal
        : CrosshairMode.Hidden,
    },
  });
}, [isCrosshairActive]);

useEffect(() => {
  activeDrawingToolRef.current =
    activeDrawingTool;

  {
    fibonacciPointsRef.current = [];
    setFibonacciPoints([]);
  }
}, [activeDrawingTool]);

useEffect(() => {
  if (
    chartCommand?.action ===
    "clearDrawings"
  ) {
    // Drawing history is handled by DrawingWorkspace.
  } else if (chartCommand?.action === "undoDrawing") {
    // DrawingWorkspace handles Undo.
  } else if (chartCommand?.action === "redoDrawing") {
    // DrawingWorkspace handles Redo.
  } else if (chartCommand?.action === "moveLeft") {
    moveChartLeft();
  } else if (chartCommand?.action === "moveRight") {
    moveChartRight();
  } else if (chartCommand?.action === "zoomIn") {
    zoomChartIn();
  } else if (chartCommand?.action === "zoomOut") {
    zoomChartOut();
  } else if (chartCommand?.action === "reset") {
    resetChartView();
  }
}, [chartCommand]);

useEffect(() => {
  function handleEscapeKey(
    event: KeyboardEvent
  ) {
    if (event.key !== "Escape") {
      return;
    }

    activeDrawingToolRef.current = null;
    fibonacciPointsRef.current = [];
    setFibonacciPoints([]);
  }

  window.addEventListener(
    "keydown",
    handleEscapeKey
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleEscapeKey
    );
  };
}, []);

function moveChartLeft() {
  const chart = chartInstanceRef.current;

  if (!chart) return;

  const timeScale = chart.timeScale();

  timeScale.scrollToPosition(
    timeScale.scrollPosition() - 50,
    false
  );
}

function moveChartRight() {
  const chart = chartInstanceRef.current;

  if (!chart) return;

  const timeScale = chart.timeScale();

  timeScale.scrollToPosition(
    timeScale.scrollPosition() + 50,
    false
  );
}

function zoomChartIn() {
  const chart = chartInstanceRef.current;

  if (!chart) return;

  const timeScale = chart.timeScale();
  const currentRange =
    timeScale.getVisibleLogicalRange();

  if (!currentRange) return;

  const rangeSize =
    currentRange.to - currentRange.from;

  const zoomAmount = rangeSize * 0.15;

  timeScale.setVisibleLogicalRange({
    from: currentRange.from + zoomAmount,
    to: currentRange.to - zoomAmount,
  });
}

function zoomChartOut() {
  const chart = chartInstanceRef.current;

  if (!chart) return;

  const timeScale = chart.timeScale();
  const currentRange =
    timeScale.getVisibleLogicalRange();

  if (!currentRange) return;

  const rangeSize =
    currentRange.to - currentRange.from;

  const zoomAmount = rangeSize * 0.15;

  timeScale.setVisibleLogicalRange({
    from: currentRange.from - zoomAmount,
    to: currentRange.to + zoomAmount,
  });
}

function resetChartView() {
  const chart = chartInstanceRef.current;

  if (!chart) return;

  chart.timeScale().fitContent();
}
function showDateRange(months: number | null) {
  const chart = chartInstanceRef.current;
  const candles = candlesRef.current;
  if (!chart || candles.length < 2) return;
  if (months === null) { chart.timeScale().fitContent(); return; }
  const last = Number(candles[candles.length - 1].time);
  const start = new Date(last * 1000);
  if (months === 0) start.setUTCMonth(0, 1);
  else start.setUTCMonth(start.getUTCMonth() - months);
  const from = Math.max(Number(candles[0].time), Math.floor(start.getTime() / 1000));
  if (from < last) chart.timeScale().setVisibleRange({ from: from as Time, to: last as Time });
}

const displayedCandle = crosshairData ?? latestCandle;
const oscillatorPaneCount =
  Number(
    activeIndicators.includes("RSI")
  ) +
  Number(
    activeIndicators.includes("MACD")
  );

return (
  <div className="w-full">

    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
      <label className="flex items-center gap-2">Chart style
        <select value={chartStyle} onChange={e => setChartStyle(e.target.value as Style)} className="rounded border border-slate-200 bg-white px-2 py-1.5">
          <option value="candles">Candles</option><option value="line">Line</option><option value="area">Area</option><option value="bars">OHLC bars</option>
        </select>
      </label>
      <span className="text-slate-500">{activeDrawingTool ? `Drawing: ${activeDrawingTool.replace(/-/g, " ")} · Escape cancels` : "Pointer · select or move a drawing"}</span>
    </div>

    {drawingContext && drawingContext.key === `stfl:drawings:v1:${exchange}:${symbol}:${timeframe}` && (
      <TechnicalStudies chart={drawingContext.chart} series={drawingContext.series} candles={drawingContext.candles} symbol={symbol} exchange={exchange} instrumentKey={instrumentKey} timeframe={timeframe} asOf={drawingContext.asOf} chartStyle={chartStyle} isChartAlive={() => chartInstanceRef.current === drawingContext.chart} />
    )}

    {/* STFL OHLC Information Bar */}
    <div className="flex min-h-[36px] flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 bg-white px-3 py-2 text-xs">

      <span className="font-semibold text-slate-900">{exchange}:{symbol}</span>
      <span className="text-slate-500">{timeframe}</span>
      {displayedCandle ? (
        <>
        <span className="font-semibold text-cyan-700">
  {new Date(
  Number(displayedCandle.time) * 1000
).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour:
      timeframe === "D" ||
      timeframe === "W" ||
      timeframe === "M"
        ? undefined
        : "2-digit",
    minute:
      timeframe === "D" ||
      timeframe === "W" ||
      timeframe === "M"
        ? undefined
        : "2-digit",
  })}
</span>

<span className="hidden text-slate-700 sm:inline">
  |
</span>
          <span className="text-slate-600">
            O{" "}
            <strong className="text-slate-900">
              {displayedCandle.open.toFixed(2)}
            </strong>
          </span>

          <span className="text-slate-600">
            H{" "}
            <strong className="text-emerald-700">
              {displayedCandle.high.toFixed(2)}
            </strong>
          </span>

          <span className="text-slate-600">
            L{" "}
            <strong className="text-red-700">
              {displayedCandle.low.toFixed(2)}
            </strong>
          </span>

          <span className="text-slate-600">
            C{" "}
            <strong className="text-slate-900">
              {displayedCandle.close.toFixed(2)}
            </strong>
          </span>

          <span
            className={
              displayedCandle.close >= displayedCandle.open
                ? "font-semibold text-emerald-700"
                : "font-semibold text-red-700"
            }
          >
            {displayedCandle.close >= displayedCandle.open
              ? "▲"
              : "▼"}{" "}
            {(
              ((displayedCandle.close -
                displayedCandle.open) /
                displayedCandle.open) *
              100
            ).toFixed(2)}
            %
          </span>

          <span className="text-slate-600">
            Vol{" "}
            <strong className="text-blue-700">
              {formatVolume(displayedCandle.volume)}
            </strong>
          </span>
        </>
      ) : (
        <span className="text-slate-500">
          Hover over a candle for OHLC and volume · Scroll to zoom · Drag to pan
        </span>
      )}

    </div>

   {/* STFL Price Chart */}
<div className="group relative w-full">
  <div
  ref={chartRef}
  className={
    isFullscreen
      ? "h-[calc(100vh-190px)] min-h-[400px] w-full"
      : oscillatorPaneCount === 2
        ? "h-[820px] w-full"
        : oscillatorPaneCount === 1
          ? "h-[680px] w-full"
          : "h-[540px] w-full"
  }
/>
{/* Left navigation button */}
<button
  type="button"
  onClick={moveChartLeft}
  title="Move to earlier candles"
  className="
    absolute
    left-4
    top-1/2
    z-10
    -translate-y-1/2
    rounded-full
    border
    border-slate-200
    bg-white/95
    px-4
    py-3
    text-xl
    text-slate-900
    opacity-0
    shadow-xl
    transition-all
    duration-200
    hover:border-emerald-500
    hover:text-emerald-700
    group-hover:opacity-100
  "
>
  ←
</button>

{/* Centre zoom controls */}
<div
  className="
    absolute
    left-1/2
    bottom-10
    z-10
    flex
    -translate-x-1/2
    items-center
    gap-1
    rounded-xl
    border
    border-slate-200
    bg-white/95
    p-1
    text-slate-900
    opacity-0
    shadow-xl
    backdrop-blur
    transition-opacity
    duration-200
    group-hover:opacity-100
  "
>
  <button
    type="button"
    onClick={zoomChartOut}
    aria-label="Zoom out" title="Zoom out"
    className="rounded-lg px-4 py-2 text-lg hover:bg-slate-100 hover:text-emerald-700"
  >
    −
  </button>

  <button
    type="button"
    onClick={zoomChartIn}
    aria-label="Zoom in" title="Zoom in"
    className="rounded-lg px-4 py-2 text-lg hover:bg-slate-100 hover:text-emerald-700"
  >
    +
  </button>

  <button
    type="button"
    onClick={resetChartView}
    title="Reset chart view"
    className="rounded-lg px-3 py-2 text-xs hover:bg-slate-100 hover:text-emerald-700"
  >
    Reset
  </button>
</div>

{/* Right navigation button */}
<button
  type="button"
  onClick={moveChartRight}
  title="Move toward recent candles"
  className="
    absolute
    right-4
    top-1/2
    z-10
    -translate-y-1/2
    rounded-full
    border
    border-slate-200
    bg-white/95
    px-4
    py-3
    text-xl
    text-slate-900
    opacity-0
    shadow-xl
    transition-all
    duration-200
    hover:border-emerald-500
    hover:text-emerald-700
    group-hover:opacity-100
  "
>
  →
</button>
  </div>

  {drawingContext && drawingContext.key === `stfl:drawings:v1:${exchange}:${symbol}:${timeframe}` && (
    <DrawingWorkspace isChartAlive={() => chartInstanceRef.current === drawingContext.chart} chart={drawingContext.chart} series={drawingContext.series} element={drawingContext.element} candles={drawingContext.candles} storageKey={drawingContext.key} tool={activeDrawingTool} command={chartCommand} onComplete={() => { activeDrawingToolRef.current = null; completeRef.current?.(); }} />
  )}
  <div role="group" aria-label="Visible date range" className="flex flex-wrap gap-1 border-t border-slate-200 bg-white px-2 py-1">
    {([{ label: "1M", months: 1 }, { label: "3M", months: 3 }, { label: "6M", months: 6 }, { label: "YTD", months: 0 }, { label: "1Y", months: 12 }, { label: "5Y", months: 60 }, { label: "Max", months: null }] as const).map((range) => (
      <button key={range.label} type="button" disabled={!latestCandle} onClick={() => showDateRange(range.months)} className="rounded px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40">{range.label}</button>
    ))}
    <span className="self-center px-2 text-[10px] text-slate-500">Available candles only</span>
  </div>
  <p className="mt-2 text-right text-[11px] text-slate-500">
    Charts powered by{" "}
    <a
      href="https://www.tradingview.com/"
      target="_blank"
      rel="noreferrer noopener"
      className="transition hover:text-slate-300"
    >
      TradingView Lightweight Charts
    </a>
  </p>

  {isLoading && (
      <p className="mt-3 text-sm text-slate-600">
        Loading market chart...
      </p>
    )}

    {error && (
      <p className="mt-3 text-sm text-red-700">
        {error}
      </p>
    )}

  </div>
);
}