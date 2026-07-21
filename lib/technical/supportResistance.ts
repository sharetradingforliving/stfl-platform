/**
 * ================================================================
 * STFL Technical Research Engine
 * File: supportResistance.ts
 * Purpose: Support & Resistance Analysis Module
 * ================================================================
 */

import {
  SupportResistanceResult,
  TechnicalResearchInput,
} from "./types";

/**
 * Find nearest support from price history
 */
function findNearestSupport(
  currentPrice: number,
  history: TechnicalResearchInput["priceHistory"]
): number {
  const lows = history
    .map(candle => candle.low)
    .filter(low => low < currentPrice);

  if (lows.length === 0) {
    return currentPrice;
  }

  return Math.max(...lows);
}

/**
 * Find nearest resistance from price history
 */
function findNearestResistance(
  currentPrice: number,
  history: TechnicalResearchInput["priceHistory"]
): number {
  const highs = history
    .map(candle => candle.high)
    .filter(high => high > currentPrice);

  if (highs.length === 0) {
    return currentPrice;
  }

  return Math.min(...highs);
}

/**
 * Analyze Support & Resistance
 */
export function analyzeSupportResistance(
  input: TechnicalResearchInput
): SupportResistanceResult {

  const currentPrice = input.currentPrice;

  const support = findNearestSupport(
    currentPrice,
    input.priceHistory
  );

  const resistance = findNearestResistance(
    currentPrice,
    input.priceHistory
  );

  const supportDistance =
    ((currentPrice - support) / currentPrice) * 100;

  const resistanceDistance =
    ((resistance - currentPrice) / currentPrice) * 100;

  let breakoutProbability = 50;

  if (resistanceDistance < 2) {
    breakoutProbability += 20;
  }

  if (supportDistance < 2) {
    breakoutProbability -= 10;
  }

  breakoutProbability = Math.max(
    0,
    Math.min(100, breakoutProbability)
  );

  return {
    immediateSupport: support,

    majorSupport: support,

    immediateResistance: resistance,

    majorResistance: resistance,

    nearestSupportDistance: Number(
      supportDistance.toFixed(2)
    ),

    nearestResistanceDistance: Number(
      resistanceDistance.toFixed(2)
    ),

    breakoutProbability,

    confidence: 80,

    explanation:
      `Nearest support is ₹${support.toFixed(2)} and nearest resistance is ₹${resistance.toFixed(2)}.`,
  };
}