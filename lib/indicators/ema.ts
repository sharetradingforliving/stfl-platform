import type { Time } from "lightweight-charts";

import {
  IndicatorCandle,
  IndicatorPoint,
} from "./sma";

export function calculateEMA(
  candles: IndicatorCandle[],
  period: number
): IndicatorPoint[] {
  const emaData: IndicatorPoint[] = [];

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

  for (let index = period; index < candles.length; index++) {
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