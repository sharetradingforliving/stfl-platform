/**
 * ================================================================
 * STFL Technical Research Engine
 * File: swingDetector.ts
 * Purpose: Detect Swing Highs & Swing Lows
 * ================================================================
 */

import { PriceData } from "./types";

/**
 * Swing Type
 */
export type SwingType = "HIGH" | "LOW";

/**
 * Swing Point
 */
export interface SwingPoint {
  index: number;
  date: string;
  price: number;
  type: SwingType;
  strength: number;
}

/**
 * Swing Detection Result
 */
export interface SwingDetectionResult {
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];
}
/**
 * Check if the candle at the given index is a Swing High
 */
function isSwingHigh(history: PriceData[], index: number): boolean {
  return (
    history[index].high > history[index - 1].high &&
    history[index].high > history[index - 2].high &&
    history[index].high > history[index + 1].high &&
    history[index].high > history[index + 2].high
  );
}

/**
 * Check if the candle at the given index is a Swing Low
 */
function isSwingLow(history: PriceData[], index: number): boolean {
  return (
    history[index].low < history[index - 1].low &&
    history[index].low < history[index - 2].low &&
    history[index].low < history[index + 1].low &&
    history[index].low < history[index + 2].low
  );
}
/**
 * Detect Swing Highs & Swing Lows
 */
export function detectSwingPoints(
  history: PriceData[]
): SwingDetectionResult {
    console.log("================================");

  const swingHighs: SwingPoint[] = [];
const swingLows: SwingPoint[] = [];


// Skip first 2 and last 2 candles
for (let i = 2; i < history.length - 2; i++) {

  if (isSwingHigh(history, i)) {
    swingHighs.push({
      index: i,
      date: history[i].date,
      price: history[i].high,
      type: "HIGH",
      strength: 1,
    });
  }

  if (isSwingLow(history, i)) {
    swingLows.push({
      index: i,
      date: history[i].date,
      price: history[i].low,
      type: "LOW",
      strength: 1,
    });
  }

}

return {
  swingHighs,
  swingLows,
};
}