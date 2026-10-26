/**
 * ================================================================
 * STFL Technical Research Engine
 * File: technicalScore.ts
 * Purpose: Overall Technical Score Calculation
 * ================================================================
 */

import {
  EntryQualityResult,
  Recommendation,
  TechnicalScoreResult,
  TrendResult,
  MomentumResult,
  VolumeResult,
  SupportResistanceResult,
  RiskRewardResult,
} from "./types";

/**
 * Calculate the overall research score.
 *
 * Entry quality and risk/reward are retained
 * in the engine for a future tracked-trades
 * module, but they do not influence the
 * public technical-research score.
 */
export function calculateTechnicalScore(
  trend: TrendResult,
  momentum: MomentumResult,
  volume: VolumeResult,
  supportResistance: SupportResistanceResult,
  _entryQuality: EntryQualityResult,
  _riskReward: RiskRewardResult,
): TechnicalScoreResult {
  const score = Math.round(
    (trend.score +
      momentum.score +
      volume.score +
      supportResistance.confidence) /
      4,
  );

  let technicalBias = Recommendation.HOLD;

  if (score >= 85) {
    technicalBias = Recommendation.STRONG_BUY;
  } else if (score >= 70) {
    technicalBias = Recommendation.BUY;
  } else if (score <= 25) {
    technicalBias = Recommendation.STRONG_SELL;
  } else if (score <= 40) {
    technicalBias = Recommendation.SELL;
  }

  return {
    totalScore: score,

    /*
     * Keep the existing internal property
     * name for backward compatibility. The
     * public UI presents it as Technical Bias.
     */
    recommendation: technicalBias,

    confidence: score,

    breakdown: {
      trend: trend.score,

      momentum: momentum.score,

      volume: volume.score,

      supportResistance: supportResistance.confidence,

      volatility: 0,

      /*
       * Retained only to preserve the shared
       * result contract. It no longer affects
       * the public score.
       */
      riskReward: 0,
    },

    explanation: `Overall Technical Score is ${score}/100 with ${technicalBias.replace(
      /_/g,
      " ",
    )} technical bias.`,
  };
}
