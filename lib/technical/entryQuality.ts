/**
 * ================================================================
 * STFL Technical Research Engine
 * File: entryQuality.ts
 * Purpose: Entry Readiness Analysis Module
 * ================================================================
 */

import {
  EntryQuality,
  EntryQualityResult,
  MomentumResult,
  SupportResistanceResult,
  TrendResult,
} from "./types";

/**
 * Analyse entry readiness using trend, momentum
 * and breakout confirmation.
 */
export function analyzeEntryQuality(
  trend: TrendResult,
  momentum: MomentumResult,
  supportResistance: SupportResistanceResult
): EntryQualityResult {
  let score = 50;

  /*
   * Trend contribution
   */
  if (trend.score >= 70) {
    score += 20;
  } else if (trend.score <= 40) {
    score -= 20;
  }

  /*
   * Momentum contribution
   */
  if (momentum.score >= 65) {
    score += 20;
  } else if (momentum.score <= 40) {
    score -= 20;
  }

  /*
   * Breakout confirmation
   */
  if (
    supportResistance.breakoutProbability >= 70
  ) {
    score += 10;
  } else if (
    supportResistance.breakoutProbability <= 30
  ) {
    score -= 10;
  }

  score = Math.max(
    0,
    Math.min(score, 100)
  );

  let quality = EntryQuality.WAIT;

  if (score >= 75) {
    quality = EntryQuality.FAVORABLE;
  } else if (score >= 60) {
    quality = EntryQuality.WATCH;
  } else if (score < 40) {
    quality = EntryQuality.AVOID;
  }

  return {
    quality,
    score,
    confidence: score,
    explanation:
      `Entry readiness is ${quality} with a score of ${score}/100.`,
  };
}