import type {
  PriceData,
  VolumeData,
} from "../types";

export function buildVolume(
  priceHistory: PriceData[]
): VolumeData {
  if (priceHistory.length === 0) {
    return {
      volume: 0,
      averageVolume: 0,
      relativeVolume: 0,
    };
  }

  const currentVolume =
    priceHistory[priceHistory.length - 1].volume;

  const periods = Math.min(20, priceHistory.length);

  const averageVolume =
    priceHistory
      .slice(-periods)
      .reduce(
        (total, candle) => total + candle.volume,
        0
      ) / periods;

  return {
    volume: currentVolume,
    averageVolume,

    relativeVolume:
      averageVolume === 0
        ? 0
        : currentVolume / averageVolume,
  };
}