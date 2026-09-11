import GlobalMarketCuesPanel from "@/components/market-intelligence/GlobalMarketCuesPanel";
import IndiaVixSentimentPanel from "@/components/market-intelligence/IndiaVixSentimentPanel";
import IndianIndicesPanel from "@/components/market-intelligence/IndianIndicesPanel";
import InstitutionalFlowPanel from "@/components/market-intelligence/InstitutionalFlowPanel";
import MarketBreadthPanel from "@/components/market-intelligence/MarketBreadthPanel";
import StocksOnTheMovePanel from "@/components/market-intelligence/StocksOnTheMovePanel";


export default function Page() {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
  STFL Market Intelligence
</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
            Follow where the market is moving
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            Analyse index direction,
            sector momentum,
            institutional activity,
            market breadth, volatility
            and stocks showing unusual
            price or volume movement.
          </p>
        </section>

        <div className="mt-8 space-y-8">
          <IndiaVixSentimentPanel />

          <GlobalMarketCuesPanel />

          <MarketBreadthPanel />

          <InstitutionalFlowPanel />

          <IndianIndicesPanel />

          <StocksOnTheMovePanel />
        </div>
      </div>
    </main>
  );
}