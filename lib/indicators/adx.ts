import { ADX } from "technicalindicators";

import {
  IndicatorCandle,
} from "./sma";

export interface ADXPoint {
  time: import("lightweight-charts").Time;
  adx: number;
  pdi: number;
  mdi: number;
}

export function calculateADX(
  candles: IndicatorCandle[],
  period = 14
): ADXPoint[] {
  if (candles.length < period * 2) {
    return [];
  }

  const results = ADX.calculate({
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
    period,
  });

  const offset = candles.length - results.length;

  return results.map((result, index) => ({
    time: candles[index + offset].time,
    adx: result.adx,
    pdi: result.pdi,
    mdi: result.mdi,
  }));
}