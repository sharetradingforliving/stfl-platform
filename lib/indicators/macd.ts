import { MACD } from "technicalindicators";

import {
  IndicatorCandle,
} from "./sma";

export interface MACDPoint {
  time: import("lightweight-charts").Time;
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  candles: IndicatorCandle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDPoint[] {
  if (candles.length < slowPeriod + signalPeriod) {
    return [];
  }

  const closes = candles.map((candle) => candle.close);

  const results = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const offset = candles.length - results.length;

  return results.map((result, index) => ({
    time: candles[index + offset].time,
    macd: result.MACD ?? 0,
    signal: result.signal ?? 0,
    histogram: result.histogram ?? 0,
  }));
}