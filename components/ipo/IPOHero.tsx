import {
  BarChart3,
  Building2,
  LineChart,
  Sparkles,
} from "lucide-react";

export default function IPOHero() {
  return (
    <section className="border-b border-slate-800 bg-[#020817]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">

        {/* Eyebrow */}

        <div className="flex flex-wrap items-center justify-between gap-4">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            STFL IPO Research Terminal
          </p>

          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
            Live Research
          </span>

        </div>

        {/* Main heading */}

        <div className="mt-7 max-w-4xl">

          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            IPO Research
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
            Track active and upcoming IPOs, subscription trends,
            issue pricing, Grey Market Premium and listing activity.
            Open any company for detailed financial analysis,
            valuation, peer comparison, risks and STFL research.
          </p>

        </div>

        {/* What STFL analyses */}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 size={20} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              Live IPO Tracking
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Mainboard and SME IPO dates, status,
              pricing and issue details.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <BarChart3 size={20} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              Subscription
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              QIB, NII, retail and total demand
              across the bidding period.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <LineChart size={20} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              Valuation & GMP
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Valuation, peer comparison, GMP trends
              and expected listing insights.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Sparkles size={20} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              STFL Analysis
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Financial quality, risks, valuation and
              investment-oriented research.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}