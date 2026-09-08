import Link from "next/link";

type ModuleStatus =
  | "Live"
  | "Beta"
  | "Available"
  | "Coming Soon";

type PlatformModule = {
  title: string;
  description: string;
  href: string | null;
  icon: string;
  status: ModuleStatus;
};

const platformModules: PlatformModule[] = [
  {
    title: "Company Research",
    description:
      "Research companies using financial performance, valuation, peer comparison, technical signals, conviction scoring and AI-generated insights.",
    href: "/fundamental-research",
    icon: "🔎",
    status: "Live",
  },
  {
    title: "Market Intelligence",
    description:
      "Track indices, market breadth, institutional activity, volatility, sectors and stocks showing market momentum.",
    href: "/market-intelligence",
    icon: "📊",
    status: "Live",
  },
  {
    title: "IPO Research",
    description:
      "Research upcoming IPOs using issue details, financial performance, valuation, subscription data and listing trends.",
    href: "/ipo-research",
    icon: "🚀",
    status: "Beta",
  },
  {
    title: "News & Sentiment",
    description:
      "Follow company, sector and market news with summaries, sentiment analysis and potential market impact.",
    href: "/news-sentiment",
    icon: "📰",
    status: "Live",
  },
  {
    title: "Astro Market Insights",
    description:
      "Explore experimental research into historical market behaviour around planetary cycles and important astrological events.",
    href: "/market-astrology",
    icon: "🪐",
    status: "Beta",
  },
  {
    title: "Learning Centre",
    description:
      "Learn fundamental analysis, technical analysis, options, risk management and practical trading concepts.",
    href: "/learning-centre",
    icon: "🎓",
    status: "Available",
  },
  {
    title: "Options Assistant",
    description:
      "Analyse option chains, open interest, volatility, Greeks, Max Pain and potential strategy opportunities.",
    href: null,
    icon: "📈",
    status: "Coming Soon",
  },
  {
    title: "Mutual Fund Research",
    description:
      "Search and compare mutual funds using returns, risk ratios, portfolio holdings and category-level analysis.",
    href: null,
    icon: "📚",
    status: "Coming Soon",
  },
];

function getStatusClass(
  status: ModuleStatus
): string {
  if (status === "Live") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }

  if (status === "Beta") {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
  }

  if (status === "Available") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
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
            Explore STFL Research Tools
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            Access market intelligence, company research,
            IPO analysis, news, market-cycle insights and
            investor education from one integrated platform.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {platformModules.map((module) => {
            const isAvailable =
              module.href !== null;

            const cardClasses = [
              "group flex min-h-[300px] flex-col rounded-3xl border bg-slate-950/70 p-7 transition duration-300",
              isAvailable
                ? "border-slate-800 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-2xl"
                : "border-slate-800/70 opacity-75",
            ].join(" ");

            return (
              <article
                key={module.title}
                className={cardClasses}
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

                <h3
                  className={`mt-7 text-2xl font-bold text-white transition ${
                    isAvailable
                      ? "group-hover:text-emerald-400"
                      : ""
                  }`}
                >
                  {module.title}
                </h3>

                <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">
                  {module.description}
                </p>

                {module.href ? (
                  <Link
                    href={module.href}
                    className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-400 transition hover:gap-3"
                  >
                    Explore Research
                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                ) : (
                  <span className="mt-8 inline-flex cursor-not-allowed items-center gap-2 font-semibold text-slate-500">
                    Development planned
                  </span>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <p className="font-semibold text-emerald-300">
            STFL Research Platform
          </p>

          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Available research tools are connected to live
            platform pages. Additional analytical capabilities
            will be released progressively after data and
            calculation validation.
          </p>
        </div>
      </div>
    </section>
  );
}