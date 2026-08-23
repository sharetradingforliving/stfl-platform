/**
 * ================================================================
 * STFL Technical Research Engine
 * File: dominantSwing.ts
 * Purpose: Identify Dominant Swing for Fibonacci Analysis
 * ================================================================
 */

import { SwingPoint } from "./swingDetector";

export interface DominantSwing {
  high: SwingPoint;
  low: SwingPoint;
  range: number;
}

export function findDominantSwing(
  swingHighs: SwingPoint[],
  swingLows: SwingPoint[]
): DominantSwing | null {

  if (swingHighs.length === 0 || swingLows.length === 0) {
    return null;
  }

  let best: DominantSwing | null = null;

  for (const high of swingHighs) {

    const previousLows = swingLows.filter(
      low => low.index < high.index
    );

    if (previousLows.length === 0) {
      continue;
    }

    const low = previousLows[previousLows.length - 1];

    const range = high.price - low.price;

    if (
      !best ||
      range > best.range
    ) {
      best = {
        high,
        low,
        range,
      };
    }

  }

  return best;
}