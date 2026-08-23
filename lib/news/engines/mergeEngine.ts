import { NewsArticle } from "../types";

export function mergeNewsSources(
  ...sources: NewsArticle[][]
): NewsArticle[] {

  return sources.flat();

}