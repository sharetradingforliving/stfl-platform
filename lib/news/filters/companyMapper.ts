import { NewsArticle } from "../types";

const INDIAN_COMPANIES = [

  "reliance",
  "tcs",
  "infosys",
  "hdfc",
  "hdfc bank",
  "icici",
  "icici bank",
  "sbi",
  "state bank",
  "axis bank",
  "kotak",
  "lt",
  "l&t",
  "bhel",
  "bel",
  "hal",
  "coal india",
  "ongc",
  "ntpc",
  "power grid",
  "adani",
  "tata",
  "mahindra",
  "maruti",
  "bajaj",
  "ultratech",
  "asian paints",
  "hindustan unilever",
  "sun pharma",
  "cipla",
  "dr reddy",
  "wipro",
  "tech mahindra",
  "indusind",
  "jsw",
  "vedanta"

];

export function isIndianCompany(
  article: NewsArticle
): boolean {

  const text =
    (
      article.headline +
      " " +
      article.summary
    ).toLowerCase();

  return INDIAN_COMPANIES.some(company =>
    text.includes(company)
  );

}