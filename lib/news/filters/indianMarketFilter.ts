import type { NewsArticle } from "../types";

import {
  containsExactPhrase,
  findIndianCompanies,
  hasIndianTradingSymbol,
} from "./companyMapper";

const STRONG_INDIA_TERMS = [
  "india",
  "indian",
  "indian market",
  "indian stock market",
  "indian equities",
  "indian shares",
  "dalal street",

  "nifty",
  "nifty 50",
  "bank nifty",
  "gift nifty",
  "sensex",
  "india vix",

  "nse",
  "nse india",
  "national stock exchange",

  "bse",
  "bse india",
  "bombay stock exchange",

  "sebi",
  "securities and exchange board of india",

  "rbi",
  "reserve bank of india",

  "fii",
  "dii",
  "foreign portfolio investors",
  "foreign institutional investors",
  "domestic institutional investors",

  "rupee",
  "usd/inr",
];

const MARKET_INFRASTRUCTURE_TERMS = [
  "groww",
  "zerodha",
  "upstox",
  "angel one",
  "motilal oswal",
  "icici securities",
  "hdfc securities",
  "kotak securities",
  "sbi securities",

  "nsdl",
  "cdsl",
  "depository",
  "depository participant",

  "stockbroker",
  "stock broker",
  "brokerage platform",
  "discount broker",

  "indian exchange",
  "indian exchanges",
  "stock exchange",
  "clearing corporation",
  "clearing member",

  "market infrastructure institution",
  "market infrastructure institutions",

  "investor protection fund",
  "investor eligibility",
  "trading member",
  "demat account",
  "demat accounts",
];

const INDIAN_ECONOMY_TERMS = [
  "union budget",
  "india gdp",
  "indian economy",
  "india inflation",
  "india cpi",
  "india wpi",
  "repo rate",
  "gst collection",
  "monetary policy committee",
  "economic survey",
  "fiscal deficit",
];

const CORPORATE_EVENT_TERMS = [
  "quarterly results",
  "financial results",
  "net profit",
  "net loss",
  "earnings",
  "dividend",
  "bonus issue",
  "stock split",
  "share split",
  "buyback",
  "ipo",
  "initial public offering",
  "order win",
  "wins order",
  "bags order",
  "merger",
  "acquisition",
  "bulk deal",
  "block deal",
];

const TECHNICAL_MARKET_TERMS = [
  "technical view",
  "technical outlook",
  "market outlook",
  "nifty outlook",
  "bank nifty outlook",
  "support level",
  "resistance level",
  "moving average",
  "market breadth",
  "advance decline",
  "volatility",
  "vix spikes",
  "vix rises",
  "vix falls",
  "market correction",
  "market rally",
];

const GLOBAL_CUE_TERMS = [
  "s&p 500",
  "nasdaq",
  "dow jones",
  "nikkei 225",
  "hang seng",
  "ftse 100",

  "dollar index",
  "dxy",
  "federal reserve",
  "fed rate",
  "us inflation",
  "us jobs data",
  "us treasury yield",
  "us 10-year yield",

  "brent crude",
  "wti crude",
  "opec",

  "ecb rate",
  "bank of japan",
  "china economy",
];

const BROKERAGE_NAMES = [
  "jefferies",
  "morgan stanley",
  "goldman sachs",
  "jpmorgan",
  "clsa",
  "nomura",
  "ubs",
  "citi",
  "macquarie",
  "bernstein",
  "hsbc",
  "motilal oswal",
  "icici securities",
  "kotak institutional equities",
  "axis securities",
  "nuvama",
  "emkay",
  "jm financial",
];

const BROKERAGE_ACTIONS = [
  "rating upgrade",
  "rating downgrade",
  "upgrades",
  "downgrades",
  "maintains buy",
  "maintains hold",
  "maintains sell",
  "reiterates buy",
  "reiterates hold",
  "reiterates sell",
  "overweight",
  "underweight",
  "target price",
  "price target",
  "initiates coverage",
  "initiated coverage",
];

const INDEX_CHANGE_TERMS = [
  "index inclusion",
  "index exclusion",
  "index rebalance",
  "index rebalancing",
  "index reshuffle",
  "index addition",
  "index deletion",
  "included in the index",
  "excluded from the index",
  "added to the index",
  "removed from the index",
  "msci inclusion",
  "msci exclusion",
  "ftse inclusion",
  "ftse exclusion",
  "nifty inclusion",
  "nifty exclusion",
  "weight increase",
  "weight reduction",
  "passive inflows",
  "passive outflows",
];

const BLOCKED_TERMS = [
  "online casino",
  "casino bonus",
  "sports betting",
  "real money sites",

  "celebrity gossip",
  "hollywood",
  "bollywood gossip",
  "movie review",
  "music video",
  "netflix series",

  "nba",
  "nfl",
  "football match",
  "soccer match",

  "rc airplane",
  "gaming guide",
  "coupon code",
  "promo code",
];

function articleText(
  article: NewsArticle
): string {
  return `${article.headline ?? ""} ${
    article.summary ?? ""
  }`.toLowerCase();
}

function countMatches(
  text: string,
  terms: readonly string[]
): number {
  return terms.reduce(
    (count, term) =>
      count +
      (
        containsExactPhrase(text, term)
          ? 1
          : 0
      ),
    0
  );
}

export function indianMarketFilter(
  articles: NewsArticle[]
): NewsArticle[] {
  return articles.filter((article) => {
    const text = articleText(article);

    if (
      countMatches(
        text,
        BLOCKED_TERMS
      ) > 0
    ) {
      return false;
    }

    const companyMatches =
      findIndianCompanies(article).length;

    const hasIndianSymbol =
      hasIndianTradingSymbol(article);

    const indiaMatches =
      countMatches(
        text,
        STRONG_INDIA_TERMS
      );

    const infrastructureMatches =
      countMatches(
        text,
        MARKET_INFRASTRUCTURE_TERMS
      );

    const economyMatches =
      countMatches(
        text,
        INDIAN_ECONOMY_TERMS
      );

    const corporateMatches =
      countMatches(
        text,
        CORPORATE_EVENT_TERMS
      );

    const technicalMatches =
      countMatches(
        text,
        TECHNICAL_MARKET_TERMS
      );

    const globalCueMatches =
      countMatches(
        text,
        GLOBAL_CUE_TERMS
      );

          const brokerageMatches =
      countMatches(
        text,
        BROKERAGE_NAMES
      );

    const brokerageActionMatches =
      countMatches(
        text,
        BROKERAGE_ACTIONS
      );

    const indexChangeMatches =
      countMatches(
        text,
        INDEX_CHANGE_TERMS
      );

    /*
     * A recognized Indian company or explicit
     * NSE/BSE symbol is strong evidence.
     */
    if (
      hasIndianSymbol ||
      companyMatches > 0
    ) {
      return true;
    }

    /*
     * Direct Indian-market, exchange,
     * regulatory or economic evidence.
     */
    if (
      indiaMatches > 0 ||
      economyMatches > 0
    ) {
      return true;
    }

    /*
     * Broker and market-infrastructure stories
     * are relevant when at least one recognized
     * intermediary/infrastructure term exists.
     */
    if (infrastructureMatches > 0) {
      return true;
    }

    /*
     * Technical stories require Indian-market
     * context to avoid accepting generic
     * overseas trading commentary.
     */
    if (
      technicalMatches > 0 &&
      indiaMatches > 0
    ) {
      return true;
    }

    /*
     * Corporate language alone is too broad.
     * It must be linked to India, an Indian
     * company or an Indian symbol.
     */
    if (
      corporateMatches > 0 &&
      (
        indiaMatches > 0 ||
        companyMatches > 0 ||
        hasIndianSymbol
      )
    ) {
      return true;
    }

    /*
     * Preserve recognized international cues
     * only when the normalizer classified the
     * article as Global.
     */
    if (
      article.category === "Global" &&
      globalCueMatches > 0
    ) {
      return true;
    }

        /*
     * Require both a recognised brokerage
     * and a clear research action. This
     * avoids accepting clickbait articles
     * that merely contain the word "buy".
     */
    if (
      brokerageMatches > 0 &&
      brokerageActionMatches > 0
    ) {
      return true;
    }

    /*
     * Index inclusion, exclusion and
     * rebalancing can cause passive-fund
     * buying or selling.
     */
        /*
     * Index-change stories must also have
     * clear Indian-market or Indian-company
     * evidence. This blocks unrelated global
     * MSCI changes such as MSTR exclusions.
     */
    if (
      indexChangeMatches > 0 &&
      (
        indiaMatches > 0 ||
        companyMatches > 0 ||
        hasIndianSymbol
      )
    ) {
      return true;
    }

    return false;
  });
}