import { XMLParser } from "fast-xml-parser";

const NEWS_API_KEY =
  process.env.NEWSAPI_KEY;

export interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };

  author?: string | null;

  title: string;

  description?: string | null;

  url: string;

  urlToImage?: string | null;

  publishedAt: string;

  content?: string | null;
}

interface NewsApiResponse {
  status: string;

  totalResults: number;

  articles: NewsApiArticle[];

  code?: string;

  message?: string;
}

interface GoogleRssSource {
  "#text"?: string;

  "@_url"?: string;
}

interface GoogleRssItem {
  title?: string;

  link?: string;

  pubDate?: string;

  description?: string;

  source?:
    | string
    | GoogleRssSource;
}

interface GoogleRssResponse {
  rss?: {
    channel?: {
      item?:
        | GoogleRssItem
        | GoogleRssItem[];
    };
  };
}

const GOOGLE_NEWS_QUERIES = [
  /*
   * Current index and technical-market news.
   */
  [
    "(",
    "Nifty",
    "OR",
    "Sensex",
    "OR",
    '"Bank Nifty"',
    "OR",
    '"India VIX"',
    "OR",
    '"GIFT Nifty"',
    ")",
    "when:2d",
  ].join(" "),

  /*
   * Exchanges, regulators, brokers
   * and market infrastructure.
   */
  [
    "(",
    "NSE",
    "OR",
    "BSE",
    "OR",
    "SEBI",
    "OR",
    "RBI",
    "OR",
    "Groww",
    "OR",
    "Zerodha",
    "OR",
    "Upstox",
    "OR",
    "NSDL",
    "OR",
    "CDSL",
    ")",
    "India",
    "when:3d",
  ].join(" "),

  /*
   * Indian companies, IPOs and
   * corporate developments.
   */
  [
    "(",
    '"Indian stock market"',
    "OR",
    '"Indian shares"',
    "OR",
    '"Indian equities"',
    "OR",
    '"India IPO"',
    "OR",
    '"India dividend"',
    "OR",
    '"India buyback"',
    "OR",
    '"India quarterly results"',
    "OR",
    '"India order win"',
    ")",
    "when:3d",
  ].join(" "),
    /*
   * Brokerage recommendations,
   * upgrades, downgrades and targets.
   */
  [
    "(",
    "Jefferies",
    "OR",
    '"Morgan Stanley"',
    "OR",
    '"Goldman Sachs"',
    "OR",
    "JPMorgan",
    "OR",
    "CLSA",
    "OR",
    "Nomura",
    "OR",
    "UBS",
    "OR",
    "Citi",
    "OR",
    "Macquarie",
    "OR",
    "Bernstein",
    "OR",
    "HSBC",
    "OR",
    '"Motilal Oswal"',
    "OR",
    '"ICICI Securities"',
    "OR",
    '"Kotak Institutional Equities"',
    "OR",
    '"Axis Securities"',
    "OR",
    "Nuvama",
    "OR",
    "Emkay",
    "OR",
    '"JM Financial"',
    ")",
    "(",
    "India",
    "OR",
    "Indian",
    "OR",
    "NSE",
    "OR",
    "BSE",
    ")",
    "(",
    "upgrade",
    "OR",
    "downgrade",
    "OR",
    "buy",
    "OR",
    "sell",
    "OR",
    "overweight",
    "OR",
    "underweight",
    "OR",
    '"target price"',
    "OR",
    '"initiates coverage"',
    ")",
    "when:3d",
  ].join(" "),

  /*
   * Index inclusions, exclusions
   * and periodic rebalancing.
   */
  [
    "(",
    "MSCI",
    "OR",
    '"FTSE Russell"',
    "OR",
    '"Nifty 50"',
    "OR",
    '"Nifty Next 50"',
    "OR",
    '"Nifty Midcap"',
    "OR",
    '"Nifty Smallcap"',
    "OR",
    "Sensex",
    "OR",
    '"BSE index"',
    ")",
    "(",
    "inclusion",
    "OR",
    "included",
    "OR",
    "addition",
    "OR",
    "exclusion",
    "OR",
    "excluded",
    "OR",
    "deletion",
    "OR",
    "rebalance",
    "OR",
    "rebalancing",
    "OR",
    '"weight increase"',
    "OR",
    '"weight reduction"',
    ")",
    "India",
    "when:7d",
  ].join(" "),
];

function decodeHtml(
  value: string
): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractGoogleSource(
  source:
    | string
    | GoogleRssSource
    | undefined
): string {
  if (typeof source === "string") {
    return source.trim();
  }

  if (
    source &&
    typeof source["#text"] ===
      "string"
  ) {
    return source["#text"].trim();
  }

  return "Google News";
}

function removeSourceFromTitle(
  title: string,
  source: string
): string {
  const suffix = ` - ${source}`;

  if (
    source !== "Google News" &&
    title.endsWith(suffix)
  ) {
    return title
      .slice(0, -suffix.length)
      .trim();
  }

  return title.trim();
}

function normalizePublishedAt(
  value: string | undefined
): string {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function removeDuplicateArticles(
  articles: NewsApiArticle[]
): NewsApiArticle[] {
  const seenUrls =
    new Set<string>();

  const seenTitles =
    new Set<string>();

  return articles.filter(
    (article) => {
      const normalizedUrl =
        article.url
          .trim()
          .toLowerCase();

      const normalizedTitle =
        article.title
          .trim()
          .toLowerCase()
          .replace(
            /[^a-z0-9\s]/g,
            ""
          )
          .replace(/\s+/g, " ");

      if (
        !normalizedTitle ||
        !normalizedUrl
      ) {
        return false;
      }

      if (
        seenUrls.has(normalizedUrl) ||
        seenTitles.has(
          normalizedTitle
        )
      ) {
        return false;
      }

      seenUrls.add(normalizedUrl);

      seenTitles.add(
        normalizedTitle
      );

      return true;
    }
  );
}

async function fetchGoogleNewsQuery(
  query: string
): Promise<NewsApiArticle[]> {
  const searchParams =
    new URLSearchParams({
      q: query,

      hl: "en-IN",

      gl: "IN",

      ceid: "IN:en",
    });

  const url =
    "https://news.google.com/rss/search?" +
    searchParams.toString();

  try {
    const response = await fetch(
      url,
      {
        cache: "no-store",

        headers: {
          "User-Agent":
            "STFL-News-Intelligence/1.0",
        },
      }
    );

    if (!response.ok) {
      console.warn(
        "Google News RSS request failed:",
        response.status,
        response.statusText
      );

      return [];
    }

    const xml =
      await response.text();

    const parser =
      new XMLParser({
        ignoreAttributes: false,

        trimValues: true,

        parseTagValue: false,
      });

    const parsed =
      parser.parse(
        xml
      ) as GoogleRssResponse;

    const rawItems =
      parsed.rss?.channel?.item;

    const items =
      Array.isArray(rawItems)
        ? rawItems
        : rawItems
          ? [rawItems]
          : [];

    return items
      .map((item) => {
        const source =
          extractGoogleSource(
            item.source
          );

        const rawTitle =
          decodeHtml(
            item.title ?? ""
          );

        const title =
          removeSourceFromTitle(
            rawTitle,
            source
          );

        const description =
          decodeHtml(
            item.description ?? ""
          );

        return {
          source: {
            id: null,

            name: source,
          },

          author: null,

          title,

          description,

          url:
            item.link?.trim() ?? "",

          urlToImage: null,

          publishedAt:
            normalizePublishedAt(
              item.pubDate
            ),

          content: null,
        } satisfies NewsApiArticle;
      })
      .filter(
        (article) =>
          Boolean(
            article.title &&
              article.url
          )
      );
  } catch (error) {
    console.error(
      "Google News RSS error:",
      error
    );

    return [];
  }
}

async function fetchGoogleNewsRss():
  Promise<NewsApiArticle[]> {
  const results =
    await Promise.all(
      GOOGLE_NEWS_QUERIES.map(
        fetchGoogleNewsQuery
      )
    );

  return removeDuplicateArticles(
    results.flat()
  );
}

async function fetchDelayedNewsApi():
  Promise<NewsApiArticle[]> {
  /*
   * Google News RSS still works if
   * NEWSAPI_KEY is unavailable.
   */
  if (!NEWS_API_KEY) {
    console.warn(
      "NEWSAPI_KEY is missing. Using Google News RSS only."
    );

    return [];
  }

  const query = [
    "(",
    '"Nifty"',
    "OR",
    '"Sensex"',
    "OR",
    '"Bank Nifty"',
    "OR",
    '"India VIX"',
    "OR",
    '"Gift Nifty"',
    "OR",
    '"NSE"',
    "OR",
    '"BSE"',
    "OR",
    '"SEBI"',
    "OR",
    '"RBI"',
    "OR",
    '"Indian stock market"',
    "OR",
    '"Indian shares"',
    "OR",
    '"Indian equities"',
    "OR",
    '"Indian exchanges"',
    "OR",
    '"Groww"',
    "OR",
    '"Zerodha"',
    "OR",
    '"NSDL"',
    "OR",
    '"CDSL"',
    "OR",
    '"FII"',
    "OR",
    '"DII"',
    "OR",
    '"rupee"',
    ")",
    "OR",
    "(",
    "(India OR Indian)",
    "AND",
    "(",
    "IPO",
    "OR",
    "dividend",
    "OR",
    "earnings",
    "OR",
    "results",
    "OR",
    "buyback",
    "OR",
    '"stock split"',
    "OR",
    '"bulk deal"',
    "OR",
    '"block deal"',
    "OR",
    '"order win"',
    ")",
    ")",
  ].join(" ");

  if (query.length > 500) {
    throw new Error(
      `NewsAPI query exceeds 500 characters: ${query.length}`
    );
  }

  const threeDaysAgo =
    new Date(
      Date.now() -
        3 *
          24 *
          60 *
          60 *
          1000
    ).toISOString();

  const searchParams =
    new URLSearchParams({
      q: query,

      searchIn:
        "title,description",

      language: "en",

      sortBy: "publishedAt",

      pageSize: "100",

      page: "1",

      from: threeDaysAgo,
    });

  const url =
    "https://newsapi.org/v2/everything?" +
    searchParams.toString();

  try {
    const response =
      await fetch(url, {
        cache: "no-store",

        headers: {
          "X-Api-Key":
            NEWS_API_KEY,
        },
      });

    if (!response.ok) {
      console.warn(
        "NewsAPI request failed:",
        response.status,
        response.statusText
      );

      return [];
    }

    const data: NewsApiResponse =
      await response.json();

    if (
      data.status !== "ok"
    ) {
      console.warn(
        "NewsAPI returned an error:",
        data.message ||
          data.code
      );

      return [];
    }

    return data.articles.filter(
      (article) =>
        Boolean(
          article.title &&
            article.url &&
            article.publishedAt
        ) &&
        article.title !==
          "[Removed]"
    );
  } catch (error) {
    console.error(
      "NewsAPI provider error:",
      error
    );

    return [];
  }
}

export async function fetchNewsApiNews():
  Promise<NewsApiArticle[]> {
  /*
   * Fetch current RSS news and delayed
   * NewsAPI coverage simultaneously.
   */
  const [
    googleNews,
    delayedNewsApi,
  ] = await Promise.all([
    fetchGoogleNewsRss(),

    fetchDelayedNewsApi(),
  ]);

  /*
   * Google News is placed first so that
   * current articles win exact-title
   * duplicate removal.
   */
    const combined =
    removeDuplicateArticles([
      ...googleNews,

      ...delayedNewsApi,
    ]).sort(
      (a, b) =>
        new Date(
          b.publishedAt
        ).getTime() -
        new Date(
          a.publishedAt
        ).getTime()
    );

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.log(
      "===== COMBINED NEWS PROVIDER ====="
    );

    console.log({
      googleNews:
        googleNews.length,

      delayedNewsApi:
        delayedNewsApi.length,

      combined:
        combined.length,

      newestArticle:
        combined[0]?.publishedAt ??
        null,
    });
  }

  return combined;
}