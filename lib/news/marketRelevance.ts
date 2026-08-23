import { NewsArticle } from "./types";

const HIGH_PRIORITY = [
  "nifty",
  "sensex",
  "bank nifty",
  "gift nifty",
  "rbi",
  "sebi",
  "nse",
  "bse",
  "fii",
  "dii",
  "ipo",
  "results",
  "earnings",
  "dividend",
  "bonus",
  "buyback",
  "split",
  "bulk deal",
  "block deal",
  "order",
  "guidance",
];

const GLOBAL_MARKET = [
  "fed",
  "federal reserve",
  "ecb",
  "inflation",
  "interest rate",
  "crude",
  "brent",
  "wti",
  "gold",
  "silver",
  "usd",
  "rupee",
  "china",
];

const LOW_PRIORITY = [
  "war",
  "crime",
  "celebrity",
  "football",
  "movie",
  "weather",
  "tourism",
];

export function calculateMarketRelevance(
  article: NewsArticle
): number {

  const text =
    `${article.headline} ${article.summary}`.toLowerCase();

  let score = 0;

  HIGH_PRIORITY.forEach(keyword => {
    if (text.includes(keyword))
      score += 20;
  });

  GLOBAL_MARKET.forEach(keyword => {
    if (text.includes(keyword))
      score += 10;
  });

  LOW_PRIORITY.forEach(keyword => {
    if (text.includes(keyword))
      score -= 20;
  });

  return Math.max(0, Math.min(score,100));
}