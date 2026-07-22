import { RSI } from "technicalindicators";

import {
  IndicatorCandle,
  IndicatorPoint,
} from "./sma";

export function calculateRSI(
  candles: IndicatorCandle[],
  period: number
): IndicatorPoint[] {
  if (candles.length < period + 1) {
    return [];
  }

  const closes = candles.map((candle) => candle.close);

  const rsiValues = RSI.calculate({
    values: closes,
    period,
  });

  return rsiValues.map((value, index) => ({
    time: candles[index + period].time,
    value,
  }));
}