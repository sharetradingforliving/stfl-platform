/**
 * ================================================================
 * STFL News & Sentiment Engine
 * File: sentiment.ts
 * Purpose: Analyze sentiment of news articles
 * ================================================================
 */

import {
  NewsArticle,
  Sentiment,
  SentimentResult,
} from "./types";

/**
 * Positive keywords
 */
const POSITIVE_KEYWORDS = [
  "profit",
  "growth",
  "record",
  "order",
  "contract",
  "expansion",
  "upgrade",
  "buy",
  "strong",
  "beat",
  "dividend",
  "bonus",
  "acquisition",
  "approval",
  "wins",
];

/**
 * Negative keywords
 */
const NEGATIVE_KEYWORDS = [
  "loss",
  "decline",
  "fall",
  "downgrade",
  "penalty",
  "fraud",
  "lawsuit",
  "default",
  "pledge",
  "warning",
  "miss",
  "regulatory",
  "investigation",
  "delay",
];

/**
 * Analyze sentiment for a single article
 */
export function analyzeSentiment(
  article: NewsArticle
): SentimentResult {

  const text =
    `${article.headline} ${article.summary}`.toLowerCase();

  let positive = 0;
  let negative = 0;

  POSITIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) positive++;
  });

  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) negative++;
  });

  let sentiment: Sentiment = "Neutral";
  let score = 0;

  if (positive > negative) {
    sentiment = "Bullish";
    score = Math.min(100, positive * 20);
  } else if (negative > positive) {
    sentiment = "Bearish";
    score = -Math.min(100, negative * 20);
  }

  return {
    sentiment,
    score,
    confidence: 80,
    explanation: `Positive keywords: ${positive}, Negative keywords: ${negative}.`,
  };
}

/**
 * Aggregate sentiment across multiple articles
 */
export function analyzeOverallSentiment(
  articles: NewsArticle[]
): SentimentResult {

  if (articles.length === 0) {
    return {
      sentiment: "Neutral",
      score: 0,
      confidence: 0,
      explanation: "No news articles available.",
    };
  }

  const results = articles.map(analyzeSentiment);

  const averageScore =
    results.reduce((sum, r) => sum + r.score, 0) /
    results.length;

  let sentiment: Sentiment = "Neutral";

  if (averageScore > 20) {
    sentiment = "Bullish";
  } else if (averageScore < -20) {
    sentiment = "Bearish";
  }

  return {
    sentiment,
    score: Math.round(averageScore),
    confidence: 85,
    explanation: `Calculated from ${articles.length} news article(s).`,
  };
}