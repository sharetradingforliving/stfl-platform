import {
  NextResponse,
} from "next/server";

import {
  runNewsEngine,
} from "@/lib/news/newsEngine";

type NewsResult =
  Awaited<
    ReturnType<
      typeof runNewsEngine
    >
  >;

function toDashboardPayload(
  result: NewsResult
) {
  return {
    articles:
      result.articles ?? [],

    clusters:
      (
        result.clusters ?? []
      ).slice(
        0,
        20
      ),

    companyNews:
      result.companyNews ?? [],

    globalNews:
      result.globalNews ?? [],

    impact:
      result.impact,

    latestMarketNews:
      result.latestMarketNews ?? [],

    marketBriefing:
      result.marketBriefing,

    negativeNews:
      result.negativeNews ?? [],

    overallScore:
      result.overallScore ?? 0,

    positiveNews:
      result.positiveNews ?? [],

    sectorImpact:
      result.sectorImpact ?? [],

    sectorNews:
      result.sectorNews ?? [],

    sentiment:
      result.sentiment,

    summary:
      result.summary,

    whatMattersNow:
      (
        result.whatMattersNow ?? []
      ).slice(
        0,
        10
      ),
  };
}

type NewsDashboardPayload =
  ReturnType<
    typeof toDashboardPayload
  >;

const NEWS_CACHE_DURATION_MS =
  10 * 60 * 1000;

const NEWS_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=3600";

let cachedNews:
  NewsDashboardPayload | null =
    null;

let newsCacheExpiresAt = 0;

let newsRefreshPromise:
  Promise<NewsDashboardPayload> | null =
    null;

function startNewsRefresh():
  Promise<NewsDashboardPayload> {
  if (newsRefreshPromise) {
    return newsRefreshPromise;
  }

  newsRefreshPromise =
    runNewsEngine()
      .then((result) => {
        const payload =
          toDashboardPayload(
            result
          );

        cachedNews = payload;

        newsCacheExpiresAt =
          Date.now() +
          NEWS_CACHE_DURATION_MS;

        return payload;
      })
      .finally(() => {
        newsRefreshPromise = null;
      });

  return newsRefreshPromise;
}

function createNewsResponse(
  payload: NewsDashboardPayload,
  source: string
) {
  return NextResponse.json(
    payload,
    {
      status: 200,
      headers: {
        "Cache-Control":
          NEWS_CACHE_CONTROL,

        "X-STFL-News-Source":
          source,
      },
    }
  );
}

export async function GET() {
  try {
    const cacheIsFresh =
      cachedNews !== null &&
      Date.now() <
        newsCacheExpiresAt;

    if (
      cacheIsFresh &&
      cachedNews
    ) {
      return createNewsResponse(
        cachedNews,
        "memory-cache"
      );
    }

    /*
     * When old news exists, return it
     * immediately and refresh the engine
     * without delaying the visitor.
     */
    if (cachedNews) {
      void startNewsRefresh()
        .catch((error) => {
          console.error(
            "Background news refresh failed:",
            error
          );
        });

      return createNewsResponse(
        cachedNews,
        "stale-while-refreshing"
      );
    }

    /*
     * Only the first request after a
     * frontend-server restart waits for
     * the complete News Engine.
     */
    const result =
      await startNewsRefresh();

    return createNewsResponse(
      result,
      "fresh-engine"
    );
  } catch (error) {
    console.error(
      "News API error:",
      error
    );

    /*
     * Continue serving the last successful
     * result if a provider refresh fails.
     */
    if (cachedNews) {
      return createNewsResponse(
        cachedNews,
        "stale-error-fallback"
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to load news.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}