/**
 * ================================================================
 * STFL Technical Research Engine
 * File: levelBuilder.ts
 * Purpose: Build and classify technical price levels
 * ================================================================
 */

import type {
  MovingAverageData,
  PriceLevel,
} from "./types";

import type {
  SwingPoint,
} from "./swingDetector";

import type {
  FibonacciLevels,
} from "./fibRetracement";

import type {
  PivotLevels,
} from "./pivotPoints";

export interface LevelBuilderResult {
  supportLevels:
    PriceLevel[];

  resistanceLevels:
    PriceLevel[];
}

type DefaultLevelSide =
  | "Support"
  | "Resistance";

function isValidPrice(
  value:
    number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function calculateSwingWeight(
  swing:
    SwingPoint,

  maximumSwingIndex:
    number
): number {
  /*
   * The detector supplies structural
   * strength between 1 and 5.
   *
   * Recent swings receive a small
   * additional weight without removing
   * older major market structure.
   */
  const recencyRatio =
    maximumSwingIndex > 0
      ? swing.index /
        maximumSwingIndex
      : 0;

  const recencyWeight =
    recencyRatio >= 0.75
      ? 2
      : recencyRatio >= 0.5
        ? 1
        : 0;

  return (
    2 +
    swing.strength +
    recencyWeight
  );
}

export function buildPriceLevels(
  swingHighs:
    SwingPoint[],

  swingLows:
    SwingPoint[],

  fibonacci?:
    FibonacciLevels,

  pivots?:
    PivotLevels,

  currentPrice?:
    number,

  movingAverages?:
    MovingAverageData
): LevelBuilderResult {
  const supportLevels:
    PriceLevel[] = [];

  const resistanceLevels:
    PriceLevel[] = [];

  const hasCurrentPrice =
    isValidPrice(
      currentPrice
    );

  /*
   * Once current price is available,
   * every technical level is classified
   * according to its actual position.
   *
   * This allows a former swing high to
   * become support after a breakout and
   * a former swing low to become
   * resistance after a breakdown.
   */
  function addLevel(
    level:
      PriceLevel,

    defaultSide:
      DefaultLevelSide
  ): void {
    if (
      !isValidPrice(
        level.price
      )
    ) {
      return;
    }

    if (
      hasCurrentPrice
    ) {
      if (
        level.price <
        currentPrice
      ) {
        supportLevels.push(
          level
        );

        return;
      }

      if (
        level.price >
        currentPrice
      ) {
        resistanceLevels.push(
          level
        );

        return;
      }

      /*
       * A level equal to current price
       * is not useful as either support
       * or resistance.
       */
      return;
    }

    if (
      defaultSide ===
      "Support"
    ) {
      supportLevels.push(
        level
      );
    } else {
      resistanceLevels.push(
        level
      );
    }
  }

  const maximumSwingIndex =
    Math.max(
      0,

      ...swingHighs.map(
        (swing) =>
          swing.index
      ),

      ...swingLows.map(
        (swing) =>
          swing.index
      )
    );

  /*
   * Swing highs
   */
  for (
    const swing
    of swingHighs
  ) {
    addLevel(
      {
        price:
          swing.price,

        source:
          "Swing",

        label:
          `Swing High ${swing.date}`,

        weight:
          calculateSwingWeight(
            swing,
            maximumSwingIndex
          ),

        timeframe:
          "Daily",
      },
      "Resistance"
    );
  }

  /*
   * Swing lows
   */
  for (
    const swing
    of swingLows
  ) {
    addLevel(
      {
        price:
          swing.price,

        source:
          "Swing",

        label:
          `Swing Low ${swing.date}`,

        weight:
          calculateSwingWeight(
            swing,
            maximumSwingIndex
          ),

        timeframe:
          "Daily",
      },
      "Support"
    );
  }

  /*
   * Fibonacci retracements and
   * extensions.
   */
  if (fibonacci) {
    const fibonacciLevels:
      Array<{
        price: number;
        label: string;
        weight: number;
        defaultSide:
          DefaultLevelSide;
      }> = [
        {
          price:
            fibonacci
              .retracement23_6,

          label:
            "Fib 23.6%",

          weight: 3,

          defaultSide:
            "Support",
        },
        {
          price:
            fibonacci
              .retracement38_2,

          label:
            "Fib 38.2%",

          weight: 4,

          defaultSide:
            "Support",
        },
        {
          price:
            fibonacci
              .retracement50,

          label:
            "Fib 50%",

          weight: 5,

          defaultSide:
            "Support",
        },
        {
          price:
            fibonacci
              .retracement61_8,

          label:
            "Fib 61.8%",

          weight: 5,

          defaultSide:
            "Support",
        },
        {
          price:
            fibonacci
              .retracement78_6,

          label:
            "Fib 78.6%",

          weight: 4,

          defaultSide:
            "Support",
        },
        {
          price:
            fibonacci
              .extension127_2,

          label:
            "Fib 127.2%",

          weight: 3,

          defaultSide:
            "Resistance",
        },
        {
          price:
            fibonacci
              .extension161_8,

          label:
            "Fib 161.8%",

          weight: 3,

          defaultSide:
            "Resistance",
        },
      ];

    for (
      const level
      of fibonacciLevels
    ) {
      addLevel(
        {
          price:
            level.price,

          source:
            "Fibonacci",

          label:
            level.label,

          weight:
            level.weight,

          timeframe:
            "Daily",
        },
        level.defaultSide
      );
    }
  }

  /*
   * Classic pivot levels.
   */
  if (pivots) {
    const pivotLevels:
      Array<{
        price: number;
        label: string;
        weight: number;
        defaultSide:
          DefaultLevelSide;
      }> = [
        {
          price:
            pivots.support1,

          label: "Pivot S1",
          weight: 4,
          defaultSide:
            "Support",
        },
        {
          price:
            pivots.support2,

          label: "Pivot S2",
          weight: 3,
          defaultSide:
            "Support",
        },
        {
          price:
            pivots.support3,

          label: "Pivot S3",
          weight: 2,
          defaultSide:
            "Support",
        },
        {
          price:
            pivots.resistance1,

          label: "Pivot R1",
          weight: 4,
          defaultSide:
            "Resistance",
        },
        {
          price:
            pivots.resistance2,

          label: "Pivot R2",
          weight: 3,
          defaultSide:
            "Resistance",
        },
        {
          price:
            pivots.resistance3,

          label: "Pivot R3",
          weight: 2,
          defaultSide:
            "Resistance",
        },
      ];

    for (
      const level
      of pivotLevels
    ) {
      addLevel(
        {
          price:
            level.price,

          source:
            "Pivot",

          label:
            level.label,

          weight:
            level.weight,

          timeframe:
            "Daily",
        },
        level.defaultSide
      );
    }
  }

  /*
   * Moving averages can act as dynamic
   * support or resistance depending on
   * their location relative to price.
   */
  if (movingAverages) {
    const movingAverageLevels:
      Array<{
        price: number;
        label: string;
        weight: number;
      }> = [
        {
          price:
            movingAverages.ema20,

          label: "EMA 20",
          weight: 4,
        },
        {
          price:
            movingAverages.ema50,

          label: "EMA 50",
          weight: 5,
        },
        {
          price:
            movingAverages.ema100,

          label: "EMA 100",
          weight: 4,
        },
        {
          price:
            movingAverages.ema200,

          label: "EMA 200",
          weight: 6,
        },
        {
          price:
            movingAverages.sma20,

          label: "SMA 20",
          weight: 3,
        },
        {
          price:
            movingAverages.sma50,

          label: "SMA 50",
          weight: 4,
        },
        {
          price:
            movingAverages.sma100,

          label: "SMA 100",
          weight: 3,
        },
        {
          price:
            movingAverages.sma200,

          label: "SMA 200",
          weight: 5,
        },
      ];

    for (
      const movingAverage
      of movingAverageLevels
    ) {
      addLevel(
        {
          price:
            movingAverage.price,

          source:
            "MovingAverage",

          label:
            movingAverage.label,

          weight:
            movingAverage.weight,

          timeframe:
            "Daily",
        },

        movingAverage.price <
          (currentPrice ??
            movingAverage.price)
          ? "Support"
          : "Resistance"
      );
    }
  }

  return {
    supportLevels,
    resistanceLevels,
  };
}