import { NewsArticle } from "../types";

const IMPORTANT_KEYWORDS = [

  // Indian Markets
  "nifty",
  "sensex",
  "bank nifty",
  "bse",
  "nse",
  "sebi",
  "rbi",

  // Economy
  "repo",
  "inflation",
  "gdp",
  "budget",
  "fii",
  "dii",

  // Commodities
  "crude",
  "oil",
  "gold",
  "silver",
  "usd",
  "rupee",

  // Corporate Actions
  "results",
  "earnings",
  "dividend",
  "bonus",
  "split",
  "buyback",
  "ipo",

  // Market
  "stock",
  "share",
  "market",
  "index",

  // Sectors
  "bank",
  "pharma",
  "auto",
  "it",
  "metal",
  "realty",
  "energy",

  // Large Indian Companies
  "reliance",
  "tcs",
  "infosys",
  "hdfc",
  "icici",
  "sbi",
  "l&t",
  "bhel",
  "bel",
  "hal",
  "tata",
  "adani",
  "mahindra",
  "bajaj"
];

const BLOCKED_KEYWORDS = [

  "spacex",
  "elon musk",
  "hollywood",
  "nba",
  "nfl",
  "celebrity",
  "movie",
  "football",
  "soccer",
  "fashion",
  "music",
  "netflix",
  "disney"

];

export function indianMarketFilter(
  articles: NewsArticle[]
): NewsArticle[] {

  return articles.filter(article => {

    const text =
      (
        article.headline +
        " " +
        article.summary
      ).toLowerCase();

    // Reject unwanted news

    if (
      BLOCKED_KEYWORDS.some(word =>
        text.includes(word)
      )
    ) {
      return false;
    }

    // Accept market related news

    return IMPORTANT_KEYWORDS.some(word =>
      text.includes(word)
    );

  });

}