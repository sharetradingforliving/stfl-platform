/**
 * ================================================================
 * STFL Technical Research Engine
 * File: types.ts
 * Purpose: Shared types and interfaces for Technical Analysis
 * Version: 1.0
 * ================================================================
 */

/* ================================================================
 * ENUMS
 * ================================================================ */

export enum TrendDirection {
  STRONG_BULLISH = "STRONG_BULLISH",
  BULLISH = "BULLISH",
  NEUTRAL = "NEUTRAL",
  BEARISH = "BEARISH",
  STRONG_BEARISH = "STRONG_BEARISH",
}

export enum SignalStrength {
  VERY_STRONG = "VERY_STRONG",
  STRONG = "STRONG",
  MODERATE = "MODERATE",
  WEAK = "WEAK",
  VERY_WEAK = "VERY_WEAK",
}

export enum EntryQuality {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  AVERAGE = "AVERAGE",
  POOR = "POOR",
  AVOID = "AVOID",
}

export enum Recommendation {
  STRONG_BUY = "STRONG_BUY",
  BUY = "BUY",
  HOLD = "HOLD",
  SELL = "SELL",
  STRONG_SELL = "STRONG_SELL",
}

/* ================================================================
 * BASE INTERFACES
 * ================================================================ */

export interface IndicatorResult {
  name: string;
  value: number | string;
  signal: string;
  confidence: number;
  explanation: string;
}

export interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
}

export interface MovingAverageData {
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;

  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;
}

export interface OscillatorData {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;

  stochasticK: number;
  stochasticD: number;

  adx: number;

  atr: number;
}

export interface VolumeData {
  volume: number;
  averageVolume: number;
  relativeVolume: number;

  obv?: number;
  cmf?: number;
}

/* ================================================================
 * INPUT DATA
 * ================================================================ */

export interface TechnicalResearchInput {
  symbol: string;

  exchange: "NSE" | "BSE";

  currentPrice: number;

  priceHistory: PriceData[];

  movingAverages: MovingAverageData;

  oscillators: OscillatorData;

  volume: VolumeData;
}

/* ================================================================
 * TREND ANALYSIS
 * ================================================================ */

export interface TrendResult {
  direction: TrendDirection;
  confidence: number;
  score: number;

  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;

  emaAlignment: boolean;
  smaAlignment: boolean;

  explanation: string;
}

/* ================================================================
 * MOMENTUM ANALYSIS
 * ================================================================ */

export interface MomentumResult {
  score: number;

  rsiSignal: string;

  macdSignal: string;

  stochasticSignal: string;

  momentumStrength: SignalStrength;

  confidence: number;

  explanation: string;
}

/* ================================================================
 * VOLUME ANALYSIS
 * ================================================================ */

export interface VolumeResult {
  score: number;

  relativeVolume: number;

  accumulation: boolean;

  distribution: boolean;

  breakoutConfirmed: boolean;

  confidence: number;

  explanation: string;
}

/* ================================================================
 * SUPPORT & RESISTANCE
 * ================================================================ */

export interface SupportResistanceResult {
  immediateSupport: number;

  majorSupport: number;

  immediateResistance: number;

  majorResistance: number;

  nearestSupportDistance: number;

  nearestResistanceDistance: number;

  breakoutProbability: number;

  confidence: number;

  explanation: string;

  supportZones?: PriceZone[];

  resistanceZones?: PriceZone[];
}

/* ================================================================
 * ENTRY QUALITY
 * ================================================================ */

export interface EntryQualityResult {
  quality: EntryQuality;

  score: number;

  confidence: number;

  explanation: string;
}

/* ================================================================
 * RISK : REWARD
 * ================================================================ */

export interface RiskRewardResult {
  stopLoss: number;

  target: number;

  risk: number;

  reward: number;

  ratio: number;

  verdict: string;

  confidence: number;

  explanation: string;
}
/* ================================================================
 * TECHNICAL SCORE
 * ================================================================ */

export interface TechnicalScoreBreakdown {
  trend: number;
  momentum: number;
  volume: number;
  supportResistance: number;
  volatility: number;
  riskReward: number;
}

export interface TechnicalScoreResult {
  totalScore: number;

  recommendation: Recommendation;

  confidence: number;

  breakdown: TechnicalScoreBreakdown;

  explanation: string;
}

/* ================================================================
 * FINAL TECHNICAL RESEARCH RESULT
 * ================================================================ */

export interface TechnicalResearchResult {
  symbol: string;

  currentPrice: number;
  
  generatedAt: string;

  trend: TrendResult;

  momentum: MomentumResult;

  volume: VolumeResult;

  supportResistance: SupportResistanceResult;

  entryQuality: EntryQualityResult;

  riskReward: RiskRewardResult;

  technicalScore: TechnicalScoreResult;

  aiSummary: string;
}

/* ================================================================
 * ENGINE CONFIGURATION
 * ================================================================ */

export interface TechnicalEngineConfig {
  trendWeight: number;
  momentumWeight: number;
  volumeWeight: number;
  supportResistanceWeight: number;
  volatilityWeight: number;
  riskRewardWeight: number;

  minimumConfidence: number;
}

export const DEFAULT_TECHNICAL_ENGINE_CONFIG: TechnicalEngineConfig = {
  trendWeight: 30,
  momentumWeight: 20,
  volumeWeight: 15,
  supportResistanceWeight: 15,
  volatilityWeight: 10,
  riskRewardWeight: 10,

  minimumConfidence: 60,
};

/* ================================================================
 * SHARED TYPES
 * ================================================================ */

export type Signal =
  | "BUY"
  | "SELL"
  | "HOLD";

export type ConfidenceLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface ModuleResult {
  score: number;
  confidence: number;
  explanation: string;
}

// ========================================
// Support & Resistance V2
// ========================================

export type LevelSource =
  | "Swing"
  | "Fibonacci"
  | "Pivot"
  | "VWAP"
  | "VolumeProfile"
  | "MovingAverage"
  | "PreviousHighLow";

export interface PriceLevel {
  price: number;

  source: LevelSource;

  label: string;

  weight: number;

  timeframe?: "Daily" | "Weekly" | "Monthly";
}
export interface PriceZone {
  lower: number;
  upper: number;
  center: number;

  strength: number;

  confidence: number;

  contributors: PriceLevel[];

  explanation: string;

  touches: number;

  type: "Support" | "Resistance";
}