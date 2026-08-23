/**
 * ================================================================
 * STFL Technical Research Engine
 * File: technicalEngine.ts
 * Purpose: Main Technical Research Engine
 * ================================================================
 */

import {
  TechnicalResearchInput,
  TechnicalResearchResult,
} from "./types";

import { analyzeTrend } from "./trend";
import { analyzeMomentum } from "./momentum";
import { analyzeVolume } from "./volume";
import { analyzeSupportResistance } from "./supportResistance";
import { analyzeEntryQuality } from "./entryQuality";
import { analyzeRiskReward } from "./riskReward";
import { calculateTechnicalScore } from "./technicalScore";

/**
 * Execute complete technical analysis
 */
export function runTechnicalAnalysis(
  input: TechnicalResearchInput
): TechnicalResearchResult {

  // Step 1: Trend
  const trend = analyzeTrend(input);

  // Step 2: Momentum
  const momentum = analyzeMomentum(input);

  // Step 3: Volume
  const volume = analyzeVolume(input);

  // Step 4: Support & Resistance
  const supportResistance =
    analyzeSupportResistance(input);

  // Step 5: Entry Quality
  const entryQuality =
    analyzeEntryQuality(
      trend,
      momentum,
      supportResistance
    );

  // Step 6: Risk / Reward
  const riskReward =
    analyzeRiskReward(
      input.currentPrice,
      supportResistance
    );

  // Step 7: Overall Technical Score
  const technicalScore =
    calculateTechnicalScore(
  trend,
  momentum,
  volume,
  supportResistance,
  entryQuality,
  riskReward
);

  return {
  symbol: input.symbol,

  currentPrice: input.currentPrice,

  generatedAt: new Date().toISOString(),

  trend,

  momentum,

  volume,

  supportResistance,

  entryQuality,

  riskReward,

  technicalScore,

  aiSummary:
    "AI summary will be generated in Sprint 6.",
};
}