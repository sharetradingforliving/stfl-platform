/**
 * ================================================================
 * STFL Investment Summary Engine
 * File: investmentSummaryEngine.ts
 * Purpose: Generate a unified research summary from all modules.
 * Version: 2.0
 * ================================================================
 */

import type { TechnicalResearchResult } from "@/lib/technical/types";

import { Recommendation, TrendDirection } from "@/lib/technical/types";

const TECHNICAL_DISCLAIMER =
  "This technical assessment is generated from price action, volume and historical market data. Support and resistance levels are analytical observations, not trade targets or stop-loss recommendations. It does not consider your financial objectives, investment horizon or risk profile. Please consult a SEBI-registered investment adviser or your financial adviser before making any investment or trading decision.";

/* ================================================================
 * OUTPUT TYPE
 * ================================================================ */

export interface InvestmentSummaryResult {
  pattern: TrendDirection;

  technicalBias: Recommendation;

  confidence: number;

  technicalScore: number;

  currentPrice: number;

  support1: number;

  support2: number | null;

  resistance1: number;

  resistance2: number | null;

  summary: string;

  strengths: {
    trend: string;
    momentum: string;
    volume: string;
  };

  risks: {
    supportResistance: string;
  };

  disclaimer: string;
}

function getDistinctSecondaryLevel(
  primaryLevel: number,
  secondaryLevel: number,
): number | null {
  if (!Number.isFinite(primaryLevel) || !Number.isFinite(secondaryLevel)) {
    return null;
  }

  const minimumDifference = Math.max(0.01, Math.abs(primaryLevel) * 0.0001);

  return Math.abs(primaryLevel - secondaryLevel) >= minimumDifference
    ? secondaryLevel
    : null;
}

/* ================================================================
 * INVESTMENT SUMMARY ENGINE
 * ================================================================ */

export function buildInvestmentSummary(
  technical: TechnicalResearchResult,
): InvestmentSummaryResult {
  const support1 = technical.supportResistance.immediateSupport;

  const support2 = getDistinctSecondaryLevel(
    support1,
    technical.supportResistance.majorSupport,
  );

  const resistance1 = technical.supportResistance.immediateResistance;

  const resistance2 = getDistinctSecondaryLevel(
    resistance1,
    technical.supportResistance.majorResistance,
  );

  return {
    pattern: technical.trend.direction,

    technicalBias: technical.technicalScore.recommendation,

    confidence: technical.technicalScore.confidence,

    technicalScore: technical.technicalScore.totalScore,

    currentPrice: technical.currentPrice,

    support1,

    support2,

    resistance1,

    resistance2,

    summary: technical.aiSummary,

    strengths: {
      trend: technical.trend.explanation,

      momentum: technical.momentum.explanation,

      volume: technical.volume.explanation,
    },

    risks: {
      supportResistance: technical.supportResistance.explanation,
    },

    disclaimer: TECHNICAL_DISCLAIMER,
  };
}
