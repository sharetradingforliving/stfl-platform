"use client";

import type { CompanyResearch } from "@/lib/types/research";

interface Props {
  research: CompanyResearch | null;
}

type SignalTone =
  "positive" | "negative" | "warning" | "neutral" | "informational";

function formatLabel(value: string | null | undefined): string {
  return value ? value.replaceAll("_", " ").trim() : "--";
}

function getSignalTone(value: string | null | undefined): SignalTone {
  const normalizedValue = value?.trim().toUpperCase().replaceAll(" ", "_");

  const positiveSignals = new Set([
    "STRONG_BULLISH",
    "BULLISH",
    "POSITIVE",
    "VERY_STRONG",
    "STRONG",
    "BUILDING",
    "FAVORABLE",
    "BUY",
    "STRONG_BUY",
  ]);

  const negativeSignals = new Set([
    "STRONG_BEARISH",
    "BEARISH",
    "NEGATIVE",
    "VERY_WEAK",
    "WEAK",
    "AVOID",
    "SELL",
    "STRONG_SELL",
  ]);

  const warningSignals = new Set([
    "NEUTRAL",
    "HOLD",
    "WATCH",
    "WAIT",
    "MODERATE",
    "SLOWING",
  ]);

  if (normalizedValue && positiveSignals.has(normalizedValue)) {
    return "positive";
  }

  if (normalizedValue && negativeSignals.has(normalizedValue)) {
    return "negative";
  }

  if (normalizedValue && warningSignals.has(normalizedValue)) {
    return "warning";
  }

  return "neutral";
}

function getToneClass(tone: SignalTone): string {
  if (tone === "positive") return "text-emerald-400";
  if (tone === "negative") return "text-red-400";
  if (tone === "warning") return "text-amber-400";
  if (tone === "informational") return "text-cyan-400";
  return "text-slate-300";
}

export default function MarketSnapshotCard({ research }: Props) {
  if (!research?.technical) {
    return null;
  }

  const technical = research.technical;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">
          Market Intelligence
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Trend, confidence and momentum overview
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <Metric
          title="Trend"
          value={formatLabel(technical.trend.direction)}
          tone={getSignalTone(technical.trend.direction)}
        />

        <Metric
          title="Trend Confidence"
          value={`${technical.trend.confidence}%`}
          tone="informational"
        />

        <Metric
          title="Momentum"
          value={formatLabel(technical.momentum.momentumStrength)}
          tone={getSignalTone(technical.momentum.momentumStrength)}
        />
      </div>
    </section>
  );
}

function Metric({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: SignalTone;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>

      <p className={`mt-2 text-lg font-semibold ${getToneClass(tone)}`}>
        {value}
      </p>
    </div>
  );
}
