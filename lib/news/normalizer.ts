import { FinnhubNewsArticle } from "./providers/finnhub";
import { NewsArticle } from "./types";
import { classifyCategory } from "./categoryClassifier";
import { calculateMarketRelevance } from "./marketRelevance";

export function normalizeFinnhubNews(
  articles: FinnhubNewsArticle[]
): NewsArticle[] {
  return articles.map((article) => {
    const newsArticle: NewsArticle = {
      marketRelevance: 0,
      id: article.id.toString(),
      symbol: article.related || "",
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      category: "Global", // Temporary value
    };

    // Automatically classify the category
    newsArticle.category = classifyCategory(newsArticle);
    newsArticle.marketRelevance =
  calculateMarketRelevance(newsArticle);

    return newsArticle;
  });
}