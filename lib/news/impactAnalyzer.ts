/**
 * ================================================================
 * STFL News & Sentiment Engine
 * File: impactAnalyzer.ts
 * Purpose: Estimate market impact of classified news events
 * ================================================================
 */

import {
  Impact,
  ImpactResult,
  NewsEvent,
} from "./types";

/**
 * Event impact scores
 */
const IMPACT_MAP: Record<
  NewsEvent["eventType"],
  { impact: Impact; score: number }
> = {
  Results: { impact: "High", score: 90 },
  Dividend: { impact: "Medium", score: 65 },
  Bonus: { impact: "High", score: 85 },
  Split: { impact: "Medium", score: 60 },
  Buyback: { impact: "High", score: 90 },
  Merger: { impact: "High", score: 95 },
  Acquisition: { impact: "High", score: 90 },
  "Order Win": { impact: "High", score: 85 },
  Management: { impact: "Medium", score: 60 },
  Promoter: { impact: "High", score: 80 },
  "Bulk Deal": { impact: "Medium", score: 55 },
  "Block Deal": { impact: "Medium", score: 55 },
  "FII Activity": { impact: "High", score: 80 },
  "DII Activity": { impact: "Medium", score: 60 },
  "Rating Upgrade": { impact: "Medium", score: 70 },
  "Rating Downgrade": { impact: "Medium", score: 70 },
  Regulatory: { impact: "High", score: 90 },
  Litigation: { impact: "High", score: 85 },
  Guidance: { impact: "Medium", score: 70 },
  "Product Launch": { impact: "Medium", score: 65 },
  Other: { impact: "Low", score: 30 },
};

/**
 * Analyze a single event
 */
export function analyzeImpact(
  event: NewsEvent
): ImpactResult {

  const result =
    IMPACT_MAP[event.eventType] ??
    IMPACT_MAP.Other;

  return {
    impact: result.impact,
    score: result.score,
    explanation: `${event.eventType} is classified as ${result.impact} impact.`,
  };
}

/**
 * Analyze multiple events
 */
export function analyzeOverallImpact(
  events: NewsEvent[]
): ImpactResult {

  if (events.length === 0) {
    return {
      impact: "Low",
      score: 0,
      explanation: "No news events available.",
    };
  }

  const impacts = events.map(analyzeImpact);

  const averageScore =
    impacts.reduce((sum, i) => sum + i.score, 0) /
    impacts.length;

  let impact: Impact = "Low";

  if (averageScore >= 75) {
    impact = "High";
  } else if (averageScore >= 50) {
    impact = "Medium";
  }

  return {
    impact,
    score: Math.round(averageScore),
    explanation: `Calculated from ${events.length} classified event(s).`,
  };
}