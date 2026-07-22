import {
  calculateEMA,
  calculateSMA,
  type IndicatorCandle,
} from "@/lib/indicators";

import type { MovingAverageData } from "../types";

export function buildMovingAverages(
  candles: IndicatorCandle[]
): MovingAverageData {
  const getLatestValue = (
    values: { value: number }[]
  ): number => {
    if (values.length === 0) {
      return 0;
    }

    return values[values.length - 1].value;
  };

  return {
    ema20: getLatestValue(calculateEMA(candles, 20)),
    ema50: getLatestValue(calculateEMA(candles, 50)),
    ema100: getLatestValue(calculateEMA(candles, 100)),
    ema200: getLatestValue(calculateEMA(candles, 200)),

    sma20: getLatestValue(calculateSMA(candles, 20)),
    sma50: getLatestValue(calculateSMA(candles, 50)),
    sma100: getLatestValue(calculateSMA(candles, 100)),
    sma200: getLatestValue(calculateSMA(candles, 200)),
  };
}