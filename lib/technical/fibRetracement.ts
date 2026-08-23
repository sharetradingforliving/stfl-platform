/**
 * ================================================================
 * STFL Technical Research Engine
 * File: fibRetracement.ts
 * Purpose: Fibonacci Retracement & Extension Levels
 * ================================================================
 */

export interface FibonacciLevels {
  high: number;
  low: number;

  retracement23_6: number;
  retracement38_2: number;
  retracement50: number;
  retracement61_8: number;
  retracement78_6: number;

  extension127_2: number;
  extension161_8: number;
}

export function calculateFibonacciLevels(
  swingHigh: number,
  swingLow: number
): FibonacciLevels {

  const range = swingHigh - swingLow;

  return {

    high: swingHigh,

    low: swingLow,

    retracement23_6: swingHigh - range * 0.236,

    retracement38_2: swingHigh - range * 0.382,

    retracement50: swingHigh - range * 0.5,

    retracement61_8: swingHigh - range * 0.618,

    retracement78_6: swingHigh - range * 0.786,

    extension127_2: swingHigh + range * 0.272,

    extension161_8: swingHigh + range * 0.618,
  };
}