type CompanyPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CompanyPage({
  params,
}: CompanyPageProps) {
  const { symbol } = await params;
  const stockSymbol = symbol.toUpperCase();

  return (
  <main className="min-h-screen bg-slate-950 text-white">
    <div className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <a
          href="/"
          className="text-sm font-semibold text-slate-400 transition hover:text-emerald-400"
        >
          ← Back to Home
        </a>
      </div>
    </div>

    <section className="border-b border-slate-800 bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              STFL Company Research
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-bold md:text-6xl">
                {stockSymbol}
              </h1>

              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-400">
                NSE
              </span>
            </div>

            <p className="mt-4 text-lg text-slate-300">
              Complete Company Dashboard
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Company overview • Financials • Valuation • Technical analysis • Research
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Current Market Price</p>

            <div className="mt-2 flex flex-wrap items-end gap-4">
              <p className="text-4xl font-bold">₹1,528.40</p>

              <p className="pb-1 font-semibold text-emerald-400">
                ▲ 1.24%
              </p>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Demo market data
            </p>

            <button className="mt-5 w-full rounded-xl border border-emerald-500 px-5 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950">
              + Add to Watchlist
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
);
}