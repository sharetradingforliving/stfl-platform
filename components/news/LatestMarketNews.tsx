import { NewsArticle } from "@/lib/news/types";
import NewsCard from "./NewsCard";

type LatestMarketNewsProps = {
  news: NewsArticle[];
};

export default function LatestMarketNews({
  news,
}: LatestMarketNewsProps) {
  return (
    <NewsCard
  title="Latest Market News"
  badge="LIVE"
  news={news}
  viewMoreLink="/news"
/>
  );
}