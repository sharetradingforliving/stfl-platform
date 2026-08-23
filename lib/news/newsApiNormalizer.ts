/**
 * ================================================================
 * STFL News Intelligence Engine
 * File: newsApiNormalizer.ts
 * Purpose: Normalize NewsAPI articles into STFL NewsArticle format
 * ================================================================
 */

import { NewsArticle } from "./types";
import { NewsApiArticle } from "./providers/newsApi";
import { classifyCategory } from "./categoryClassifier";
import { calculateMarketRelevance } from "./marketRelevance";

export function normalizeNewsApiNews(
  articles: NewsApiArticle[]
): NewsArticle[] {

  return articles.map((article, index) => {

    const newsArticle: NewsArticle = {

      id: `newsapi-${index}`,

      symbol: "",

      headline: article.title || "",

      summary: article.description || "",

      source: article.source?.name || "NewsAPI",

      url: article.url,

      publishedAt: article.publishedAt,

      category: "Global",

      marketRelevance: 0,

    };

    // Automatically classify category
    newsArticle.category =
      classifyCategory(newsArticle);

    // Calculate market relevance
    newsArticle.marketRelevance =
      calculateMarketRelevance(newsArticle);

    return newsArticle;

  });

}