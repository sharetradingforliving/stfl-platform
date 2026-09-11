import { fetchAllNews } from "./providers/providerManager";
import { normalizeFinnhubNews } from "./normalizer";
import { normalizeNewsApiNews } from "./newsApiNormalizer";
import { indianMarketFilter } from "./filters/indianMarketFilter";
import { configureIndianCompanyUniverse,  isIndianCompany,} from "./filters/companyMapper";
import { isIndianNews } from "./filters/countryDetector";
import { duplicateFilter } from "./filters/duplicateFilter";
import { mergeNewsSources } from "./engines/mergeEngine";
import { rankNews } from "./engines/rankingEngine";
import { buildInvestorIntelligence } from "./investorIntelligence";
import {
  getAllNseEquities,
} from "@/lib/market/allNseEquities";
import type {
  Impact,
  NewsArticle,
  NewsEngineResult,
  NewsEvent,
  NewsSummary,
  Sentiment,
  SentimentResult,
} from "./types";

const DASHBOARD_LIMIT = 10;

function uniqueArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = article.id || article.url || article.headline.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toOverallSentiment(
  label: "Positive" | "Negative" | "Neutral" | "Mixed" | "Cautious",
  score: number,
  confidence: number
): SentimentResult {
  const sentiment: Sentiment =
  label === "Positive"
    ? "Bullish"
    : label === "Negative"
      ? "Bearish"
      : label === "Cautious"
        ? "Neutral"
        : label;

  return {
    sentiment,
    score: Math.max(-100, Math.min(100, (score - 50) * 2)),
    confidence,
    explanation:
      "Calculated from the highest-priority, deduplicated news-event clusters.",
  };
}

function toOverallImpact(scores: number[]): {
  impact: Impact;
  score: number;
  explanation: string;
} {
  if (scores.length === 0) {
    return {
      impact: "Low",
      score: 0,
      explanation: "No classified news events are available.",
    };
  }

  const score = Math.round(
    scores.reduce((sum, value) => sum + value, 0) / scores.length
  );

  const impact: Impact =
    score >= 85
      ? "Critical"
      : score >= 65
        ? "High"
        : score >= 42
          ? "Medium"
          : "Low";

  return {
    impact,
    score,
    explanation: `Calculated from ${scores.length} high-priority event cluster(s).`,
  };
}

export async function runNewsEngine(): Promise<NewsEngineResult> {
  const [
    providers,
    nseUniverse,
  ] = await Promise.all([
    fetchAllNews(),
    getAllNseEquities(),
  ]);

  configureIndianCompanyUniverse(
    nseUniverse.equities
  );
  const finnhubArticles = normalizeFinnhubNews(providers.finnhub);
  const newsApiArticles = normalizeNewsApiNews(providers.newsApi);

  const mergedArticles = mergeNewsSources(
    finnhubArticles,
    newsApiArticles
  );

  const articles = rankNews(
    duplicateFilter(indianMarketFilter(mergedArticles))
  );

  const {
    intelligence,
    clusters,
    whatMattersNow,
    sectorImpact,
    marketBriefing,
  } = buildInvestorIntelligence(articles);

  const events: NewsEvent[] = intelligence.map((item) => ({
    eventType: item.primaryEvent,
    confidence: item.impact.confidence,
    explanation: item.whyItMatters,
  }));

  const sentiment = toOverallSentiment(
    marketBriefing.label,
    marketBriefing.score,
    marketBriefing.confidence
  );

  const impact = toOverallImpact(
    whatMattersNow.map((item) => item.impact.score)
  );

  const summary: NewsSummary = {
    overallSentiment: sentiment.sentiment,
    keyPositives: marketBriefing.keyPositives,
    keyNegatives: marketBriefing.keyNegatives,
    risks: marketBriefing.keyRisks,
    opportunities: marketBriefing.opportunities,
    aiSummary: marketBriefing.summary,
  };

  const priorityArticles = whatMattersNow.map((item) => item.article);

  let latestMarketNews = uniqueArticles(
    priorityArticles.filter(
      (article) =>
        isIndianNews(article) &&
        (article.category === "Market" || article.category === "Economy")
    )
  ).slice(0, DASHBOARD_LIMIT);

  if (latestMarketNews.length === 0) {
    latestMarketNews = priorityArticles.slice(0, DASHBOARD_LIMIT);
  }

  const companyNews = uniqueArticles(
    intelligence
      .filter(
        (item) =>
          item.article.category === "Company" &&
          isIndianCompany(item.article)
      )
      .map((item) => item.article)
  ).slice(0, DASHBOARD_LIMIT);

  const sectorNews = uniqueArticles(
    intelligence
      .filter((item) => item.affectedSectors.length > 0)
      .map((item) => item.article)
  ).slice(0, DASHBOARD_LIMIT);

  const globalNews = uniqueArticles(
    intelligence
      .filter((item) => item.article.category === "Global")
      .map((item) => item.article)
  ).slice(0, DASHBOARD_LIMIT);

  const positiveNews = intelligence
    .filter((item) => item.impact.direction === "Positive")
    .map((item) => item.article)
    .slice(0, DASHBOARD_LIMIT);

  const negativeNews = intelligence
    .filter((item) => item.impact.direction === "Negative")
    .map((item) => item.article)
    .slice(0, DASHBOARD_LIMIT);

  const neutralNews = intelligence
    .filter(
      (item) =>
        item.impact.direction === "Neutral" ||
        item.impact.direction === "Mixed"
    )
    .map((item) => item.article)
    .slice(0, DASHBOARD_LIMIT);

  if (process.env.NODE_ENV === "development") {
    console.log("===== STFL INVESTOR NEWS ENGINE =====");
    console.table({
      finnhub: finnhubArticles.length,
      newsApi: newsApiArticles.length,
      filteredArticles: articles.length,
      eventClusters: clusters.length,
      whatMattersNow: whatMattersNow.length,
      companyNews: companyNews.length,
      sectorNews: sectorNews.length,
      globalNews: globalNews.length,
    });
  }

  return {
    articles,
    events,
    sentiment,
    impact,
    summary,
    latestMarketNews,
    companyNews,
    sectorNews,
    globalNews,
    positiveNews,
    negativeNews,
    neutralNews,
    overallScore: marketBriefing.score,
    intelligence,
    clusters,
    marketBriefing,
    sectorImpact,
    whatMattersNow,
    engineVersion: "2.0.0",
    generatedAt: new Date().toISOString(),
  };
}