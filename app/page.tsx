"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { marketTickerData } from "../data/marketTicker";
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const handleSearch = () => {
  if (!searchQuery.trim()) {
    alert("Please enter a stock name or symbol.");
    return;
  }

  router.push(`/company/${searchQuery.trim().toLowerCase()}`);
};
  return (
    <main id="top" className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* STFL Logo */}
          <div className="flex items-center">
            <Image
              src="/sharetradingforlivingwithoutbg.png"
              alt="Share Trading For Living"
              width={150}
              height={90}
              priority
              className="h-20 w-auto scale-125"
            />
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            <a href="#top" className="text-emerald-400">
              Home
            </a>
            <a href="#markets" className="transition hover:text-emerald-400">
              Markets
            </a>
            <a href="#stock-research" className="transition hover:text-emerald-400">
              Stock Research
            </a>
            <a href="#technical-analysis" className="transition hover:text-emerald-400">
              Technical Analysis
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              IPO
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              Mutual Funds
            </a>
            <a href="#acadmeys" className="transition hover:text-emerald-400">
              Academy
            </a>
            <a href="#" className="transition hover:text-emerald-400">
  Blog
</a>
          </nav>

          {/* Login and Premium */}
          <div className="flex items-center gap-3">
            <button className="hidden px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:block">
              Login
            </button>

            <a
  href="#premium"
  className="rounded-lg bg-emerald-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400"
>
  Premium
</a>
          </div>
        </div>
      </header>
{/* Continuous Market Ticker */}
<section className="overflow-hidden border-y border-slate-800 bg-slate-900">
  <div className="market-ticker-track py-4 text-sm">

    {[...marketTickerData, ...marketTickerData].map(
  ({ name, price, change, isUp }, index) => (      <div
        key={index}
        className="flex shrink-0 items-center whitespace-nowrap border-r border-slate-700 px-7"
      >
        <span className="text-slate-400">{name}</span>

        <span className="ml-2 font-bold text-white">
          {price}
        </span>

        <span
          className={`ml-2 font-semibold ${
            isUp ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {change}
        </span>
          </div>
  )
)}
  </div>
</section>
      {/* Hero Section */}
      <section className="flex min-h-[650px] items-center justify-center px-6 py-16">
        <div className="max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            Share Trading For Living
          </p>

          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            Research Smarter.
            <br />
            Trade Smarter.
            <br />
            <span className="text-emerald-400">Invest Better.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-300">
            Research Indian stocks, study market trends and make informed
            investment decisions with STFL.
          </p>
{/* Universal Search */}
<form
onSubmit={(e) => {
  e.preventDefault();
  handleSearch();
}}
 className="mx-auto mt-10 flex max-w-2xl items-center rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-lg">
  <span className="pl-4 text-xl">⌕</span>

  <input
    type="text"
    placeholder="Search stocks, indices, IPOs or mutual funds..."
    value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
  />

  <button
  type="submit"
  onClick={handleSearch}
  className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
>
    Search
  </button>
</form>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button className="rounded-xl bg-emerald-500 px-8 py-4 font-semibold text-slate-950 transition hover:bg-emerald-400">
              Start Research
            </button>

            <button className="rounded-xl border border-slate-600 px-8 py-4 font-semibold transition hover:border-emerald-400 hover:text-emerald-400">
              Explore Markets
            </button>
          </div>
        </div>
      </section>
     {/* Dashboard Preview */}
{/* Market Overview Dashboard */}
<section id="markets" className="scroll-mt-28 bg-slate-950 px-6 py-20">
  <div className="mx-auto max-w-7xl">
    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Market Overview
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Today&apos;s Market Snapshot
        </h2>

        <p className="mt-3 text-slate-400">
          A quick view of market breadth, leading stocks and institutional
          activity.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
        DEMO DATA
      </span>
    </div>

    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
      {/* Market Breadth */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
        <h3 className="text-lg font-bold">Market Breadth</h3>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Advances</span>
            <span className="font-bold text-emerald-400">1,428</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Declines</span>
            <span className="font-bold text-red-400">986</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Unchanged</span>
            <span className="font-bold">112</span>
          </div>
        </div>

        <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="w-[59%] bg-emerald-500"></div>
          <div className="w-[41%] bg-red-500"></div>
        </div>
      </div>

      {/* Top Gainers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
        <h3 className="text-lg font-bold">Top Gainers</h3>

        <div className="mt-6 space-y-5">
          <div className="flex justify-between">
            <span>RELIANCE</span>
            <span className="font-semibold text-emerald-400">+2.84%</span>
          </div>

          <div className="flex justify-between">
            <span>ICICIBANK</span>
            <span className="font-semibold text-emerald-400">+2.15%</span>
          </div>

          <div className="flex justify-between">
            <span>LT</span>
            <span className="font-semibold text-emerald-400">+1.92%</span>
          </div>
        </div>
      </div>

      {/* Top Losers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
        <h3 className="text-lg font-bold">Top Losers</h3>

        <div className="mt-6 space-y-5">
          <div className="flex justify-between">
            <span>INFY</span>
            <span className="font-semibold text-red-400">-1.76%</span>
          </div>

          <div className="flex justify-between">
            <span>WIPRO</span>
            <span className="font-semibold text-red-400">-1.32%</span>
          </div>

          <div className="flex justify-between">
            <span>TECHM</span>
            <span className="font-semibold text-red-400">-1.08%</span>
          </div>
        </div>
      </div>

      {/* FII DII Activity */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10">
        <h3 className="text-lg font-bold">FII / DII Activity</h3>

        <div className="mt-6 space-y-6">
          <div>
            <div className="flex justify-between">
              <span className="text-slate-400">FII Net</span>
              <span className="font-bold text-red-400">-₹1,245 Cr</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Net institutional selling
            </p>
          </div>

          <div>
            <div className="flex justify-between">
              <span className="text-slate-400">DII Net</span>
              <span className="font-bold text-emerald-400">+₹1,860 Cr</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Net domestic buying
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>  
<section id="technical-analysis" className="scroll-mt-28 border-t border-slate-800 bg-slate-900/50 px-6 py-20">  <div className="mx-auto max-w-7xl">
    <div className="mb-12 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
        STFL Market Intelligence
      </p>

      <h2 className="mt-4 text-3xl font-bold md:text-5xl">
        Everything You Need to Study the Market
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-slate-400">
        Track market trends, discover opportunities and access research
        tools from one intelligent dashboard.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {/* Card 1 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">📊</div>
        <h3 className="mt-5 text-xl font-bold">Market Overview</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Track major indices, market breadth, sector performance and
          investor sentiment.
        </p>
        <button className="mt-6 font-semibold text-emerald-400">
          View Markets →
        </button>
      </div>

      {/* Card 2 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">🚀</div>
        <h3 className="mt-5 text-xl font-bold">Market Screener</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
  Filter stocks using price, volume, valuation, momentum and technical indicators.
</p>
        <button className="mt-6 font-semibold text-emerald-400">
          Open Screener →
        </button>
      </div>

      {/* Card 3 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">📈</div>
        <h3 className="mt-5 text-xl font-bold">Technical Signals</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Study trend indicators, support and resistance levels, momentum
          signals and chart patterns.
        </p>
        <button className="mt-6 font-semibold text-emerald-400">
          View Signals →
        </button>
      </div>

      {/* Card 4 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">🔎</div>
        <h3 className="mt-5 text-xl font-bold">Latest Research</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Access company analysis, investment insights, IPO research and
          market commentary.
        </p>
        <button className="mt-6 font-semibold text-emerald-400">
          Read Research →
        </button>
      </div>
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
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
        Featured Research
      </p>

      <h2 className="mt-4 text-3xl font-bold md:text-5xl">
        Research Ideas for Smarter Investing
      </h2>

      <p className="mt-5 max-w-2xl text-slate-400">
        Explore investment opportunities, market-moving stocks, mutual fund
        ideas and upcoming IPO research in one place.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {/* Long-Term Picks */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">🎯</div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Investment Ideas
        </p>

        <h3 className="mt-3 text-xl font-bold">Long-Term Picks</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Discover fundamentally strong companies selected for long-term
          wealth creation.
        </p>

        <button className="mt-6 font-semibold text-emerald-400">
          View Long-Term Picks →
        </button>
      </div>

      {/* Stocks on the Move */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">🚀</div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Market Momentum
        </p>

        <h3 className="mt-3 text-xl font-bold">Stocks on the Move</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Track stocks showing strong price action, volume activity and
          emerging momentum.
        </p>

        <button className="mt-6 font-semibold text-emerald-400">
          Discover Opportunities →
        </button>
      </div>

      {/* Mutual Fund Ideas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">📊</div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Portfolio Building
        </p>

        <h3 className="mt-3 text-xl font-bold">Mutual Fund Ideas</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Explore mutual fund categories and portfolio ideas aligned with
          different investment goals.
        </p>

        <button className="mt-6 font-semibold text-emerald-400">
          Explore Mutual Funds →
        </button>
      </div>

      {/* IPO Research */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="text-3xl">🔔</div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          New Listings
        </p>

        <h3 className="mt-3 text-xl font-bold">IPO Research</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Study upcoming IPOs, company fundamentals, issue details and key
          investment considerations.
        </p>

        <button className="mt-6 font-semibold text-emerald-400">
          View IPO Research →
        </button>
      </div>
    </div>
  </div>
</section>
{/* Why Choose STFL */}
<section className="border-t border-slate-800 bg-slate-900/50 px-6 py-20">
  <div className="mx-auto max-w-7xl">
    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      
      {/* Left Content */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Why Choose STFL
        </p>

        <h2 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
          Research Built for
          <span className="text-emerald-400"> Smarter Decisions</span>
        </h2>

        <p className="mt-6 max-w-xl leading-7 text-slate-400">
          STFL brings market data, fundamental research and technical
          insights together to help investors study opportunities with
          greater clarity and confidence.
        </p>

        <button className="mt-8 rounded-xl bg-emerald-500 px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400">
          Explore STFL Research →
        </button>
      </div>

      {/* Right Features */}
      <div className="grid gap-5 sm:grid-cols-2">
        
        {/* Feature 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-3xl">📊</div>

          <h3 className="mt-5 text-lg font-bold">
            Data-Driven Research
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Study market trends, company performance and investment
            opportunities using structured data and meaningful insights.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-3xl">🔍</div>

          <h3 className="mt-5 text-lg font-bold">
            Fundamental + Technical
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Combine business fundamentals with technical indicators to
            develop a more complete view of every stock.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-3xl">🇮🇳</div>

          <h3 className="mt-5 text-lg font-bold">
            Indian Market Focus
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Research designed around Indian stocks, indices, IPOs, mutual
            funds and the needs of Indian market participants.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-3xl">💡</div>

          <h3 className="mt-5 text-lg font-bold">
            Clear & Transparent Insights
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Understand the reasoning, opportunities and risks behind each
            research idea instead of relying only on market noise.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
{/* STFL Academy */}
<section
  id="academy"
  className="scroll-mt-28 border-t border-slate-800 ..."
>
  <div className="mx-auto max-w-7xl">
    <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          STFL Academy
        </p>

        <h2 className="mt-4 text-3xl font-bold md:text-5xl">
          Learn the Market. Build Your Skills.
        </h2>

        <p className="mt-5 max-w-2xl leading-7 text-slate-400">
          Build practical knowledge through structured learning modules
          designed for investors and traders at every stage.
        </p>
      </div>

      <button className="w-fit rounded-xl border border-emerald-500 px-6 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950">
        Explore STFL Academy →
      </button>
    </div>

    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {/* Trading Basics */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
          📚
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Beginner
        </p>

        <h3 className="mt-3 text-xl font-bold">Trading Basics</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Understand stock markets, order types, trading terminology, risk
          management and the foundations of investing.
        </p>

        <button className="mt-7 font-semibold text-emerald-400">
          Start Learning →
        </button>
      </div>

      {/* Technical Analysis */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
          📈
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Intermediate
        </p>

        <h3 className="mt-3 text-xl font-bold">Technical Analysis</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Learn candlestick patterns, trends, support and resistance,
          indicators and practical chart analysis.
        </p>

        <button className="mt-7 font-semibold text-emerald-400">
          Study Charts →
        </button>
      </div>

      {/* Fundamental Analysis */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
          🔎
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Investor
        </p>

        <h3 className="mt-3 text-xl font-bold">Fundamental Analysis</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Study financial statements, business quality, valuation ratios,
          growth, profitability and company fundamentals.
        </p>

        <button className="mt-7 font-semibold text-emerald-400">
          Analyse Companies →
        </button>
      </div>

      {/* Options Trading */}
      <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-emerald-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
          ⚡
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Advanced
        </p>

        <h3 className="mt-3 text-xl font-bold">Options Trading</h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Learn option concepts, Greeks, strategies, position management
          and disciplined approaches to trading risk.
        </p>

        <button className="mt-7 font-semibold text-emerald-400">
          Explore Options →
        </button>
      </div>
    </div>
  </div>
</section>
{/* Premium Membership CTA */}
<section
  id="premium"
  className="scroll-mt-28 border-t border-slate-800 ..."
>
  <div className="mx-auto max-w-7xl">
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-950 px-8 py-14 md:px-14 lg:py-16">
      
      {/* Decorative Glow */}
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>

      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        
        {/* Left Content */}
        <div>
          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            STFL Premium
          </span>

          <h2 className="mt-6 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Go Beyond Market Noise.
            <span className="text-emerald-400">
              {" "}Research with Greater Clarity.
            </span>
          </h2>

          <p className="mt-6 max-w-2xl leading-7 text-slate-400">
            Unlock premium research, curated investment ideas, advanced
            market insights and powerful tools designed to support more
            informed investment decisions.
          </p>
        </div>

        {/* Right Content */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7">
          <h3 className="text-xl font-bold">
            Premium Access Includes
          </h3>

          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex gap-3">
              <span className="font-bold text-emerald-400">✓</span>
              <span>Curated long-term investment research</span>
            </div>

            <div className="flex gap-3">
              <span className="font-bold text-emerald-400">✓</span>
              <span>Stocks on the Move insights</span>
            </div>

            <div className="flex gap-3">
              <span className="font-bold text-emerald-400">✓</span>
              <span>Advanced fundamental and technical tools</span>
            </div>

            <div className="flex gap-3">
              <span className="font-bold text-emerald-400">✓</span>
              <span>Premium research reports and market commentary</span>
            </div>
          </div>

          <button className="mt-8 w-full rounded-xl bg-emerald-500 px-6 py-4 font-bold text-slate-950 transition hover:bg-emerald-400">
            Explore Premium Membership →
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Educational and research content. Market risks apply.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
{/* Footer */}
<footer className="border-t border-slate-800 bg-slate-950 px-6 pt-16">
  <div className="mx-auto max-w-7xl">
    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">

      {/* Brand */}
      <div className="lg:col-span-2">
        <Image
          src="/sharetradingforlivingwithoutbg.png"
          alt="Share Trading For Living"
          width={170}
          height={100}
          className="h-20 w-auto"
        />

        <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
          STFL brings stock research, market intelligence, investment
          education and analytical tools together to help investors make
          more informed decisions.
        </p>

        <p className="mt-5 text-sm font-semibold text-emerald-400">
          Research Smarter. Trade Smarter. Invest Better.
        </p>
      </div>

      {/* Research */}
      <div>
        <h3 className="font-bold text-white">Research</h3>

        <div className="mt-5 space-y-3 text-sm text-slate-400">
          <a href="#" className="block transition hover:text-emerald-400">
            Stock Research
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Long-Term Picks
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Stocks on the Move
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            IPO Research
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Mutual Funds
          </a>
        </div>
      </div>

      {/* Learn */}
      <div>
        <h3 className="font-bold text-white">Learn</h3>

        <div className="mt-5 space-y-3 text-sm text-slate-400">
          <a href="#" className="block transition hover:text-emerald-400">
            Trading Basics
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Technical Analysis
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Fundamental Analysis
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Options Trading
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            STFL Academy
          </a>
        </div>
      </div>

      {/* Company */}
      <div>
        <h3 className="font-bold text-white">Company</h3>

        <div className="mt-5 space-y-3 text-sm text-slate-400">
          <a href="#" className="block transition hover:text-emerald-400">
            About STFL
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Blog
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Contact
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Privacy Policy
          </a>
          <a href="#" className="block transition hover:text-emerald-400">
            Terms & Conditions
          </a>
        </div>
      </div>
    </div>

    {/* Disclaimer */}
    <div className="mt-14 border-t border-slate-800 py-8">
      <p className="text-xs leading-6 text-slate-500">
        <span className="font-semibold text-slate-400">
          Market Risk Disclaimer:
        </span>{" "}
        Investments in securities markets are subject to market risks.
        Please read all related documents carefully before investing.
        Information provided on STFL is intended for educational and
        research purposes and should not be considered a guarantee of
        returns. Investors should conduct their own research and consult a
        qualified financial adviser where appropriate.
      </p>
    </div>

    {/* Copyright */}
    <div className="flex flex-col gap-3 border-t border-slate-800 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
      <p>
        © 2026 Share Trading For Living. All rights reserved.
      </p>

      <p>
        Built for smarter market research.
      </p>
    </div>
  </div>
</footer>

         </main>
  );
}