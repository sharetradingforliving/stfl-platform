import Link from "next/link";

type PlatformModule = {
  title: string;
  description: string;
  href: string;
  icon: string;
  status: "Live" | "In Development" | "Placeholder Ready";
};

const platformModules: PlatformModule[] = [
  {
    title: "Market Intelligence",
    description:
      "Track indices, market breadth, institutional activity, volatility, sectors and stocks on the move.",
    href: "/market-intelligence",
    icon: "📊",
    status: "Placeholder Ready",
  },
  {
    title: "Company Research",
    description:
      "Explore company performance, professional charts, financial data, valuation and peer analysis.",
    href: "/company/RELIANCE",
    icon: "🏢",
    status: "In Development",
  },
  {
    title: "Fundamental Research",
    description:
      "Evaluate financial performance, business quality, growth, profitability and intrinsic value.",
    href: "/fundamental-research",
    icon: "🔎",
    status: "In Development",
  },
  {
    title: "STFL Conviction Engine",
    description:
      "Combine fundamentals, valuation, momentum, sentiment and risk into one conviction framework.",
    href: "/conviction-engine",
    icon: "🎯",
    status: "Placeholder Ready",
  },
  {
    title: "AI Research Assistant",
    description:
      "Ask questions about companies, results, financial statements, charts and market developments.",
    href: "/ai-research-assistant",
    icon: "🧠",
    status: "Placeholder Ready",
  },
  {
    title: "Portfolio Intelligence",
    description:
      "Analyse portfolio performance, allocation, diversification, sector exposure and overall risk.",
    href: "/portfolio-intelligence",
    icon: "💼",
    status: "Placeholder Ready",
  },
  {
    title: "Options Assistant",
    description:
      "Study option chains, open interest, volatility, Greeks, Max Pain and strategy opportunities.",
    href: "/options-assistant",
    icon: "📈",
    status: "Placeholder Ready",
  },
  {
    title: "News & Sentiment",
    description:
      "Follow market, company and sector news with AI summaries, sentiment and potential impact.",
    href: "/news-sentiment",
    icon: "📰",
    status: "Placeholder Ready",
  },
  {
    title: "IPO Research",
    description:
      "Research upcoming IPOs, financial performance, valuation, subscription and listing trends.",
    href: "/ipo-research",
    icon: "🚀",
    status: "Placeholder Ready",
  },
  {
    title: "Mutual Fund Research",
    description:
      "Search and compare funds using returns, risk ratios, holdings and category-level analysis.",
    href: "/mutual-fund-research",
    icon: "📚",
    status: "Placeholder Ready",
  },
  {
    title: "Market Astrology Research",
    description:
      "Explore experimental research into historical market behaviour around planetary events.",
    href: "/market-astrology",
    icon: "🪐",
    status: "Placeholder Ready",
  },
  {
    title: "Learning Centre",
    description:
      "Learn fundamental analysis, technical analysis, options, risk management and trading concepts.",
    href: "/learning-centre",
    icon: "🎓",
    status: "Placeholder Ready",
  },
];

function getStatusClass(
  status: PlatformModule["status"]
) {
  if (status === "Live") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }

  if (status === "In Development") {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

export default function PlatformModules() {
  return (
    <section className="border-t border-slate-800 bg-[#020817] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            STFL Research Ecosystem
          </p>

          <h2 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Explore the STFL Platform
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            One integrated research ecosystem for market
            intelligence, company analysis, valuation,
            portfolio research, options and investor education.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {platformModules.map((module) => (
            <article
              key={module.href}
              className="group flex min-h-[320px] flex-col rounded-3xl border border-slate-800 bg-slate-950/70 p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-2xl"
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl">
                  {module.icon}
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusClass(
                    module.status
                  )}`}
                >
                  {module.status}
                </span>

              </div>

              <h3 className="mt-7 text-2xl font-bold text-white transition group-hover:text-emerald-400">
                {module.title}
              </h3>

              <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">
                {module.description}
              </p>

              <Link
                href={module.href}
                className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-400 transition hover:gap-3"
              >
                Explore Module
                <span aria-hidden="true">
                  →
                </span>
              </Link>

            </article>
          ))}

        </div>

        <div className="mt-12 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">

          <p className="font-semibold text-amber-300">
            STFL Platform Development Roadmap
          </p>

          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            The complete platform structure is being created
            first. Individual research engines, live-data
            integrations and interactive tools will then be
            developed and activated module by module.
          </p>

        </div>

      </div>
    </section>
  );
}