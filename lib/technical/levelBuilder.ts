/**
 * ================================================================
 * STFL Technical Research Engine
 * File: levelBuilder.ts
 * Purpose: Build technical Price Levels from multiple sources
 * ================================================================
 */

import { PriceLevel } from "./types";
import { SwingPoint } from "./swingDetector";
import { FibonacciLevels } from "./fibRetracement";
import { PivotLevels } from "./pivotPoints";

export interface LevelBuilderResult {
  supportLevels: PriceLevel[];
  resistanceLevels: PriceLevel[];
}

export function buildPriceLevels(
  swingHighs: SwingPoint[],
  swingLows: SwingPoint[],
  fibonacci?: FibonacciLevels,
  pivots?: PivotLevels
): LevelBuilderResult {

  const supportLevels: PriceLevel[] = [];
  const resistanceLevels: PriceLevel[] = [];

  // ------------------------------------------------
  // Swing Highs
  // ------------------------------------------------
  swingHighs.forEach((swing) => {

    resistanceLevels.push({
      price: swing.price,
      source: "Swing",
      label: "Swing High",
      weight: 5,
    });

  });

  // ------------------------------------------------
  // Swing Lows
  // ------------------------------------------------
  swingLows.forEach((swing) => {

    supportLevels.push({
      price: swing.price,
      source: "Swing",
      label: "Swing Low",
      weight: 5,
    });

  });

  // ------------------------------------------------
  // Fibonacci
  // ------------------------------------------------
  if (fibonacci) {

    supportLevels.push(
      {
        price: fibonacci.retracement23_6,
        source: "Fibonacci",
        label: "Fib 23.6%",
        weight: 3,
      },
      {
        price: fibonacci.retracement38_2,
        source: "Fibonacci",
        label: "Fib 38.2%",
        weight: 4,
      },
      {
        price: fibonacci.retracement50,
        source: "Fibonacci",
        label: "Fib 50%",
        weight: 5,
      },
      {
        price: fibonacci.retracement61_8,
        source: "Fibonacci",
        label: "Fib 61.8%",
        weight: 5,
      },
      {
        price: fibonacci.retracement78_6,
        source: "Fibonacci",
        label: "Fib 78.6%",
        weight: 4,
      }
    );

    resistanceLevels.push(
      {
        price: fibonacci.extension127_2,
        source: "Fibonacci",
        label: "Fib 127.2%",
        weight: 3,
      },
      {
        price: fibonacci.extension161_8,
        source: "Fibonacci",
        label: "Fib 161.8%",
        weight: 3,
      }
    );
  }

  // ------------------------------------------------
  // Pivot Points
  // ------------------------------------------------
  if (pivots) {

    supportLevels.push(
      {
        price: pivots.support1,
        source: "Pivot",
        label: "S1",
        weight: 4,
      },
      {
        price: pivots.support2,
        source: "Pivot",
        label: "S2",
        weight: 3,
      },
      {
        price: pivots.support3,
        source: "Pivot",
        label: "S3",
        weight: 2,
      }
    );

    resistanceLevels.push(
      {
        price: pivots.resistance1,
        source: "Pivot",
        label: "R1",
        weight: 4,
      },
      {
        price: pivots.resistance2,
        source: "Pivot",
        label: "R2",
        weight: 3,
      },
      {
        price: pivots.resistance3,
        source: "Pivot",
        label: "R3",
        weight: 2,
      }
    );
  }

  return {
    supportLevels,
    resistanceLevels,
  };
}