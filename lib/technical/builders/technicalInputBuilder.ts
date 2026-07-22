import type { IndicatorCandle } from "@/lib/indicators";

import type {
  TechnicalResearchInput,
  PriceData,
} from "../types";

import { buildMovingAverages } from "./buildMovingAverages";
import { buildOscillators } from "./buildOscillators";
import { buildVolume } from "./buildVolume";

interface BuildTechnicalInputParams {
  symbol: string;
  exchange: "NSE" | "BSE";
  currentPrice: number;
  priceHistory: PriceData[];
}

export function buildTechnicalInput({
  symbol,
  exchange,
  currentPrice,
  priceHistory,
}: BuildTechnicalInputParams): TechnicalResearchInput {
  const indicatorCandles: IndicatorCandle[] = priceHistory.map(
    (candle) => ({
      time: candle.date,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    })
  );

  return {
    symbol,
    exchange,
    currentPrice,
    priceHistory,

    movingAverages:
      buildMovingAverages(indicatorCandles),

    oscillators:
      buildOscillators(priceHistory),

    volume:
      buildVolume(priceHistory),
  };
}