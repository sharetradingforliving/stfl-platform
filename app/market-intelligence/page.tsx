import IndianIndicesPanel from "@/components/market-intelligence/IndianIndicesPanel";
import StocksOnTheMovePanel from "@/components/market-intelligence/StocksOnTheMovePanel";
import MarketBreadthPanel from "@/components/market-intelligence/MarketBreadthPanel";
import InstitutionalFlowPanel from "@/components/market-intelligence/InstitutionalFlowPanel";

const upcomingSections = [
  
    
    {
    title: "Volatility and Market Risk",
    description:
      "India VIX, volatility regime and broader market-risk interpretation.",
  },
  {
    title: "Global Market Cues",
    description:
      "International indices, commodities, currencies and signals affecting Indian markets.",
  },
  {
    title: "Corporate Actions",
    description:
      "Dividends, splits, bonuses, rights issues and important upcoming ex-dates.",
  },
];

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
            Analyse index direction, sector momentum,
            institutional activity, market breadth,
            volatility and stocks showing unusual
            price or volume movement.
          </p>
        </section>

        <div className="mt-8">
  <MarketBreadthPanel />
</div>

<div className="mt-8">
  <InstitutionalFlowPanel />
</div>

<div className="mt-8">
  <IndianIndicesPanel />
</div>

<div className="mt-8">
  <StocksOnTheMovePanel />
</div>

        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Intelligence modules
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Additional market analysis
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcomingSections.map(
              (section) => (
                <article
                  key={section.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
                >
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Next integration
                  </span>

                  <h3 className="mt-5 text-lg font-semibold">
                    {section.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {section.description}
                  </p>
                </article>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}