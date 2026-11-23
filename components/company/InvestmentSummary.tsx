"use client";

import type { CompanyResearch } from "@/lib/types/research";
import { formatPrice } from "@/lib/utils/formatters";

type Status = "positive" | "negative" | "warning" | "neutral";
const colours: Record<Status, string> = {
  positive: "text-emerald-800", negative: "text-red-700",
  warning: "text-amber-800", neutral: "text-slate-700",
};
function label(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Insufficient Data";
}
function biasStatus(value: string | null | undefined): Status {
  if (value === "STRONG_BUY" || value === "BUY") return "positive";
  if (value === "STRONG_SELL" || value === "SELL") return "negative";
  return value === "HOLD" ? "warning" : "neutral";
}
function momentumStatus(value: string | null | undefined): Status {
  if (value === "VERY_STRONG" || value === "STRONG") return "positive";
  if (value === "VERY_WEAK" || value === "WEAK") return "negative";
  return value === "MODERATE" ? "warning" : "neutral";
}
function price(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? formatPrice(value) : "Not Available";
}
function Metric({ name, value, status = "neutral" }: { name: string; value: string; status?: Status }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 text-sm"><span className="text-slate-600">{name}</span><span className={`text-right font-semibold ${colours[status]}`}>{value}</span></div>;
}
export default function InvestmentSummary({ research }: { research: CompanyResearch | null }) {
  const technical = research?.technical;
  const summary = research?.investmentSummary;
  const status = biasStatus(summary?.technicalBias);
  const assessment = status === "positive" ? "Positive Technical Structure" : status === "negative" ? "Weak Technical Structure" : status === "warning" ? "Neutral Technical Structure" : "Insufficient Technical Data";
  let volume: { value: string; status: Status } = { value: "Insufficient Data", status: "neutral" };
  const relativeVolume = technical?.volumeData.relativeVolume;
  if (technical?.volume.breakoutConfirmed) volume = { value: "Breakout Confirmed", status: "positive" };
  else if (technical?.volume.accumulation && !technical.volume.distribution) volume = { value: "Accumulation", status: "positive" };
  else if (technical?.volume.distribution) volume = { value: "Distribution", status: "negative" };
  else if (typeof relativeVolume === "number" && Number.isFinite(relativeVolume)) {
    volume = { value: `${relativeVolume >= 1.5 ? "High" : relativeVolume < 0.75 ? "Low" : "Normal"} Volume (${relativeVolume.toFixed(2)}x)`, status: relativeVolume >= 1.5 ? "positive" : relativeVolume < 0.75 ? "warning" : "neutral" };
  }
  const reasons = [summary?.strengths?.trend, summary?.strengths?.momentum, summary?.strengths?.volume, summary?.risks?.supportResistance].filter((reason): reason is string => typeof reason === "string" && reason.trim().length > 0);
  return (
    <section className="rounded-xl bg-white p-4 text-slate-900 sm:p-5">
      <header className="mb-4 border-b border-slate-200 pb-3">
        <h2 className="text-base font-semibold">Research Summary</h2>
        <p className="mt-1 text-xs text-slate-600">Technical observations from the selected timeframe and available data</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Technical assessment</p>
          <h3 className={`mt-2 text-xl font-bold ${colours[status]}`}>{assessment}</h3>
          <Metric name="Confidence" value={summary?.confidence != null ? `${summary.confidence}%` : "Not Available"} />
          <Metric name="Technical score" value={summary?.technicalScore != null ? `${summary.technicalScore}/100` : "Not Available"} />
          <Metric name="Current price" value={price(summary?.currentPrice)} />
          <p className="mt-3 text-xs leading-5 text-slate-600">Confidence is the research engine’s score; it is not a probability of a profitable trade.</p>
        </div>
        <div>
          <Metric name="Technical trend" value={label(summary?.pattern)} status={status} />
          <Metric name="Technical bias" value={label(summary?.technicalBias)} status={status} />
          <Metric name="Momentum" value={label(technical?.momentum.momentumStrength)} status={momentumStatus(technical?.momentum.momentumStrength)} />
          <Metric name="Volume" value={volume.value} status={volume.status} />
          <Metric name="Support 1" value={price(summary?.support1)} status="positive" />
          <Metric name="Support 2" value={price(summary?.support2)} status="positive" />
          <Metric name="Resistance 1" value={price(summary?.resistance1)} status="negative" />
          <Metric name="Resistance 2" value={price(summary?.resistance2)} status="negative" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Supporting observations</h3>
          {reasons.length ? <ul className="list-disc space-y-2 pl-4 text-sm leading-6 text-slate-700">{reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}</ul> : <p className="text-sm text-slate-600">Technical observations are not available yet.</p>}
          <div className="mt-4">
            <Metric name="Fundamental" value={research?.fundamental ? "Available" : "Not Connected"} status={research?.fundamental ? "positive" : "neutral"} />
            <Metric name="Valuation" value={research?.valuation ? "Available" : "Not Connected"} status={research?.valuation ? "positive" : "neutral"} />
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">{summary?.disclaimer ?? "Technical analysis is for research purposes and does not constitute investment advice."}</p>
    </section>
  );
}
