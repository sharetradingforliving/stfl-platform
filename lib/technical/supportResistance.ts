/**
 * ================================================================
 * STFL Technical Research Engine
 * File: supportResistance.ts
 * Purpose: Proximity-ordered multi-source Support & Resistance
 * ================================================================
 */

import { detectSwingPoints } from "./swingDetector";
import { findDominantSwing } from "./dominantSwing";
import { calculateFibonacciLevels } from "./fibRetracement";
import { calculateClassicPivot } from "./pivotPoints";
import { buildConfluenceZones } from "./confluence";
import { buildPriceLevels } from "./levelBuilder";

import type {
  PriceZone,
  SupportResistanceResult,
  TechnicalResearchInput,
} from "./types";

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getDistancePercent(currentPrice: number, level: number): number {
  if (!isPositiveNumber(currentPrice)) {
    return 0;
  }

  return (Math.abs(currentPrice - level) / currentPrice) * 100;
}

function getSourceCount(zone: PriceZone): number {
  return new Set(zone.contributors.map((item) => item.source)).size;
}

/*
 * Structural evidence is used only as
 * a tie-breaker between similarly
 * positioned zones. It cannot replace
 * a nearer valid chart level.
 */
function calculateEvidenceScore(zone: PriceZone): number {
  return (
    zone.confidence * 0.5 +
    zone.strength * 2 +
    zone.touches * 10 +
    getSourceCount(zone) * 8
  );
}

/*
 * Exclude zones that are extremely
 * close to the current price and are
 * likely to represent market noise.
 */
function getNoiseDistance(
  currentPrice: number,
  atr: number | null | undefined,
): number {
  return Math.max(currentPrice * 0.0015, isPositiveNumber(atr) ? atr * 0.1 : 0);
}

/*
 * S2 and R2 must be meaningfully
 * separated from S1 and R1.
 *
 * The larger of the following is used:
 *
 * - 0.75% of the current price
 * - 0.50 ATR of the selected timeframe
 *
 * Because ATR is calculated from the
 * selected chart timeframe, weekly
 * levels will normally require wider
 * separation than daily levels.
 */
function getDistinctDistance(
  currentPrice: number,
  atr: number | null | undefined,
): number {
  return Math.max(currentPrice * 0.0075, isPositiveNumber(atr) ? atr * 0.5 : 0);
}

function prepareSupportZones(
  currentPrice: number,
  zones: PriceZone[],
  atr: number | null | undefined,
): PriceZone[] {
  const noiseDistance = getNoiseDistance(currentPrice, atr);

  const validZones = zones.filter(
    (zone) =>
      isPositiveNumber(zone.center) &&
      zone.center < currentPrice &&
      currentPrice - zone.center >= noiseDistance,
  );

  /*
   * Prefer zones within 20% of the
   * current price. If none are found,
   * retain all valid structural zones.
   */
  const nearbyZones = validZones.filter(
    (zone) => getDistancePercent(currentPrice, zone.center) <= 20,
  );

  const candidates = nearbyZones.length > 0 ? nearbyZones : validZones;

  /*
   * Support zones are ordered from
   * highest to lowest:
   *
   * current price > S1 > S2
   */
  return candidates.slice().sort((first, second) => {
    const distanceDifference = second.center - first.center;

    if (Math.abs(distanceDifference) > 0.01) {
      return distanceDifference;
    }

    return calculateEvidenceScore(second) - calculateEvidenceScore(first);
  });
}

function prepareResistanceZones(
  currentPrice: number,
  zones: PriceZone[],
  atr: number | null | undefined,
): PriceZone[] {
  const noiseDistance = getNoiseDistance(currentPrice, atr);

  const validZones = zones.filter(
    (zone) =>
      isPositiveNumber(zone.center) &&
      zone.center > currentPrice &&
      zone.center - currentPrice >= noiseDistance,
  );

  /*
   * Prefer zones within 20% of the
   * current price. If none are found,
   * retain all valid structural zones.
   */
  const nearbyZones = validZones.filter(
    (zone) => getDistancePercent(currentPrice, zone.center) <= 20,
  );

  const candidates = nearbyZones.length > 0 ? nearbyZones : validZones;

  /*
   * Resistance zones are ordered from
   * lowest to highest:
   *
   * current price < R1 < R2
   */
  return candidates.slice().sort((first, second) => {
    const distanceDifference = first.center - second.center;

    if (Math.abs(distanceDifference) > 0.01) {
      return distanceDifference;
    }

    return calculateEvidenceScore(second) - calculateEvidenceScore(first);
  });
}

function selectFirstTwoDistinctZones(
  zones: PriceZone[],
  currentPrice: number,
  atr: number | null | undefined,
): [PriceZone | undefined, PriceZone | undefined] {
  const firstZone = zones[0];

  if (!firstZone) {
    return [undefined, undefined];
  }

  const minimumSeparation = getDistinctDistance(currentPrice, atr);

  const secondZone = zones.find(
    (zone, index) =>
      index > 0 &&
      Math.abs(zone.center - firstZone.center) >= minimumSeparation,
  );

  return [firstZone, secondZone];
}

export function analyzeSupportResistance(
  input: TechnicalResearchInput,
): SupportResistanceResult {
  const currentPrice = input.currentPrice;

  const atr = input.oscillators.atr;

  const { swingHighs, swingLows } = detectSwingPoints(input.priceHistory);

  const dominantSwing = findDominantSwing(swingHighs, swingLows);

  const fibonacci = dominantSwing
    ? calculateFibonacciLevels(
        dominantSwing.high.price,
        dominantSwing.low.price,
      )
    : undefined;

  const latestCandle = input.priceHistory.at(-1);

  const pivots = latestCandle
    ? calculateClassicPivot(
        latestCandle.high,
        latestCandle.low,
        latestCandle.close,
      )
    : undefined;

  /*
   * Candidate levels are built from:
   *
   * - recent swing highs and lows
   * - Fibonacci retracement levels
   * - Classical Pivot levels
   * - moving averages
   */
  const { supportLevels, resistanceLevels } = buildPriceLevels(
    swingHighs,
    swingLows,
    fibonacci,
    pivots,
    currentPrice,
    input.movingAverages,
  );

  const supportZones = buildConfluenceZones(supportLevels, "Support");

  const resistanceZones = buildConfluenceZones(resistanceLevels, "Resistance");

  const orderedSupports = prepareSupportZones(currentPrice, supportZones, atr);

  const orderedResistances = prepareResistanceZones(
    currentPrice,
    resistanceZones,
    atr,
  );

  const [support1Zone, support2Zone] = selectFirstTwoDistinctZones(
    orderedSupports,
    currentPrice,
    atr,
  );

  const [resistance1Zone, resistance2Zone] = selectFirstTwoDistinctZones(
    orderedResistances,
    currentPrice,
    atr,
  );

  /*
   * Latest-candle values are used only
   * when no valid technical zone can
   * be constructed.
   */
  const fallbackSupport =
    latestCandle && latestCandle.low < currentPrice
      ? latestCandle.low
      : currentPrice;

  const fallbackResistance =
    latestCandle && latestCandle.high > currentPrice
      ? latestCandle.high
      : currentPrice;

  const support1 = support1Zone?.center ?? fallbackSupport;

  /*
   * If no distinct second zone exists,
   * retain S1/R1 for compatibility.
   * The UI can later display "N/A"
   * instead of duplicating the level.
   */
  const support2 = support2Zone?.center ?? support1;

  const resistance1 = resistance1Zone?.center ?? fallbackResistance;

  const resistance2 = resistance2Zone?.center ?? resistance1;

  const supportDistance = getDistancePercent(currentPrice, support1);

  const resistanceDistance = getDistancePercent(currentPrice, resistance1);

  let breakoutProbability = 50;

  if (resistanceDistance < 2) {
    breakoutProbability += 15;
  }

  if (supportDistance < 2) {
    breakoutProbability -= 10;
  }

  if (resistance1Zone && resistance1Zone.confidence >= 70) {
    breakoutProbability -= 10;
  }

  breakoutProbability = Math.max(0, Math.min(100, breakoutProbability));

  const confidence = Math.round(
    ((support1Zone?.confidence ?? 50) + (resistance1Zone?.confidence ?? 50)) /
      2,
  );

  const supportEvidence = support1Zone
    ? support1Zone.explanation
    : "Latest candle low used as fallback support.";

  const resistanceEvidence = resistance1Zone
    ? resistance1Zone.explanation
    : "Latest candle high used as fallback resistance.";

  const explanation =
    `Support 1 at ₹${support1.toFixed(2)} and Support 2 at ₹${support2.toFixed(
      2,
    )} are ordered below the current price by proximity. ` +
    `Resistance 1 at ₹${resistance1.toFixed(
      2,
    )} and Resistance 2 at ₹${resistance2.toFixed(2)} are ordered above it. ` +
    `Secondary levels require a minimum separation of 0.75% of price or 0.50 ATR. ` +
    `${supportEvidence} ${resistanceEvidence}`;

  return {
    /*
     * Legacy property names are
     * retained for compatibility:
     *
     * immediateSupport = S1
     * majorSupport = S2
     * immediateResistance = R1
     * majorResistance = R2
     */
    immediateSupport: Number(support1.toFixed(2)),

    majorSupport: Number(support2.toFixed(2)),

    immediateResistance: Number(resistance1.toFixed(2)),

    majorResistance: Number(resistance2.toFixed(2)),

    nearestSupportDistance: Number(supportDistance.toFixed(2)),

    nearestResistanceDistance: Number(resistanceDistance.toFixed(2)),

    breakoutProbability,

    confidence,

    explanation,

    supportZones,

    resistanceZones,
  };
}
