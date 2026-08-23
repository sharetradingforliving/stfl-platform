/**
 * ================================================================
 * STFL Technical Research Engine
 * File: supportResistance.ts
 * Purpose: Support & Resistance Analysis Module
 * ================================================================
 */
import { detectSwingPoints } from "./swingDetector";
import { findDominantSwing } from "./dominantSwing";
import { calculateFibonacciLevels } from "./fibRetracement";
import { calculateClassicPivot } from "./pivotPoints";
import { buildConfluenceZones } from "./confluence";
import { buildPriceLevels } from "./levelBuilder";

import {
    SupportResistanceResult,
    TechnicalResearchInput,
    PriceZone,
} from "./types";
/**
 * Find nearest support from price history
 */
function findNearestSupportZone(
  currentPrice: number,
  supportZones: PriceZone[]
): PriceZone | undefined {
  const validZones = supportZones.filter(
    (zone) => zone.center <= currentPrice
  );

  if (validZones.length === 0) {
    return undefined;
  }

  return validZones.reduce((nearest, zone) =>
    zone.center > nearest.center ? zone : nearest
  );
}

function findNearestResistanceZone(
  currentPrice: number,
  resistanceZones: PriceZone[]
): PriceZone | undefined {
  const validZones = resistanceZones.filter(
    (zone) => zone.center >= currentPrice
  );

  if (validZones.length === 0) {
    return undefined;
  }

  return validZones.reduce((nearest, zone) =>
    zone.center < nearest.center ? zone : nearest
  );
}
/**
 * Analyze Support & Resistance
 */
console.log("SupportResistance V2 is running");
export function analyzeSupportResistance(
  input: TechnicalResearchInput
): SupportResistanceResult {

  const currentPrice = input.currentPrice;

  // ------------------------------------------------
  // Detect Swings
  // ------------------------------------------------
  const { swingHighs, swingLows } = detectSwingPoints(input.priceHistory);

  // ------------------------------------------------
  // Dominant Swing
  // ------------------------------------------------
  const dominantSwing = findDominantSwing(
    swingHighs,
    swingLows
  );

  // ------------------------------------------------
  // Fibonacci
  // ------------------------------------------------
  const fibonacci = dominantSwing
    ? calculateFibonacciLevels(
        dominantSwing.high.price,
        dominantSwing.low.price
      )
    : undefined;

  // ------------------------------------------------
  // Pivot Points
  // ------------------------------------------------
  const latestCandle =
    input.priceHistory[input.priceHistory.length - 1];

  const pivots = calculateClassicPivot(
    latestCandle.high,
    latestCandle.low,
    latestCandle.close
  );

  // ------------------------------------------------
  // Build Technical Levels
  // ------------------------------------------------
  const {
    supportLevels,
    resistanceLevels,
  } = buildPriceLevels(
    swingHighs,
    swingLows,
    fibonacci,
    pivots
  );

  // ------------------------------------------------
  // Build Zones
  // ------------------------------------------------
  const supportZones = buildConfluenceZones(
    supportLevels,
    "Support"
  );

  const resistanceZones = buildConfluenceZones(
    resistanceLevels,
    "Resistance"
  );

  // ------------------------------------------------
  // Find Nearest Zones
  // ------------------------------------------------
  const nearestSupportZone =
    findNearestSupportZone(
      currentPrice,
      supportZones
    );

  const nearestResistanceZone =
    findNearestResistanceZone(
      currentPrice,
      resistanceZones
    );

  const support =
    nearestSupportZone?.center ?? currentPrice;

  const resistance =
    nearestResistanceZone?.center ?? currentPrice;

  // ------------------------------------------------
  // Distances
  // ------------------------------------------------
  const supportDistance =
    ((currentPrice - support) / currentPrice) * 100;

  const resistanceDistance =
    ((resistance - currentPrice) / currentPrice) * 100;

  // ------------------------------------------------
  // Breakout Probability
  // ------------------------------------------------
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

  // ------------------------------------------------
  // Confidence
  // ------------------------------------------------
  const confidence =
    Math.round(
      (
        (nearestSupportZone?.confidence ?? 70) +
        (nearestResistanceZone?.confidence ?? 70)
      ) / 2
    );

  // ------------------------------------------------
  // Explanation
  // ------------------------------------------------
  const explanation =
    `Nearest support zone ₹${support.toFixed(2)} and nearest resistance zone ₹${resistance.toFixed(2)} identified using Swing, Fibonacci and Pivot confluence.`;

  return {

    immediateSupport: support,

    majorSupport:
      supportZones.length > 0
        ? supportZones[0].center
        : support,

    immediateResistance: resistance,

    majorResistance:
      resistanceZones.length > 0
        ? resistanceZones[0].center
        : resistance,

    nearestSupportDistance:
      Number(supportDistance.toFixed(2)),

    nearestResistanceDistance:
      Number(resistanceDistance.toFixed(2)),

    breakoutProbability,

    confidence,

    explanation,

    supportZones,

    resistanceZones,
  };

}