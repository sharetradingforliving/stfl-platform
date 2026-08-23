import { NewsArticle } from "./types";

export type NewsCategory =
  | "Market"
  | "Company"
  | "Sector"
  | "Global"
  | "Economy";

const MARKET_KEYWORDS = [
  "nifty",
  "sensex",
  "bank nifty",
  "gift nifty",
  "stock market",
  "market",
  "bse",
  "nse",
];

const ECONOMY_KEYWORDS = [
  "rbi",
  "repo rate",
  "inflation",
  "gdp",
  "budget",
  "fiscal",
  "monetary policy",
  "cpi",
  "wpi",
];

const GLOBAL_KEYWORDS = [
  "fed",
  "nasdaq",
  "dow",
  "s&p",
  "china",
  "japan",
  "europe",
  "global",
  "us treasury",
  "ecb",
];

const SECTOR_KEYWORDS = [
  "banking",
  "pharma",
  "metal",
  "automobile",
  "auto sector",
  "fmcg",
  "realty",
  "energy",
  "defence",
  "telecom",
  "capital goods",
];

function containsKeyword(
  text: string,
  keywords: string[]
): boolean {
  return keywords.some((keyword) =>
    text.includes(keyword)
  );
}

export function classifyCategory(
  article: NewsArticle
): NewsCategory {

  const text =
    `${article.headline} ${article.summary}`.toLowerCase();

  if (containsKeyword(text, MARKET_KEYWORDS))
    return "Market";

  if (containsKeyword(text, ECONOMY_KEYWORDS))
    return "Economy";

  if (containsKeyword(text, GLOBAL_KEYWORDS))
    return "Global";

  if (containsKeyword(text, SECTOR_KEYWORDS))
    return "Sector";

  return "Company";
}