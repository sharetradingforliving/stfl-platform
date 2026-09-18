import type {
  Metadata,
} from "next";

import AstrologyPrimer from "@/components/market-astrology/AstrologyPrimer";
import HistoricalMarketEventsPanel from "@/components/market-astrology/HistoricalMarketEventsPanel";
import PlanetaryPositionsPanel from "@/components/market-astrology/PlanetaryPositionsPanel";
import PlanetaryEventCalendar from "@/components/market-astrology/PlanetaryEventCalendar";

export const metadata: Metadata = {
  title:
    "Market Astrology Research | STFL",
  description:
    "Experimental research comparing verified planetary configurations with historical market behaviour.",
};

const planetaryFramework = [
  {
    body: "Jupiter",
    role: "Structural cycle",
    hypothesis:
      "Traditionally associated with expansion, liquidity, optimism and risk appetite.",
    markets:
      "Broad-market participation, financials, consumption and metals.",
  },
  {
    body: "Saturn",
    role: "Structural cycle",
    hypothesis:
      "Traditionally associated with restriction, discipline, consolidation and pressure.",
    markets:
      "Capital expenditure, infrastructure, commodities and defensive rotation.",
  },
  {
    body: "Uranus",
    role: "Structural cycle",
    hypothesis:
      "Traditionally associated with shocks, disruption, innovation and unexpected change.",
    markets:
      "Technology, emerging industries and volatility.",
  },
  {
    body: "Neptune",
    role: "Structural cycle",
    hypothesis:
      "Traditionally associated with uncertainty, narratives and changing expectations.",
    markets:
      "Sentiment, policy narratives and sector rotation.",
  },
  {
    body: "Pluto",
    role: "Structural cycle",
    hypothesis:
      "Traditionally associated with structural transformation and systemic change.",
    markets:
      "Long-term industrial change, concentration and emerging themes.",
  },
  {
    body: "Mars",
    role: "Potential trigger",
    hypothesis:
      "Traditionally associated with urgency, momentum, conflict and forceful movement.",
    markets:
      "Energy, defence, metals and high-beta segments.",
  },
  {
    body: "Mercury",
    role: "Short-term context",
    hypothesis:
      "Traditionally associated with communication, information flow and market reactions.",
    markets:
      "Technology, media, exchanges and short-term sentiment.",
  },
];

const confirmationRequirements = [
  "Price trend and market structure",
  "Momentum and volume",
  "Market breadth and sector participation",
  "India VIX and volatility regime",
  "FII and DII institutional activity",
  "Historical sample size and consistency",
];

export default function MarketAstrologyPage() {
  return (
    <main className="min-h-screen bg-[#020817] text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-b from-indigo-950/30 to-[#020817]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Experimental Research
              </span>

              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                No active signal published
              </span>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              STFL Planetary Market Research
              Terminal
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
              Market Astrology Research
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Examine verified astronomical
              configurations alongside
              documented market crashes,
              corrections and recoveries. STFL
              separates calculations,
              traditional interpretations and
              observed market evidence.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <HistoricalMarketEventsPanel />

        <AstrologyPrimer />

        <details className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
          <summary className="cursor-pointer list-none px-6 py-6">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                  Research methodology
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  Planetary Research Framework
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Traditional hypotheses that
                  STFL may test against
                  historical market data.
                </p>
              </div>

              <span className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                View framework{" "}

                <span className="ml-2 inline-block transition-transform group-open:rotate-180">
                  ▼
                </span>
              </span>
            </div>
          </summary>

          <div className="overflow-x-auto border-t border-slate-800">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-800 bg-slate-900/40">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">
                    Body
                  </th>

                  <th className="px-6 py-4">
                    Research role
                  </th>

                  <th className="px-6 py-4">
                    Traditional hypothesis
                  </th>

                  <th className="px-6 py-4">
                    Areas to examine
                  </th>

                  <th className="px-6 py-4">
                    Evidence
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {planetaryFramework.map(
                  (item) => (
                    <tr
                      key={item.body}
                      className="transition hover:bg-slate-900/50"
                    >
                      <td className="px-6 py-5 font-semibold text-white">
                        {item.body}
                      </td>

                      <td className="px-6 py-5 text-sm text-violet-300">
                        {item.role}
                      </td>

                      <td className="px-6 py-5 text-sm leading-6 text-slate-300">
                        {item.hypothesis}
                      </td>

                      <td className="px-6 py-5 text-sm leading-6 text-slate-400">
                        {item.markets}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex whitespace-nowrap rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
                          Not tested
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 px-6 py-4 text-xs leading-5 text-slate-500">
            Rahu, Ketu and nakshatras are
            excluded because the current
            calculation engine uses the
            tropical zodiac. They can be added
            later through a separate sidereal
            research model.
          </div>
        </details>

        <PlanetaryEventCalendar />

        <PlanetaryPositionsPanel />

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Market validation
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Confirmation Before Interpretation
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            A planetary observation cannot
            become an STFL research view unless
            relevant historical and current
            market evidence also supports it.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {confirmationRequirements.map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />

                    <span className="text-sm text-slate-300">
                      {item}
                    </span>
                  </div>

                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Required
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold text-amber-200">
            Research Disclaimer
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Market Astrology is an
            experimental research area.
            Planetary observations do not
            establish causation and must not be
            treated as predictions or standalone
            trading signals. Information
            presented by STFL is for education
            and research only. Always evaluate
            market risk, conduct independent
            research and consult a qualified
            financial adviser where appropriate.
          </p>
        </section>
      </div>
    </main>
  );
}