import { fetchAllNews } from "./providers/providerManager";
import { normalizeFinnhubNews } from "./normalizer";
import { normalizeNewsApiNews } from "./newsApiNormalizer";
import { indianMarketFilter } from "./filters/indianMarketFilter";
import { isIndianCompany } from "./filters/companyMapper";
import { isIndianNews } from "./filters/countryDetector";
import { NewsArticle } from "./types";
import { NewsEngineResult } from "./types";
import { duplicateFilter } from "./filters/duplicateFilter";
import { mergeNewsSources } from "./engines/mergeEngine";
import { rankNews } from "./engines/rankingEngine";


import { classifyEvents } from "./eventClassifier";
import { analyzeOverallSentiment } from "./sentiment";
import { analyzeOverallImpact } from "./impactAnalyzer";
import { generateNewsSummary } from "./newsSummary";


export async function runNewsEngine(): Promise<NewsEngineResult> {

  // Fetch all providers
  const providers = await fetchAllNews();

  // Normalize news
  

const finnhubArticles =
  normalizeFinnhubNews(
    providers.finnhub
  );

const newsApiArticles =
  normalizeNewsApiNews(
    providers.newsApi
  );

const mergedArticles =
mergeNewsSources(

    finnhubArticles,

    newsApiArticles,

);

const filteredArticles =
duplicateFilter(
  indianMarketFilter(
    mergedArticles
  )
);

const articles =
rankNews(
  filteredArticles
);

console.log("===== PROVIDERS =====");

console.log(
  "Finnhub:",
  finnhubArticles.length
);

console.log(
  "NewsAPI:",
  newsApiArticles.length
);

console.log(
  "Combined:",
  articles.length
);

  // Intelligence
  const events = classifyEvents(articles);

  const sentiment = analyzeOverallSentiment(articles);

  const impact = analyzeOverallImpact(events);

  const summary = generateNewsSummary(
    articles,
    events,
    sentiment,
    impact
  );

 
  // Dashboard Data

const latestMarketNews = articles
  .filter(
    (article: NewsArticle) =>
      isIndianNews(article) &&
      (
        article.category === "Market" ||
        article.category === "Economy"
      )
  )
  .slice(0,10);

const companyNews = articles
  .filter(
    (article: NewsArticle) =>
      article.category === "Company" &&
      isIndianCompany(article)
  )
  .slice(0,10);
    
const sectorNews = [] as NewsArticle[];

const globalNews = articles.filter(
  (article: NewsArticle) => article.category === "Global"
);

// Fallback: if no Market/Economy news is available,
// show the latest news instead.
if (latestMarketNews.length === 0) {
  latestMarketNews.push(...articles.slice(0, 10));
}
  const positiveNews = articles.filter((article: NewsArticle, index: number) =>
    index < summary.keyPositives.length
  );

  const negativeNews = articles.filter((article: NewsArticle, index: number) =>
    index < summary.keyNegatives.length
  );

  const neutralNews = articles.filter(
    (article) =>
      !positiveNews.includes(article) &&
      !negativeNews.includes(article)
  );

  // ======================================================
// DEBUG (Development Only)
// ======================================================

if (process.env.NODE_ENV === "development") {

  console.log("==========================================");
  console.log("       STFL NEWS ENGINE DEBUG");
  console.log("==========================================");

  console.log("Providers");

  console.log(
    "Finnhub Articles :",
    finnhubArticles.length
  );

  console.log(
    "NewsAPI Articles :",
    newsApiArticles.length
  );

  console.log("");

  console.log(
    "Articles After Merge & Filter :",
    articles.length
  );

  console.log("");

  console.log("Top 10 Articles");

  console.table(
    articles.slice(0, 10).map((article) => ({
      Headline: article.headline,
      Source: article.source,
      Category: article.category,
      Relevance: article.marketRelevance,
      Published: article.publishedAt,
    }))
  );

  console.log("");

  console.log("Dashboard");

  console.log(
    "Latest Market News :",
    latestMarketNews.length
  );

  console.log(
    "Company News :",
    companyNews.length
  );

  console.log(
    "Sector News :",
    sectorNews.length
  );

  console.log(
    "Global News :",
    globalNews.length
  );

  console.log("");

  console.log("==========================================");
}
  console.log("===== FINAL NEWS ENGINE =====");

console.log({
  latestMarketNews: latestMarketNews.length,
  companyNews: companyNews.length,
  sectorNews: sectorNews.length,
  globalNews: globalNews.length,
  positiveNews: positiveNews.length,
  negativeNews: negativeNews.length,
});

  return {

    articles,

    events,

    sentiment,

    impact,

    summary,

    latestMarketNews,

    companyNews,

    sectorNews,

    globalNews,

    positiveNews,

    negativeNews,

    neutralNews,

    overallScore:
      Math.round(
        (
          sentiment.score +
          impact.score
        ) / 2
      ),
  };
}