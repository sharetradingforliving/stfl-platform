import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About STFL",
  description:
    "Learn about Share Trading For Living, an Indian market research platform bringing together market data, fundamental research, technical analysis and investor education.",

  alternates: {
    canonical: "/about",
  },

  openGraph: {
    title: "About STFL | Share Trading For Living",
    description:
      "Learn about the purpose, research approach and development vision behind the STFL investment research platform.",
    url: "https://sharetradingforliving.com/about",
    type: "website",
  },
};

const principles = [
  {
    title: "Research Before Decisions",
    description:
      "STFL encourages investors and traders to examine market data, company fundamentals, price behaviour and risk before making financial decisions.",
  },
  {
    title: "Clarity Over Complexity",
    description:
      "Financial information should be understandable. STFL aims to convert complex market data into structured and clearly explained research.",
  },
  {
    title: "Evidence Over Noise",
    description:
      "Our tools focus on measurable market information instead of rumours, sensational claims or promises of assured returns.",
  },
  {
    title: "Education With Responsibility",
    description:
      "Every research tool should help users understand both opportunities and risks. STFL does not treat a single indicator as a complete investment decision.",
  },
];

const researchAreas = [
  "Indian company research",
  "Fundamental analysis",
  "Technical analysis",
  "Market intelligence",
  "FII and DII activity",
  "Market movers",
  "Corporate actions",
  "IPO research",
  "Mutual fund research",
  "Unlisted-share information",
  "Investor education",
  "AI-assisted research",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-emerald-950/30 dark:via-slate-950 dark:to-[#020817]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400">
            About STFL
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Research Smarter. Trade Smarter. Invest Better.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Share Trading For Living, also known as STFL, is an Indian financial
            research platform designed to bring market data, company research,
            technical analysis and investor education together in one structured
            environment.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <article>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
              Our Purpose
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Helping market participants conduct better research
            </h2>

            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600 dark:text-slate-400">
              <p>
                Financial markets generate an enormous amount of information
                every day. Prices, financial statements, corporate
                announcements, technical indicators and institutional activity
                can become difficult to study across multiple sources.
              </p>

              <p>
                STFL is being developed to organise this information into
                practical research dashboards. Our objective is to help users
                examine a company or market from multiple perspectives without
                presenting speculation as certainty.
              </p>

              <p>
                The platform combines publicly available information, licensed
                or authorised data sources, analytical calculations and
                explanatory content. Some tools may use automated or AI-assisted
                processes to organise and interpret information.
              </p>
            </div>
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
            <h2 className="text-xl font-bold">STFL Research Areas</h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {researchAreas.map((area) => (
                <div
                  key={area}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />

                  <span>{area}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-100/70 px-6 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
            Our Principles
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            How we approach financial research
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-none"
              >
                <h3 className="text-xl font-bold">{principle.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-8 dark:border-cyan-500/20 dark:bg-cyan-500/5 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-400">
              Important Information
            </p>

            <h2 className="mt-4 text-2xl font-bold">
              Research and education—not assured returns
            </h2>

            <p className="mt-5 max-w-4xl leading-8 text-slate-600 dark:text-slate-400">
              Information and analytical outputs available on STFL are intended
              for education and research. They should not be interpreted as a
              guarantee of performance or as personalized investment, legal or
              tax advice. Securities-market investments involve risk, including
              possible loss of capital.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/disclaimer"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Read Disclaimer
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                Contact STFL
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
