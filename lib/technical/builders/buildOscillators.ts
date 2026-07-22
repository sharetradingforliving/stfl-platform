import {
  calculateADX,
  calculateATR,
  calculateMACD,
  calculateRSI,
  calculateStochastic,
  IndicatorCandle,
} from "@/lib/indicators";

import type { PriceData } from "../types";
import type { OscillatorData } from "../types";

export function buildOscillators(
  priceHistory: PriceData[]
): OscillatorData {
  const candles: IndicatorCandle[] = priceHistory.map((candle) => ({
    time: candle.date,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));

  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const atr = calculateATR(candles, 14);
  const adx = calculateADX(candles, 14);
  const stochastic = calculateStochastic(candles);

  return {
    rsi: rsi.at(-1)?.value ?? 0,

    macd: macd.at(-1)?.macd ?? 0,
    macdSignal: macd.at(-1)?.signal ?? 0,
    macdHistogram: macd.at(-1)?.histogram ?? 0,

    stochasticK: stochastic.at(-1)?.k ?? 0,
    stochasticD: stochastic.at(-1)?.d ?? 0,

    adx: adx.at(-1)?.adx ?? 0,

    atr: atr.at(-1)?.value ?? 0,
  };
}