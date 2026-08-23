/**
 * ================================================================
 * STFL Technical Research Engine
 * File: confluence.ts
 * Purpose: Merge nearby technical levels into support/resistance zones
 * ================================================================
 */

import { PriceLevel, PriceZone } from "./types";

const DEFAULT_ZONE_THRESHOLD = 0.005; // 0.5%

export function buildConfluenceZones(
  levels: PriceLevel[],
  zoneType: "Support" | "Resistance",
  threshold = DEFAULT_ZONE_THRESHOLD
): PriceZone[] {

  if (levels.length === 0) {
    return [];
  }

  // Sort price levels
  const sorted = [...levels].sort((a, b) => a.price - b.price);

  const zones: PriceZone[] = [];

  let currentGroup: PriceLevel[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {

    const previous = currentGroup[currentGroup.length - 1];
    const current = sorted[i];

    const difference =
      Math.abs(current.price - previous.price) / previous.price;

    if (difference <= threshold) {

      currentGroup.push(current);

    } else {

      zones.push(createZone(currentGroup, zoneType));

      currentGroup = [current];

    }

  }

  zones.push(createZone(currentGroup, zoneType));

  return zones;
}

function createZone(
  levels: PriceLevel[],
  zoneType: "Support" | "Resistance"
): PriceZone {

  const prices = levels.map(level => level.price);

  const lower = Math.min(...prices);

  const upper = Math.max(...prices);

  const center = (lower + upper) / 2;

  const strength = levels.reduce(
    (sum, level) => sum + level.weight,
    0
  );

  const confidence = Math.min(
    100,
    Math.round((strength / 15) * 100)
  );

  const explanation =
    `${zoneType} zone formed by ${levels
      .map(level => level.label)
      .join(", ")}.`;

  return {

    lower,

    upper,

    center,

    strength,

    confidence,

    touches: levels.length,

    contributors: levels,

    explanation,

    type: zoneType,
  };
}