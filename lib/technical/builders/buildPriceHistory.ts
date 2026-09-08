import type {
  PriceData,
} from "../types";

export interface BusinessDayInput {
  year: number;
  month: number;
  day: number;
}

export interface CandleInput {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  /*
   * Lightweight Charts can provide
   * epoch seconds, an ISO date string,
   * or a BusinessDay object.
   */
  time:
    | number
    | string
    | BusinessDayInput;
}

function convertCandleTimeToDate(
  time:
    CandleInput["time"]
): string {
  if (
    typeof time === "number"
  ) {
    return new Date(
      time * 1000
    ).toISOString();
  }

  if (
    typeof time === "string"
  ) {
    return new Date(
      time
    ).toISOString();
  }

  return new Date(
    Date.UTC(
      time.year,
      time.month - 1,
      time.day
    )
  ).toISOString();
}

export function buildPriceHistory(
  candles:
    CandleInput[]
): PriceData[] {
  return candles.map(
    (candle) => ({
      open:
        candle.open,

      high:
        candle.high,

      low:
        candle.low,

      close:
        candle.close,

      volume:
        candle.volume,

      date:
        convertCandleTimeToDate(
          candle.time
        ),
    })
  );
}