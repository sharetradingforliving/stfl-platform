const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY!;

export interface FinnhubNewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function fetchMarketNews(): Promise<FinnhubNewsArticle[]> {
  const response = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${API_KEY}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to fetch market news from Finnhub.");
  }

  return response.json();
}