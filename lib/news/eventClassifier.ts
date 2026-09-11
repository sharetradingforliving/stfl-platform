/**
 * ================================================================
 * STFL News & Sentiment Engine
 * File: eventClassifier.ts
 * Purpose: Identify the type of event from a news article
 * ============================================================================
 */

import {
  NewsArticle,
  NewsEvent,
  NewsEventType,
} from "./types";

/**
 * Keywords for event classification
 */
const EVENT_KEYWORDS: Record<NewsEventType, string[]> = {
  Results: ["result", "earnings", "quarter", "q1", "q2", "q3", "q4", "profit", "loss"],
  Dividend: ["dividend", "interim dividend", "final dividend"],
  Bonus: ["bonus issue", "bonus shares"],
  Split: ["stock split", "split"],
  Buyback: ["buyback", "share buyback"],
  Merger: ["merger", "merge"],
  Acquisition: ["acquisition", "acquire", "takeover"],
  "Order Win": ["order", "contract", "deal", "wins project"],
  Management: ["ceo", "cfo", "director", "management", "appointment", "resignation"],
  Promoter: ["promoter", "pledge", "stake sale", "stake increase"],
  "Bulk Deal": ["bulk deal"],
  "Block Deal": ["block deal"],
  "FII Activity": ["fii", "foreign institutional investor"],
  "DII Activity": ["dii", "domestic institutional investor"],
  "Rating Upgrade": ["upgrade", "buy rating", "outperform"],
  "Rating Downgrade": ["downgrade", "sell rating", "underperform"],
  Regulatory: ["sebi", "regulation", "penalty", "notice"],
  Litigation: ["court", "lawsuit", "litigation"],
  Guidance: ["guidance", "outlook", "forecast"],
  "Product Launch": ["launch", "introduces", "new product"],
    "Brokerage Call": [
    "brokerage",
    "broker call",
    "research call",
    "target price",
    "price target",
    "initiates coverage",
    "maintains rating",
    "reiterates rating",
  ],

  "Index Inclusion": [
    "index inclusion",
    "included in index",
    "added to index",
    "index addition",
    "to enter index",
  ],

  "Index Exclusion": [
    "index exclusion",
    "excluded from index",
    "removed from index",
    "index deletion",
    "to exit index",
  ],

  "Index Rebalance": [
    "index rebalance",
    "index rebalancing",
    "index reshuffle",
    "index revision",
    "constituent changes",
  ],

  Macro: [
    "inflation",
    "gdp",
    "interest rate",
    "repo rate",
    "rbi policy",
    "monetary policy",
    "fiscal policy",
    "trade deficit",
    "economic growth",
  ],

  "Market Movement": [
    "market rises",
    "market falls",
    "market rally",
    "market decline",
    "stocks rise",
    "stocks fall",
    "sensex gains",
    "sensex falls",
    "nifty gains",
    "nifty falls",
  ],
  Other: [],
};

/**
 * Classify a single news article
 */
export function classifyEvent(
  article: NewsArticle
): NewsEvent {

  const text =
    `${article.headline} ${article.summary}`.toLowerCase();

  for (const [eventType, keywords] of Object.entries(EVENT_KEYWORDS)) {

    if (
      keywords.some(keyword => text.includes(keyword))
    ) {
      return {
        eventType: eventType as NewsEventType,
        confidence: 90,
        explanation: `Matched keywords for ${eventType}.`,
      };
    }
  }

  return {
    eventType: "Other",
    confidence: 50,
    explanation: "No matching event keywords found.",
  };
}

/**
 * Classify multiple articles
 */
export function classifyEvents(
  articles: NewsArticle[]
): NewsEvent[] {

  return articles.map(classifyEvent);
}