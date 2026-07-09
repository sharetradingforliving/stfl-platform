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
    {/* Company Snapshot */}
<section className="border-b border-slate-800 bg-slate-950">
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Company Snapshot
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Key Market Metrics
        </h2>

        <p className="mt-3 text-slate-400">
          A quick view of important valuation, return and price indicators.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO DATA
      </span>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500">
        <p className="text-sm text-slate-400">Market Cap</p>
        <p className="mt-3 text-2xl font-bold">₹20.68 Lakh Cr</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500">
        <p className="text-sm text-slate-400">P/E Ratio</p>
        <p className="mt-3 text-2xl font-bold">24.85</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500">
        <p className="text-sm text-slate-400">Return on Equity</p>
        <p className="mt-3 text-2xl font-bold">9.72%</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500">
        <p className="text-sm text-slate-400">Dividend Yield</p>
        <p className="mt-3 text-2xl font-bold">0.36%</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500">
        <p className="text-sm text-slate-400">52-Week High</p>
        <p className="mt-3 text-2xl font-bold">₹1,608.80</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-500">
        <p className="text-sm text-slate-400">52-Week Low</p>
        <p className="mt-3 text-2xl font-bold">₹1,114.85</p>
      </div>
    </div>
  </div>
</section>
{/* Financial Performance */}
<section className="border-b border-slate-800 bg-slate-900/40">
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Financial Performance
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Business Growth & Profitability
        </h2>

        <p className="mt-3 text-slate-400">
          Review key annual financial indicators and their year-on-year movement.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO DATA
      </span>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">Revenue</p>
        <p className="mt-3 text-2xl font-bold">₹10.72 Lakh Cr</p>
        <p className="mt-3 text-sm font-semibold text-emerald-400">
          ▲ 7.1% YoY
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">EBITDA</p>
        <p className="mt-3 text-2xl font-bold">₹1.83 Lakh Cr</p>
        <p className="mt-3 text-sm font-semibold text-emerald-400">
          ▲ 5.4% YoY
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">Net Profit</p>
        <p className="mt-3 text-2xl font-bold">₹81,309 Cr</p>
        <p className="mt-3 text-sm font-semibold text-emerald-400">
          ▲ 2.9% YoY
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">Earnings Per Share</p>
        <p className="mt-3 text-2xl font-bold">₹60.12</p>
        <p className="mt-3 text-sm font-semibold text-emerald-400">
          ▲ 3.2% YoY
        </p>
      </div>
    </div>

    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-7">
      <div className="flex flex-col justify-between gap-3 md:flex-row">
        <div>
          <h3 className="text-xl font-bold">Five-Year Financial Trend</h3>
          <p className="mt-2 text-sm text-slate-400">
            Revenue, profit and margin charts will appear here after the
            financial-data integration.
          </p>
        </div>

        <span className="h-fit rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400">
          CHART PLACEHOLDER
        </span>
      </div>

      <div className="mt-8 flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50">
        <p className="text-sm text-slate-500">
          Interactive financial chart coming in the live-data phase
        </p>
      </div>
    </div>
  </div>
</section>
{/* Valuation Analysis */}
<section className="border-b border-slate-800 bg-slate-950">
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Valuation Analysis
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Is the Stock Fairly Valued?
        </h2>

        <p className="mt-3 text-slate-400">
          Compare important valuation multiples and estimated intrinsic value.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO DATA
      </span>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">Stock P/E</p>
        <p className="mt-3 text-2xl font-bold">24.85</p>
        <p className="mt-2 text-sm text-slate-500">
          Industry P/E: 27.40
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">Price-to-Book Ratio</p>
        <p className="mt-3 text-2xl font-bold">2.18</p>
        <p className="mt-2 text-sm text-slate-500">
          Measures price against book value
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">EV / EBITDA</p>
        <p className="mt-3 text-2xl font-bold">12.64</p>
        <p className="mt-2 text-sm text-slate-500">
          Enterprise-value valuation multiple
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">PEG Ratio</p>
        <p className="mt-3 text-2xl font-bold">1.42</p>
        <p className="mt-2 text-sm text-slate-500">
          Valuation adjusted for earnings growth
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Estimated Intrinsic Value
        </p>
        <p className="mt-3 text-2xl font-bold">₹1,640</p>
        <p className="mt-2 text-sm font-semibold text-emerald-400">
          7.3% above current price
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-6">
        <p className="text-sm text-emerald-300">
          STFL Valuation Signal
        </p>
        <p className="mt-3 text-2xl font-bold text-emerald-400">
          Fairly Valued
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Valuation appears reasonable relative to industry and estimated value.
        </p>
      </div>
    </div>

    <p className="mt-6 text-xs leading-5 text-slate-500">
      Valuation indicators are illustrative placeholders and are not investment
      recommendations. Live financial data and valuation models will be connected
      in the data-integration phase.
    </p>
  </div>
</section>
  </main>
);
}