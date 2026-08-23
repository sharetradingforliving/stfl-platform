import { NewsArticle } from "../types";

export function rankNews(
  articles: NewsArticle[]
): NewsArticle[] {

  return [...articles].sort(
    (a, b) =>
      b.marketRelevance -
      a.marketRelevance
  );

}