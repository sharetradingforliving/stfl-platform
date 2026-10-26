import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Financial Disclaimer",
  description:
    "Read the financial, investment, market-data and research disclaimer applicable to Share Trading For Living and the STFL platform.",

  alternates: {
    canonical: "/disclaimer",
  },

  openGraph: {
    title: "Financial Disclaimer | Share Trading For Living",
    description:
      "Important information about market risk, research limitations, automated analysis and third-party data used by STFL.",
    url: "https://sharetradingforliving.com/disclaimer",
    type: "website",
  },
};

const disclaimerSections = [
  {
    title: "Educational and Research Purpose",
    content: [
      "Information, calculations, dashboards, articles, charts, indicators and analytical outputs available on Share Trading For Living (STFL) are provided for general education, information and research purposes.",
      "Nothing available on this website should be interpreted as personalized investment advice, legal advice, tax advice, portfolio-management advice or an instruction to buy, sell or hold any security or financial product.",
    ],
  },
  {
    title: "No Assured or Guaranteed Returns",
    content: [
      "STFL does not promise, assure or guarantee investment returns, trading profits, price targets, investment performance or protection from financial loss.",
      "Past performance, historical prices, technical patterns and previous market behaviour do not guarantee future performance.",
    ],
  },
  {
    title: "Securities-Market Risk",
    content: [
      "Investments and trading in securities markets are subject to market risk. Prices may rise or fall rapidly, and investors may lose part or all of the capital invested.",
      "Before making a financial decision, users should consider their investment objectives, financial circumstances, investment horizon, liquidity needs and ability to bear risk.",
    ],
  },
  {
    title: "Technical Analysis and Market Indicators",
    content: [
      "Technical indicators, trend classifications, momentum readings, support and resistance levels, market breadth, institutional-flow information and technical-bias outputs are analytical references based on available market data and defined calculation methodologies.",
      "They are not trade instructions, entry calls, exit calls, stop-loss recommendations, profit targets or guarantees that a security will move in a particular direction.",
    ],
  },
  {
    title: "Fundamental Analysis and Valuation",
    content: [
      "Financial ratios, peer comparisons, valuation models, fair-value estimates and intrinsic-value calculations may depend on historical information, assumptions, forecasts and third-party data.",
      "Small changes in revenue growth, margins, discount rates, terminal growth, capital structure or other assumptions may materially change a valuation result.",
    ],
  },
  {
    title: "Automated and AI-Assisted Analysis",
    content: [
      "Certain STFL features may use automated calculations, algorithms or artificial-intelligence-assisted processes to organise, summarise or interpret information.",
      "Automated outputs may contain errors, omissions, delayed information or incorrect interpretations. Users should independently verify important information from company filings, stock exchanges, regulators and other authoritative sources.",
    ],
  },
  {
    title: "Market Data and Third-Party Sources",
    content: [
      "STFL may obtain prices, historical candles, company information, financial data, exchange information, institutional-flow data, corporate actions and other content from exchanges, regulatory sources, authorised providers or third-party services.",
      "Although reasonable efforts may be made to present accurate and timely information, STFL does not warrant that every item will always be complete, current, uninterrupted or error-free.",
    ],
  },
  {
    title: "Corporate Actions and Adjusted Data",
    content: [
      "Stock splits, bonuses, dividends, rights issues, mergers, demergers and other corporate actions can affect historical prices, indicators and comparisons.",
      "Users should verify whether displayed historical data has been appropriately adjusted before relying on a technical or valuation calculation.",
    ],
  },
  {
    title: "No Trade Execution or Client Suitability Assessment",
    content: [
      "STFL does not execute securities transactions through the research pages of this website and does not assess the personal suitability of a security for an individual user.",
      "General research cannot account for every user's income, liabilities, investment experience, tax position, financial objectives or risk tolerance.",
    ],
  },
  {
    title: "Professional Advice",
    content: [
      "Users requiring personalized investment advice should consult an appropriately qualified and registered professional and independently evaluate the professional's registration and credentials.",
      "Users should read all relevant offer documents, exchange announcements, regulatory disclosures and company filings before making a financial decision.",
    ],
  },
  {
    title: "External Links and Services",
    content: [
      "The website may contain links to third-party websites, data providers, exchanges, regulators or other external services. These links are provided for convenience and reference.",
      "STFL does not control and is not responsible for the availability, accuracy, security, privacy practices or content of external websites.",
    ],
  },
  {
    title: "User Responsibility",
    content: [
      "Every user remains solely responsible for evaluating information and making their own financial decisions.",
      "Users should not make an investment or trading decision solely because of a score, label, chart pattern, technical bias, AI-generated summary or other isolated output displayed on STFL.",
    ],
  },
  {
    title: "Limitation of Responsibility",
    content: [
      "To the extent permitted by applicable law, STFL and its contributors will not be responsible for losses, damages, costs or consequences arising from reliance on website information, unavailable services, delayed data, technical errors or third-party content.",
      "Nothing in this disclaimer excludes any responsibility that cannot lawfully be excluded under applicable law.",
    ],
  },
  {
    title: "Changes to This Disclaimer",
    content: [
      "STFL may update this disclaimer when the platform, its research tools, applicable requirements or data sources change.",
      "The latest version published on this page will apply from its stated effective date.",
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-amber-50 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-amber-950/20 dark:via-slate-950 dark:to-[#020817]">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
            Important Information
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Financial Disclaimer
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Please read this disclaimer carefully before using STFL market data,
            research tools, analytical outputs or educational content.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: 26 October 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300">
              Market Risk Warning
            </h2>

            <p className="mt-3 leading-7 text-red-800/80 dark:text-slate-300">
              Investments in securities markets are subject to market risks.
              Please read all relevant documents carefully and conduct your own
              independent research before investing or trading.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            {disclaimerSections.map((section, index) => (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none md:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {index + 1}
                  </span>

                  <div>
                    <h2 className="text-xl font-bold">{section.title}</h2>

                    <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
                      {section.content.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 dark:border-cyan-500/20 dark:bg-cyan-500/5 md:p-8">
            <h2 className="text-xl font-bold">
              Questions about this disclaimer?
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Contact STFL if you have a question about the presentation, source
              or intended use of information available on this website.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Contact STFL
              </Link>

              <Link
                href="/research-methodology"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                Research Methodology
              </Link>
            </div>
          </div>

          <p className="mt-8 text-xs leading-6 text-slate-500">
            This website disclaimer is intended to communicate the general
            purpose and limitations of the STFL platform. It is not a substitute
            for legal advice concerning the platform or its regulatory
            obligations.
          </p>
        </div>
      </section>
    </main>
  );
}
