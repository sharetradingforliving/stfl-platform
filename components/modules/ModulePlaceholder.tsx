type ModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  status?: "Planned" | "Placeholder Ready" | "In Development";
};

export default function ModulePlaceholder({
  eyebrow,
  title,
  description,
  features,
  status = "Placeholder Ready",
}: ModulePlaceholderProps) {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl md:p-12">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              {eyebrow}
            </p>

            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
              {status}
            </span>

          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            {title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            {description}
          </p>

          <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

            <p className="font-semibold text-emerald-400">
              STFL Development Status
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              The module structure is ready. Data integration,
              intelligence engines and interactive functionality
              will be activated during the next development phase.
            </p>

          </div>

        </section>

        <section className="mt-8">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Planned Capabilities
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              What this module will include
            </h2>
          </div>

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
                  This capability is included in the STFL
                  master development roadmap.
                </p>

              </article>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}