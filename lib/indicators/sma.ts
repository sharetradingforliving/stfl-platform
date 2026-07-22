import type { Time } from "lightweight-charts";

export interface IndicatorCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorPoint {
  time: Time;
  value: number;
}
export function calculateSMA(
  candles: IndicatorCandle[],
  period: number
): IndicatorPoint[] {
  const smaData: IndicatorPoint[] = [];

  for (let index = period - 1; index < candles.length; index++) {
    let total = 0;

    for (
      let candleIndex = index - period + 1;
      candleIndex <= index;
      candleIndex++
    ) {
      total += candles[candleIndex].close;
    }

    smaData.push({
      time: candles[index].time,
      value: total / period,
    });
  }

  return smaData;
}