"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LiveMarketTicker from "../components/market/LiveMarketTicker";
import AllNseMarketStats from "../components/market/AllNseMarketStats";
import LiveMarketOverview from "../components/market/LiveMarketOverview";
import PlatformModules from "@/components/home/PlatformModules";

import {
  Activity,
  BarChart3,
  BookOpen,
  Database,
  FileSearch,
  GitCompareArrows,
  Landmark,
  Lightbulb,
  LineChart,
  PieChart,
  Rocket,
  Search,
  SearchCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const homepageFaqs = [
  {
    question: "What is Share Trading For Living?",
    answer:
      "Share Trading For Living, or STFL, is an Indian-market research and investment education platform providing market intelligence, company research and analytical tools.",
  },
  {
    question: "How can I research Indian stocks on STFL?",
    answer:
      "You can search NSE and BSE companies and study available price data, charts, technical indicators, company fundamentals, market activity and research insights.",
  },
  {
    question: "Does STFL provide live NSE and BSE market data?",
    answer:
      "STFL provides current or latest available NSE and BSE market information. Data availability and timing may vary by exchange session, provider and instrument.",
  },
  {
    question: "Can I research mutual funds, ETFs and IPOs on STFL?",
    answer:
      "Yes. STFL includes dedicated research areas for mutual funds, ETFs, IPOs, unlisted shares and other investment categories as those modules become available.",
  },
  {
    question: "What are AI-assisted investment insights?",
    answer:
      "AI-assisted insights organize financial, technical and market information into structured observations. They support research but do not guarantee outcomes or replace professional advice.",
  },
  {
    question: "Is STFL investment advice?",
    answer:
      "No. STFL provides research and educational information. It does not guarantee returns or replace independent research and advice from a qualified financial professional.",
  },
  {
    question: "Which STFL research tools are available for free?",
    answer:
      "Visitors can access selected market information, research previews and educational resources. Advanced valuation, analytical and premium research features may require membership.",
  },
];

const homepageFaqSchema = {
  "@context": "https://schema.org",

  "@type": "FAQPage",

  mainEntity: homepageFaqs.map((item) => ({
    "@type": "Question",

    name: item.question,

    acceptedAnswer: {
      "@type": "Answer",

      text: item.answer,
    },
  })),
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  type StockSearchResult = {
    symbol: string;
    companyName: string;
    exchange: string;
    instrumentKey: string;
  };

  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [selectedExchange, setSelectedExchange] = useState<"NSE" | "BSE">(
    "NSE",
  );
  const router = useRouter();
  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (searchResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveResultIndex((currentIndex) =>
        currentIndex < searchResults.length - 1 ? currentIndex + 1 : 0,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveResultIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : searchResults.length - 1,
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selectedStock =
        searchResults[activeResultIndex >= 0 ? activeResultIndex : 0];

      if (selectedStock) {
        setSearchQuery(selectedStock.symbol);
        setSearchResults([]);

        router.push(
          `/company/${selectedStock.symbol.toLowerCase()}?exchange=${selectedStock.exchange}`,
        );
      }
    }

    if (event.key === "Escape") {
      setSearchResults([]);
      setActiveResultIndex(-1);
    }
  }
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        setIsSearching(true);

        const response = await fetch(
          `/api/upstox/instruments/search?q=${encodeURIComponent(
            trimmedQuery,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Unable to search the Upstox instrument master");
        }

        const data = await response.json();

        const exchangeResults = (data.results ?? []).filter(
          (stock: StockSearchResult) => stock.exchange === selectedExchange,
        );

        setSearchResults(exchangeResults);
      } catch (error) {
        console.error("Stock search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(searchTimer);
    };
  }, [searchQuery, selectedExchange]);

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      alert("Please enter a stock name or symbol.");
      return;
    }

    try {
      let availableResults = searchResults;

      if (availableResults.length === 0) {
        setIsSearching(true);

        const response = await fetch(
          `/api/upstox/instruments/search?q=${encodeURIComponent(
            trimmedQuery,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Unable to search for the stock");
        }

        const data = await response.json();

        availableResults = data.results ?? [];
      }

      const exactSymbolMatch = availableResults.find(
        (stock) => stock.symbol.toUpperCase() === trimmedQuery.toUpperCase(),
      );

      const selectedStock = exactSymbolMatch ?? availableResults[0];

      if (!selectedStock) {
        alert("No matching NSE or BSE stock was found.");
        return;
      }

      setSearchQuery(selectedStock.symbol);
      setSearchResults([]);

      router.push(
        `/company/${selectedStock.symbol.toLowerCase()}?exchange=${selectedExchange}`,
      );
    } catch (error) {
      console.error("Homepage stock search error:", error);

      alert("Unable to search for this stock. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  return (
    <main
      id="top"
      className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageFaqSchema).replace(/</g, "\\u003c"),
        }}
      />
      {/* Live Market Ticker */}
      <LiveMarketTicker />

      {/* Hero Section */}
      <section className="flex min-h-[650px] items-center justify-center border-b border-slate-200 bg-white px-6 py-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="w-full max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400">
            Share Trading For Living
          </p>

          <h1 className="text-5xl font-bold leading-tight text-slate-950 md:text-7xl dark:text-white">
            Research Indian Stocks Smarter.
            <br />
            Trade Smarter.
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">
              Invest Better.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Research Indian stocks, study market trends and make informed
            investment decisions with STFL.
          </p>

          {/* Exchange selector */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-3">
            <span className="mr-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              Select Exchange:
            </span>

            {(["NSE", "BSE"] as const).map((exchange) => (
              <label
                key={exchange}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  selectedExchange === exchange
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="stockExchange"
                  value={exchange}
                  checked={selectedExchange === exchange}
                  onChange={() => {
                    setSelectedExchange(exchange);

                    setSearchResults([]);
                  }}
                  className="accent-emerald-500"
                />

                {exchange}
              </label>
            ))}
          </div>

          {/* Universal Search */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="relative mx-auto mt-5 flex max-w-2xl items-center rounded-2xl border border-slate-300 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <span
              className="pl-4 text-slate-500 dark:text-slate-400"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />

                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>

            <input
              type="text"
              placeholder="Search stocks, indices, IPOs or mutual funds..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent px-4 py-3 text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Search
            </button>

            {searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                {isSearching ? (
                  <p className="px-5 py-4 text-left text-sm text-slate-600 dark:text-slate-400">
                    Searching stocks...
                  </p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((stock, index) => (
                    <button
                      key={`${stock.exchange}-${stock.instrumentKey}`}
                      type="button"
                      onClick={() => {
                        setSearchQuery(stock.symbol);

                        setSearchResults([]);

                        router.push(
                          `/company/${stock.symbol.toLowerCase()}?exchange=${selectedExchange}`,
                        );
                      }}
                      className={`flex w-full items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-left transition last:border-b-0 dark:border-slate-800 ${
                        activeResultIndex === index
                          ? "bg-emerald-50 dark:bg-emerald-500/15"
                          : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {stock.symbol}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                          {stock.companyName}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {stock.exchange}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-5 py-4 text-left text-sm text-slate-600 dark:text-slate-400">
                    No matching NSE or BSE stocks found.
                  </p>
                )}
              </div>
            )}
          </form>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              className="rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Start Research
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              Explore Markets
            </button>
          </div>
        </div>
      </section>
      {/* Dashboard Preview */}

      {/* All NSE Market Statistics */}
      <AllNseMarketStats />

      {/* Nifty 500 Live Market Overview */}
      <LiveMarketOverview />

      <section
        id="technical-analysis"
        className="scroll-mt-28 border-t border-slate-200 bg-slate-100/70 px-6 py-20 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              STFL Market Intelligence
            </p>

            <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">
              Everything You Need to Study the Market
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-400">
              Track market trends, discover opportunities and access research
              tools from one intelligent dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Market Overview */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:shadow-none dark:hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                <BarChart3 className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                Market Overview
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Track major indices, market breadth, sector performance and
                investor sentiment.
              </p>

              <a
                href="/market-intelligence"
                className="mt-6 inline-flex items-center font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View Markets
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Market Screener */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:shadow-none dark:hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                Market Screener
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Filter stocks using price, volume, valuation, momentum and
                technical indicators.
              </p>

              <a
                href="/fundamental-research/discovery"
                className="mt-6 inline-flex items-center font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Open Screener
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Technical Signals */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:shadow-none dark:hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Activity className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                Technical Signals
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Study trend indicators, support and resistance levels, momentum
                signals and chart patterns.
              </p>

              <a
                href="/fundamental-research"
                className="mt-6 inline-flex items-center font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View Signals
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Latest Research */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:shadow-none dark:hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <FileSearch className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
                Latest Research
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Access company analysis, investment insights, IPO research and
                market commentary.
              </p>

              <a
                href="/news-sentiment"
                className="mt-6 inline-flex items-center font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Read Research
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>
          </div>
        </div>
      </section>
      {/* Featured Research */}
      <section
        id="stock-research"
        className="scroll-mt-28 border-t border-slate-800 bg-slate-950 px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              Featured Research
            </p>

            <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">
              Research Ideas for Smarter Investing
            </h2>

            <p className="mt-5 max-w-2xl text-slate-600 dark:text-slate-400">
              Explore investment opportunities, market-moving stocks, mutual
              fund ideas and upcoming IPO research in one place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Long-Term Picks */}
            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Target className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Investment Ideas
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Long-Term Picks
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Discover fundamentally strong companies selected for long-term
                wealth creation.
              </p>

              <a
                href="/fundamental-research/discovery"
                className="mt-6 inline-flex items-center font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View Long-Term Picks
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Stocks on the Move */}
            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-cyan-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-sm font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                <TrendingUp className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                Market Momentum
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Stocks on the Move
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Track stocks showing strong price action, volume activity and
                emerging momentum.
              </p>

              <a
                href="/market-movers"
                className="mt-6 inline-flex items-center font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Discover Opportunities
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Mutual Fund Ideas */}
            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-violet-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                <PieChart className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-400">
                Portfolio Building
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Mutual Fund Ideas
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Explore mutual fund categories and portfolio ideas aligned with
                different investment goals.
              </p>

              <a
                href="/mutual-fund-research"
                className="mt-6 inline-flex items-center font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Explore Mutual Funds
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* IPO Research */}
            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:border-amber-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-amber-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <Rocket className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                New Listings
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                IPO Research
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Study upcoming IPOs, company fundamentals, issue details and key
                investment considerations.
              </p>

              <a
                href="/ipo-research"
                className="mt-6 inline-flex items-center font-semibold text-amber-700 transition hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              >
                View IPO Research
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>
          </div>
        </div>
      </section>
      {/* Why Choose STFL */}
      <section className="border-t border-slate-200 bg-slate-100/70 px-6 py-20 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* Left Content */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                Why Choose STFL
              </p>

              <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-950 md:text-5xl dark:text-white">
                Research Built for
                <span className="text-emerald-600 dark:text-emerald-400">
                  {" "}
                  Smarter Decisions
                </span>
              </h2>

              <p className="mt-6 max-w-xl leading-7 text-slate-600 dark:text-slate-400">
                STFL brings market data, fundamental research and technical
                insights together to help investors study opportunities with
                greater clarity and confidence.
              </p>

              <a
                href="/fundamental-research"
                className="mt-8 inline-flex items-center rounded-xl bg-emerald-500 px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Explore STFL Research
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </div>

            {/* Right Features */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Feature 1 */}
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-500 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-sm font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                  <Database className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                  Data-Driven Research
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Study market trends, company performance and investment
                  opportunities using structured data and meaningful insights.
                </p>
              </article>

              {/* Feature 2 */}
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <GitCompareArrows className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                  Fundamental + Technical
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Combine business fundamentals with technical indicators to
                  develop a more complete view of every stock.
                </p>
              </article>

              {/* Feature 3 */}
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                  <Landmark className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                  Indian Market Focus
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Research designed around Indian stocks, indices, IPOs, mutual
                  funds and the needs of Indian market participants.
                </p>
              </article>

              {/* Feature 4 */}
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-500 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <Lightbulb className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                  Clear &amp; Transparent Insights
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Understand the reasoning, opportunities and risks behind each
                  research idea instead of relying only on market noise.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
      {/* STFL Academy */}
      <section
        id="academy"
        className="scroll-mt-28 border-t border-slate-200 bg-white px-6 py-20 dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                STFL Academy
              </p>

              <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">
                Learn the Market. Build Your Skills.
              </h2>

              <p className="mt-5 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
                Build practical knowledge through structured learning modules
                designed for investors and traders at every stage.
              </p>
            </div>

            <a
              href="/learning-centre"
              className="inline-flex w-fit items-center rounded-xl border border-emerald-600 px-6 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-500 hover:text-slate-950 dark:border-emerald-500 dark:text-emerald-400"
            >
              Explore STFL Academy
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Trading Basics */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-emerald-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Beginner
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Trading Basics
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Understand stock markets, order types, trading terminology, risk
                management and the foundations of investing.
              </p>

              <a
                href="/learning-centre"
                className="mt-7 inline-flex items-center font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Start Learning
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Technical Analysis */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-cyan-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-sm font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                <LineChart className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                Intermediate
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Technical Analysis
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Learn candlestick patterns, trends, support and resistance,
                indicators and practical chart analysis.
              </p>

              <a
                href="/learning-centre"
                className="mt-7 inline-flex items-center font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Study Charts
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Fundamental Analysis */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-violet-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-violet-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                <SearchCheck className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-400">
                Investor
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Fundamental Analysis
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Study financial statements, business quality, valuation ratios,
                growth, profitability and company fundamentals.
              </p>

              <a
                href="/learning-centre"
                className="mt-7 inline-flex items-center font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Analyse Companies
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>

            {/* Options Trading */}
            <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-amber-500 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900 dark:hover:shadow-amber-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <Zap className="h-6 w-6" aria-hidden="true" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Advanced
              </p>

              <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                Options Trading
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Learn option concepts, Greeks, strategies, position management
                and disciplined approaches to trading risk.
              </p>

              <a
                href="/options-assistant"
                className="mt-7 inline-flex items-center font-semibold text-amber-700 transition hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Explore Options
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </a>
            </article>
          </div>
        </div>
      </section>
      {/* Premium Membership CTA */}
      <section
        id="premium"
        className="scroll-mt-28 border-t border-slate-200 bg-slate-100/70 px-6 py-20 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-8 py-14 shadow-sm md:px-14 lg:py-16 dark:border-emerald-500/30 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30 dark:shadow-none">
            {/* Decorative Glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />

            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              {/* Left Content */}
              <div>
                <span className="inline-flex rounded-full border border-emerald-400 bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                  STFL Premium
                </span>

                <h2 className="mt-6 max-w-3xl text-3xl font-bold leading-tight text-slate-950 md:text-5xl dark:text-white">
                  Go Beyond Market Noise.
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {" "}
                    Research with Greater Clarity.
                  </span>
                </h2>

                <p className="mt-6 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
                  Unlock premium research, curated investment ideas, advanced
                  market insights and powerful tools designed to support more
                  informed investment decisions.
                </p>
              </div>

              {/* Right Content */}
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-7 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                  Premium Access Includes
                </h3>

                <div className="mt-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {"\u2713"}
                    </span>

                    <span>Curated long-term investment research</span>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {"\u2713"}
                    </span>

                    <span>Stocks on the Move insights</span>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {"\u2713"}
                    </span>

                    <span>Advanced fundamental and technical tools</span>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {"\u2713"}
                    </span>

                    <span>Premium research reports and market commentary</span>
                  </div>
                </div>

                <a
                  href="/premium-research"
                  className="mt-8 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-6 py-4 font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Explore Premium Membership
                  <span className="ml-2" aria-hidden="true">
                    {"\u2192"}
                  </span>
                </a>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Educational and research content. Market risks apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PlatformModules />
      {/* Homepage FAQ */}
      <section className="border-t border-slate-200 bg-slate-100/70 px-6 py-20 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
              Frequently Asked Questions
            </p>

            <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-5xl dark:text-white">
              Learn More About STFL
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
              Understand how STFL supports Indian stock-market research,
              investment learning and informed decision-making.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {homepageFaqs.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-none"
              >
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {item.question}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 pt-16 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Image
                src="/sharetradingforlivingwithoutbg.png"
                alt="Share Trading For Living"
                width={170}
                height={100}
                className="h-20 w-auto"
              />

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
                STFL brings stock research, market intelligence, investment
                education and analytical tools together to help investors make
                more informed decisions.
              </p>

              <p className="mt-5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Research Smarter. Trade Smarter. Invest Better.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <a
                  href="mailto:sharetradingforliving@gmail.com"
                  className="block break-words transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  sharetradingforliving@gmail.com
                </a>

                <a
                  href="https://wa.me/917905635297?text=Hello%20STFL%2C%20I%20would%20like%20to%20know%20more%20about%20your%20market%20research%20services."
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  WhatsApp: +91 79056 35297
                </a>

                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                  <a
                    href="https://www.youtube.com/@sharetrading4living"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition hover:text-red-600 dark:hover:text-red-400"
                  >
                    YouTube
                  </a>

                  <a
                    href="https://www.instagram.com/sharetradingforliving/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition hover:text-pink-600 dark:hover:text-pink-400"
                  >
                    Instagram
                  </a>

                  <a
                    href="https://www.facebook.com/sharetradingforliving"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Facebook
                  </a>
                </div>
              </div>
            </div>

            {/* Research */}
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">
                Research
              </h3>

              <nav
                aria-label="Footer research links"
                className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400"
              >
                <a
                  href="/fundamental-research"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Stock Research
                </a>

                <a
                  href="/fundamental-research/discovery"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Stock Discovery
                </a>

                <a
                  href="/market-intelligence"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Market Intelligence
                </a>

                <a
                  href="/market-movers"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Market Movers
                </a>

                <a
                  href="/ipo-research"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  IPO Research
                </a>

                <a
                  href="/mutual-fund-research"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Mutual Funds
                </a>
              </nav>
            </div>

            {/* Learn */}
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">
                Learn
              </h3>

              <nav
                aria-label="Footer learning links"
                className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400"
              >
                <a
                  href="/learning-centre"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Learning Centre
                </a>

                <a
                  href="/learning-centre"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Trading Basics
                </a>

                <a
                  href="/learning-centre"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Technical Analysis
                </a>

                <a
                  href="/learning-centre"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Fundamental Analysis
                </a>

                <a
                  href="/options-assistant"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Options Research
                </a>
              </nav>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">
                Company
              </h3>

              <nav
                aria-label="Footer company links"
                className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400"
              >
                <a
                  href="/about"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  About STFL
                </a>

                <a
                  href="/news-sentiment"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  News &amp; Sentiment
                </a>

                <a
                  href="/market-astrology"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Market Astrology
                </a>

                <a
                  href="/premium-research"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Premium Research
                </a>

                <a
                  href="/contact"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Contact Us
                </a>
              </nav>
            </div>

            {/* Legal and Transparency */}
            <div>
              <h3 className="font-bold text-slate-950 dark:text-white">
                Legal &amp; Transparency
              </h3>

              <nav
                aria-label="Footer legal and transparency links"
                className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400"
              >
                <a
                  href="/research-methodology"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Research Methodology
                </a>

                <a
                  href="/editorial-policy"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Editorial Policy
                </a>

                <a
                  href="/privacy-policy"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Privacy Policy
                </a>

                <a
                  href="/terms-and-conditions"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Terms &amp; Conditions
                </a>

                <a
                  href="/disclaimer"
                  className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Financial Disclaimer
                </a>
              </nav>
            </div>
          </div>

          {/* Market Risk Disclaimer */}
          <div className="mt-14 border-t border-slate-200 py-8 dark:border-slate-800">
            <p className="text-xs leading-6 text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-400">
                Market Risk Disclaimer:
              </span>{" "}
              Investments in securities markets are subject to market risks.
              Please read all related documents carefully before investing.
              Information provided on STFL is intended for educational and
              research purposes and should not be considered a guarantee of
              returns. Investors should conduct their own research and consult
              an appropriately qualified financial professional where necessary.{" "}
              <a
                href="/disclaimer"
                className="font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Read the complete disclaimer.
              </a>
            </p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col gap-4 border-t border-slate-200 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between dark:border-slate-800">
            <p>
              {"\u00A9"} 2026 Share Trading For Living. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a
                href="/privacy-policy"
                className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                Privacy
              </a>

              <a
                href="/terms-and-conditions"
                className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                Terms
              </a>

              <a
                href="/disclaimer"
                className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
              >
                Disclaimer
              </a>
            </div>

            <p>Built for smarter market research.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
