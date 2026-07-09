import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
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
              className="h-16 w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            <a href="#" className="text-emerald-400">
              Home
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              Markets
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              Stock Research
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              Technical Analysis
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              IPO
            </a>
            <a href="#" className="transition hover:text-emerald-400">
              Mutual Funds
            </a>
            <a href="#" className="transition hover:text-emerald-400">
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

            <button className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
              Premium
            </button>
          </div>
        </div>
      </header>
{/* Market Snapshot Ribbon */}
<section className="border-b border-slate-800 bg-slate-900">
  <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 overflow-x-auto px-6 py-3 text-sm whitespace-nowrap">
    <div>
      <span className="text-slate-400">NIFTY 50</span>
      <span className="ml-2 font-semibold text-white">25,480.65</span>
      <span className="ml-2 text-emerald-400">▲ 0.42%</span>
    </div>

    <div>
      <span className="text-slate-400">BANK NIFTY</span>
      <span className="ml-2 font-semibold text-white">57,820.30</span>
      <span className="ml-2 text-emerald-400">▲ 0.35%</span>
    </div>

    <div>
      <span className="text-slate-400">SENSEX</span>
      <span className="ml-2 font-semibold text-white">83,210.50</span>
      <span className="ml-2 text-emerald-400">▲ 0.38%</span>
    </div>

    <div>
      <span className="text-slate-400">INDIA VIX</span>
      <span className="ml-2 font-semibold text-white">12.45</span>
      <span className="ml-2 text-red-400">▼ 1.20%</span>
    </div>

    <div>
      <span className="text-slate-400">GOLD</span>
      <span className="ml-2 font-semibold text-white">₹98,420</span>
      <span className="ml-2 text-emerald-400">▲ 0.26%</span>
    </div>

    <div>
      <span className="text-slate-400">USD/INR</span>
      <span className="ml-2 font-semibold text-white">85.74</span>
      <span className="ml-2 text-red-400">▼ 0.08%</span>
    </div>
  </div>
</section>
      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-89px)] items-center justify-center px-6 py-20">
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
<div className="mx-auto mt-10 flex max-w-2xl items-center rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-lg">
  <span className="pl-4 text-xl">⌕</span>

  <input
    type="text"
    placeholder="Search stocks, indices, IPOs or mutual funds..."
    className="w-full bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
  />

  <button className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">
    Search
  </button>
</div>
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
<section className="bg-slate-950 px-6 py-20">
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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

<section className="border-t border-slate-800 bg-slate-900/50 px-6 py-20">
  <div className="mx-auto max-w-7xl">
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
        <h3 className="mt-5 text-xl font-bold">Stocks on the Move</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Discover stocks showing strong price action, volume activity and
          market momentum.
        </p>
        <button className="mt-6 font-semibold text-emerald-400">
          Explore Stocks →
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

         </main>
  );
}