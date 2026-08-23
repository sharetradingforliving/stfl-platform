/**
 * ================================================================
 * STFL Investment Summary Engine
 * File: investmentSummaryEngine.ts
 * Purpose: Generate a unified investment summary from all research modules.
 * Version: 1.0
 * ================================================================
 */

import type { TechnicalResearchResult } from "@/lib/technical/types";
import {
  Recommendation,
  TrendDirection,
  EntryQuality,
} from "@/lib/technical/types";
const TECHNICAL_DISCLAIMER =
  "This recommendation is generated solely from technical analysis, price action, volume and historical market data. It does not consider your financial objectives, investment horizon or risk profile. Please consult a SEBI-registered investment adviser or your financial advisor before making any investment or trading decisions.";
/* ================================================================
 * OUTPUT TYPE
 * ================================================================
 */

export interface InvestmentSummaryResult {
  // Decision
  pattern: TrendDirection;
  recommendation: Recommendation;
  confidence: number;
  technicalScore: number;

  // Trade Plan
  currentPrice: number;

support: number;

resistance: number;

stopLoss: number;

target: number;

riskReward: number;

riskRewardVerdict: string;

  // Analysis
  entryQuality: EntryQuality;

  summary: string;

  strengths: {
    trend: string;
    momentum: string;
    volume: string;
  };

  risks: {
    supportResistance: string;
    riskReward: string;
  };

  disclaimer: string;
}
/* ================================================================
 * INVESTMENT SUMMARY ENGINE
 * ================================================================
 */

export function buildInvestmentSummary(
  technical: TechnicalResearchResult
): InvestmentSummaryResult {

      return {
  // Decision
  pattern: technical.trend.direction,

  recommendation: technical.technicalScore.recommendation,

  confidence: technical.technicalScore.confidence,

  technicalScore: technical.technicalScore.totalScore,

  // Trade Plan
  currentPrice: technical.currentPrice,

  support: technical.supportResistance.immediateSupport,

  resistance:
    technical.supportResistance.immediateResistance,

  stopLoss:
    technical.riskReward.stopLoss,

  target:
    technical.riskReward.target,

  riskReward:
    technical.riskReward.ratio,

  riskRewardVerdict:
    technical.riskReward.verdict,

    entryQuality: technical.entryQuality.quality,

    summary: technical.aiSummary,

    strengths: {
  trend: technical.trend.explanation,
  momentum: technical.momentum.explanation,
  volume: technical.volume.explanation,
},

risks: {
  supportResistance: technical.supportResistance.explanation,
  riskReward: technical.riskReward.explanation,
},
disclaimer: TECHNICAL_DISCLAIMER,
  };
}