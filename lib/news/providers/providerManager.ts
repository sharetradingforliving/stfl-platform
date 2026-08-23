import { fetchMarketNews as fetchFinnhubNews } from "./finnhub";
import {
  fetchNewsApiNews,
  NewsApiArticle,
} from "./newsApi";
import { FinnhubNewsArticle } from "./finnhub";

export interface ProviderNewsResult {

  finnhub: FinnhubNewsArticle[];

  newsApi: NewsApiArticle[];

}
export async function fetchAllNews(): Promise<ProviderNewsResult> {
  const [
    finnhub,
    newsApi,
] = await Promise.all([
    fetchFinnhubNews(),
    fetchNewsApiNews(),
]);

  return {
    finnhub,
    newsApi,
  };
}