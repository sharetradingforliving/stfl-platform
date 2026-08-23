const NEWS_API_KEY = process.env.NEWSAPI_KEY;

if (!NEWS_API_KEY) {
  throw new Error("NEWSAPI_KEY is missing from .env.local");
}

console.log("====================================");
console.log("NEWSAPI Provider Loaded");
console.log("First 8 chars:", NEWS_API_KEY.substring(0, 8));
console.log("====================================");

export interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author?: string;
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  content?: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export async function fetchNewsApiNews(): Promise<NewsApiArticle[]> {

  const query = [
    "Nifty",
    "Sensex",
    "NSE",
    "BSE",
    "\"Indian Stock Market\"",
    "RBI",
    "SEBI",
    "IPO",
    "Dividend",
    "Bonus",
    "Buyback",
    "\"Quarterly Results\"",
    "\"Stock Split\"",
    "\"Bulk Deal\"",
    "\"Block Deal\"",
    "\"Bank Nifty\"",
    "\"Gift Nifty\"",
    "FII",
    "DII",
    "\"Crude Oil\"",
    "Rupee"
  ].join(" OR ");

  const url =
    "https://newsapi.org/v2/everything?" +
    `q=${encodeURIComponent(query)}` +
    "&language=en" +
    "&sortBy=publishedAt" +
    "&pageSize=100" +
    `&apiKey=${NEWS_API_KEY}`;

  console.log("====================================");
  console.log("NEWS API URL");
  console.log(url);
  console.log("====================================");

  const response = await fetch(url, {
    cache: "no-store",
  });

  console.log("HTTP Status:", response.status);
  console.log("HTTP Status Text:", response.statusText);

  if (!response.ok) {

    const errorText = await response.text();

    console.log("========== NEWS API ERROR ==========");
    console.log(errorText);
    console.log("====================================");

    throw new Error(
      `NewsAPI ${response.status}: ${errorText}`
    );
  }

  const data: NewsApiResponse = await response.json();

  console.log(
    `NewsAPI returned ${data.articles.length} articles`
  );

  return data.articles;
}