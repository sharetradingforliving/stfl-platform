/**
 * ================================================================
 * STFL Technical Research Engine
 * File: momentum.ts
 * Purpose: Multi-session Momentum Analysis
 * ================================================================
 */

import {
  MomentumResult,
  SignalStrength,
  TechnicalResearchInput,
} from "./types";

function getRSISignal(
  rsi: number
): string {
  if (rsi >= 80) return "OVERBOUGHT";
  if (rsi <= 20) return "OVERSOLD";
  if (rsi >= 60) return "BULLISH";
  if (rsi <= 40) return "BEARISH";

  return "NEUTRAL";
}

function getRSIContribution(
  rsi: number
): number {
  if (rsi >= 60) return 15;
  if (rsi >= 55) return 10;
  if (rsi <= 40) return -15;
  if (rsi <= 45) return -10;

  return 0;
}

function getMACDSignal(
  macd: number,
  signal: number
): string {
  if (macd > signal) return "BULLISH";
  if (macd < signal) return "BEARISH";

  return "NEUTRAL";
}

function getMACDContribution(
  macd: number,
  signal: number
): number {
  if (macd > signal) {
    return macd >= 0 ? 20 : 10;
  }

  if (macd < signal) {
    return macd <= 0 ? -20 : -10;
  }

  return 0;
}

function getStochasticSignal(
  k: number,
  d: number
): string {
  if (k > d && k < 80) return "BULLISH";
  if (k < d && k > 20) return "BEARISH";

  return "NEUTRAL";
}

function getStochasticContribution(
  k: number,
  d: number
): number {
  if (k > d && k < 80) return 10;
  if (k < d && k > 20) return -10;

  return 0;
}

function getRecentPriceAction(
  input: TechnicalResearchInput
) {
  const recentCandles = [
    ...input.priceHistory,
  ]
    .sort(
      (left, right) =>
        new Date(left.date).getTime() -
        new Date(right.date).getTime()
    )
    .slice(-5);

  if (recentCandles.length < 2) {
    return {
      risingSessions: 0,
      fallingSessions: 0,
      recentReturnPercent: 0,
      contribution: 0,
    };
  }

  let risingSessions = 0;
  let fallingSessions = 0;

  for (
    let index = 1;
    index < recentCandles.length;
    index += 1
  ) {
    const previous =
      recentCandles[index - 1].close;

    const current =
      recentCandles[index].close;

    if (current > previous) {
      risingSessions += 1;
    } else if (current < previous) {
      fallingSessions += 1;
    }
  }

  const firstClose =
    recentCandles[0].close;

  const lastClose =
    recentCandles[
      recentCandles.length - 1
    ].close;

  const recentReturnPercent =
    firstClose > 0
      ? (
          (lastClose - firstClose) /
          firstClose
        ) * 100
      : 0;

  let contribution = 0;

  if (
    risingSessions >= 3 &&
    recentReturnPercent > 0
  ) {
    contribution = 15;
  } else if (
    fallingSessions >= 3 &&
    recentReturnPercent < 0
  ) {
    contribution = -15;
  } else if (
    recentReturnPercent >= 1
  ) {
    contribution = 8;
  } else if (
    recentReturnPercent <= -1
  ) {
    contribution = -8;
  }

  return {
    risingSessions,
    fallingSessions,
    recentReturnPercent,
    contribution,
  };
}

function getEMAContribution(
  input: TechnicalResearchInput
): number {
  const {
    currentPrice,
    movingAverages,
  } = input;

  let contribution = 0;

  contribution +=
    currentPrice >= movingAverages.ema20
      ? 5
      : -5;

  contribution +=
    currentPrice >= movingAverages.ema50
      ? 5
      : -5;

  return contribution;
}

function calculateAgreement(
  contributions: number[]
): number {
  const active =
    contributions.filter(
      (value) => value !== 0
    );

  if (active.length === 0) {
    return 0;
  }

  const bullish =
    active.filter(
      (value) => value > 0
    ).length;

  const bearish =
    active.filter(
      (value) => value < 0
    ).length;

  return Math.round(
    (
      Math.max(bullish, bearish) /
      active.length
    ) * 100
  );
}

export function analyzeMomentum(
  input: TechnicalResearchInput
): MomentumResult {
  const osc = input.oscillators;

  const rsiSignal =
    getRSISignal(osc.rsi);

  const macdSignal =
    getMACDSignal(
      osc.macd,
      osc.macdSignal
    );

  const stochasticSignal =
    getStochasticSignal(
      osc.stochasticK,
      osc.stochasticD
    );

  const rsiContribution =
    getRSIContribution(osc.rsi);

  const macdContribution =
    getMACDContribution(
      osc.macd,
      osc.macdSignal
    );

  const stochasticContribution =
    getStochasticContribution(
      osc.stochasticK,
      osc.stochasticD
    );

  const priceAction =
    getRecentPriceAction(input);

  const emaContribution =
    getEMAContribution(input);

  const contributions = [
    rsiContribution,
    macdContribution,
    stochasticContribution,
    priceAction.contribution,
    emaContribution,
  ];

  const rawScore =
    50 +
    contributions.reduce(
      (total, value) =>
        total + value,
      0
    );

  let score = Math.max(
    0,
    Math.min(100, rawScore)
  );

  const priceAboveEMA20 =
    input.currentPrice >=
    input.movingAverages.ema20;

  const priceAboveEMA50 =
    input.currentPrice >=
    input.movingAverages.ema50;

  const macdBullish =
    osc.macd > osc.macdSignal;

  const establishedBullish =
    priceAboveEMA20 &&
    priceAboveEMA50 &&
    osc.rsi >= 55 &&
    macdBullish &&
    osc.macd >= 0 &&
    priceAction.risingSessions >= 3;

  /*
   * Prevent an early recovery below EMA 50,
   * neutral RSI or negative MACD from receiving
   * an established-momentum score.
   */
  if (
    !priceAboveEMA50 ||
    osc.rsi < 55 ||
    osc.macd < 0
  ) {
    score = Math.min(score, 69);
  }

  let momentumStrength =
    SignalStrength.MODERATE;

  if (
    score >= 80 &&
    establishedBullish &&
    osc.adx >= 30
  ) {
    momentumStrength =
      SignalStrength.VERY_STRONG;
  } else if (
    score >= 70 &&
    establishedBullish &&
    osc.adx >= 20
  ) {
    momentumStrength =
      SignalStrength.STRONG;
  } else if (
    score >= 55 &&
    macdBullish &&
    osc.rsi >= 45 &&
    (
      priceAction.risingSessions >= 2 ||
      priceAction.recentReturnPercent > 0
    )
  ) {
    momentumStrength =
      SignalStrength.BUILDING;
  } else if (
    score <= 35 &&
    !priceAboveEMA20 &&
    osc.rsi < 45 &&
    !macdBullish &&
    priceAction.fallingSessions >= 3
  ) {
    momentumStrength =
      SignalStrength.NEGATIVE;
  } else if (
    score < 50 &&
    (
      priceAction.fallingSessions >= 3 ||
      priceAction.recentReturnPercent < 0 ||
      !macdBullish
    )
  ) {
    momentumStrength =
      SignalStrength.SLOWING;
  }

  const confidence =
    calculateAgreement(
      contributions
    );

  return {
    score,
    rsiSignal,
    macdSignal,
    stochasticSignal,
    momentumStrength,
    confidence,
    explanation:
      `Momentum is ${momentumStrength}. ` +
      `Score ${score}/100; ` +
      `${priceAction.risingSessions} rising and ` +
      `${priceAction.fallingSessions} falling sessions ` +
      `across the recent window; ` +
      `recent return ${priceAction.recentReturnPercent.toFixed(2)}%.`,
  };
}