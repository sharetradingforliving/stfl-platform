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
 * Calculate Overall Technical Score
 */
export function calculateTechnicalScore(
  trend: TrendResult,
  momentum: MomentumResult,
  volume: VolumeResult,
  supportResistance: SupportResistanceResult,
  entryQuality: EntryQualityResult,
  riskReward: RiskRewardResult
): TechnicalScoreResult {
    
  const score = Math.round(
    (
      trend.score +
      momentum.score +
      volume.score +
      entryQuality.score
    ) / 4
  );

  let recommendation = Recommendation.HOLD;

  if (score >= 85) {
    recommendation = Recommendation.STRONG_BUY;
  } else if (score >= 70) {
    recommendation = Recommendation.BUY;
  } else if (score <= 25) {
    recommendation = Recommendation.STRONG_SELL;
  } else if (score <= 40) {
    recommendation = Recommendation.SELL;
  }

 return {
  totalScore: score,

  recommendation,

  confidence: score,

  breakdown: {
    trend: trend.score,
    momentum: momentum.score,
    volume: volume.score,
    supportResistance: supportResistance.confidence,
    volatility: 0,
    riskReward: riskReward.confidence,
  },

  explanation: `Overall Technical Score is ${score}/100 with ${recommendation} recommendation.`,
};
}