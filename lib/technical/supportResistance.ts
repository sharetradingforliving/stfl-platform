/**
 * ================================================================
 * STFL Technical Research Engine
 * File: supportResistance.ts
 * Purpose: Ranked multi-source Support & Resistance Analysis
 * ================================================================
 */

import {
  detectSwingPoints,
} from "./swingDetector";

import {
  findDominantSwing,
} from "./dominantSwing";

import {
  calculateFibonacciLevels,
} from "./fibRetracement";

import {
  calculateClassicPivot,
} from "./pivotPoints";

import {
  buildConfluenceZones,
} from "./confluence";

import {
  buildPriceLevels,
} from "./levelBuilder";

import type {
  PriceZone,
  SupportResistanceResult,
  TechnicalResearchInput,
} from "./types";

function isPositiveNumber(
  value:
    number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function getDistancePercent(
  currentPrice:
    number,

  level:
    number
): number {
  if (
    !isPositiveNumber(
      currentPrice
    )
  ) {
    return 0;
  }

  return (
    Math.abs(
      currentPrice -
      level
    ) /
    currentPrice
  ) * 100;
}

function getSourceCount(
  zone:
    PriceZone
): number {
  return new Set(
    zone.contributors.map(
      (contributor) =>
        contributor.source
    )
  ).size;
}

function calculateZoneScore(
  zone:
    PriceZone,

  currentPrice:
    number
): number {
  const distancePercent =
    getDistancePercent(
      currentPrice,
      zone.center
    );

  const sourceCount =
    getSourceCount(
      zone
    );

  /*
   * Structural evidence is given more
   * importance than simple proximity.
   *
   * A nearby weak pivot should not
   * automatically defeat a stronger
   * swing/Fibonacci/MA confluence.
   */
  const confidenceScore =
    zone.confidence * 0.5;

  const strengthScore =
    zone.strength * 2;

  const touchScore =
    zone.touches * 10;

  const diversityScore =
    sourceCount * 8;

  /*
   * Relevant nearby levels receive a
   * modest proximity bonus, but the
   * bonus cannot dominate structural
   * evidence.
   */
  const proximityScore =
    Math.max(
      0,
      20 -
      distancePercent
    );

  return (
    confidenceScore +
    strengthScore +
    touchScore +
    diversityScore +
    proximityScore
  );
}

function getEligibleSupportZones(
  currentPrice:
    number,

  zones:
    PriceZone[]
): PriceZone[] {
  return zones.filter(
    (zone) =>
      isPositiveNumber(
        zone.center
      ) &&
      zone.center <
        currentPrice
  );
}

function getEligibleResistanceZones(
  currentPrice:
    number,

  zones:
    PriceZone[]
): PriceZone[] {
  return zones.filter(
    (zone) =>
      isPositiveNumber(
        zone.center
      ) &&
      zone.center >
        currentPrice
  );
}

function selectMeaningfulZone(
  zones:
    PriceZone[],

  currentPrice:
    number,

  atr:
    number | null | undefined
): PriceZone | undefined {
  if (
    zones.length === 0
  ) {
    return undefined;
  }

  /*
   * Exclude levels that are so close
   * to price that they are likely to be
   * intraday noise rather than useful
   * daily support or resistance.
   *
   * ATR makes this threshold adjust
   * automatically to each stock's
   * volatility.
   */
  const minimumDistance =
    isPositiveNumber(atr)
      ? atr * 0.35
      : 0;

  /*
   * Ignore extremely distant levels
   * when selecting the immediate daily
   * trading zone. Such levels may still
   * be available as major levels.
   */
  const nearbyZones =
    zones.filter(
      (zone) => {
        const absoluteDistance =
          Math.abs(
            currentPrice -
            zone.center
          );

        const distancePercent =
          getDistancePercent(
            currentPrice,
            zone.center
          );

        return (
          absoluteDistance >=
            minimumDistance &&
          distancePercent <= 20
        );
      }
    );

  const candidates =
    nearbyZones.length > 0
      ? nearbyZones
      : zones;

  return candidates
    .slice()
    .sort(
      (first, second) => {
        const scoreDifference =
          calculateZoneScore(
            second,
            currentPrice
          ) -
          calculateZoneScore(
            first,
            currentPrice
          );

        if (
          Math.abs(
            scoreDifference
          ) > 0.001
        ) {
          return scoreDifference;
        }

        /*
         * Use proximity only when two
         * zones have almost identical
         * evidence scores.
         */
        return (
          getDistancePercent(
            currentPrice,
            first.center
          ) -
          getDistancePercent(
            currentPrice,
            second.center
          )
        );
      }
    )[0];
}

function selectMajorZone(
  zones:
    PriceZone[],

  currentPrice:
    number
): PriceZone | undefined {
  return zones
    .slice()
    .sort(
      (first, second) => {
        const evidenceDifference =
          (
            second.strength +
            second.touches * 3 +
            getSourceCount(
              second
            ) * 2
          ) -
          (
            first.strength +
            first.touches * 3 +
            getSourceCount(
              first
            ) * 2
          );

        if (
          evidenceDifference !== 0
        ) {
          return evidenceDifference;
        }

        return (
          getDistancePercent(
            currentPrice,
            first.center
          ) -
          getDistancePercent(
            currentPrice,
            second.center
          )
        );
      }
    )[0];
}

export function analyzeSupportResistance(
  input:
    TechnicalResearchInput
): SupportResistanceResult {
  const currentPrice =
    input.currentPrice;

  const {
    swingHighs,
    swingLows,
  } = detectSwingPoints(
    input.priceHistory
  );

  const dominantSwing =
    findDominantSwing(
      swingHighs,
      swingLows
    );

  const fibonacci =
    dominantSwing
      ? calculateFibonacciLevels(
          dominantSwing.high.price,
          dominantSwing.low.price
        )
      : undefined;

  const latestCandle =
    input.priceHistory.at(-1);

  const pivots =
    latestCandle
      ? calculateClassicPivot(
          latestCandle.high,
          latestCandle.low,
          latestCandle.close
        )
      : undefined;

  /*
   * Levels are classified dynamically
   * using current price. Moving
   * averages are also included as
   * support/resistance evidence.
   */
  const {
    supportLevels,
    resistanceLevels,
  } = buildPriceLevels(
    swingHighs,
    swingLows,
    fibonacci,
    pivots,
    currentPrice,
    input.movingAverages
  );

  const supportZones =
    buildConfluenceZones(
      supportLevels,
      "Support"
    );

  const resistanceZones =
    buildConfluenceZones(
      resistanceLevels,
      "Resistance"
    );

  const eligibleSupportZones =
    getEligibleSupportZones(
      currentPrice,
      supportZones
    );

  const eligibleResistanceZones =
    getEligibleResistanceZones(
      currentPrice,
      resistanceZones
    );

  const nearestSupportZone =
    selectMeaningfulZone(
      eligibleSupportZones,
      currentPrice,
      input.oscillators.atr
    );

  const nearestResistanceZone =
    selectMeaningfulZone(
      eligibleResistanceZones,
      currentPrice,
      input.oscillators.atr
    );

  const majorSupportZone =
    selectMajorZone(
      eligibleSupportZones,
      currentPrice
    );

  const majorResistanceZone =
    selectMajorZone(
      eligibleResistanceZones,
      currentPrice
    );

  /*
   * The last candle high/low is used
   * only as a final fallback when the
   * engine cannot construct any valid
   * technical zone.
   */
  const fallbackSupport =
    latestCandle &&
    latestCandle.low <
      currentPrice
      ? latestCandle.low
      : currentPrice;

  const fallbackResistance =
    latestCandle &&
    latestCandle.high >
      currentPrice
      ? latestCandle.high
      : currentPrice;

  const support =
    nearestSupportZone
      ?.center ??
    fallbackSupport;

  const resistance =
    nearestResistanceZone
      ?.center ??
    fallbackResistance;

  const majorSupport =
    majorSupportZone
      ?.center ??
    support;

  const majorResistance =
    majorResistanceZone
      ?.center ??
    resistance;

  const supportDistance =
    getDistancePercent(
      currentPrice,
      support
    );

  const resistanceDistance =
    getDistancePercent(
      currentPrice,
      resistance
    );

  let breakoutProbability =
    50;

  if (
    resistanceDistance < 2
  ) {
    breakoutProbability +=
      15;
  }

  if (
    supportDistance < 2
  ) {
    breakoutProbability -=
      10;
  }

  if (
    nearestResistanceZone &&
    nearestResistanceZone
      .confidence >= 70
  ) {
    breakoutProbability -=
      10;
  }

  breakoutProbability =
    Math.max(
      0,
      Math.min(
        100,
        breakoutProbability
      )
    );

  const confidence =
    Math.round(
      (
        (
          nearestSupportZone
            ?.confidence ??
          50
        ) +
        (
          nearestResistanceZone
            ?.confidence ??
          50
        )
      ) /
      2
    );

  const supportEvidence =
    nearestSupportZone
      ? nearestSupportZone
          .explanation
      : "Latest candle low used as fallback support.";

  const resistanceEvidence =
    nearestResistanceZone
      ? nearestResistanceZone
          .explanation
      : "Latest candle high used as fallback resistance.";

  const explanation =
    `Support ₹${support.toFixed(
      2
    )} and resistance ₹${resistance.toFixed(
      2
    )} were selected by ranking Swing, Fibonacci, Pivot and Moving Average confluence. ` +
    `${supportEvidence} ${resistanceEvidence}`;

  return {
    immediateSupport:
      Number(
        support.toFixed(2)
      ),

    majorSupport:
      Number(
        majorSupport.toFixed(2)
      ),

    immediateResistance:
      Number(
        resistance.toFixed(2)
      ),

    majorResistance:
      Number(
        majorResistance.toFixed(2)
      ),

    nearestSupportDistance:
      Number(
        supportDistance.toFixed(
          2
        )
      ),

    nearestResistanceDistance:
      Number(
        resistanceDistance.toFixed(
          2
        )
      ),

    breakoutProbability,

    confidence,

    explanation,

    supportZones,

    resistanceZones,
  };
}