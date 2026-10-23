import Link from "next/link";

import StocksOnTheMovePanel from "@/components/market-intelligence/StocksOnTheMovePanel";

export default function MarketMoversPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-100 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-slate-800 dark:via-slate-900 dark:to-[#020817]">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-400">
            STFL Market Movers
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl dark:text-white">
            Top Gainers and Losers Today —
            NSE Market Movers
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-400">
            Track stocks on the move across
            the NSE, including top gainers,
            top losers, 52-week highs,
            52-week lows, volume leaders and
            the most actively traded shares
            by value.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/market-intelligence"
              className="rounded-xl border border-cyan-600 bg-cyan-50 px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
            >
              Market Intelligence
            </Link>

            <Link
              href="/fundamental-research/discovery"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            >
              Stock Discovery
            </Link>
          </div>
        </div>
      </section>

      {/* Market-movement dashboard */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <StocksOnTheMovePanel />

          {/* Educational information */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                How to Read Market Movers
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Top gainers and losers show
                the strongest price movements
                in the latest market session.
                Always compare percentage
                movement with trading volume,
                liquidity, news and the
                broader market trend.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                Volume and Value Leaders
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                Volume leaders show where the
                greatest number of shares
                changed hands. Value leaders
                highlight stocks with
                significant traded turnover,
                which can help identify where
                market participation is
                concentrated.
              </p>
            </article>
          </div>

          {/* Risk disclaimer */}
          <section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5">
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">
              Research Before You Trade
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-400">
              A large price or volume movement
              is not by itself a buy or sell
              signal. Review company
              fundamentals, technical
              structure, market news,
              liquidity and risk before
              making an investment or trading
              decision.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}