import { NewsArticle } from "../types";

export function duplicateFilter(
  articles: NewsArticle[]
): NewsArticle[] {

  const seen = new Set<string>();

  return articles.filter((article) => {

    const key = article.headline
      .trim()
      .toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;

  });

}