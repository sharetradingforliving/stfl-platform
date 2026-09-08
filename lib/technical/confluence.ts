/**
 * ================================================================
 * STFL Technical Research Engine
 * File: confluence.ts
 * Purpose: Merge and rank nearby technical levels into zones
 * ================================================================
 */

import type {
  LevelSource,
  PriceLevel,
  PriceZone,
} from "./types";

/*
 * Levels within 0.5% of the developing
 * zone centre are treated as one zone.
 */
const DEFAULT_ZONE_THRESHOLD =
  0.005;

function isValidPrice(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    value > 0
  );
}

function getWeightedCenter(
  levels:
    PriceLevel[]
): number {
  const totalWeight =
    levels.reduce(
      (total, level) =>
        total +
        Math.max(
          level.weight,
          1
        ),
      0
    );

  if (totalWeight <= 0) {
    return (
      levels.reduce(
        (total, level) =>
          total +
          level.price,
        0
      ) /
      levels.length
    );
  }

  return (
    levels.reduce(
      (total, level) =>
        total +
        level.price *
          Math.max(
            level.weight,
            1
          ),
      0
    ) /
    totalWeight
  );
}

function calculateConfidence(
  levels:
    PriceLevel[],

  strength:
    number,

  sourceCount:
    number,

  swingTouches:
    number
): number {
  /*
   * Confidence combines:
   *
   * 1. Total contributor weight
   * 2. Independent source diversity
   * 3. Historical swing touches
   *
   * This prevents a single minor swing
   * from receiving the same confidence
   * as a multi-source confluence zone.
   */
  const strengthScore =
    Math.min(
      50,
      strength * 3
    );

  const sourceScore =
    Math.min(
      25,
      sourceCount * 6
    );

  const touchScore =
    Math.min(
      20,
      swingTouches * 5
    );

  const timeframeBonus =
    levels.some(
      (level) =>
        level.timeframe ===
        "Monthly"
    )
      ? 5
      : levels.some(
            (level) =>
              level.timeframe ===
              "Weekly"
          )
        ? 3
        : 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        strengthScore +
        sourceScore +
        touchScore +
        timeframeBonus
      )
    )
  );
}

function createZone(
  levels:
    PriceLevel[],

  zoneType:
    "Support" | "Resistance"
): PriceZone {
  const prices =
    levels.map(
      (level) =>
        level.price
    );

  const lower =
    Math.min(
      ...prices
    );

  const upper =
    Math.max(
      ...prices
    );

  /*
   * Weighted centre gives stronger
   * technical evidence more influence
   * than weak nearby levels.
   */
  const center =
    getWeightedCenter(
      levels
    );

  const strength =
    levels.reduce(
      (total, level) =>
        total +
        Math.max(
          level.weight,
          0
        ),
      0
    );

  const sources =
    new Set<LevelSource>(
      levels.map(
        (level) =>
          level.source
      )
    );

  /*
   * Only swing contributors count as
   * historical price touches.
   * Fibonacci, pivots and moving
   * averages are confluence sources,
   * not market touches.
   */
  const swingTouches =
    levels.filter(
      (level) =>
        level.source ===
        "Swing"
    ).length;

  const confidence =
    calculateConfidence(
      levels,
      strength,
      sources.size,
      swingTouches
    );

  const sourceNames =
    Array.from(
      sources
    ).join(", ");

  const explanation =
    `${zoneType} zone ₹${lower.toFixed(
      2
    )}–₹${upper.toFixed(
      2
    )} formed from ${sourceNames}. ` +
    `${swingTouches} historical swing touch${
      swingTouches === 1
        ? ""
        : "es"
    }, ${sources.size} independent source${
      sources.size === 1
        ? ""
        : "s"
    } and strength ${strength}.`;

  return {
    lower,

    upper,

    center,

    strength,

    confidence,

    touches:
      swingTouches,

    contributors:
      levels,

    explanation,

    type:
      zoneType,
  };
}

export function buildConfluenceZones(
  levels:
    PriceLevel[],

  zoneType:
    "Support" | "Resistance",

  threshold =
    DEFAULT_ZONE_THRESHOLD
): PriceZone[] {
  const validLevels =
    levels
      .filter(
        (level) =>
          isValidPrice(
            level.price
          )
      )
      .sort(
        (first, second) =>
          first.price -
          second.price
      );

  if (
    validLevels.length === 0
  ) {
    return [];
  }

  const zones:
    PriceZone[] = [];

  let currentGroup:
    PriceLevel[] = [
      validLevels[0],
    ];

  for (
    let index = 1;
    index <
    validLevels.length;
    index += 1
  ) {
    const currentLevel =
      validLevels[index];

    /*
     * Compare with the developing
     * group centre—not merely the
     * previous price. This prevents
     * chain-merging unrelated levels
     * into one overly broad zone.
     */
    const groupCenter =
      getWeightedCenter(
        currentGroup
      );

    const difference =
      Math.abs(
        currentLevel.price -
        groupCenter
      ) /
      groupCenter;

    if (
      difference <= threshold
    ) {
      currentGroup.push(
        currentLevel
      );
    } else {
      zones.push(
        createZone(
          currentGroup,
          zoneType
        )
      );

      currentGroup = [
        currentLevel,
      ];
    }
  }

  zones.push(
    createZone(
      currentGroup,
      zoneType
    )
  );

  /*
   * Preserve price order. The
   * support/resistance analyzer will
   * rank eligible zones using their
   * strength, confidence, touches and
   * distance from current price.
   */
  return zones.sort(
    (first, second) =>
      first.center -
      second.center
  );
}