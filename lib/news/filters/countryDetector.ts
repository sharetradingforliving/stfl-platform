import { NewsArticle } from "../types";

const INDIAN_KEYWORDS = [

  "india",
  "indian",
  "nse",
  "bse",
  "sensex",
  "nifty",
  "bank nifty",
  "rbi",
  "sebi",
  "rupee",
  "fii",
  "dii",

];

const FOREIGN_ONLY = [

  "wall street",
  "nasdaq",
  "dow jones",
  "s&p 500",
  "ftse",
  "euro stoxx",
  "nikkei",
  "hang seng",

];

export function isIndianNews(
  article: NewsArticle
): boolean {

  const text =
    (
      article.headline +
      " " +
      article.summary
    ).toLowerCase();

  if (
    FOREIGN_ONLY.some(word => text.includes(word))
  ) {
    return false;
  }

  return INDIAN_KEYWORDS.some(word =>
    text.includes(word)
  );

}