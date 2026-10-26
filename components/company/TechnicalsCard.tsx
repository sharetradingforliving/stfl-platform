"use client";

import type { CompanyResearch } from "@/lib/types/research";

import { formatPrice } from "@/lib/utils/formatters";

import { Recommendation } from "@/lib/technical/types";

type TechnicalsCardProps = {
  research: CompanyResearch | null;
};

type IndicatorCardProps = {
  label: string;
  value: string;
  signal?: string;
  tone?: SignalTone;
};

type SignalTone =
  "negative" | "positive" | "neutral" | "warning" | "informational";

function isValidNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatIndicator(
  value: number | null | undefined,

  decimals = 2,
): string {
  return isValidNumber(value) ? value.toFixed(decimals) : "--";
}

function formatIndicatorPrice(value: number | null | undefined): string {
  return isValidNumber(value) ? formatPrice(value) : "--";
}

function formatVolume(value: number | null | undefined): string {
  if (!isValidNumber(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTechnicalBias(value: Recommendation | null | undefined): string {
  if (value === Recommendation.STRONG_BUY) {
    return "STRONG BULLISH";
  }

  if (value === Recommendation.BUY) {
    return "BULLISH";
  }

  if (value === Recommendation.STRONG_SELL) {
    return "STRONG BEARISH";
  }

  if (value === Recommendation.SELL) {
    return "BEARISH";
  }

  if (value === Recommendation.HOLD) {
    return "NEUTRAL";
  }

  return "--";
}

function formatSignalLabel(value: string | null | undefined): string {
  return value ? value.replaceAll("_", " ").trim() : "--";
}

function getSemanticTone(value: string | null | undefined): SignalTone {
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

function getBorderToneClass(tone: SignalTone): string {
  if (tone === "positive") return "border-emerald-700/40";
  if (tone === "negative") return "border-red-700/40";
  if (tone === "warning") return "border-amber-700/40";
  return "border-slate-700";
}

function getMovingAverageSignal(
  currentPrice: number | null | undefined,

  movingAverage: number | null | undefined,
): {
  label: string;
  tone: "positive" | "negative" | "neutral";
} {
  if (!isValidNumber(currentPrice) || !isValidNumber(movingAverage)) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  if (currentPrice > movingAverage) {
    return {
      label: "Price above average",
      tone: "positive",
    };
  }

  if (currentPrice < movingAverage) {
    return {
      label: "Price below average",
      tone: "negative",
    };
  }

  return {
    label: "Price at average",
    tone: "neutral",
  };
}

function getRsiSignal(rsi: number | null | undefined): {
  label: string;
  tone: "positive" | "negative" | "neutral" | "warning";
} {
  if (!isValidNumber(rsi)) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  if (rsi >= 80) {
    return {
      label: "Overbought",
      tone: "warning",
    };
  }

  if (rsi <= 20) {
    return {
      label: "Oversold",
      tone: "warning",
    };
  }

  if (rsi >= 60) {
    return {
      label: "Bullish",
      tone: "positive",
    };
  }

  if (rsi <= 40) {
    return {
      label: "Bearish",
      tone: "negative",
    };
  }

  return {
    label: "Neutral momentum",
    tone: "neutral",
  };
}

function getMacdSignal(
  macd: number | null | undefined,

  signal: number | null | undefined,
): {
  label: string;
  tone: "positive" | "negative" | "neutral" | "warning";
} {
  if (!isValidNumber(macd) || !isValidNumber(signal)) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  if (macd > signal) {
    return {
      label: "Bullish crossover",
      tone: "positive",
    };
  }

  if (macd < signal) {
    return {
      label: "Bearish crossover",
      tone: "negative",
    };
  }

  return {
    label: "Neutral",
    tone: "neutral",
  };
}

function getStochasticSignal(
  stochasticK: number | null | undefined,

  stochasticD: number | null | undefined,
): {
  label: string;
  tone: "positive" | "negative" | "neutral" | "warning";
} {
  if (!isValidNumber(stochasticK) || !isValidNumber(stochasticD)) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  if (stochasticK >= 80 || stochasticD >= 80) {
    return {
      label: "Overbought",
      tone: "warning",
    };
  }

  if (stochasticK <= 20 || stochasticD <= 20) {
    return {
      label: "Oversold",
      tone: "warning",
    };
  }

  if (stochasticK > stochasticD) {
    return {
      label: "Bullish momentum",
      tone: "positive",
    };
  }

  if (stochasticK < stochasticD) {
    return {
      label: "Bearish momentum",
      tone: "negative",
    };
  }

  return {
    label: "Neutral",
    tone: "neutral",
  };
}

function getAdxSignal(adx: number | null | undefined): {
  label: string;
  tone: SignalTone;
} {
  if (!isValidNumber(adx)) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  if (adx >= 40) {
    return {
      label: "Very strong trend",
      tone: "informational",
    };
  }

  if (adx >= 25) {
    return {
      label: "Strong trend",
      tone: "informational",
    };
  }

  if (adx >= 20) {
    return {
      label: "Developing trend",
      tone: "neutral",
    };
  }

  return {
    label: "Weak trend",
    tone: "neutral",
  };
}

function getRelativeVolumeSignal(relativeVolume: number | null | undefined): {
  label: string;
  tone: "positive" | "negative" | "neutral";
} {
  if (!isValidNumber(relativeVolume)) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  if (relativeVolume >= 1.5) {
    return {
      label: "High participation",
      tone: "positive",
    };
  }

  if (relativeVolume < 0.75) {
    return {
      label: "Low participation",
      tone: "negative",
    };
  }

  return {
    label: "Normal participation",
    tone: "neutral",
  };
}

function getBooleanSignal(
  value: boolean | undefined,

  positiveLabel: string,

  negativeLabel: string,
): {
  label: string;
  tone: "positive" | "negative" | "neutral";
} {
  if (value === undefined) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  return value
    ? {
        label: positiveLabel,
        tone: "positive",
      }
    : {
        label: negativeLabel,
        tone: "neutral",
      };
}

function IndicatorCard({
  label,
  value,
  signal,
  tone = "neutral",
}: IndicatorCardProps) {
  const toneClass = getToneClass(tone);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>

      <p className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</p>

      {signal && <p className={`mt-1 text-xs ${toneClass}`}>{signal}</p>}
    </div>
  );
}

export default function TechnicalsCard({ research }: TechnicalsCardProps) {
  const technical = research?.technical;

  const summary = research?.investmentSummary;

  const movingAverages = technical?.movingAverages;

  const oscillators = technical?.oscillators;

  const volumeData = technical?.volumeData;

  const volumeAnalysis = technical?.volume;

  const currentPrice = technical?.currentPrice;

  const ema20Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.ema20,
  );

  const ema50Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.ema50,
  );

  const ema100Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.ema100,
  );

  const ema200Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.ema200,
  );

  const sma20Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.sma20,
  );

  const sma50Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.sma50,
  );

  const sma100Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.sma100,
  );

  const sma200Signal = getMovingAverageSignal(
    currentPrice,
    movingAverages?.sma200,
  );

  const rsiSignal = getRsiSignal(oscillators?.rsi);

  const macdSignal = getMacdSignal(oscillators?.macd, oscillators?.macdSignal);

  const stochasticSignal = getStochasticSignal(
    oscillators?.stochasticK,
    oscillators?.stochasticD,
  );

  const adxSignal = getAdxSignal(oscillators?.adx);

  const relativeVolumeSignal = getRelativeVolumeSignal(
    volumeData?.relativeVolume,
  );

  const accumulationSignal = getBooleanSignal(
    volumeAnalysis?.accumulation,
    "Accumulation detected",
    "No accumulation signal",
  );

  const distributionSignal = getBooleanSignal(
    volumeAnalysis?.distribution,
    "Distribution detected",
    "No distribution signal",
  );

  const breakoutSignal = getBooleanSignal(
    volumeAnalysis?.breakoutConfirmed,
    "Volume confirms breakout",
    "Breakout not confirmed",
  );

  const patternTone = getSemanticTone(summary?.pattern);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
      <p className="text-sm font-semibold text-emerald-400">
        STFL Technical Summary
      </p>

      <div
        className={`mt-6 rounded-xl border bg-slate-800 p-6 ${getBorderToneClass(
          patternTone,
        )}`}
      >
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm text-slate-400">Pattern</p>

            <p
              className={`mt-1 text-3xl font-bold ${getToneClass(patternTone)}`}
            >
              {formatSignalLabel(summary?.pattern) || "Loading..."}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-400">STFL Technical Score</p>

            <p className="mt-1 text-4xl font-bold text-white">
              {summary?.technicalScore ?? "--"}

              <span className="text-xl text-slate-400">/100</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Technical Bias
            </p>

            <p
              className={`mt-1 text-lg font-semibold ${
                summary?.technicalBias === Recommendation.BUY ||
                summary?.technicalBias === Recommendation.STRONG_BUY
                  ? "text-emerald-400"
                  : summary?.technicalBias === Recommendation.HOLD
                    ? "text-amber-400"
                    : summary?.technicalBias === Recommendation.SELL ||
                        summary?.technicalBias === Recommendation.STRONG_SELL
                      ? "text-red-400"
                      : "text-slate-400"
              }`}
            >
              {formatTechnicalBias(summary?.technicalBias)}
            </p>
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
              Support 1
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-400">
              {summary ? formatPrice(summary.support1) : "--"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Support 2
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-400">
              {summary?.support2 != null ? formatPrice(summary.support2) : "--"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Resistance 1
            </p>

            <p className="mt-1 text-lg font-semibold text-red-400">
              {summary ? formatPrice(summary.resistance1) : "--"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Resistance 2
            </p>

            <p className="mt-1 text-lg font-semibold text-red-400">
              {summary?.resistance2 != null
                ? formatPrice(summary.resistance2)
                : "--"}
            </p>
          </div>
        </div>

        <p className="mt-5 border-t border-slate-700 pt-4 text-xs leading-5 text-slate-400">
          Support and resistance levels are analytical price zones derived from
          historical market data. They are not trade targets or stop-loss
          recommendations.
        </p>
      </div>

      <div className="my-8 border-t border-slate-700" />

      <h3 className="text-lg font-semibold text-white">Moving Averages</h3>

      <p className="mt-2 text-sm text-slate-400">
        Current price compared with exponential and simple moving averages for
        the selected chart timeframe.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IndicatorCard
          label="EMA 20"
          value={formatIndicatorPrice(movingAverages?.ema20)}
          signal={ema20Signal.label}
          tone={ema20Signal.tone}
        />

        <IndicatorCard
          label="EMA 50"
          value={formatIndicatorPrice(movingAverages?.ema50)}
          signal={ema50Signal.label}
          tone={ema50Signal.tone}
        />

        <IndicatorCard
          label="EMA 100"
          value={formatIndicatorPrice(movingAverages?.ema100)}
          signal={ema100Signal.label}
          tone={ema100Signal.tone}
        />

        <IndicatorCard
          label="EMA 200"
          value={formatIndicatorPrice(movingAverages?.ema200)}
          signal={ema200Signal.label}
          tone={ema200Signal.tone}
        />

        <IndicatorCard
          label="SMA 20"
          value={formatIndicatorPrice(movingAverages?.sma20)}
          signal={sma20Signal.label}
          tone={sma20Signal.tone}
        />

        <IndicatorCard
          label="SMA 50"
          value={formatIndicatorPrice(movingAverages?.sma50)}
          signal={sma50Signal.label}
          tone={sma50Signal.tone}
        />

        <IndicatorCard
          label="SMA 100"
          value={formatIndicatorPrice(movingAverages?.sma100)}
          signal={sma100Signal.label}
          tone={sma100Signal.tone}
        />

        <IndicatorCard
          label="SMA 200"
          value={formatIndicatorPrice(movingAverages?.sma200)}
          signal={sma200Signal.label}
          tone={sma200Signal.tone}
        />
      </div>

      <div className="my-8 border-t border-slate-700" />

      <h3 className="text-lg font-semibold text-white">Momentum Indicators</h3>

      <p className="mt-2 text-sm text-slate-400">
        RSI, MACD, stochastic oscillator, trend strength and volatility.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IndicatorCard
          label="RSI"
          value={formatIndicator(oscillators?.rsi)}
          signal={rsiSignal.label}
          tone={rsiSignal.tone}
        />

        <IndicatorCard
          label="MACD"
          value={formatIndicator(oscillators?.macd)}
          signal={macdSignal.label}
          tone={macdSignal.tone}
        />

        <IndicatorCard
          label="MACD Signal"
          value={formatIndicator(oscillators?.macdSignal)}
          signal={`Histogram ${formatIndicator(oscillators?.macdHistogram)}`}
          tone={
            isValidNumber(oscillators?.macdHistogram) &&
            oscillators.macdHistogram > 0
              ? "positive"
              : isValidNumber(oscillators?.macdHistogram) &&
                  oscillators.macdHistogram < 0
                ? "negative"
                : "neutral"
          }
        />

        <IndicatorCard
          label="Stochastic K / D"
          value={`${formatIndicator(
            oscillators?.stochasticK,
          )} / ${formatIndicator(oscillators?.stochasticD)}`}
          signal={stochasticSignal.label}
          tone={stochasticSignal.tone}
        />

        <IndicatorCard
          label="ADX"
          value={formatIndicator(oscillators?.adx)}
          signal={adxSignal.label}
          tone={adxSignal.tone}
        />

        <IndicatorCard
          label="ATR"
          value={formatIndicatorPrice(oscillators?.atr)}
          signal="Selected-timeframe volatility range"
          tone="informational"
        />

        <IndicatorCard
          label="Momentum Strength"
          value={formatSignalLabel(technical?.momentum.momentumStrength)}
          signal={technical?.momentum.explanation}
          tone={getSemanticTone(technical?.momentum.momentumStrength)}
        />

        <IndicatorCard
          label="Momentum Score"
          value={
            isValidNumber(technical?.momentum.score)
              ? `${technical?.momentum.score}/100`
              : "--"
          }
          signal={
            isValidNumber(technical?.momentum.confidence)
              ? `${technical?.momentum.confidence}% confidence`
              : "Unavailable"
          }
          tone="informational"
        />
      </div>

      <div className="my-8 border-t border-slate-700" />

      <h3 className="text-lg font-semibold text-white">Volume Analysis</h3>

      <p className="mt-2 text-sm text-slate-400">
        Current participation compared with average volume and price-volume
        behaviour.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IndicatorCard
          label="Current Volume"
          value={formatVolume(volumeData?.volume)}
          signal="Latest candle volume"
          tone="informational"
        />

        <IndicatorCard
          label="Average Volume"
          value={formatVolume(volumeData?.averageVolume)}
          signal="Historical average"
          tone="informational"
        />

        <IndicatorCard
          label="Relative Volume"
          value={
            isValidNumber(volumeData?.relativeVolume)
              ? `${volumeData.relativeVolume.toFixed(2)}x`
              : "--"
          }
          signal={relativeVolumeSignal.label}
          tone={relativeVolumeSignal.tone}
        />

        <IndicatorCard
          label="Volume Score"
          value={
            isValidNumber(volumeAnalysis?.score)
              ? `${volumeAnalysis?.score}/100`
              : "--"
          }
          signal={
            isValidNumber(volumeAnalysis?.confidence)
              ? `${volumeAnalysis?.confidence}% confidence`
              : "Unavailable"
          }
          tone="informational"
        />

        <IndicatorCard
          label="Accumulation"
          value={volumeAnalysis?.accumulation ? "YES" : "NO"}
          signal={accumulationSignal.label}
          tone={accumulationSignal.tone}
        />

        <IndicatorCard
          label="Distribution"
          value={volumeAnalysis?.distribution ? "YES" : "NO"}
          signal={distributionSignal.label}
          tone={
            volumeAnalysis?.distribution ? "negative" : distributionSignal.tone
          }
        />

        <IndicatorCard
          label="Breakout Confirmation"
          value={
            volumeAnalysis?.breakoutConfirmed ? "CONFIRMED" : "NOT CONFIRMED"
          }
          signal={breakoutSignal.label}
          tone={breakoutSignal.tone}
        />

        <IndicatorCard
          label="Volume Interpretation"
          value={volumeAnalysis ? "Calculated" : "--"}
          signal={volumeAnalysis?.explanation ?? "Volume analysis unavailable"}
          tone="neutral"
        />
      </div>
    </div>
  );
}
