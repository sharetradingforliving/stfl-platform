
import type { Metadata } from "next";

import BasicCompanyDashboard from "./BasicCompanyDashboard";
import Link from "next/link";

import {
  getCompanyIdentity,
} from "@/lib/seo/companyIdentity";

import PublicFinancialHighlights from "@/components/company/PublicFinancialHighlights";

type CompanyPageProps = {
  params: Promise<{
    symbol: string;
  }>;

  searchParams: Promise<{
    exchange?: string;
  }>;
};

const SITE_URL = "https://sharetradingforliving.com";

export async function generateMetadata({
  params,
  searchParams,
}: CompanyPageProps): Promise<Metadata> {
  const { symbol } = await params;
  const { exchange } = await searchParams;

  const stockSymbol = symbol.trim().toUpperCase();

  const selectedExchange =
    exchange?.toUpperCase() === "BSE"
      ? "BSE"
      : "NSE";

  const canonicalUrl =
    `${SITE_URL}/company/${encodeURIComponent(stockSymbol)}`;

      const company =
    selectedExchange === "NSE"
      ? await getCompanyIdentity(stockSymbol)
      : null;

  const companyLabel =
    company?.companyName ?? stockSymbol;

    const title =
    `${companyLabel} Share Price, Fundamentals & Valuation`;

  const description =
    `Explore ${companyLabel} (${stockSymbol}) stock research ` +
    `on ${selectedExchange}, including financial statements, ` +
    `historical performance and fundamental analysis ` +
    `on Share Trading For Living.`;

  return {
    title: {
      absolute: `${title} | STFL`,
    },

    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: "Share Trading For Living",
      title: `${title} | STFL`,
      description,
    },

    twitter: {
      card: "summary_large_image",
      title: `${title} | STFL`,
      description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CompanyPage({
  params,
  searchParams,
}: CompanyPageProps) {
  const { symbol } = await params;
  const { exchange } = await searchParams;

  const selectedExchange: "NSE" | "BSE" =
    exchange?.toUpperCase() === "BSE"
      ? "BSE"
      : "NSE";

  const stockSymbol = symbol.trim().toUpperCase();

  const company =
    selectedExchange === "NSE"
      ? await getCompanyIdentity(stockSymbol)
      : null;

  const companyLabel =
    company?.status === "verified"
      ? company.companyName
      : stockSymbol;

  return (
    <>
      <section
        aria-label="Company research overview"
        className="border-b border-slate-200 bg-white px-6 py-8 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            STFL Company Research
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            {companyLabel}
          </h1>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {selectedExchange}: {stockSymbol}
          </p>

          {company?.status === "verified" && company.industry && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Industry: {company.industry}
            </p>
          )}

          <p className="mt-4 max-w-3xl leading-7 text-slate-700 dark:text-slate-300">
            Explore research and market information for{" "}
            {companyLabel}. Use the dashboard to view
            available price data and charts, and open
            fundamental research to review available
            financial statements and valuation analysis.
          </p>

          <div className="mt-5 flex flex-wrap gap-5">
            <Link
              href={`/fundamental-research/${encodeURIComponent(stockSymbol)}?exchange=${selectedExchange}`}
              className="font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400"
            >
              Explore fundamental research
            </Link>

            <Link
              href="/research-methodology"
              className="font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400"
            >
              Research methodology
            </Link>
          </div>
        </div>
      </section>
            {company?.status === "verified" && (
        <PublicFinancialHighlights
          symbol={stockSymbol}
          exchange={selectedExchange}
        />
      )}

      <BasicCompanyDashboard
        symbol={stockSymbol}
        exchange={selectedExchange}
      />
    </>
  );
}
