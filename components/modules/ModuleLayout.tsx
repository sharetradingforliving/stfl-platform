import { ReactNode } from "react";

type ModuleLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  status?: "Planned" | "Placeholder Ready" | "In Development" | "Live";
  children: ReactNode;
};

export default function ModuleLayout({
  eyebrow,
  title,
  description,
  status = "In Development",
  children,
}: ModuleLayoutProps) {
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

        </section>

        <section className="mt-10">
          {children}
        </section>

      </div>
    </main>
  );
}