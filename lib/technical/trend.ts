/**
 * ================================================================
 * STFL Technical Research Engine
 * File: trend.ts
 * Purpose: Bidirectional, recency-aware Trend Analysis
 * ================================================================
 */

import type { PriceData, TechnicalResearchInput, TrendResult } from "./types";

import { TrendDirection } from "./types";

type MarketStructure = {
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
};

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isBullishAlignment(values: number[]): boolean {
  return (
    values.every(isPositiveNumber) &&
    values[0] > values[1] &&
    values[1] > values[2] &&
    values[2] > values[3]
  );
}

function isBearishAlignment(values: number[]): boolean {
  return (
    values.every(isPositiveNumber) &&
    values[0] < values[1] &&
    values[1] < values[2] &&
    values[2] < values[3]
  );
}

function getPercentageChange(
  currentValue: number,
  previousValue: number | null | undefined,
): number | null {
  if (!isPositiveNumber(currentValue) || !isPositiveNumber(previousValue)) {
    return null;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

function getRecentCandles(priceHistory: PriceData[], count = 80): PriceData[] {
  return priceHistory
    .filter(
      (candle) =>
        isPositiveNumber(candle.high) &&
        isPositiveNumber(candle.low) &&
        isPositiveNumber(candle.close),
    )
    .slice(-count);
}

function analyseMarketStructure(priceHistory: PriceData[]): MarketStructure {
  const candles = getRecentCandles(priceHistory);
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  const pivotWidth = 2;

  for (
    let index = pivotWidth;
    index < candles.length - pivotWidth;
    index += 1
  ) {
    const candle = candles[index];
    if (!candle) continue;

    const neighbouringCandles = candles.slice(
      index - pivotWidth,
      index + pivotWidth + 1,
    );

    const isSwingHigh = neighbouringCandles.every(
      (item, neighbourIndex) =>
        neighbourIndex === pivotWidth || candle.high > item.high,
    );

    const isSwingLow = neighbouringCandles.every(
      (item, neighbourIndex) =>
        neighbourIndex === pivotWidth || candle.low < item.low,
    );

    if (isSwingHigh) swingHighs.push(candle.high);
    if (isSwingLow) swingLows.push(candle.low);
  }

  const previousHigh = swingHighs.at(-2);
  const latestHigh = swingHighs.at(-1);
  const previousLow = swingLows.at(-2);
  const latestLow = swingLows.at(-1);

  return {
    higherHighs:
      isPositiveNumber(previousHigh) &&
      isPositiveNumber(latestHigh) &&
      latestHigh > previousHigh,
    higherLows:
      isPositiveNumber(previousLow) &&
      isPositiveNumber(latestLow) &&
      latestLow > previousLow,
    lowerHighs:
      isPositiveNumber(previousHigh) &&
      isPositiveNumber(latestHigh) &&
      latestHigh < previousHigh,
    lowerLows:
      isPositiveNumber(previousLow) &&
      isPositiveNumber(latestLow) &&
      latestLow < previousLow,
  };
}

function getPriorRange(
  priceHistory: PriceData[],
  period = 20,
): { highestHigh: number | null; lowestLow: number | null } {
  const candles = getRecentCandles(priceHistory, period + 1);
  const priorCandles = candles.slice(0, -1);

  if (priorCandles.length === 0) {
    return { highestHigh: null, lowestLow: null };
  }

  return {
    highestHigh: Math.max(...priorCandles.map((candle) => candle.high)),
    lowestLow: Math.min(...priorCandles.map((candle) => candle.low)),
  };
}

function addPricePositionScore(
  score: number,
  currentPrice: number,
  movingAverage: number,
  weight: number,
): number {
  if (!isPositiveNumber(movingAverage)) return score;
  return currentPrice >= movingAverage ? score + weight : score - weight;
}

export function analyzeTrend(input: TechnicalResearchInput): TrendResult {
  const { currentPrice, movingAverages, priceHistory } = input;
  const emaValues = [
    movingAverages.ema20,
    movingAverages.ema50,
    movingAverages.ema100,
    movingAverages.ema200,
  ];
  const smaValues = [
    movingAverages.sma20,
    movingAverages.sma50,
    movingAverages.sma100,
    movingAverages.sma200,
  ];

  const bullishEMAAlignment = isBullishAlignment(emaValues);
  const bearishEMAAlignment = isBearishAlignment(emaValues);
  const bullishSMAAlignment = isBullishAlignment(smaValues);
  const bearishSMAAlignment = isBearishAlignment(smaValues);
  const structure = analyseMarketStructure(priceHistory);
  const priorRange = getPriorRange(priceHistory);
  const recentCandles = getRecentCandles(priceHistory);
  const twentySessionReference = recentCandles.at(-21)?.close;
  const fiftySessionReference = recentCandles.at(-51)?.close;
  const twentySessionChange = getPercentageChange(
    currentPrice,
    twentySessionReference,
  );
  const fiftySessionChange = getPercentageChange(
    currentPrice,
    fiftySessionReference,
  );

  const bullishStructure = structure.higherHighs && structure.higherLows;
  const bearishStructure = structure.lowerHighs && structure.lowerLows;
  const recentBreakout =
    isPositiveNumber(priorRange.highestHigh) &&
    currentPrice > priorRange.highestHigh;
  const recentBreakdown =
    isPositiveNumber(priorRange.lowestLow) &&
    currentPrice < priorRange.lowestLow;

  let score = 50;

  score = addPricePositionScore(score, currentPrice, movingAverages.ema20, 8);
  score = addPricePositionScore(score, currentPrice, movingAverages.ema50, 8);
  score = addPricePositionScore(score, currentPrice, movingAverages.ema100, 5);
  score = addPricePositionScore(score, currentPrice, movingAverages.ema200, 5);

  if (bullishEMAAlignment) score += 12;
  if (bearishEMAAlignment) score -= 12;
  if (bullishSMAAlignment) score += 8;
  if (bearishSMAAlignment) score -= 8;
  if (bullishStructure) score += 12;
  if (bearishStructure) score -= 12;
  if (recentBreakout) score += 10;
  if (recentBreakdown) score -= 10;

  if (twentySessionChange !== null) {
    if (twentySessionChange >= 3) score += 8;
    if (twentySessionChange <= -3) score -= 8;
  }

  if (fiftySessionChange !== null) {
    if (fiftySessionChange >= 5) score += 6;
    if (fiftySessionChange <= -5) score -= 6;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let direction = TrendDirection.NEUTRAL;
  if (score >= 75) direction = TrendDirection.STRONG_BULLISH;
  else if (score >= 60) direction = TrendDirection.BULLISH;
  else if (score <= 25) direction = TrendDirection.STRONG_BEARISH;
  else if (score <= 40) direction = TrendDirection.BEARISH;

  const evidenceCount = [
    bullishEMAAlignment || bearishEMAAlignment,
    bullishSMAAlignment || bearishSMAAlignment,
    bullishStructure || bearishStructure,
    recentBreakout || recentBreakdown,
    twentySessionChange !== null,
    fiftySessionChange !== null,
  ].filter(Boolean).length;

  const confidence = Math.round(
    Math.min(100, Math.abs(score - 50) * 1.5 + evidenceCount * 5),
  );

  const evidence: string[] = [];
  if (bullishEMAAlignment) evidence.push("bullish EMA alignment");
  if (bearishEMAAlignment) evidence.push("bearish EMA alignment");
  if (bullishSMAAlignment) evidence.push("bullish SMA alignment");
  if (bearishSMAAlignment) evidence.push("bearish SMA alignment");
  if (bullishStructure) evidence.push("higher highs and higher lows");
  if (bearishStructure) evidence.push("lower highs and lower lows");
  if (recentBreakout) evidence.push("a recent 20-session breakout");
  if (recentBreakdown) evidence.push("a recent 20-session breakdown");
  if (twentySessionChange !== null) {
    evidence.push(
      `20-session price change of ${twentySessionChange.toFixed(1)}%`,
    );
  }

  return {
    direction,
    confidence,
    score,
    higherHighs: structure.higherHighs,
    higherLows: structure.higherLows,
    lowerHighs: structure.lowerHighs,
    lowerLows: structure.lowerLows,
    emaAlignment: bullishEMAAlignment,
    smaAlignment: bullishSMAAlignment,
    explanation:
      evidence.length > 0
        ? `The ${direction.toLowerCase().replaceAll("_", " ")} trend is based on ${evidence.join(
            ", ",
          )}.`
        : "The available trend evidence is mixed, resulting in a neutral reading.",
  };
}
