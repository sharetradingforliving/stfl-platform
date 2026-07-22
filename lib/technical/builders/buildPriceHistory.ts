import type { PriceData } from "../types";

export interface CandleInput {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
}

export function buildPriceHistory(
  candles: CandleInput[]
): PriceData[] {
  return candles.map((candle) => ({
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    date:
      typeof candle.time === "number"
        ? new Date(candle.time * 1000).toISOString()
        : new Date(candle.time).toISOString(),
  }));
}