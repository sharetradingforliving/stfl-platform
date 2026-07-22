import { ATR } from "technicalindicators";

import {
  IndicatorCandle,
  IndicatorPoint,
} from "./sma";

export function calculateATR(
  candles: IndicatorCandle[],
  period = 14
): IndicatorPoint[] {
  if (candles.length < period + 1) {
    return [];
  }

  const results = ATR.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
  });

  const offset = candles.length - results.length;

  return results.map((value, index) => ({
    time: candles[index + offset].time,
    value,
  }));
}