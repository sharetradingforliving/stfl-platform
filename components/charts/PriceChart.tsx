"use client";

import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

type ChartCommand =
  | "moveLeft"
  | "moveRight"
  | "zoomIn"
  | "zoomOut"
  | "reset";

type PriceChartProps = {
  symbol: string;
  instrumentKey: string;
  timeframe: string;
  activeIndicators: string[];
  activeDrawingTool: string | null;
  isCrosshairActive: boolean;
   chartCommand: {
    action: ChartCommand;
    id: number;
  } | null;
};

type CrosshairData = {
  time: number;
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

function calculateSMA(
  candles: {
    time: Time;
    close: number;
  }[],
  period: number
) {
  const smaData: {
    time: Time;
    value: number;
  }[] = [];

  for (
    let index = period - 1;
    index < candles.length;
    index++
  ) {
    let total = 0;

    for (
      let candleIndex = index - period + 1;
      candleIndex <= index;
      candleIndex++
    ) {
      total += candles[candleIndex].close;
    }

    smaData.push({
      time: candles[index].time,
      value: total / period,
    });
  }

  return smaData;
}
function calculateEMA(
  candles: {
    time: Time;
    close: number;
  }[],
  period: number
) {
  const emaData: {
    time: Time;
    value: number;
  }[] = [];

  if (candles.length < period) {
    return emaData;
  }

  let initialTotal = 0;

  for (let index = 0; index < period; index++) {
    initialTotal += candles[index].close;
  }

  let previousEMA = initialTotal / period;

  emaData.push({
    time: candles[period - 1].time,
    value: previousEMA,
  });

  const multiplier = 2 / (period + 1);

  for (
    let index = period;
    index < candles.length;
    index++
  ) {
    const currentEMA =
      (candles[index].close - previousEMA) *
        multiplier +
      previousEMA;

    emaData.push({
      time: candles[index].time,
      value: currentEMA,
    });

    previousEMA = currentEMA;
  }

  return emaData;
}
export default function PriceChart({
  symbol,
  instrumentKey,
  timeframe,
  activeIndicators,
    activeDrawingTool,
    isCrosshairActive,
  }: PriceChartProps) {
      const chartRef = useRef<HTMLDivElement>(null);
      const chartInstanceRef = useRef<ReturnType<
  typeof createChart
> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");

const [crosshairData, setCrosshairData] =
  useState<CrosshairData>(null);

  const [fibonacciPoints, setFibonacciPoints] =
  useState<FibonacciPoint[]>([]);

const activeDrawingToolRef =
  useRef<string | null>(activeDrawingTool);

const fibonacciPointsRef =
  useRef<FibonacciPoint[]>([]);


  useEffect(() => {
    if (!chartRef.current) return;

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
      color: "#020817",
    },
    textColor: "#CBD5E1",
  },

  grid: {
    vertLines: {
      color: "#1E293B",
    },
    horzLines: {
      color: "#1E293B",
    },
  },

  rightPriceScale: {
    borderColor: "#334155",
  },

  timeScale: {
    borderColor: "#334155",
  },
});
chartInstanceRef.current = chart;
const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: "#22c55e",
    downColor: "#ef4444",
    borderVisible: false,
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
});
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
      )}&timeframe=${encodeURIComponent(timeframe)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ?? "Unable to load historical candles"
      );
    }

    const formattedCandles = data.candles
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
    ),
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
     
    const formattedVolume = formattedCandles.map(
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
volumeSeries.setData(formattedVolume);
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
chart.subscribeCrosshairMove((param) => {
  if (!param.time) {
    setCrosshairData(null);
    return;
  }

  const candleData = param.seriesData.get(candleSeries);

  if (!candleData) {
    setCrosshairData(null);
    return;
  }

  const candle = candleData as {
    open: number;
    high: number;
    low: number;
    close: number;
  };

  const matchingCandle = formattedCandles.find(
  (item: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }) => item.time === param.time
);

  setCrosshairData({
  time: matchingCandle?.time ?? 0,
  open: candle.open,
  high: candle.high,
  low: candle.low,
  close: candle.close,
  volume: matchingCandle?.volume ?? 0,
});
});
chart.subscribeClick((param) => {
  if (
    activeDrawingToolRef.current !==
    "fibonacci"
  ) {
    return;
  }

  if (!param.point || !param.time) {
    return;
  }

  const clickedPrice =
    candleSeries.coordinateToPrice(
      param.point.y
    );

  if (clickedPrice === null) {
    return;
  }

  const newPoint: FibonacciPoint = {
    time: Number(param.time),
    price: clickedPrice,
  };

  const currentPoints =
    fibonacciPointsRef.current;

  if (currentPoints.length === 0) {
    fibonacciPointsRef.current = [
      newPoint,
    ];

    setFibonacciPoints([newPoint]);

    return;
  }

  const completedPoints = [
    currentPoints[0],
    newPoint,
  ];

  fibonacciPointsRef.current =
    completedPoints;

  setFibonacciPoints(
    completedPoints
  );

  const startPrice =
  completedPoints[0].price;

const endPrice =
  completedPoints[1].price;

const priceDifference =
  endPrice - startPrice;

const fibonacciLevels = [
  {
    ratio: 0,
    label: "0%",
    color: "#14532d",
  },
  {
    ratio: 0.236,
    label: "23.6%",
    color: "#166534",
  },
  {
    ratio: 0.382,
    label: "38.2%",
    color: "#15803d",
  },
  {
    ratio: 0.5,
    label: "50%",
    color: "#22c55e",
  },
  {
    ratio: 0.618,
    label: "61.8%",
    color: "#4ade80",
  },
  {
    ratio: 0.786,
    label: "78.6%",
    color: "#86efac",
  },
  {
    ratio: 1,
    label: "100%",
    color: "#bbf7d0",
  },
];

fibonacciLevels.forEach(
  ({ ratio, label, color }) => {
    const levelPrice =
      startPrice +
      priceDifference * ratio;

    candleSeries.createPriceLine({
      price: levelPrice,
      title: `Fib ${label}`,
      color,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
    });
  }
);
  
});

    const visibleCandleCount = 250;

chart.timeScale().setVisibleLogicalRange({
  from: Math.max(
    formattedCandles.length - visibleCandleCount,
    0
  ),
  to: formattedCandles.length + 5,
});

  } catch (error) {
    console.error("STFL chart error:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Unable to load chart data"
    );
  } finally {
    setIsLoading(false);
  }
}

loadCandles();

chart.timeScale().fitContent();

    return () => chart.remove();
  }, [symbol, instrumentKey, timeframe, activeIndicators]);
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

  if (activeDrawingTool !== "fibonacci") {
    fibonacciPointsRef.current = [];
    setFibonacciPoints([]);
  }
}, [activeDrawingTool]);

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

  return (
  <div className="w-full">
    {/* Active Drawing Tool Status */}
{activeDrawingTool === "fibonacci" &&
  fibonacciPoints.length < 2 && (
  <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        📐 Fibonacci Retracement Mode Active
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {fibonacciPoints.length === 0
  ? "Click the first point on the chart."
  : fibonacciPoints.length === 1
    ? "First point selected. Now click the second point."
    : "Two Fibonacci points selected successfully."}
      </p>
    </div>

    <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
      Drawing Mode
    </span>
  </div>
)}

    {/* STFL OHLC Information Bar */}
    <div className="mb-3 flex min-h-[42px] flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm">

      {crosshairData ? (
        <>
        <span className="font-semibold text-cyan-400">
  {new Date(
    crosshairData.time * 1000
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
          <span className="text-slate-400">
            O{" "}
            <strong className="text-white">
              {crosshairData.open.toFixed(2)}
            </strong>
          </span>

          <span className="text-slate-400">
            H{" "}
            <strong className="text-emerald-400">
              {crosshairData.high.toFixed(2)}
            </strong>
          </span>

          <span className="text-slate-400">
            L{" "}
            <strong className="text-red-400">
              {crosshairData.low.toFixed(2)}
            </strong>
          </span>

          <span className="text-slate-400">
            C{" "}
            <strong className="text-white">
              {crosshairData.close.toFixed(2)}
            </strong>
          </span>

          <span
            className={
              crosshairData.close >= crosshairData.open
                ? "font-semibold text-emerald-400"
                : "font-semibold text-red-400"
            }
          >
            {crosshairData.close >= crosshairData.open
              ? "▲"
              : "▼"}{" "}
            {(
              ((crosshairData.close -
                crosshairData.open) /
                crosshairData.open) *
              100
            ).toFixed(2)}
            %
          </span>

          <span className="text-slate-400">
            Volume{" "}
            <strong className="text-blue-400">
              {formatVolume(crosshairData.volume)}
            </strong>
          </span>
        </>
      ) : (
        <span className="text-slate-500">
          Move the cursor over the chart to view
          OHLC and volume data
        </span>
      )}

    </div>

   {/* STFL Price Chart */}
<div className="group relative w-full">
  <div
    ref={chartRef}
    className="h-[540px] w-full rounded-2xl"
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
    z-[999]
    -translate-y-1/2
    rounded-full
    border
    border-slate-600
    bg-slate-950/90
    px-4
    py-3
    text-xl
    text-white
    opacity-0
    shadow-xl
    transition-all
    duration-200
    hover:border-emerald-500
    hover:text-emerald-400
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
    top-4
    z-[999]
    flex
    -translate-x-1/2
    items-center
    gap-1
    rounded-xl
    border
    border-slate-600
    bg-slate-950/90
    p-1
    text-white
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
    title="Zoom out"
    className="rounded-lg px-4 py-2 text-lg hover:bg-slate-800 hover:text-emerald-400"
  >
    −
  </button>

  <button
    type="button"
    onClick={zoomChartIn}
    title="Zoom in"
    className="rounded-lg px-4 py-2 text-lg hover:bg-slate-800 hover:text-emerald-400"
  >
    +
  </button>

  <button
    type="button"
    onClick={resetChartView}
    title="Reset chart view"
    className="rounded-lg px-3 py-2 text-xs hover:bg-slate-800 hover:text-emerald-400"
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
    z-[999]
    -translate-y-1/2
    rounded-full
    border
    border-slate-600
    bg-slate-950/90
    px-4
    py-3
    text-xl
    text-white
    opacity-0
    shadow-xl
    transition-all
    duration-200
    hover:border-emerald-500
    hover:text-emerald-400
    group-hover:opacity-100
  "
>
  →
</button>
  </div>
    {isLoading && (
      <p className="mt-3 text-sm text-slate-400">
        Loading market chart...
      </p>
    )}

    {error && (
      <p className="mt-3 text-sm text-red-400">
        {error}
      </p>
    )}

  </div>
);
}