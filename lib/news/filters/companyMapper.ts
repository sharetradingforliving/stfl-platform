import type { NewsArticle } from "../types";

// Keep aliases lowercase. Longer and more specific names should be preferred.
// This list can later be generated from the NSE instrument master/database.
export const INDIAN_COMPANY_ALIASES = [
  "reliance industries",
  "reliance",
  "tata consultancy services",
  "tcs",
  "infosys",
  "hdfc bank",
  "hdfc",
  "icici bank",
  "icici",
  "state bank of india",
  "state bank",
  "sbi",
  "axis bank",
  "kotak mahindra bank",
  "kotak bank",
  "kotak",
  "larsen and toubro",
  "larsen & toubro",
  "l&t",
  "lt",
  "bharat heavy electricals",
  "bhel",
  "bharat electronics",
  "bel",
  "coal india",
  "ongc",
  "ntpc",
  "power grid corporation",
  "power grid",
  "adani enterprises",
  "adani ports",
  "adani green",
  "adani power",
  "adani energy solutions",
  "adani",
  "tata motors",
  "tata steel",
  "tata power",
  "tata consumer",
  "tata communications",
  "tech mahindra",
  "mahindra & mahindra",
  "mahindra and mahindra",
  "maruti suzuki",
  "maruti",
  "bajaj finance",
  "bajaj finserv",
  "bajaj auto",
  "ultratech cement",
  "asian paints",
  "hindustan unilever",
  "hul",
  "itc",
  "sun pharma",
  "sun pharmaceutical",
  "cipla",
  "dr reddy's",
  "dr reddy",
  "wipro",
  "indusind bank",
  "jsw steel",
  "jsw energy",
  "vedanta",
  "hindalco",
  "hero motocorp",
  "eicher motors",
  "britannia industries",
  "nestle india",
  "itc limited",
  "bharti airtel",
  "airtel",
  "grasim industries",
  "apollo hospitals",
  "divi's laboratories",
  "divis labs",
  "aditya birla capital",
  "shriram finance",
  "sbi life",
  "hdfc life",
  "bajaj holdings",
  "trent limited",
  "avenue supermarts",
  "dmart",
  "zomato",
  "eternal limited",
  "jio financial",
  "interglobe aviation",
  "indigo",
  "siemens india",
  "abb india",
  "bosch india",
  "pidilite industries",
  "dabur india",
  "godrej consumer",
  "marico",
  "colgate palmolive india",
  "bank of baroda",
  "punjab national bank",
  "pnb",
  "canara bank",
  "union bank of india",
  "indian bank",
  "idfc first bank",
  "yes bank",
  "lic india",
  "life insurance corporation",
  "irctc",
  "irfc",
  "rvnl",
  "rail vikas nigam",
  "mazagon dock",
  "cochin shipyard",
  "hindustan aeronautics",
  "hal",
  "bharat dynamics",
  "nhpc",
  "rec limited",
  "pfc limited",
  "indian oil corporation",
  "ioc",
  "bharat petroleum",
  "bpcl",
  "hindustan petroleum",
  "hpcl",
] as const;

type NseCompanyIdentity = {
  companyName: string;
  symbol: string;
};

let nseCompanyMatchers: Array<{
  companyName: string;
  pattern: RegExp;
}> = [];

let nseTradingSymbols =
  new Set<string>();

function cleanCompanyName(
  companyName: string
): string {
  return companyName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(
      /\s+(limited|ltd|ltd\.|private limited|pvt ltd|pvt\. ltd\.)$/i,
      ""
    )
    .trim();
}

/**
 * Load the complete NSE equity universe
 * into the news company matcher.
 *
 * This is called once by newsEngine.ts.
 */
export function configureIndianCompanyUniverse(
  equities: readonly NseCompanyIdentity[]
): void {
  const companyNames =
    new Map<string, string>();

  const symbols =
    new Set<string>();

  for (const equity of equities) {
    const originalName =
      equity.companyName?.trim();

    const cleanedName =
      cleanCompanyName(
        equity.companyName ?? ""
      );

    const symbol =
      equity.symbol
        ?.trim()
        .toUpperCase();

    if (
      originalName &&
      originalName.length >= 3
    ) {
      companyNames.set(
        originalName.toLowerCase(),
        originalName
      );
    }

    if (
      cleanedName &&
      cleanedName.length >= 3
    ) {
      companyNames.set(
        cleanedName,
        originalName || cleanedName
      );
    }

    if (symbol) {
      symbols.add(symbol);
    }
  }

  nseCompanyMatchers =
    Array.from(
      companyNames.entries()
    ).map(
      ([
        alias,
        companyName,
      ]) => ({
        companyName,

        pattern: new RegExp(
          `(^|[^a-z0-9])${escapeRegExp(
            alias
          )}($|[^a-z0-9])`,
          "i"
        ),
      })
    );

  nseTradingSymbols = symbols;
}

const GENERIC_SYMBOLS = new Set([
  "",
  "MARKET",
  "GLOBAL",
  "GENERAL",
  "N/A",
  "NA",
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function containsExactPhrase(text: string, phrase: string): boolean {
  const escaped = escapeRegExp(phrase.trim().toLowerCase());
  if (!escaped) return false;

  // Letter/number boundaries avoid false matches such as "it" in "profit".
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

function articleText(article: NewsArticle): string {
  return `${article.headline ?? ""} ${article.summary ?? ""}`.toLowerCase();
}

export function findIndianCompanies(
  article: NewsArticle
): string[] {
  const text =
    articleText(article);

  const curatedMatches =
    INDIAN_COMPANY_ALIASES.filter(
      (company) =>
        containsExactPhrase(
          text,
          company
        )
    );

  const universeMatches =
    nseCompanyMatchers
      .filter((company) =>
        company.pattern.test(text)
      )
      .map(
        (company) =>
          company.companyName
      );

  return [
    ...new Set([
      ...curatedMatches,
      ...universeMatches,
    ]),
  ];
}

export function hasIndianTradingSymbol(
  article: NewsArticle
): boolean {
  const rawSymbol =
    (article.symbol ?? "")
      .trim()
      .toUpperCase();

  if (
    GENERIC_SYMBOLS.has(
      rawSymbol
    )
  ) {
    return false;
  }

  if (
    rawSymbol.endsWith(".NS") ||
    rawSymbol.endsWith(".BO")
  ) {
    return true;
  }

  const cleanSymbol =
    rawSymbol
      .replace(/\.NS$/, "")
      .replace(/\.BO$/, "");

  return nseTradingSymbols.has(
    cleanSymbol
  );
}
export function isIndianCompany(article: NewsArticle): boolean {
  return hasIndianTradingSymbol(article) || findIndianCompanies(article).length > 0;
}
