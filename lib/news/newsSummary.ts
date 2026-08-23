/**
 * ================================================================
 * STFL News & Sentiment Engine
 * File: newsSummary.ts
 * Purpose: Generate investor-friendly news summary
 * ================================================================
 */

import {
  NewsArticle,
  NewsEvent,
  SentimentResult,
  ImpactResult,
  NewsSummary,
} from "./types";

/**
 * Generate summary
 */
export function generateNewsSummary(
  articles: NewsArticle[],
  events: NewsEvent[],
  sentiment: SentimentResult,
  impact: ImpactResult
): NewsSummary {

  const keyPositives: string[] = [];
  const keyNegatives: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  events.forEach(event => {

    switch (event.eventType) {

      case "Results":
        if (sentiment.sentiment === "Bullish")
          keyPositives.push("Strong quarterly results.");
        else
          keyNegatives.push("Weak quarterly results.");
        break;

      case "Dividend":
        opportunities.push("Dividend declared.");
        break;

      case "Bonus":
        opportunities.push("Bonus issue announced.");
        break;

      case "Buyback":
        opportunities.push("Share buyback announced.");
        break;

      case "Order Win":
        keyPositives.push("Major order secured.");
        break;

      case "Merger":
      case "Acquisition":
        opportunities.push("Strategic expansion through acquisition.");
        break;

      case "Regulatory":
      case "Litigation":
        risks.push("Regulatory or legal developments.");
        break;

      case "Rating Downgrade":
        risks.push("Brokerage downgrade.");
        break;

      case "Rating Upgrade":
        opportunities.push("Brokerage upgrade.");
        break;

      default:
        break;
    }

  });

  const aiSummary =
    `${sentiment.sentiment} news flow with ${impact.impact.toLowerCase()} expected market impact based on ${articles.length} recent article(s).`;

  return {

    overallSentiment: sentiment.sentiment,

    keyPositives,

    keyNegatives,

    risks,

    opportunities,

    aiSummary,

  };

}