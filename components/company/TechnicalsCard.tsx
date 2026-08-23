"use client";


import type { CompanyResearch } from "@/lib/types/research";
import { formatPrice } from "@/lib/utils/formatters";
import { Recommendation } from "@/lib/technical/types";

type TechnicalsCardProps = {
  research: CompanyResearch | null;
};

export default function TechnicalsCard({
  research,
}: TechnicalsCardProps) 
{

  const summary = research?.investmentSummary;

     return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">

      <p className="text-sm font-semibold text-emerald-400">
        STFL Technical Summary
      </p>

      
<div className="mt-6 rounded-xl border border-emerald-700/40 bg-slate-800 p-6">

  <div className="flex items-center justify-between">

    <div>
      <p className="text-sm text-slate-400">
        Pattern
      </p>

      <p className="mt-1 text-3xl font-bold text-emerald-400">
  {summary?.pattern ?? "Loading..."}
</p>
    </div>

    <div className="text-right">
      <p className="text-sm text-slate-400">
        STFL Technical Score
      </p>

      <p className="mt-1 text-4xl font-bold text-white">
        {summary?.technicalScore ?? "--"}
        <span className="text-xl text-slate-400">/100</span>
      </p>
    </div>

  </div>

  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">

    <div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Confidence
  </p>

  <p className="mt-1 text-lg font-semibold text-white">
    {summary?.confidence ?? "--"}%
  </p>
</div>

    <div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Recommendation
  </p>

  <p className={`mt-1 text-lg font-semibold ${
  summary?.recommendation === Recommendation.BUY ||
  summary?.recommendation === Recommendation.STRONG_BUY
    ? "text-emerald-400"
    : summary?.recommendation === Recommendation.HOLD
    ? "text-yellow-400"
    : summary?.recommendation === Recommendation.SELL ||
      summary?.recommendation === Recommendation.STRONG_SELL
    ? "text-red-400"
    : "text-slate-400"
}`}>
    {summary?.recommendation ?? "--"}  </p>
</div>

<div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Current Price
  </p>

  <p className="mt-1 text-lg font-semibold text-white">
    {summary ? formatPrice(summary.currentPrice) : "--"}
  </p>
</div>

<div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Support
  </p>

  <p className="mt-1 text-lg font-semibold text-green-400">
    {summary ? formatPrice(summary.support) : "--"}
  </p>
</div>

<div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Resistance
  </p>

  <p className="mt-1 text-lg font-semibold text-red-400">
    {summary ? formatPrice(summary.resistance) : "--"}
  </p>
</div>

<div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Stop Loss
  </p>

  <p className="mt-1 text-lg font-semibold text-red-400">
    {summary ? formatPrice(summary.stopLoss) : "--"}
  </p>
</div>

<div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Target
  </p>

  <p className="mt-1 text-lg font-semibold text-green-400">
    {summary ? formatPrice(summary.target) : "--"}
  </p>
</div>

    <div>
  <p className="text-xs uppercase tracking-wide text-slate-500">
    Risk : Reward
  </p>

  <p className="mt-1 text-lg font-semibold text-yellow-400">
    1 : {summary?.riskReward ?? "--"}
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
        87/ 100
      </p>

    </div>
  );
}