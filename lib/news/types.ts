/**
 * ================================================================
 * STFL News & Sentiment Engine
 * File: types.ts
 * Purpose: Type definitions for News Intelligence Engine
 * ================================================================
 */

/**
 * News Category
 */
export type NewsCategory =
  | "Company"
  | "Market"
  | "Sector"
  | "Economy"
  | "Global";

/**
 * Event Type
 */
export type NewsEventType =
  | "Results"
  | "Dividend"
  | "Bonus"
  | "Split"
  | "Buyback"
  | "Merger"
  | "Acquisition"
  | "Order Win"
  | "Management"
  | "Promoter"
  | "Bulk Deal"
  | "Block Deal"
  | "FII Activity"
  | "DII Activity"
  | "Rating Upgrade"
  | "Rating Downgrade"
  | "Regulatory"
  | "Litigation"
  | "Guidance"
  | "Product Launch"
  | "Other";

/**
 * Sentiment
 */
export type Sentiment =
  | "Bullish"
  | "Bearish"
  | "Neutral";

/**
 * Impact
 */
export type Impact =
  | "Low"
  | "Medium"
  | "High";

/**
 * Raw News Article
 */
export interface NewsArticle {

  id: string;

  symbol: string;

  headline: string;

  summary: string;

  source: string;

  url: string;

  publishedAt: string;

  category: NewsCategory;

  marketRelevance: number;
}
/**
 * Classified Event
 */
export interface NewsEvent {

  eventType: NewsEventType;

  confidence: number;

  explanation: string;
}

/**
 * Sentiment Result
 */
export interface SentimentResult {

  sentiment: Sentiment;

  score: number;

  confidence: number;

  explanation: string;
}

/**
 * Impact Result
 */
export interface ImpactResult {

  impact: Impact;

  score: number;

  explanation: string;
}

/**
 * News Summary
 */
export interface NewsSummary {

  overallSentiment: Sentiment;

  keyPositives: string[];

  keyNegatives: string[];

  risks: string[];

  opportunities: string[];

  aiSummary: string;
}

/**
 * Final News Engine Result
 */
export interface NewsEngineResult {

  /**
   * Complete normalized news
   */
  articles: NewsArticle[];

  /**
   * Classified events
   */
  events: NewsEvent[];

  /**
   * Overall market sentiment
   */
  sentiment: SentimentResult;

  /**
   * Overall market impact
   */
  impact: ImpactResult;

  /**
   * AI Summary
   */
  summary: NewsSummary;

  /**
   * Dashboard Data
   */

  latestMarketNews: NewsArticle[];

  companyNews: NewsArticle[];

  sectorNews: NewsArticle[];

  globalNews: NewsArticle[];

  positiveNews: NewsArticle[];

  negativeNews: NewsArticle[];

  neutralNews: NewsArticle[];

  /**
   * Dashboard Score
   */
  overallScore: number;
}