/**
 * ================================================================
 * STFL Technical Research Engine
 * File: trend.ts
 * Purpose: Trend Analysis Module
 * ================================================================
 */

import {
  TechnicalResearchInput,
  TrendResult,
  TrendDirection,
} from "./types";

/**
 * Analyze overall market trend.
 *
 * Responsibilities:
 * - EMA alignment
 * - SMA alignment
 * - Higher Highs / Higher Lows
 * - Lower Highs / Lower Lows
 * - Trend direction
 * - Trend confidence
 * - Trend score
 */
/**
 * Checks whether EMAs are in bullish alignment.
 *
 * 20 > 50 > 100 > 200
 */
function isBullishEMAAlignment(input: TechnicalResearchInput): boolean {
  const ma = input.movingAverages;

  return (
    ma.ema20 > ma.ema50 &&
    ma.ema50 > ma.ema100 &&
    ma.ema100 > ma.ema200
  );
}

/**
 * Checks whether SMAs are in bullish alignment.
 *
 * 20 > 50 > 100 > 200
 */
function isBullishSMAAlignment(input: TechnicalResearchInput): boolean {
  const ma = input.movingAverages;

  return (
    ma.sma20 > ma.sma50 &&
    ma.sma50 > ma.sma100 &&
    ma.sma100 > ma.sma200
  );
}

export function analyzeTrend(
  input: TechnicalResearchInput
): TrendResult {
    const emaAlignment = isBullishEMAAlignment(input);
  const smaAlignment = isBullishSMAAlignment(input);

  let score = 50;

  if (emaAlignment) score += 20;
  if (smaAlignment) score += 20;

  score = Math.min(score, 100);

  let direction = TrendDirection.NEUTRAL;

  if (score >= 90) {
    direction = TrendDirection.STRONG_BULLISH;
  } else if (score >= 70) {
    direction = TrendDirection.BULLISH;
  }

  return {
    direction,

    confidence: score,

    score,

    higherHighs: false,
    higherLows: false,
    lowerHighs: false,
    lowerLows: false,

    emaAlignment,

    smaAlignment,

    explanation: `Trend score is ${score}/100 based on moving average alignment.`,
  };
}