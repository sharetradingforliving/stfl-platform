/**
 * ================================================================
 * STFL Technical Research Engine
 * File: riskReward.ts
 * Purpose: Risk Reward Analysis Module
 * ================================================================
 */

import {
  RiskRewardResult,
  SupportResistanceResult,
} from "./types";

/**
 * Analyze Risk / Reward
 */
export function analyzeRiskReward(
  currentPrice: number,
  supportResistance: SupportResistanceResult
): RiskRewardResult {

  const stopLoss = supportResistance.immediateSupport;

  const target = supportResistance.immediateResistance;

  const risk = currentPrice - stopLoss;
  const reward = target - currentPrice;

  const ratio =
    risk > 0 ? Number((reward / risk).toFixed(2)) : 0;

  let verdict = "Poor";

  if (ratio >= 3) {
    verdict = "Excellent";
  } else if (ratio >= 2) {
    verdict = "Good";
  } else if (ratio >= 1) {
    verdict = "Average";
  }

  return {
    stopLoss,

    target,

    risk,

    reward,

    ratio,

    verdict,

    confidence: 80,

    explanation:
      `Risk/Reward ratio is ${ratio}:1 (${verdict}).`,
  };
}