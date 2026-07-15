import Link from "next/link";

type AccountPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
};

export default function AccountPlaceholder({
  eyebrow,
  title,
  description,
  icon,
  features,
}: AccountPlaceholderProps) {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl md:p-12">

          <div className="flex flex-wrap items-start justify-between gap-8">

            <div className="max-w-4xl">

              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                {eyebrow}
              </p>

              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                {title}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                {description}
              </p>

            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-4xl">
              {icon}
            </div>

          </div>

          <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <p className="font-semibold text-amber-300">
                  Account Integration Planned
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  The page structure is ready. Personalized member
                  information will become available after authentication,
                  database and user-account integration.
                </p>

              </div>

              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
                Placeholder Ready
              </span>

            </div>

          </div>

        </section>

        {/* Planned Features */}
        <section className="mt-10">

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Planned Capabilities
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            What this account area will include
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {features.map((feature, index) => (
              <article
                key={feature}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition hover:-translate-y-1 hover:border-emerald-500/50"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-400">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {feature}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  This capability is included in the STFL member
                  workspace development roadmap.
                </p>

              </article>
            ))}

          </div>

        </section>

        {/* Navigation */}
        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/60 p-7">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Member Workspace
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Return to Dashboard
            </Link>

            <Link
              href="/watchlist"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Watchlist
            </Link>

            <Link
              href="/saved-research"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Saved Research
            </Link>

            <Link
              href="/alerts"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Alerts
            </Link>

            <Link
              href="/profile-settings"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Profile & Settings
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}