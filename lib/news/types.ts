export type NewsCategory =
  | "Company"
  | "Market"
  | "Sector"
  | "Economy"
  | "Global";

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
  |   "Guidance"
  | "Product Launch"

  // Brokerage research
  | "Brokerage Call"
  // Index changes
  | "Index Inclusion"
  | "Index Exclusion"
  | "Index Rebalance"

  // Market and economy
  | "Macro"
  | "Market Movement"

  | "Other";

export type Sentiment =
  | "Bullish"
  | "Bearish"
  | "Neutral"
  | "Mixed";

export type Impact =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export type ImpactDirection =
  | "Positive"
  | "Negative"
  | "Neutral"
  | "Mixed";

export type ImpactScope =
  | "Company"
  | "Sector"
  | "Index"
  | "Indian Market"
  | "Global Market";

export type ImpactHorizon =
  | "Immediate"
  | "Short Term"
  | "Medium Term"
  | "Structural";

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

  provider?: string;
  imageUrl?: string | null;
  language?: string;
}

export interface NewsEvent {
  articleId?: string;

  eventType: NewsEventType;

  confidence: number;

  explanation: string;

  matchedPhrases?: string[];
}

export interface SentimentResult {
  sentiment: Sentiment;

  score: number;

  confidence: number;

  explanation: string;
}

export interface ImpactResult {
  impact: Impact;

  score: number;

  explanation: string;
}

export interface ArticleImpact {
  direction: ImpactDirection;

  magnitude: Impact;

  scope: ImpactScope;

  horizon: ImpactHorizon;

  score: number;

  confidence: number;

  explanation: string;
}

export interface ArticleIntelligence {
  article: NewsArticle;

  eventTypes: NewsEventType[];

  primaryEvent: NewsEventType;

  sentiment: SentimentResult;

  impact: ArticleImpact;

  affectedCompanies: string[];

  affectedSectors: string[];

  affectedIndices: string[];

  whyItMatters: string;

  priorityScore: number;

  sourceReliability: number;

  freshnessScore: number;

  confirmationCount: number;

  clusterId: string;
}

export interface NewsCluster {
  id: string;

  primaryHeadline: string;

  primaryArticleId: string;

  articleIds: string[];

  sources: string[];

  publishedAt: string;

  primaryEvent: NewsEventType;

  affectedCompanies: string[];

  affectedSectors: string[];

  impactDirection:
    ImpactDirection;

  impactMagnitude: Impact;

  priorityScore: number;

  confirmationCount: number;
}

export interface SectorImpact {
  sector: string;

  direction: ImpactDirection;

  score: number;

  positiveEvents: number;

  negativeEvents: number;

  importantHeadlines: string[];

  affectedCompanies: string[];
}

export interface MarketBriefing {
  label:
    | "Positive"
    | "Cautious"
    | "Negative"
    | "Mixed"
    | "Neutral";

  score: number;

  confidence: number;

  headline: string;

  summary: string;

  keyPositives: string[];

  keyNegatives: string[];

  keyRisks: string[];

  opportunities: string[];

  generatedBy:
    | "STFL_RULE_ENGINE"
    | "AI_MODEL";

  generatedAt: string;
}

export interface NewsSummary {
  overallSentiment: Sentiment;

  keyPositives: string[];

  keyNegatives: string[];

  risks: string[];

  opportunities: string[];

  aiSummary: string;
}

export interface NewsEngineResult {
  articles: NewsArticle[];

  events: NewsEvent[];

  sentiment: SentimentResult;

  impact: ImpactResult;

  summary: NewsSummary;

  latestMarketNews: NewsArticle[];

  companyNews: NewsArticle[];

  sectorNews: NewsArticle[];

  globalNews: NewsArticle[];

  positiveNews: NewsArticle[];

  negativeNews: NewsArticle[];

  neutralNews: NewsArticle[];

  overallScore: number;

  intelligence?:
    ArticleIntelligence[];

  clusters?: NewsCluster[];

  marketBriefing?:
    MarketBriefing;

  sectorImpact?:
    SectorImpact[];

  whatMattersNow?:
    ArticleIntelligence[];

  engineVersion?: string;

  generatedAt?: string;
}