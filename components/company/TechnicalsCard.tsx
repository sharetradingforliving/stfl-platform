"use client";

export default function TechnicalsCard() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">

      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
        TECHNICALS
      </p>

      
<div className="mt-6 rounded-xl border border-emerald-700/40 bg-slate-800 p-6">

  <div className="flex items-center justify-between">

    <div>
      <p className="text-sm text-slate-400">
        Overall Technical View
      </p>

      <p className="mt-1 text-3xl font-bold text-emerald-400">
        Bullish
      </p>
    </div>

    <div className="text-right">
      <p className="text-sm text-slate-400">
        STFL Technical Score
      </p>

      <p className="mt-1 text-4xl font-bold text-white">
        87
        <span className="text-xl text-slate-400">/100</span>
      </p>
    </div>

  </div>

  <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Confidence
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        92%
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Suggested Action
      </p>

      <p className="mt-1 text-lg font-semibold text-emerald-400">
        Buy
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Risk
      </p>

      <p className="mt-1 text-lg font-semibold text-yellow-400">
        Medium
      </p>
    </div>

    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Time Horizon
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        Swing
      </p>
    </div>

  </div>

</div>

<div className="my-8 border-t border-slate-700" />


      <h3 className="text-lg font-semibold text-white">
        Moving Averages
      </h3>

      <div className="mt-4">
        Coming Soon...
      </div>

      <div className="my-8 border-t border-slate-700" />

      <h3 className="text-lg font-semibold text-white">
        Momentum Indicators
      </h3>

      <div className="mt-4">
        Coming Soon...
      </div>

      <div className="my-8 border-t border-slate-700" />

      <h3 className="text-lg font-semibold text-white">
        Volume Analysis
      </h3>

      <div className="mt-4">
        Coming Soon...
      </div>

      <div className="my-8 border-t border-slate-700" />

      <h3 className="text-lg font-semibold text-white">
        Technical Score
      </h3>

      <p className="mt-3 text-3xl font-bold text-emerald-400">
        87 / 100
      </p>

    </div>
  );
}