import Link from "next/link";

type DashboardCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  status: string;
};

const dashboardCards: DashboardCard[] = [
  {
    title: "My Watchlist",
    description:
      "Track selected stocks, price movement, important alerts and research updates.",
    href: "/watchlist",
    icon: "⭐",
    status: "Integration Planned",
  },
  {
    title: "Portfolio Intelligence",
    description:
      "Review holdings, returns, asset allocation, sector exposure, diversification and portfolio risk.",
    href: "/portfolio-intelligence",
    icon: "💼",
    status: "Placeholder Ready",
  },
  {
    title: "Saved Research",
    description:
      "Access saved company reports, valuation analysis, comparisons and research notes.",
    // Saved Research
href: "/saved-research",
    icon: "📚",
    status: "Integration Planned",
  },
  {
    title: "Market Alerts",
    description:
      "Manage price alerts, corporate-action notifications, market events and research updates.",
    href: "/alerts",
    icon: "🔔",
    status: "Integration Planned",
  },
  {
    title: "Premium Membership",
    description:
      "View subscription status and access premium research, model portfolios and market ideas.",
    href: "/premium-research",
    icon: "👑",
    status: "Placeholder Ready",
  },
  {
    title: "Profile & Settings",
    description:
      "Manage your profile, preferences, notifications, password and account settings.",
    href: "/profile-settings",
    icon: "⚙️",
    status: "Integration Planned",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Dashboard Header */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl md:p-12">

          <div className="flex flex-wrap items-start justify-between gap-6">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                STFL Member Workspace
              </p>

              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                My Dashboard
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Your personalized workspace for watchlists,
                portfolio intelligence, saved research, alerts
                and premium market insights.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Account Status
              </p>

              <p className="mt-2 font-semibold text-white">
                Demo Member
              </p>

            </div>

          </div>

          <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">

            <p className="font-semibold text-amber-300">
              Dashboard Preview
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-400">
              The member-dashboard structure is ready.
              Personalized account data will become available
              after authentication, database and user-profile
              integration.
            </p>

          </div>

        </section>

        {/* Account Summary */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              label: "Watchlist Stocks",
              value: "—",
              note: "Connect after login",
            },
            {
              label: "Portfolio Value",
              value: "—",
              note: "Portfolio integration pending",
            },
            {
              label: "Saved Research",
              value: "—",
              note: "Member data integration pending",
            },
            {
              label: "Active Alerts",
              value: "—",
              note: "Alert engine integration pending",
            },
          ].map((summary) => (
            <article
              key={summary.label}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
            >

              <p className="text-sm text-slate-500">
                {summary.label}
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {summary.value}
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-600">
                {summary.note}
              </p>

            </article>
          ))}

        </section>

        {/* Member Tools */}
        <section className="mt-12">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Member Tools
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Manage your STFL workspace
            </h2>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {dashboardCards.map((card) => (
              <article
                key={card.title}
                className="group flex min-h-[300px] flex-col rounded-3xl border border-slate-800 bg-slate-950/60 p-7 transition hover:-translate-y-1 hover:border-emerald-500/50"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl">
                    {card.icon}
                  </div>

                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    {card.status}
                  </span>

                </div>

                <h3 className="mt-7 text-2xl font-bold transition group-hover:text-emerald-400">
                  {card.title}
                </h3>

                <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">
                  {card.description}
                </p>

                {card.href === "#" ? (
                  <span className="mt-8 font-semibold text-slate-600">
                    Available after integration
                  </span>
                ) : (
                  <Link
                    href={card.href}
                    className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-400 transition hover:gap-3"
                  >
                    Open Module
                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                )}

              </article>
            ))}

          </div>

        </section>

        {/* Quick Navigation */}
        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-950/60 p-8">

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Quick Access
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Continue exploring STFL
          </h2>

          <div className="mt-7 flex flex-wrap gap-3">

            <Link
              href="/market-intelligence"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Market Intelligence
            </Link>

            <Link
              href="/conviction-engine"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Conviction Engine
            </Link>

            <Link
              href="/ai-research-assistant"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              AI Research Assistant
            </Link>

            <Link
              href="/options-assistant"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Options Assistant
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}