/**
 * ================================================================
 * STFL Technical Research Engine
 * File: riskReward.ts
 * Purpose: Volatility-adjusted Risk/Reward Analysis
 * ================================================================
 */

import type {
  PriceZone,
  RiskRewardResult,
  SupportResistanceResult,
} from "./types";

function isPositiveNumber(
  value:
    number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function roundPrice(
  value: number
): number {
  return Number(
    value.toFixed(2)
  );
}

function findNextResistance(
  currentPrice:
    number,

  immediateResistance:
    number,

  resistanceZones:
    PriceZone[]
): number | null {
  const higherResistanceLevels =
    resistanceZones
      .flatMap(
        (zone) => [
          zone.center,
          zone.upper,
        ]
      )
      .filter(
        (level) =>
          isPositiveNumber(
            level
          ) &&
          level >
            currentPrice &&
          level >
            immediateResistance
      )
            .sort(
        (first, second) =>
          first - second
      );

  return (
    higherResistanceLevels[0] ??
    null
  );
}

export function analyzeRiskReward(
  currentPrice:
    number,

  supportResistance:
    SupportResistanceResult,

  atr:
    number | null | undefined
): RiskRewardResult {
  const immediateSupport =
    supportResistance
      .immediateSupport;

  const majorSupport =
    supportResistance
      .majorSupport;

  /*
   * Always begin with the ranked
   * support displayed in the summary.
   */
  const selectedSupport =
    isPositiveNumber(
      immediateSupport
    ) &&
    immediateSupport <
      currentPrice
      ? immediateSupport
      : isPositiveNumber(
            majorSupport
          ) &&
          majorSupport <
            currentPrice
        ? majorSupport
        : null;

  const supportDistance =
    selectedSupport !== null
      ? currentPrice -
        selectedSupport
      : null;

  /*
   * ATR is preferred. When unavailable,
   * use the measured structural support
   * distance as the volatility unit.
   */
  const volatilityUnit =
    isPositiveNumber(
      atr
    )
      ? atr
      : isPositiveNumber(
            supportDistance
          )
        ? supportDistance
        : null;

  const stopBuffer =
    volatilityUnit !== null
      ? volatilityUnit * 0.5
      : 0;

  /*
   * Stop loss must be below the selected
   * support—not equal to or above it.
   */
  let stopLoss =
    selectedSupport !== null
      ? selectedSupport -
        stopBuffer
      : currentPrice -
        stopBuffer;

  if (
    !isPositiveNumber(
      stopLoss
    ) ||
    stopLoss >=
      currentPrice
  ) {
    stopLoss =
      selectedSupport ??
      currentPrice;
  }

  const risk =
    currentPrice -
    stopLoss;

  const immediateResistance =
    isPositiveNumber(
      supportResistance
        .immediateResistance
    ) &&
    supportResistance
      .immediateResistance >
      currentPrice
      ? supportResistance
          .immediateResistance
      : currentPrice;

  const majorResistance =
    isPositiveNumber(
      supportResistance
        .majorResistance
    ) &&
    supportResistance
      .majorResistance >
      immediateResistance
      ? supportResistance
          .majorResistance
      : null;

  const nextZoneResistance =
    findNextResistance(
      currentPrice,
      immediateResistance,
      supportResistance
        .resistanceZones ??
        []
    );

  /*
   * The minimum analytical target is
   * based on two units of calculated
   * risk.
   */
  const minimumRewardTarget =
    risk > 0
      ? currentPrice +
        risk * 2
      : immediateResistance;

  /*
   * Target hierarchy:
   *
   * 1. Next verified resistance
   * 2. Major ranked resistance
   * 3. Two-to-one calculated target
   *
   * It must remain beyond immediate
   * resistance to avoid displaying
   * Resistance and Target as the same
   * value.
   */
  const verifiedHigherTarget =
    nextZoneResistance ??
    majorResistance;

  const resistanceBuffer =
    volatilityUnit !== null
      ? volatilityUnit * 0.25
      : 0;

  const target =
    verifiedHigherTarget !==
      null
      ? Math.max(
          verifiedHigherTarget,
          minimumRewardTarget
        )
      : Math.max(
          minimumRewardTarget,
          immediateResistance +
            resistanceBuffer
        );

  const roundedStopLoss =
    roundPrice(
      stopLoss
    );

  const roundedTarget =
    roundPrice(
      target
    );

  const roundedRisk =
    roundPrice(
      currentPrice -
      roundedStopLoss
    );

  const roundedReward =
    roundPrice(
      roundedTarget -
      currentPrice
    );

  const ratio =
    roundedRisk > 0 &&
    roundedReward > 0
      ? Number(
          (
            roundedReward /
            roundedRisk
          ).toFixed(2)
        )
      : 0;

  let verdict =
    "Poor";

  if (ratio >= 3) {
    verdict =
      "Excellent";
  } else if (
    ratio >= 2
  ) {
    verdict =
      "Good";
  } else if (
    ratio >= 1
  ) {
    verdict =
      "Average";
  }

  const confidence =
    Math.round(
      (
        supportResistance
          .confidence +
        (
          isPositiveNumber(
            atr
          )
            ? 100
            : 60
        )
      ) /
      2
    );

  const targetSource =
    nextZoneResistance !==
      null
      ? "the next verified resistance zone"
      : majorResistance !==
            null
        ? "the major resistance zone"
        : "the calculated minimum 2:1 reward level";

  return {
    stopLoss:
      roundedStopLoss,

    target:
      roundedTarget,

    risk:
      roundedRisk,

    reward:
      roundedReward,

    ratio,

    verdict,

    confidence,

    explanation:
      `Support is ₹${immediateSupport.toFixed(
        2
      )}. Stop loss ₹${roundedStopLoss.toFixed(
        2
      )} is placed below support using a volatility buffer. ` +
      `Immediate resistance is ₹${immediateResistance.toFixed(
        2
      )}, while target ₹${roundedTarget.toFixed(
        2
      )} uses ${targetSource}. ` +
      `Risk/reward is 1:${ratio} (${verdict}).`,
  };
}