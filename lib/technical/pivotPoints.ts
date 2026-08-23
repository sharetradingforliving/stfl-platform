/**
 * ================================================================
 * STFL Technical Research Engine
 * File: pivotPoints.ts
 * Purpose: Classic Pivot Point Calculation
 * ================================================================
 */

export interface PivotLevels {
  pivot: number;

  resistance1: number;
  resistance2: number;
  resistance3: number;

  support1: number;
  support2: number;
  support3: number;
}

export function calculateClassicPivot(
  high: number,
  low: number,
  close: number
): PivotLevels {

  const pivot = (high + low + close) / 3;

  const resistance1 = (2 * pivot) - low;
  const support1 = (2 * pivot) - high;

  const resistance2 = pivot + (high - low);
  const support2 = pivot - (high - low);

  const resistance3 = high + 2 * (pivot - low);
  const support3 = low - 2 * (high - pivot);

  return {

    pivot,

    resistance1,
    resistance2,
    resistance3,

    support1,
    support2,
    support3,
  };
}