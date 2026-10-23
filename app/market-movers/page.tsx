import Link from "next/link";

import StocksOnTheMovePanel from "@/components/market-intelligence/StocksOnTheMovePanel";

export default function MarketMoversPage() {
  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <section className="market-movers-hero border-b border-slate-800 bg-gradient-to-b from-cyan-950/20 to-[#020817] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            STFL Market Movers
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            Top Gainers and Losers
            Today - NSE Market Movers
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 md:text-lg">
            Track stocks on the move
            across the NSE, including
            top gainers, top losers,
            volume leaders and the most
            actively traded shares by
            value.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/market-intelligence"
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Market Intelligence
            </Link>

            <Link
              href="/fundamental-research/discovery"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Stock Discovery
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <StocksOnTheMovePanel />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-bold text-white">
                How to Read Market
                Movers
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Top gainers and losers
                show the strongest price
                movements in the latest
                market session. Always
                compare percentage
                movement with trading
                volume, liquidity, news
                and the broader market
                trend.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-bold text-white">
                Volume and Value
                Leaders
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Volume leaders show
                where the greatest
                number of shares changed
                hands. Value leaders
                highlight stocks with
                significant traded
                turnover, which can help
                identify where market
                participation is
                concentrated.
              </p>
            </article>
          </div>

          <section className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h2 className="text-lg font-bold text-amber-300">
              Research Before You Trade
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              A large price or volume
              movement is not by itself
              a buy or sell signal.
              Review company
              fundamentals, technical
              structure, market news,
              liquidity and risk before
              making an investment or
              trading decision.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
