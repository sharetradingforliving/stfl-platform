"use client";

import { useEffect, useState } from "react";

import type {
  ArticleIntelligence,
  ImpactDirection,
  NewsArticle,
  NewsEngineResult,
} from "@/lib/news/types";

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }
  ).format(date);
}

function sentimentColour(
  direction: ImpactDirection
): string {
  if (direction === "Positive") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (direction === "Negative") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (direction === "Mixed") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-700 bg-slate-800/50 text-slate-300";
}

function scoreColour(score: number): string {
  if (score >= 60) {
    return "text-emerald-400";
  }

  if (score <= 40) {
    return "text-red-400";
  }

  return "text-amber-400";
}

type ArticleListProps = {
  title: string;
  articles: NewsArticle[];
  emptyMessage: string;
};

function ArticleList({
  title,
  articles,
  emptyMessage,
}: ArticleListProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
      <h3 className="text-xl font-semibold text-white">
        {title}
      </h3>

      {articles.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {articles.slice(0, 5).map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-slate-800 bg-slate-900/30 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900/60"
            >
              <p className="font-medium leading-6 text-slate-100">
                {article.headline}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{article.source}</span>

                <span>
                  {formatDate(article.publishedAt)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

type IntelligenceCardProps = {
  item: ArticleIntelligence;
  position: number;
};

function IntelligenceCard({
  item,
  position,
}: IntelligenceCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
            #{position}
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
            {item.primaryEvent}
          </span>

          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${sentimentColour(
              item.impact.direction
            )}`}
          >
            {item.impact.direction}
          </span>
        </div>

        <span className="text-xs text-slate-500">
          Priority {item.priorityScore}/100
        </span>
      </div>

      <a
        href={item.article.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block text-lg font-semibold leading-7 text-white transition hover:text-cyan-300"
      >
        {item.article.headline}
      </a>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {item.whyItMatters}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-400">
          Impact: {item.impact.magnitude}
        </span>

        <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-400">
          Horizon: {item.impact.horizon}
        </span>

        <span className="rounded-full bg-slate-900 px-3 py-1 text-slate-400">
          Scope: {item.impact.scope}
        </span>

        {item.affectedSectors.map((sector) => (
          <span
            key={sector}
            className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300"
          >
            {sector}
          </span>
        ))}

        {item.affectedIndices.map((index) => (
          <span
            key={index}
            className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-300"
          >
            {index}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
        <span>{item.article.source}</span>

        <span>
          {formatDate(item.article.publishedAt)}
        </span>
      </div>
    </article>
  );
}

export default function NewsDashboard() {
  const [data, setData] =
    useState<NewsEngineResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/news", {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => null);

          throw new Error(
            errorData?.error ||
              `Unable to load news. HTTP ${response.status}`
          );
        }

        const result: NewsEngineResult =
          await response.json();

        setData(result);
      } catch (err) {
        console.error(
          "Unable to load News Dashboard:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : String(err)
        );
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-10 text-center text-slate-400">
        Loading investor news intelligence...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center text-red-300">
        {error || "Unable to load dashboard."}
      </div>
    );
  }

  const briefing = data.marketBriefing;

  const whatMattersNow =
    data.whatMattersNow ?? [];

  const sectorImpact =
    data.sectorImpact ?? [];

  const positiveHeadlines =
    briefing?.keyPositives ?? [];

  const negativeHeadlines =
    briefing?.keyNegatives ?? [];

      const newestArticle =
    data.articles.reduce<
      NewsArticle | null
    >(
      (newest, article) => {
        if (!newest) {
          return article;
        }

        const articleTime =
          new Date(
            article.publishedAt
          ).getTime();

        const newestTime =
          new Date(
            newest.publishedAt
          ).getTime();

        return articleTime >
          newestTime
          ? article
          : newest;
      },
      null
    );

  const lastUpdated =
    newestArticle
      ? formatDate(
          newestArticle.publishedAt
        )
      : "";

  return (
    <section>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          STFL News Intelligence
        </p>

        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
          What is moving the market?
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-400">
          Important market events ranked by relevance,
          expected impact, sentiment, source quality and
          freshness.
        </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Latest market intelligence
          </span>

          {lastUpdated && (
            <span className="text-sm text-slate-400">
              Updated {lastUpdated} IST
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Headlines aggregated from multiple sources.
          Availability and publication timing may vary
          by publisher.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Market mood
          </p>

          <p className="mt-3 text-2xl font-bold text-white">
            {briefing?.label ??
              data.sentiment.sentiment}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            News-driven market assessment
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sentiment score
          </p>

          <p
            className={`mt-3 text-3xl font-bold ${scoreColour(
              data.overallScore
            )}`}
          >
            {data.overallScore}
            <span className="text-base text-slate-600">
              /100
            </span>
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Confidence{" "}
            {briefing?.confidence ??
              data.sentiment.confidence}
            %
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Expected impact
          </p>

          <p className="mt-3 text-2xl font-bold text-white">
            {data.impact.impact}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Impact score {data.impact.score}/100
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Stories analysed
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {data.articles.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {data.clusters?.length ?? 0} distinct
            event clusters
          </p>
        </article>
      </div>

      <article className="mt-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-950/70 to-slate-950/70 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Investor briefing
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white">
          {briefing?.headline ??
            "Current market-news assessment"}
        </h2>

        <p className="mt-4 max-w-4xl leading-7 text-slate-300">
          {briefing?.summary ??
            data.summary.aiSummary}
        </p>

        <p className="mt-4 text-xs text-slate-500">
          This is a rule-based news interpretation,
          not investment advice. Confirm signals with
          price action, market breadth, India VIX and
          institutional flows.
        </p>
      </article>

      {(positiveHeadlines.length > 0 ||
        negativeHeadlines.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h2 className="text-xl font-semibold text-emerald-300">
              Supportive developments
            </h2>

            {positiveHeadlines.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No strong positive development was
                identified.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {positiveHeadlines.map((headline) => (
                  <li
                    key={headline}
                    className="flex gap-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="text-emerald-400">
                      +
                    </span>

                    <span>{headline}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="text-xl font-semibold text-red-300">
              Risk developments
            </h2>

            {negativeHeadlines.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No strong negative development was
                identified.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {negativeHeadlines.map((headline) => (
                  <li
                    key={headline}
                    className="flex gap-3 text-sm leading-6 text-slate-300"
                  >
                    <span className="text-red-400">
                      −
                    </span>

                    <span>{headline}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      )}

      <section className="mt-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Ranked intelligence
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            What matters now
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            The most relevant distinct developments,
            ranked for investors.
          </p>
        </div>

        {whatMattersNow.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-500">
            No high-priority development is currently
            available.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {whatMattersNow
              .slice(0, 6)
              .map((item, index) => (
                <IntelligenceCard
                  key={`${item.clusterId}-${item.article.id}`}
                  item={item}
                  position={index + 1}
                />
              ))}
          </div>
        )}
      </section>

      {sectorImpact.length > 0 && (
        <section className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            News transmission
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Sector impact
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sectorImpact
              .slice(0, 6)
              .map((sector) => (
                <article
                  key={sector.sector}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">
                      {sector.sector}
                    </h3>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${sentimentColour(
                        sector.direction
                      )}`}
                    >
                      {sector.direction}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    {sector.positiveEvents} positive and{" "}
                    {sector.negativeEvents} negative
                    developments
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Sector news score: {sector.score}
                  </p>
                </article>
              ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          News flow
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Explore by relevance
        </h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <ArticleList
            title="Latest Market News"
            articles={data.latestMarketNews}
            emptyMessage="No recent Indian market news is available."
          />

          <ArticleList
            title="Company Developments"
            articles={data.companyNews}
            emptyMessage="No relevant company development is available."
          />

          <ArticleList
            title="Sector Developments"
            articles={data.sectorNews}
            emptyMessage="No sector-specific development is available."
          />

          <ArticleList
            title="Global Market Cues"
            articles={data.globalNews}
            emptyMessage="No relevant global market cue is available."
          />

          <ArticleList
            title="Positive News Flow"
            articles={data.positiveNews}
            emptyMessage="No strongly positive development was identified."
          />

          <ArticleList
            title="Negative News Flow"
            articles={data.negativeNews}
            emptyMessage="No strongly negative development was identified."
          />
        </div>
      </section>
    </section>
  );
}