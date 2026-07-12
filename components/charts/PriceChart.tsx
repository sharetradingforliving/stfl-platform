"use client";

import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

type PriceChartProps = {
  symbol: string;
  instrumentKey: string;
  timeframe: string;
};

export default function PriceChart({
  symbol,
  instrumentKey,
  timeframe,
}: PriceChartProps)  {
  const chartRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
  width: chartRef.current.clientWidth,
  height: 700,

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

    chart.timeScale().fitContent();
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
  }, [symbol, instrumentKey, timeframe]);

  return (
    <div
      ref={chartRef}
      className="w-full h-[700px]"
    />
  );
}