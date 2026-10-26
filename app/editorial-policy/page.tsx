import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "Read the STFL editorial standards for financial research, data sources, AI-assisted content, corrections, independence and advertising.",

  alternates: {
    canonical: "/editorial-policy",
  },

  openGraph: {
    title: "Editorial Policy | Share Trading For Living",
    description:
      "Understand how STFL prepares, reviews, updates and corrects its financial research and educational content.",
    url: "https://sharetradingforliving.com/editorial-policy",
    type: "website",
  },
};

const editorialPrinciples = [
  {
    title: "Accuracy",
    description:
      "We aim to present financial and market information accurately, clearly and in its proper context. Material facts should be checked against identifiable and credible sources wherever reasonably possible.",
  },
  {
    title: "Independence",
    description:
      "Editorial conclusions should not be altered to satisfy an advertiser, data provider, commercial partner or company being discussed.",
  },
  {
    title: "Transparency",
    description:
      "STFL aims to explain important methodologies, data limitations, assumptions and material conflicts that could help users interpret its content.",
  },
  {
    title: "Responsible Language",
    description:
      "We avoid promises of assured returns, guaranteed accuracy and sensational claims that disregard investment risk or uncertainty.",
  },
  {
    title: "Clear Separation",
    description:
      "Educational content, analytical tools, editorial research, advertisements and sponsored material should remain clearly distinguishable from one another.",
  },
  {
    title: "Continuous Improvement",
    description:
      "Research processes and analytical models may be reviewed as data sources, regulations, market structures and technology evolve.",
  },
];

const sourceHierarchy = [
  "Regulatory and statutory disclosures",
  "Stock-exchange announcements",
  "Company filings and investor communications",
  "Government and public institutional data",
  "Authorised or identified market-data providers",
  "Established financial information sources",
  "Independent calculations based on disclosed assumptions",
];

const reviewAreas = [
  "Whether the central facts are supported by available sources",
  "Whether dates, currencies, units and periods are presented consistently",
  "Whether estimates are distinguished from reported information",
  "Whether risks and limitations are adequately explained",
  "Whether automated outputs require human clarification",
  "Whether material conflicts or commercial relationships should be disclosed",
];

export default function EditorialPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-violet-50 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-violet-950/20 dark:via-slate-950 dark:to-[#020817]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-700 dark:text-violet-400">
            STFL Standards
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Editorial Policy
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            This policy describes the principles used to prepare, review,
            present and update STFL research and educational content.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: 26 October 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
            Editorial Principles
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Standards guiding STFL content
          </h2>

          <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {editorialPrinciples.map((principle) => (
              <article
                key={principle.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none"
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

      <section className="border-y border-slate-200 bg-slate-100/70 px-6 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <article>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-400">
              Sources
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Preferred source hierarchy
            </h2>

            <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
              When several sources are available, STFL generally gives greater
              weight to primary and authoritative information.
            </p>

            <div className="mt-7 space-y-3">
              {sourceHierarchy.map((source, index) => (
                <div
                  key={source}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                    {index + 1}
                  </span>

                  <p className="text-sm font-medium">{source}</p>
                </div>
              ))}
            </div>
          </article>

          <article>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
              Review
            </p>

            <h2 className="mt-4 text-3xl font-bold">What we seek to verify</h2>

            <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
              The level of review may vary according to the nature, complexity
              and timeliness of the content.
            </p>

            <div className="mt-7 space-y-3">
              {reviewAreas.map((area) => (
                <div
                  key={area}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />

                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {area}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <PolicySection title="Reported Information, Estimates and Opinions">
            STFL seeks to distinguish reported facts from estimates, model
            outputs, interpretations and opinions. A forecast or valuation
            estimate should not be presented as an established future outcome.
            Market conditions and company performance can change after
            publication.
          </PolicySection>

          <PolicySection title="Automated and AI-Assisted Content">
            Automated calculations and artificial-intelligence tools may support
            data processing, summarisation, classification or drafting. These
            systems can make mistakes. Important information should be checked
            against primary sources, and automated outputs should not be treated
            as guarantees or personalized advice.
          </PolicySection>

          <PolicySection title="Corrections and Updates">
            When STFL identifies a material factual or calculation error, we aim
            to correct it within a reasonable period. Content may also be
            updated when new financial results, exchange announcements,
            corporate actions or improved datasets become available.
          </PolicySection>

          <PolicySection title="Conflicts of Interest">
            Material ownership, commercial relationships, sponsorships or other
            interests that could reasonably affect the interpretation of
            published research should be disclosed when applicable. Such
            disclosures do not eliminate the need for users to conduct
            independent research.
          </PolicySection>

          <PolicySection title="Advertising and Sponsored Content">
            Advertising does not determine the analytical conclusions presented
            by STFL. Paid or sponsored content, if published, should be clearly
            identified. Advertisements should not be designed to resemble
            technical signals, navigation controls or independent editorial
            conclusions.
          </PolicySection>

          <PolicySection title="Testimonials and Performance Claims">
            STFL does not use selective performance examples to guarantee future
            results. Historical performance, simulations, backtests and
            hypothetical outcomes must be interpreted with their assumptions and
            limitations.
          </PolicySection>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-100/70 px-6 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-500/20 dark:bg-amber-500/5 md:p-10">
            <h2 className="text-2xl font-bold">Report a possible error</h2>

            <p className="mt-4 max-w-4xl leading-8 text-slate-600 dark:text-slate-400">
              If you believe that STFL content contains a material factual,
              calculation or attribution error, please provide the relevant
              page, disputed information and supporting source through the
              contact page.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
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

              <Link
                href="/disclaimer"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                Financial Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none md:p-8">
      <h2 className="text-xl font-bold">{title}</h2>

      <p className="mt-4 leading-8 text-slate-600 dark:text-slate-400">
        {children}
      </p>
    </article>
  );
}
