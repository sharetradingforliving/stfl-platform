"use client";

import { useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import { NewsEngineResult } from "@/lib/news/types";

import LatestMarketNews from "./LatestMarketNews";

type DashboardCardProps = {
  title: string;
  description: string;
};

function DashboardCard({
  title,
  description,
}: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition hover:-translate-y-1 hover:border-emerald-500/50">
      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-center text-sm text-slate-500">
        Coming Soon
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

        console.log("===== NEWS ENGINE =====");
        console.log(result);

        console.log(
          "Latest:",
          result.latestMarketNews?.length
        );

        console.log(
          "Company:",
          result.companyNews?.length
        );

        console.log(
          "Sector:",
          result.sectorNews?.length
        );

        console.log(
          "Global:",
          result.globalNews?.length
        );

        setData(result);
      } catch (err) {
        console.error("FULL ERROR:", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400">
        Loading News Dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-red-400">
        {error || "Unable to load dashboard."}
      </div>
    );
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          STFL News Intelligence
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          News Dashboard
        </h2>

        <p className="mt-3 max-w-3xl text-slate-400">
          AI-powered news aggregation, sentiment analysis,
          event classification, and market impact analysis
          for investors.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        <LatestMarketNews
          news={data.latestMarketNews}
        />

        <NewsCard
          title="Company News"
          news={data.companyNews}
          viewMoreLink="/company-news"
        />

        <NewsCard
          title="Sector News"
          news={data.sectorNews}
          viewMoreLink="/sector-news"
        />

        <NewsCard
          title="Global Market News"
          news={data.globalNews}
          viewMoreLink="/global-news"
        />

        <DashboardCard
          title="AI News Summary"
          description="AI-generated summary of today's most important news."
        />

        <DashboardCard
          title="Market Sentiment"
          description="Overall positive, negative and neutral sentiment analysis."
        />

        <DashboardCard
          title="Positive Sentiment"
          description="Companies with the strongest positive news flow."
        />

        <DashboardCard
          title="Negative Sentiment"
          description="Companies under pressure due to negative developments."
        />

        <DashboardCard
          title="News Impact Score"
          description="Overall impact score calculated by the STFL News Engine."
        />

      </div>
    </section>
  );
}