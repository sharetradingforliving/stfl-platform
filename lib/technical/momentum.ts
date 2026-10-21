/**
 * ================================================================
 * STFL Technical Research Engine
 * File: momentum.ts
 * Purpose: Balanced Momentum Analysis Module
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
  if (rsi >= 70) return "OVERBOUGHT";
  if (rsi <= 30) return "OVERSOLD";
  if (rsi >= 60) return "BULLISH";
  if (rsi <= 40) return "BEARISH";

  return "NEUTRAL";
}

function getRSIContribution(
  rsi: number
): number {
  if (rsi >= 60) return 15;
  if (rsi <= 40) return -15;

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
    /*
     * A bullish crossover below zero is an early recovery,
     * not the same as established positive momentum.
     */
    return macd >= 0 ? 20 : 10;
  }

  if (macd < signal) {
    /*
     * A bearish crossover above zero is deterioration,
     * while one below zero is established bearish momentum.
     */
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
  if (k > d && k < 80) return 15;
  if (k < d && k > 20) return -15;

  return 0;
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

  const rawScore =
    50 +
    rsiContribution +
    macdContribution +
    stochasticContribution;

  const score = Math.max(
    0,
    Math.min(100, rawScore)
  );

  let momentumStrength =
    SignalStrength.MODERATE;

  if (score >= 80) {
    momentumStrength =
      SignalStrength.VERY_STRONG;
  } else if (score >= 65) {
    momentumStrength =
      SignalStrength.STRONG;
  } else if (score <= 35) {
    momentumStrength =
      SignalStrength.WEAK;
  }

  const directionalSignals = [
    rsiContribution,
    macdContribution,
    stochasticContribution,
  ];

  const agreeingSignals =
    directionalSignals.filter(
      (value) => value !== 0
    ).length;

  const confidence = Math.round(
    (agreeingSignals / 3) * 100
  );

  return {
    score,
    rsiSignal,
    macdSignal,
    stochasticSignal,
    momentumStrength,
    confidence,
    explanation:
      `Momentum score is ${score}/100. ` +
      `RSI contribution: ${rsiContribution}, ` +
      `MACD contribution: ${macdContribution}, ` +
      `Stochastic contribution: ${stochasticContribution}.`,
  };
}