/**
 * ================================================================
 * STFL Technical Research Engine
 * File: entryQuality.ts
 * Purpose: Entry Quality Analysis Module
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
 * Analyze Entry Quality
 */
export function analyzeEntryQuality(
  trend: TrendResult,
  momentum: MomentumResult,
  supportResistance: SupportResistanceResult
): EntryQualityResult {

  let score = 50;

  if (trend.score >= 80) {
    score += 20;
  }

  if (momentum.score >= 70) {
    score += 20;
  }

  if (supportResistance.breakoutProbability >= 70) {
    score += 10;
  }

  score = Math.min(score, 100);

  let quality = EntryQuality.AVERAGE;

  if (score >= 90) {
    quality = EntryQuality.EXCELLENT;
  } else if (score >= 75) {
    quality = EntryQuality.GOOD;
  } else if (score <= 40) {
    quality = EntryQuality.POOR;
  } else if (score <= 20) {
    quality = EntryQuality.AVOID;
  }

  return {
    quality,

    score,

    confidence: score,

    explanation:
      `Entry quality is ${quality} with a score of ${score}/100.`,
  };
}