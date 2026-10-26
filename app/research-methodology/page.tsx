import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Research Methodology",
  description:
    "Understand how STFL calculates technical trends, momentum, support and resistance, market statistics and other research outputs.",

  alternates: {
    canonical: "/research-methodology",
  },

  openGraph: {
    title: "STFL Research Methodology",
    description:
      "Learn how STFL processes market data and generates technical, fundamental and market-intelligence research outputs.",
    url: "https://sharetradingforliving.com/research-methodology",
    type: "website",
  },
};

const methodologyAreas = [
  {
    title: "Market Data",
    description:
      "STFL obtains market prices, historical candles, trading volume and instrument information from exchanges, authorised market-data providers and other identified sources. Availability and update frequency may differ by dataset.",
  },
  {
    title: "Technical Trend",
    description:
      "Trend classification considers price position relative to multiple moving averages, bullish or bearish EMA and SMA alignment, recent swing structure, breakouts or breakdowns and recent price returns.",
  },
  {
    title: "Momentum Analysis",
    description:
      "Momentum assessment may combine RSI, MACD, stochastic indicators and other price-velocity measurements. Momentum describes the strength and direction of recent price behaviour; it does not predict a guaranteed future movement.",
  },
  {
    title: "Volume Analysis",
    description:
      "Volume analysis compares current activity with historical average volume and may evaluate relative volume, accumulation, distribution and whether trading activity supports a price movement.",
  },
  {
    title: "Support and Resistance",
    description:
      "Support and resistance are calculated through a hybrid confluence model using recent swing points, Fibonacci retracements, Classical Pivot levels and moving averages.",
  },
  {
    title: "Technical Bias",
    description:
      "The technical bias summarises multiple technical modules into a directional analytical view. It is not a personalized recommendation, trade instruction, target or stop-loss.",
  },
  {
    title: "Fundamental Research",
    description:
      "Fundamental research may consider financial statements, profitability, growth, balance-sheet strength, cash flows, valuation ratios, peer comparisons and other company information.",
  },
  {
    title: "Market Intelligence",
    description:
      "Market-intelligence tools may evaluate breadth, gainers, losers, traded volume, traded value, institutional activity, market sectors and other aggregated market statistics.",
  },
];

const supportResistanceSteps = [
  {
    label: "Candidate levels",
    detail:
      "Potential price levels are collected from swing highs and lows, Fibonacci calculations, Classical Pivots and selected moving averages.",
  },
  {
    label: "Confluence zones",
    detail:
      "Nearby candidate levels are grouped into zones. Zones supported by multiple methods, repeated touches or stronger structural evidence receive greater confidence.",
  },
  {
    label: "Noise filtering",
    detail:
      "Levels extremely close to the current price may be excluded using price-distance and Average True Range thresholds.",
  },
  {
    label: "Proximity ordering",
    detail:
      "The nearest validated level below price becomes S1 and the nearest validated level above price becomes R1.",
  },
  {
    label: "Secondary levels",
    detail:
      "S2 and R2 are the next distinct validated zones. A minimum separation based on price and selected-timeframe ATR helps prevent nearly identical levels.",
  },
];

const limitations = [
  "Market prices and third-party datasets may be delayed, incomplete or temporarily unavailable.",
  "Corporate actions can distort historical prices when source data has not been appropriately adjusted.",
  "Newly listed securities may have insufficient history for reliable long-period calculations.",
  "Low-liquidity securities can produce unstable prices, indicators and support or resistance zones.",
  "Different timeframes can produce different trend, momentum, volatility and support or resistance results.",
  "Automated and AI-assisted summaries can contain errors and should be independently verified.",
];

export default function ResearchMethodologyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-cyan-50 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-cyan-950/20 dark:via-slate-950 dark:to-[#020817]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-400">
            STFL Research Framework
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Research Methodology
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            This page explains how STFL transforms available market and company
            information into structured analytical outputs.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: 26 October 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
              Our Approach
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Multiple perspectives, clearly separated
            </h2>

            <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
              STFL combines market data, technical calculations, fundamental
              information and explanatory research. Each analytical module
              serves a different purpose, and no single indicator or score
              should be treated as a complete investment decision.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {methodologyAreas.map((area) => (
              <article
                key={area.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none"
              >
                <h3 className="text-xl font-bold">{area.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {area.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-100/70 px-6 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
            Technical Methodology
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            How STFL identifies support and resistance
          </h2>

          <p className="mt-5 max-w-4xl leading-8 text-slate-600 dark:text-slate-400">
            STFL uses a hybrid confluence model instead of depending on one
            formula. This allows the engine to recognise price zones supported
            by different forms of technical evidence.
          </p>

          <div className="mt-10 space-y-4">
            {supportResistanceSteps.map((step, index) => (
              <article
                key={step.label}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-none sm:grid-cols-[auto_1fr]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {index + 1}
                </span>

                <div>
                  <h3 className="text-lg font-bold">{step.label}</h3>

                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {step.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 dark:border-cyan-500/20 dark:bg-cyan-500/5">
            <h3 className="text-lg font-bold">Timeframe awareness</h3>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Technical calculations use the selected chart timeframe. Daily and
              weekly candles contain different price structures and volatility
              measurements; therefore, their trend, momentum, S1, S2, R1 and R2
              values can differ.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400">
            Interpretation
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            What the technical labels mean
          </h2>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[0.8fr_1.2fr] border-b border-slate-200 bg-slate-100 px-5 py-4 text-sm font-bold dark:border-slate-800 dark:bg-slate-900">
              <span>Label</span>
              <span>Meaning</span>
            </div>

            {[
              [
                "Bullish",
                "Positive technical structure based on the selected timeframe and available indicators.",
              ],
              [
                "Bearish",
                "Negative technical structure based on the selected timeframe and available indicators.",
              ],
              ["Neutral", "Mixed or insufficient directional evidence."],
              [
                "Trend Confidence",
                "The strength and consistency of the evidence supporting the trend classification.",
              ],
              [
                "S1 / R1",
                "The nearest validated support and resistance zones.",
              ],
              [
                "S2 / R2",
                "The next distinct validated support and resistance zones.",
              ],
              [
                "Technical Bias",
                "A combined analytical summary, not a personalized trading recommendation.",
              ],
            ].map(([label, meaning]) => (
              <div
                key={label}
                className="grid grid-cols-[0.8fr_1.2fr] border-b border-slate-200 bg-white px-5 py-4 text-sm last:border-b-0 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="pr-4 font-semibold">{label}</span>

                <span className="leading-6 text-slate-600 dark:text-slate-400">
                  {meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-100/70 px-6 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700 dark:text-red-400">
            Known Limitations
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Research outputs require interpretation
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {limitations.map((limitation) => (
              <div
                key={limitation}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <span
                  className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                  aria-hidden="true"
                />

                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {limitation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-500/20 dark:bg-emerald-500/5 md:p-10">
            <h2 className="text-2xl font-bold">
              Responsible use of STFL research
            </h2>

            <p className="mt-4 max-w-4xl leading-8 text-slate-600 dark:text-slate-400">
              STFL research should be considered alongside company disclosures,
              exchange announcements, financial objectives, investment horizon,
              liquidity and risk tolerance. Analytical outputs do not guarantee
              a future result.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/disclaimer"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Read Financial Disclaimer
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                Contact STFL
              </Link>
            </div>
          </div>

          <p className="mt-8 text-xs leading-6 text-slate-500">
            STFL may revise this methodology as its data sources, analytical
            models and research modules evolve.
          </p>
        </div>
      </section>
    </main>
  );
}
