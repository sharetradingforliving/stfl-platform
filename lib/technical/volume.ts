/**
 * ================================================================
 * STFL Technical Research Engine
 * File: volume.ts
 * Purpose: Volume Analysis Module
 * ================================================================
 */

import {
  TechnicalResearchInput,
  VolumeResult,
} from "./types";

/**
 * Determine accumulation/distribution
 */
function isAccumulation(
  currentVolume: number,
  averageVolume: number
): boolean {
  return currentVolume > averageVolume * 1.2;
}

function isDistribution(
  currentVolume: number,
  averageVolume: number
): boolean {
  return currentVolume < averageVolume * 0.8;
}

/**
 * Analyze Volume
 */
export function analyzeVolume(
  input: TechnicalResearchInput
): VolumeResult {

  const volume = input.volume;

  const accumulation = isAccumulation(
    volume.volume,
    volume.averageVolume
  );

  const distribution = isDistribution(
    volume.volume,
    volume.averageVolume
  );

  let score = 50;

  if (accumulation) score += 25;

  if (distribution) score -= 15;

  score = Math.max(0, Math.min(score, 100));

  const breakoutConfirmed =
    volume.relativeVolume >= 1.5;

  return {
    score,

    relativeVolume: volume.relativeVolume,

    accumulation,

    distribution,

    breakoutConfirmed,

    confidence: score,

    explanation:
      `Volume score is ${score}/100. Relative Volume is ${volume.relativeVolume.toFixed(
        2
      )}.`,
  };
}