type DevelopmentStatus =
  | "Live"
  | "In Development"
  | "Placeholder Ready"
  | "Planned";

type DevelopmentItem = {
  module: string;
  status: DevelopmentStatus;
  progress: number;
  completed: string;
  nextStep: string;
};

const developmentItems: DevelopmentItem[] = [
  {
    module: "Master Desktop Navigation",
    status: "Live",
    progress: 100,
    completed:
      "Global navigation, dropdown menus, module links and responsive desktop layout.",
    nextStep:
      "Future refinement after authentication and user-profile integration.",
  },
  {
    module: "Mobile Navigation",
    status: "Live",
    progress: 100,
    completed:
      "Responsive menu, open-and-close functionality and automatic closing after navigation.",
    nextStep:
      "Final device testing during the responsive-design phase.",
  },
  {
    module: "Homepage Platform Ecosystem",
    status: "Live",
    progress: 100,
    completed:
      "Reusable platform cards connecting users to the major STFL research modules.",
    nextStep:
      "Update module status automatically during later development phases.",
  },
  {
    module: "Company Research Dashboard",
    status: "In Development",
    progress: 60,
    completed:
      "Company route, live-price structure, company dashboard, chart integration and research layout.",
    nextStep:
      "Complete financial data, peer analysis, valuation, ownership and company intelligence.",
  },
  {
    module: "Professional Interactive Chart",
    status: "In Development",
    progress: 55,
    completed:
      "Candlestick chart, volume, timeframes, indicators, crosshair, chart navigation and basic Fibonacci retracement.",
    nextStep:
      "Complete drawing tools, improve Fibonacci interaction, activate fullscreen and add chart persistence.",
  },
  {
    module: "Crosshair Tool",
    status: "Live",
    progress: 100,
    completed:
      "One-click activation and deactivation with chart-level crosshair visibility.",
    nextStep:
      "Final visual refinement during chart-polish phase.",
  },
  {
    module: "Fibonacci Retracement",
    status: "In Development",
    progress: 65,
    completed:
      "Two-point selection, retracement levels, labels and differentiated level styling.",
    nextStep:
      "Add live dotted guide while selecting points, editing, deletion and improved drawing interaction.",
  },
  {
    module: "Chart Fullscreen",
    status: "In Development",
    progress: 35,
    completed:
      "Fullscreen button, active state and Exit Fullscreen label.",
    nextStep:
      "Connect the state to actual browser or chart-container fullscreen behaviour.",
  },
  {
    module: "Market Intelligence",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Route, module page, development status and planned capability cards.",
    nextStep:
      "Build market overview, indices, breadth, FII/DII, India VIX, sectors and stocks on the move.",
  },
  {
    module: "Fundamental Research",
    status: "In Development",
    progress: 35,
    completed:
      "Research structure and initial valuation work, including the valuation-analysis foundation.",
    nextStep:
      "Integrate financial statements, ratios, growth, profitability, DCF, WACC and peer valuation.",
  },
  {
    module: "STFL Conviction Engine",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route, module identity and planned multi-factor research framework.",
    nextStep:
      "Define scoring logic for fundamentals, valuation, technicals, momentum, sentiment and risk.",
  },
  {
    module: "STFL AI Research Assistant",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route, module page and planned AI research capabilities.",
    nextStep:
      "Design research-chat workflow, company context, market context and answer-generation architecture.",
  },
  {
    module: "Portfolio Intelligence",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and planned portfolio-analysis capability cards.",
    nextStep:
      "Build holdings, returns, allocation, diversification, risk and portfolio-health analysis.",
  },
  {
    module: "Options Assistant",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and options-intelligence capability structure.",
    nextStep:
      "Build option chain, OI analysis, PCR, Max Pain, IV, Greeks and strategy tools.",
  },
  {
    module: "News & Sentiment",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and planned market, company, sector and global-news structure.",
    nextStep:
      "Integrate news feeds, AI summaries, sentiment classification and impact scoring.",
  },
  {
    module: "IPO Research",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and planned IPO research capability cards.",
    nextStep:
      "Build IPO calendar, financial analysis, valuation, subscription and listing-performance modules.",
  },
  {
    module: "Mutual Fund Research",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and planned mutual-fund research capabilities.",
    nextStep:
      "Build fund search, comparison, returns, risk ratios, holdings and SIP tools.",
  },
  {
    module: "Market Astrology Research",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated experimental-research route with appropriate research positioning.",
    nextStep:
      "Define historical event studies, research methodology, backtesting and limitations.",
  },
  {
    module: "Learning Centre",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and planned education categories.",
    nextStep:
      "Connect articles, lessons, videos, courses and structured learning paths.",
  },
  {
    module: "Premium Research",
    status: "Placeholder Ready",
    progress: 15,
    completed:
      "Dedicated route and planned premium-research capabilities.",
    nextStep:
      "Design subscription plans, research access, recommendations and transparent performance records.",
  },
  {
    module: "Login & Member Access",
    status: "Placeholder Ready",
    progress: 25,
    completed:
      "Responsive login interface, member-benefit panel and desktop/mobile navigation links.",
    nextStep:
      "Connect registration, authentication, password recovery, sessions and user profiles.",
  },
  {
    module: "Live Market Ticker",
    status: "Planned",
    progress: 10,
    completed:
      "Continuous ticker interface and development fallback data.",
    nextStep:
      "Replace static demo prices with verified live or delayed market data and last-updated information.",
  },
];

const statusStyles: Record<DevelopmentStatus, string> = {
  Live:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  "In Development":
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  "Placeholder Ready":
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Planned:
    "border-slate-600 bg-slate-800 text-slate-300",
};

const progressStyles: Record<DevelopmentStatus, string> = {
  Live: "bg-emerald-400",
  "In Development": "bg-cyan-400",
  "Placeholder Ready": "bg-amber-400",
  Planned: "bg-slate-500",
};

export default function DevelopmentStatusPage() {
  const liveCount = developmentItems.filter(
    (item) => item.status === "Live"
  ).length;

  const developmentCount = developmentItems.filter(
    (item) => item.status === "In Development"
  ).length;

  const placeholderCount = developmentItems.filter(
    (item) => item.status === "Placeholder Ready"
  ).length;

  const plannedCount = developmentItems.filter(
    (item) => item.status === "Planned"
  ).length;

  return (
    <main className="min-h-screen bg-[#020817] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 md:p-12">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            STFL Master Development Tracker
          </p>

          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
            Platform Development Status
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            A central view of completed features, active development,
            ready placeholders and planned integrations across the
            Share Trading For Living research platform.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {[
              {
                label: "Live",
                value: liveCount,
                className: "text-emerald-400",
              },
              {
                label: "In Development",
                value: developmentCount,
                className: "text-cyan-400",
              },
              {
                label: "Placeholder Ready",
                value: placeholderCount,
                className: "text-amber-300",
              },
              {
                label: "Planned",
                value: plannedCount,
                className: "text-slate-300",
              },
            ].map((summary) => (
              <div
                key={summary.label}
                className="rounded-2xl border border-slate-800 bg-[#020817] p-5"
              >
                <p className="text-sm text-slate-500">
                  {summary.label}
                </p>

                <p
                  className={`mt-2 text-4xl font-bold ${summary.className}`}
                >
                  {summary.value}
                </p>
              </div>
            ))}

          </div>

        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">

          {developmentItems.map((item) => (
            <article
              key={item.module}
              className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7"
            >

              <div className="flex flex-wrap items-start justify-between gap-4">

                <h2 className="text-xl font-bold">
                  {item.module}
                </h2>

                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>

              </div>

              <div className="mt-6">

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Estimated Progress
                  </span>

                  <span className="font-semibold text-slate-300">
                    {item.progress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className={`h-full rounded-full ${progressStyles[item.status]}`}
                    style={{
                      width: `${item.progress}%`,
                    }}
                  />

                </div>

              </div>

              <div className="mt-7">

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Completed
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.completed}
                </p>

              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-[#020817] p-5">

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Next Step
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.nextStep}
                </p>

              </div>

            </article>
          ))}

        </section>

      </div>
    </main>
  );
}