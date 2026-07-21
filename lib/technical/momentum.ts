/**
 * ================================================================
 * STFL Technical Research Engine
 * File: momentum.ts
 * Purpose: Momentum Analysis Module
 * ================================================================
 */

import {
  MomentumResult,
  SignalStrength,
  TechnicalResearchInput,
} from "./types";

/**
 * RSI Analysis
 */
function getRSISignal(rsi: number): string {
  if (rsi >= 70) return "OVERBOUGHT";
  if (rsi <= 30) return "OVERSOLD";
  if (rsi >= 60) return "BULLISH";
  if (rsi <= 40) return "BEARISH";

  return "NEUTRAL";
}

/**
 * MACD Analysis
 */
function getMACDSignal(
  macd: number,
  signal: number
): string {
  if (macd > signal) return "BULLISH";
  if (macd < signal) return "BEARISH";

  return "NEUTRAL";
}

/**
 * Stochastic RSI Analysis
 */
function getStochasticSignal(
  k: number,
  d: number
): string {
  if (k > d && k < 80) return "BULLISH";
  if (k < d && k > 20) return "BEARISH";

  return "NEUTRAL";
}

/**
 * Analyze Momentum
 */
export function analyzeMomentum(
  input: TechnicalResearchInput
): MomentumResult {

  const osc = input.oscillators;

  const rsiSignal = getRSISignal(osc.rsi);

  const macdSignal = getMACDSignal(
    osc.macd,
    osc.macdSignal
  );

  const stochasticSignal = getStochasticSignal(
    osc.stochasticK,
    osc.stochasticD
  );

  let score = 50;

  if (rsiSignal === "BULLISH") score += 15;
  if (macdSignal === "BULLISH") score += 20;
  if (stochasticSignal === "BULLISH") score += 15;

  score = Math.min(score, 100);

  let momentumStrength = SignalStrength.MODERATE;

  if (score >= 90) {
    momentumStrength = SignalStrength.VERY_STRONG;
  } else if (score >= 75) {
    momentumStrength = SignalStrength.STRONG;
  } else if (score <= 30) {
    momentumStrength = SignalStrength.WEAK;
  }

  return {
    score,

    rsiSignal,

    macdSignal,

    stochasticSignal,

    momentumStrength,

    confidence: score,

    explanation:
      `Momentum score is ${score}/100 based on RSI, MACD and Stochastic RSI.`,
  };
}