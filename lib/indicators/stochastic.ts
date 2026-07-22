import { Stochastic } from "technicalindicators";

import {
  IndicatorCandle,
} from "./sma";

export interface StochasticPoint {
  time: import("lightweight-charts").Time;
  k: number;
  d: number;
}

export function calculateStochastic(
  candles: IndicatorCandle[],
  period = 14,
  signalPeriod = 3
): StochasticPoint[] {
  if (candles.length < period + signalPeriod) {
    return [];
  }

  const results = Stochastic.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
    signalPeriod,
  });

  const offset = candles.length - results.length;

  return results.map((result, index) => ({
    time: candles[index + offset].time,
    k: result.k,
    d: result.d,
  }));
}