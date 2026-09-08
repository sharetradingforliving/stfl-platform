"use client";

import type {
  CompanyResearch,
} from "@/lib/types/research";

import {
  formatPrice,
} from "@/lib/utils/formatters";

type InvestmentStatus =
  | "positive"
  | "negative"
  | "warning"
  | "neutral";

type SummaryMetricProps = {
  label: string;
  value: string;
  status:
    SummaryStatus;
};

type SummaryStatus =
  | "positive"
  | "negative"
  | "warning"
  | "neutral";

function formatLabel(
  value:
    string | null | undefined
): string {
  if (!value) {
    return "Insufficient Data";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function getAssessment(
  recommendation:
    string | null | undefined
): {
  label: string;
  status: SummaryStatus;
} {
  if (
    recommendation ===
      "STRONG_BUY" ||
    recommendation === "BUY"
  ) {
    return {
      label:
        "Positive Technical Setup",
      status:
        "positive",
    };
  }

  if (
    recommendation ===
      "STRONG_SELL" ||
    recommendation === "SELL"
  ) {
    return {
      label:
        "Weak Technical Setup",
      status:
        "negative",
    };
  }

  if (
    recommendation === "HOLD"
  ) {
    return {
      label:
        "Neutral — Wait and Watch",
      status:
        "warning",
    };
  }

  return {
    label:
      "Insufficient Technical Data",
    status:
      "neutral",
  };
}

function getTechnicalStatus(
  recommendation:
    string | null | undefined
): SummaryStatus {
  if (
    recommendation ===
      "STRONG_BUY" ||
    recommendation === "BUY"
  ) {
    return "positive";
  }

  if (
    recommendation ===
      "STRONG_SELL" ||
    recommendation === "SELL"
  ) {
    return "negative";
  }

  if (
    recommendation === "HOLD"
  ) {
    return "warning";
  }

  return "neutral";
}

function getMomentumStatus(
  strength:
    string | null | undefined
): SummaryStatus {
  if (
    strength ===
      "VERY_STRONG" ||
    strength === "STRONG"
  ) {
    return "positive";
  }

  if (
    strength ===
      "VERY_WEAK" ||
    strength === "WEAK"
  ) {
    return "negative";
  }

  if (
    strength === "MODERATE"
  ) {
    return "warning";
  }

  return "neutral";
}

function getVolumeDescription(
  accumulation:
    boolean | undefined,

  distribution:
    boolean | undefined,

  breakoutConfirmed:
    boolean | undefined,

  relativeVolume:
    number | null | undefined
): {
  label: string;
  status: SummaryStatus;
} {
  if (
    breakoutConfirmed
  ) {
    return {
      label:
        "Breakout Confirmed",
      status:
        "positive",
    };
  }

  if (
    accumulation &&
    !distribution
  ) {
    return {
      label:
        "Accumulation",
      status:
        "positive",
    };
  }

  if (distribution) {
    return {
      label:
        "Distribution",
      status:
        "negative",
    };
  }

  if (
    typeof relativeVolume ===
      "number" &&
    Number.isFinite(
      relativeVolume
    )
  ) {
    if (
      relativeVolume >= 1.5
    ) {
      return {
        label:
          `High Volume (${relativeVolume.toFixed(
            2
          )}x)`,
        status:
          "positive",
      };
    }

    if (
      relativeVolume < 0.75
    ) {
      return {
        label:
          `Low Volume (${relativeVolume.toFixed(
            2
          )}x)`,
        status:
          "warning",
      };
    }

    return {
      label:
        `Normal Volume (${relativeVolume.toFixed(
          2
        )}x)`,
      status:
        "neutral",
    };
  }

  return {
    label:
      "Insufficient Data",
    status:
      "neutral",
  };
}

function getEntryStatus(
  quality:
    string | null | undefined
): SummaryStatus {
  if (
    quality ===
      "EXCELLENT" ||
    quality === "GOOD"
  ) {
    return "positive";
  }

  if (
    quality === "AVERAGE"
  ) {
    return "warning";
  }

  if (
    quality === "POOR" ||
    quality === "AVOID"
  ) {
    return "negative";
  }

  return "neutral";
}

function getRiskRewardStatus(
  ratio:
    number | null | undefined
): SummaryStatus {
  if (
    typeof ratio !== "number" ||
    !Number.isFinite(ratio)
  ) {
    return "neutral";
  }

  if (ratio >= 2) {
    return "positive";
  }

  if (ratio >= 1) {
    return "warning";
  }

  return "negative";
}

function SummaryMetric({
  label,
  value,
  status,
}: SummaryMetricProps) {
  const statusClass:
    Record<
      SummaryStatus,
      string
    > = {
    positive:
      "text-emerald-400",

    negative:
      "text-red-400",

    warning:
      "text-yellow-400",

    neutral:
      "text-slate-400",
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-950/40 px-3 py-2">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p
        className={`text-right text-sm font-semibold ${statusClass[status]}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function InvestmentSummary({
  research,
}: {
  research:
    CompanyResearch | null;
}) {
  const technical =
    research?.technical;

  const summary =
    research
      ?.investmentSummary;

  const recommendation =
    summary?.recommendation;

  const assessment =
    getAssessment(
      recommendation
    );

  const volumeDescription =
    getVolumeDescription(
      technical
        ?.volume
        .accumulation,

      technical
        ?.volume
        .distribution,

      technical
        ?.volume
        .breakoutConfirmed,

      technical
        ?.volumeData
        .relativeVolume
    );

  const riskRewardRatio =
    summary?.riskReward;

  const reasons = [
    summary?.strengths
      ?.trend,

    summary?.strengths
      ?.momentum,

    summary?.strengths
      ?.volume,

    summary?.risks
      ?.supportResistance,

    summary?.risks
      ?.riskReward,
  ].filter(
    (
      reason
    ): reason is string =>
      typeof reason ===
        "string" &&
      reason.trim().length > 0
  );

  const assessmentColour =
    assessment.status ===
      "positive"
      ? "text-emerald-400"
      : assessment.status ===
            "negative"
        ? "text-red-400"
        : assessment.status ===
              "warning"
          ? "text-yellow-400"
          : "text-slate-400";

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">
          Investment Summary
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Live, evidence-based STFL technical assessment
        </p>
      </div>

      <div className="p-4">
        <div className="mb-4 rounded-lg bg-slate-800 p-3">
          <p className="text-sm text-slate-400">
            Overall Assessment
          </p>

          <h3
            className={`mt-1 text-xl font-bold ${assessmentColour}`}
          >
            {assessment.label}
          </h3>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Confidence
            </p>

            <p className="text-sm font-semibold text-white">
              {summary
                ?.confidence ??
                "--"}
              %
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Technical Score
            </p>

            <p className="text-sm font-semibold text-white">
              {summary
                ?.technicalScore ??
                "--"}
              /100
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <SummaryMetric
            label="Current Price"
            value={
              summary
                ? formatPrice(
                    summary.currentPrice
                  )
                : "--"
            }
            status="neutral"
          />

          <SummaryMetric
            label="Technical Trend"
            value={formatLabel(
              summary?.pattern
            )}
            status={getTechnicalStatus(
              recommendation
            )}
          />

          <SummaryMetric
            label="Recommendation"
            value={formatLabel(
              recommendation
            )}
            status={getTechnicalStatus(
              recommendation
            )}
          />

          <SummaryMetric
            label="Momentum"
            value={formatLabel(
              technical
                ?.momentum
                .momentumStrength
            )}
            status={getMomentumStatus(
              technical
                ?.momentum
                .momentumStrength
            )}
          />

          <SummaryMetric
            label="Volume"
            value={
              volumeDescription.label
            }
            status={
              volumeDescription.status
            }
          />

          <SummaryMetric
            label="Entry Quality"
            value={formatLabel(
              summary?.entryQuality
            )}
            status={getEntryStatus(
              summary?.entryQuality
            )}
          />

          <SummaryMetric
            label="Risk : Reward"
            value={
              typeof riskRewardRatio ===
                "number" &&
              Number.isFinite(
                riskRewardRatio
              )
                ? `1 : ${riskRewardRatio.toFixed(
                    2
                  )} (${summary?.riskRewardVerdict ?? "Unavailable"})`
                : "Insufficient Data"
            }
            status={getRiskRewardStatus(
              riskRewardRatio
            )}
          />

          <SummaryMetric
            label="Fundamental"
            value={
              research?.fundamental
                ? "Available"
                : "Not Connected"
            }
            status={
              research?.fundamental
                ? "positive"
                : "neutral"
            }
          />

          <SummaryMetric
            label="Valuation"
            value={
              research?.valuation
                ? "Available"
                : "Not Connected"
            }
            status={
              research?.valuation
                ? "positive"
                : "neutral"
            }
          />
        </div>

        <div className="mt-4 max-h-52 overflow-y-auto border-t border-slate-800 pt-3 pr-2">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Why {assessment.label}
          </h4>

          {reasons.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-300">
              {reasons.map(
                (reason, index) => (
                  <li
                    key={`${index}-${reason}`}
                  >
                    • {reason}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Technical observations are loading.
            </p>
          )}
        </div>

        <p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-500">
          {summary?.disclaimer ??
            "Technical analysis is for research purposes and does not constitute investment advice."}
        </p>
      </div>
    </div>
  );
}