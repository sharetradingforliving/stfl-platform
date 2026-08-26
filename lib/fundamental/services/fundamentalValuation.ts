import "server-only";

import type {
  FundamentalMetrics,
  GrahamValuationResult,
  MarketSnapshot,
  NullableNumber,
  ValuationLabel,
} from "../types";

const GRAHAM_MULTIPLIER =
  22.5;

function isPositiveNumber(
  value: NullableNumber
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function calculateUpsideDownside(
  fairValue: NullableNumber,
  currentPrice: NullableNumber
): NullableNumber {
  if (
    !isPositiveNumber(fairValue) ||
    !isPositiveNumber(currentPrice)
  ) {
    return null;
  }

  return (
    (fairValue / currentPrice - 1) *
    100
  );
}

function classifyValuation(
  upsideDownsidePercent:
    NullableNumber
): ValuationLabel {
  if (
    typeof upsideDownsidePercent !==
      "number" ||
    !Number.isFinite(
      upsideDownsidePercent
    )
  ) {
    return "INSUFFICIENT_DATA";
  }

  /*
   * Fair value at least 25% above the
   * market price.
   */
  if (
    upsideDownsidePercent >= 25
  ) {
    return (
      "SIGNIFICANTLY_UNDERVALUED"
    );
  }

  /*
   * Fair value between 10% and 25%
   * above the market price.
   */
  if (
    upsideDownsidePercent >= 10
  ) {
    return "UNDERVALUED";
  }

  /*
   * Fair value remains within a
   * practical ±10% valuation range.
   */
  if (
    upsideDownsidePercent > -10
  ) {
    return "FAIRLY_VALUED";
  }

  /*
   * Fair value is between 10% and 25%
   * below the market price.
   */
  if (
    upsideDownsidePercent > -25
  ) {
    return "OVERVALUED";
  }

  /*
   * Fair value is at least 25% below
   * the current market price.
   */
  return (
    "SIGNIFICANTLY_OVERVALUED"
  );
}

/*
 * Graham Number:
 *
 * Fair Value =
 * √(22.5 × EPS × Book Value/Share)
 *
 * 22.5 represents Graham's traditional
 * combination of a maximum 15x P/E and
 * 1.5x P/B:
 *
 * 15 × 1.5 = 22.5
 */
export function calculateGrahamValuation(
  metrics: FundamentalMetrics | null,
  market: MarketSnapshot | null
): GrahamValuationResult {
  if (!metrics) {
    return {
      applicable: false,

      suitabilityReason:
        "Fundamental metrics are unavailable.",

      fairValuePerShare: null,

      upsideDownsidePercent:
        null,

      valuationLabel:
        "INSUFFICIENT_DATA",
    };
  }

  const earningsPerShare =
    metrics.valuation
      .earningsPerShare;

  const bookValuePerShare =
    metrics.valuation
      .bookValuePerShare;

  if (
    !isPositiveNumber(
      earningsPerShare
    )
  ) {
    return {
      applicable: false,

      suitabilityReason:
        "Graham valuation requires positive verified earnings per share.",

      fairValuePerShare: null,

      upsideDownsidePercent:
        null,

      valuationLabel:
        "INSUFFICIENT_DATA",
    };
  }

  if (
    !isPositiveNumber(
      bookValuePerShare
    )
  ) {
    return {
      applicable: false,

      suitabilityReason:
        "Graham valuation requires a positive verified book value per share.",

      fairValuePerShare: null,

      upsideDownsidePercent:
        null,

      valuationLabel:
        "INSUFFICIENT_DATA",
    };
  }

  const fairValuePerShare =
    Math.sqrt(
      GRAHAM_MULTIPLIER *
      earningsPerShare *
      bookValuePerShare
    );

  const currentPrice =
    market?.currentPrice ??
    null;

  const upsideDownsidePercent =
    calculateUpsideDownside(
      fairValuePerShare,
      currentPrice
    );

  return {
    applicable: true,

    suitabilityReason:
      "Calculated from verified diluted EPS and shareholder book value per share. This is a conservative Graham benchmark and should not be used as the sole valuation method for conglomerates, high-growth businesses or financial companies.",

    fairValuePerShare,

    upsideDownsidePercent,

    valuationLabel:
      classifyValuation(
        upsideDownsidePercent
      ),
  };
}