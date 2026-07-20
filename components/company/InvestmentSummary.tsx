"use client";

import SummaryRow from "./SummaryRow";
import { InvestmentSummaryData } from "@/types/investment";
const investmentSummary: InvestmentSummaryData = {
  overallAssessment: "Strong Candidate",
  confidence: 82,

  metrics: [
  {
    label: "Technical",
    value: "Bullish",
    status: "positive",
  },
  {
    label: "Fundamental",
    value: "Strong",
    status: "positive",
  },
  {
    label: "Valuation",
    value: "Undervalued",
    status: "positive",
  },
  {
    label: "Short Term",
    value: "Bullish",
    status: "positive",
  },
  {
    label: "Long Term",
    value: "Positive",
    status: "positive",
  },
  {
    label: "Risk",
    value: "Medium",
    status: "warning",
  },
],

  reasons: [
    "Price is trading above the 200-day moving average.",
    "Strong quarterly earnings growth.",
      ]
};

export default function InvestmentSummary() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg">

      {/* Header */}
<div className="border-b border-slate-700 px-4 py-3">
  <h2 className="text-lg font-semibold text-white">
    Investment Summary
  </h2>

  </div>

      {/* Body */}
      <div className="p-4">

        {/* Technical Health */}

        {/* Technical Health */}

{/* Overall Assessment */}

<div className="mb-4 rounded-lg bg-slate-800 p-3">

  <p className="text-sm text-slate-400">
    Overall Assessment
  </p>

  <h3 className="mt-1 text-xl font-bold text-green-400">
    {investmentSummary.overallAssessment}
  </h3>

  <div className="mt-4">

    <div className="flex items-center justify-between">

  <p className="text-xs uppercase tracking-wider text-slate-500">
    Confidence
  </p>

  <p className="text-sm font-semibold text-white">
    {investmentSummary.confidence}%
  </p>

</div>
      </div>

</div>

        {/* Summary Metrics */}

       <div className="space-y-2">

  {investmentSummary.metrics.map((metric) => (
  <SummaryRow
    key={metric.label}
    label={metric.label}
    value={metric.value}
    status={metric.status}
  />
))}
</div>

<div className="mt-4 border-t border-slate-800 pt-3">
  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
    Why {investmentSummary.overallAssessment}
  </h4>

  <ul className="space-y-2 text-sm text-slate-300">
  {investmentSummary.reasons.map((reason) => (
    <li key={reason}>• {reason}</li>
  ))}
</ul>
</div>



      </div>

    </div>
  );
}