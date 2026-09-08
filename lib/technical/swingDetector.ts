/**
 * ================================================================
 * STFL Technical Research Engine
 * File: swingDetector.ts
 * Purpose: Detect and rank meaningful Swing Highs and Swing Lows
 * ================================================================
 */

import type {
  PriceData,
} from "./types";

export type SwingType =
  | "HIGH"
  | "LOW";

export interface SwingPoint {
  index: number;
  date: string;
  price: number;
  type: SwingType;

  /*
   * Calculated strength from 1 to 5.
   * Higher values represent more
   * prominent structural swings.
   */
  strength: number;
}

export interface SwingDetectionResult {
  swingHighs:
    SwingPoint[];

  swingLows:
    SwingPoint[];
}

function isValidPrice(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    value > 0
  );
}

function getDetectionWindow(
  historyLength: number
): number {
  /*
   * Short histories retain a smaller
   * window. Longer daily histories use
   * a wider window to suppress noise.
   */
  if (historyLength >= 100) {
    return 4;
  }

  if (historyLength >= 50) {
    return 3;
  }

  return 2;
}

function calculateSwingStrength(
  history:
    PriceData[],

  index:
    number,

  type:
    SwingType,

  window:
    number
): number {
  const candle =
    history[index];

  const surrounding =
    history.slice(
      index - window,
      index + window + 1
    );

  const neighbouring =
    surrounding.filter(
      (_, surroundingIndex) =>
        surroundingIndex !==
        window
    );

  if (
    neighbouring.length === 0
  ) {
    return 1;
  }

  const referencePrice =
    type === "HIGH"
      ? Math.max(
          ...neighbouring.map(
            (item) =>
              item.high
          )
        )
      : Math.min(
          ...neighbouring.map(
            (item) =>
              item.low
          )
        );

  const swingPrice =
    type === "HIGH"
      ? candle.high
      : candle.low;

  const prominence =
    type === "HIGH"
      ? swingPrice -
        referencePrice
      : referencePrice -
        swingPrice;

  const prominencePercent =
    swingPrice > 0
      ? (
          prominence /
          swingPrice
        ) * 100
      : 0;

  /*
   * Start every confirmed swing at 1.
   * Increase strength as prominence
   * rises above nearby price action.
   */
  if (
    prominencePercent >= 3
  ) {
    return 5;
  }

  if (
    prominencePercent >= 2
  ) {
    return 4;
  }

  if (
    prominencePercent >= 1
  ) {
    return 3;
  }

  if (
    prominencePercent >= 0.5
  ) {
    return 2;
  }

  return 1;
}

function isSwingHigh(
  history:
    PriceData[],

  index:
    number,

  window:
    number
): boolean {
  const candidate =
    history[index].high;

  if (
    !isValidPrice(candidate)
  ) {
    return false;
  }

  for (
    let offset = 1;
    offset <= window;
    offset += 1
  ) {
    if (
      candidate <=
        history[index - offset]
          .high ||
      candidate <=
        history[index + offset]
          .high
    ) {
      return false;
    }
  }

  return true;
}

function isSwingLow(
  history:
    PriceData[],

  index:
    number,

  window:
    number
): boolean {
  const candidate =
    history[index].low;

  if (
    !isValidPrice(candidate)
  ) {
    return false;
  }

  for (
    let offset = 1;
    offset <= window;
    offset += 1
  ) {
    if (
      candidate >=
        history[index - offset]
          .low ||
      candidate >=
        history[index + offset]
          .low
    ) {
      return false;
    }
  }

  return true;
}

export function detectSwingPoints(
  history:
    PriceData[]
): SwingDetectionResult {
  const swingHighs:
    SwingPoint[] = [];

  const swingLows:
    SwingPoint[] = [];

  const window =
    getDetectionWindow(
      history.length
    );

  if (
    history.length <
    window * 2 + 1
  ) {
    return {
      swingHighs,
      swingLows,
    };
  }

  for (
    let index = window;
    index <
    history.length - window;
    index += 1
  ) {
    if (
      isSwingHigh(
        history,
        index,
        window
      )
    ) {
      swingHighs.push({
        index,

        date:
          history[index].date,

        price:
          history[index].high,

        type:
          "HIGH",

        strength:
          calculateSwingStrength(
            history,
            index,
            "HIGH",
            window
          ),
      });
    }

    if (
      isSwingLow(
        history,
        index,
        window
      )
    ) {
      swingLows.push({
        index,

        date:
          history[index].date,

        price:
          history[index].low,

        type:
          "LOW",

        strength:
          calculateSwingStrength(
            history,
            index,
            "LOW",
            window
          ),
      });
    }
  }

  return {
    swingHighs,
    swingLows,
  };
}