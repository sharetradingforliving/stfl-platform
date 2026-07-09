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
    {/* Sticky Dashboard Navigation */}
<nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
  <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-6 py-4 text-sm font-semibold text-slate-400">
    <a
      href="#overview"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      Overview
    </a>

    <a
      href="#financials"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      Financials
    </a>

    <a
      href="#valuation"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      Valuation
    </a>

    <a
      href="#technical"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      Technical
    </a>

    <a
      href="#shareholding"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      Shareholding
    </a>

    <a
      href="#news"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      News
    </a>

    <a
      href="#ai-research"
      className="whitespace-nowrap transition hover:text-emerald-400"
    >
      AI Research
    </a>
  </div>
</nav>
    {/* Company Snapshot */}
<section
  id="overview"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-950"
>
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
<section
  id="financials"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-900/40"
>
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
<section
  id="valuation"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-950"
>
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
{/* Technical Analysis */}
{/* Technical Analysis */}
<section
  id="technical"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-900/40"
>
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Technical Analysis
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Trend, Momentum & Key Price Levels
        </h2>

        <p className="mt-3 text-slate-400">
          Review technical indicators, moving averages and important support
          and resistance levels.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO DATA
      </span>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Trend */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">Overall Trend</p>

        <p className="mt-3 text-2xl font-bold text-emerald-400">
          Bullish
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Price is trading above major moving averages.
        </p>
      </div>

      {/* RSI */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">RSI (14)</p>

        <p className="mt-3 text-2xl font-bold">
          61.40
        </p>

        <p className="mt-2 text-sm font-semibold text-emerald-400">
          Positive Momentum
        </p>
      </div>

      {/* MACD */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">MACD</p>

        <p className="mt-3 text-2xl font-bold text-emerald-400">
          Bullish Crossover
        </p>

        <p className="mt-2 text-sm text-slate-500">
          MACD is trading above its signal line.
        </p>
      </div>

      {/* Moving Averages */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">
          Moving-Average Signal
        </p>

        <p className="mt-3 text-2xl font-bold text-emerald-400">
          Buy
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Price is above the 20-day, 50-day and 200-day averages.
        </p>
      </div>

      {/* Support */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">
          Key Support
        </p>

        <p className="mt-3 text-2xl font-bold">
          ₹1,485
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Important demand area based on recent price action.
        </p>
      </div>

      {/* Resistance */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">
          Key Resistance
        </p>

        <p className="mt-3 text-2xl font-bold">
          ₹1,610
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Important supply zone and potential breakout level.
        </p>
      </div>
    </div>

    {/* Technical Signal Summary */}
    <div className="mt-6 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            STFL Technical Signal
          </p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-400">
            Moderately Bullish
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Momentum and moving-average indicators are positive. The stock
            remains above key support, while a sustained move above resistance
            may strengthen the bullish trend.
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-emerald-500/30 bg-slate-950/60 px-6 py-4 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Signal Score
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-400">
            7.5 / 10
          </p>
        </div>
      </div>
    </div>

    <p className="mt-6 text-xs leading-5 text-slate-500">
      Technical indicators and price levels are illustrative placeholders,
      not trading recommendations. Live historical prices and dynamically
      calculated indicators will be connected during the market-data phase.
    </p>
  </div>
</section>
{/* Shareholding Pattern */}
{/* Shareholding Pattern */}
<section
  id="shareholding"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-950"
>
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Shareholding Pattern
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Who Owns the Company?
        </h2>

        <p className="mt-3 text-slate-400">
          Review promoter, institutional and public ownership along with
          quarterly changes in shareholding.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO DATA
      </span>
    </div>

    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Shareholding Cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Promoter Holding</p>

          <p className="mt-3 text-3xl font-bold">
            50.11%
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-400">
            No change QoQ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Foreign Institutional Investors
          </p>

          <p className="mt-3 text-3xl font-bold">
            21.72%
          </p>

          <p className="mt-3 text-sm font-semibold text-red-400">
            ▼ 0.18% QoQ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Domestic Institutional Investors
          </p>

          <p className="mt-3 text-3xl font-bold">
            18.34%
          </p>

          <p className="mt-3 text-sm font-semibold text-emerald-400">
            ▲ 0.24% QoQ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Public & Other Shareholders
          </p>

          <p className="mt-3 text-3xl font-bold">
            9.83%
          </p>

          <p className="mt-3 text-sm font-semibold text-slate-400">
            ▼ 0.06% QoQ
          </p>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <div>
            <h3 className="text-xl font-bold">
              Ownership Distribution
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Latest quarterly ownership mix and historical holding trends.
            </p>
          </div>

          <span className="h-fit rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400">
            CHART PLACEHOLDER
          </span>
        </div>

        <div className="mt-8 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-400">
              Shareholding Chart
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              An interactive ownership chart and quarterly trend will appear
              here after the shareholding-data integration.
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="mt-6 text-xs leading-5 text-slate-500">
      Shareholding figures are illustrative placeholders. Live quarterly
      shareholding disclosures will be connected during the data-integration
      phase.
    </p>
  </div>
</section>
{/* News & Corporate Announcements */}
{/* News & Corporate Announcements */}
<section
  id="news"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-900/40"
>
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          News & Announcements
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Latest Company Developments
        </h2>

        <p className="mt-3 text-slate-400">
          Track important company news, exchange filings, results and
          corporate actions in one place.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO CONTENT
      </span>
    </div>

    <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Latest News */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Recent Company News</h3>

          <button className="text-sm font-semibold text-emerald-400">
            View All →
          </button>
        </div>

        <div className="mt-6 divide-y divide-slate-800">
          <article className="py-5 first:pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                BUSINESS UPDATE
              </span>

              <span className="text-xs text-slate-500">
                Demo date
              </span>
            </div>

            <h4 className="mt-3 text-lg font-semibold">
              Company reports progress across key business segments
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              A concise summary of the latest business development will
              appear here after live news integration.
            </p>
          </article>

          <article className="py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                RESULTS
              </span>

              <span className="text-xs text-slate-500">
                Demo date
              </span>
            </div>

            <h4 className="mt-3 text-lg font-semibold">
              Quarterly financial performance and management commentary
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Revenue, profitability, segment performance and management
              guidance will be summarized here.
            </p>
          </article>

          <article className="py-5 pb-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
                CORPORATE ACTION
              </span>

              <span className="text-xs text-slate-500">
                Demo date
              </span>
            </div>

            <h4 className="mt-3 text-lg font-semibold">
              Dividend, bonus, split and other corporate-action updates
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Important record dates, ex-dates and shareholder updates
              will be displayed here.
            </p>
          </article>
        </div>
      </div>

      {/* Exchange Announcements */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7">
        <h3 className="text-xl font-bold">
          Exchange Announcements
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Latest regulatory filings and disclosures submitted to the stock
          exchanges.
        </p>

        <div className="mt-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Financial Results
            </p>

            <p className="mt-2 font-semibold">
              Quarterly results and investor presentation
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Demo filing
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Board Meeting
            </p>

            <p className="mt-2 font-semibold">
              Board-meeting outcome and key decisions
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Demo filing
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Corporate Disclosure
            </p>

            <p className="mt-2 font-semibold">
              Material event and regulatory disclosure
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Demo filing
            </p>
          </div>
        </div>

        <button className="mt-6 w-full rounded-xl border border-emerald-500 px-5 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950">
          View All Exchange Filings →
        </button>
      </div>
    </div>

    <p className="mt-6 text-xs leading-5 text-slate-500">
      News and announcements shown above are placeholders. Live company news,
      exchange filings and corporate-action data will be connected during the
      data-integration phase.
    </p>
  </div>
</section>
{/* STFL AI Research Summary */}
{/* STFL AI Research Summary */}
<section
  id="ai-research"
  className="scroll-mt-32 border-b border-slate-800 bg-slate-950"
>
  <div className="mx-auto max-w-7xl px-6 py-16">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          STFL AI Research
        </p>

        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Research Summary & Investment Outlook
        </h2>

        <p className="mt-3 max-w-3xl text-slate-400">
          A structured view of business quality, growth drivers, risks,
          valuation and technical momentum.
        </p>
      </div>

      <span className="w-fit rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
        DEMO AI ANALYSIS
      </span>
    </div>

    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {/* Business Strengths */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
          ✓
        </div>

        <h3 className="mt-5 text-xl font-bold">
          Business Strengths
        </h3>

        <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
          <li className="flex gap-3">
            <span className="text-emerald-400">•</span>
            Diversified business portfolio with leadership across key sectors.
          </li>

          <li className="flex gap-3">
            <span className="text-emerald-400">•</span>
            Strong scale, brand presence and long-term growth opportunities.
          </li>

          <li className="flex gap-3">
            <span className="text-emerald-400">•</span>
            Healthy cash-generation potential across major business segments.
          </li>
        </ul>
      </div>

      {/* Growth Drivers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          ↗
        </div>

        <h3 className="mt-5 text-xl font-bold">
          Key Growth Drivers
        </h3>

        <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
          <li className="flex gap-3">
            <span className="text-blue-400">•</span>
            Expansion in consumer, digital and new-growth businesses.
          </li>

          <li className="flex gap-3">
            <span className="text-blue-400">•</span>
            Capacity additions and improving operating efficiency.
          </li>

          <li className="flex gap-3">
            <span className="text-blue-400">•</span>
            Long-term opportunities from technology and energy transition.
          </li>
        </ul>
      </div>

      {/* Key Risks */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-2xl">
          !
        </div>

        <h3 className="mt-5 text-xl font-bold">
          Key Risks
        </h3>

        <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
          <li className="flex gap-3">
            <span className="text-red-400">•</span>
            Large capital-expenditure requirements may affect cash flows.
          </li>

          <li className="flex gap-3">
            <span className="text-red-400">•</span>
            Commodity cycles and regulatory changes may affect profitability.
          </li>

          <li className="flex gap-3">
            <span className="text-red-400">•</span>
            Execution risk across multiple large growth initiatives.
          </li>
        </ul>
      </div>
    </div>

    {/* Research Views */}
    <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Fundamental View
        </p>

        <p className="mt-3 text-2xl font-bold text-emerald-400">
          Positive
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Business scale and long-term growth drivers support the fundamental
          outlook.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Valuation View
        </p>

        <p className="mt-3 text-2xl font-bold text-amber-400">
          Fairly Valued
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Current valuation appears reasonable relative to illustrative
          industry and intrinsic-value estimates.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Technical View
        </p>

        <p className="mt-3 text-2xl font-bold text-emerald-400">
          Moderately Bullish
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Momentum and moving-average indicators remain constructive above
          key support.
        </p>
      </div>
    </div>

    {/* Overall Outlook */}
    <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/50 bg-emerald-500/10">
      <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Overall STFL Research Outlook
          </p>

          <h3 className="mt-3 text-3xl font-bold text-emerald-400">
            Positive with a Long-Term Perspective
          </h3>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
            The illustrative research view reflects strong business scale,
            diversified growth opportunities and constructive technical
            momentum. Investors should continue to monitor valuation,
            execution progress, cash flows and business-specific risks.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 px-8 py-6 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Research Score
          </p>

          <p className="mt-2 text-4xl font-bold text-emerald-400">
            8.0 / 10
          </p>
        </div>
      </div>
    </div>

    <p className="mt-6 text-xs leading-5 text-slate-500">
      This is illustrative demo analysis and not an investment recommendation.
      The final AI research summary will be generated using company financials,
      exchange filings, valuation models, news and technical indicators after
      live-data integration.
    </p>
  </div>
</section>
{/* Dashboard Footer */}
<footer className="border-t border-slate-800 bg-slate-950">
  <div className="mx-auto max-w-7xl px-6 py-12">
    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
      <div>
        <p className="text-lg font-bold text-white">
          Share Trading For Living
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Research Indian stocks, study market trends and make informed
          investment decisions with STFL.
        </p>
      </div>

      <a
        href="/"
        className="w-fit rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
      >
        ← Back to Homepage
      </a>
    </div>

    <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <p className="text-sm font-bold text-amber-400">
        Important Research Disclaimer
      </p>

      <p className="mt-3 text-xs leading-6 text-slate-400">
        Information, market data, financial metrics, valuation estimates,
        technical indicators, scores and research views displayed on this
        dashboard are for educational and informational purposes only. They
        should not be considered investment advice, a stock recommendation,
        or an offer to buy or sell securities. Investors should conduct their
        own research and consult a SEBI-registered investment adviser before
        making investment decisions.
      </p>
    </div>

    <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        © 2026 Share Trading For Living. All rights reserved.
      </p>

      <p>
        Demo dashboard • Live-data integration pending
      </p>
    </div>
  </div>
</footer>
  </main>
);
}