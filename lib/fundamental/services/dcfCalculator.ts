import "server-only";

import type {
  DcfAssumptions,
  DcfValuationResult,
  NullableNumber,
  ValuationLabel,
  ValuationScenario,
} from "../types";

export type DcfCalculatorInputs = {
  baseFreeCashFlow:
    NullableNumber;

  currentPrice:
    NullableNumber;

  forecastYears: number;

  freeCashFlowGrowthRate:
    NullableNumber;

  wacc:
    NullableNumber;

  terminalGrowthRate:
    NullableNumber;

  netDebt:
    NullableNumber;

  dilutedShares:
    NullableNumber;

  /*
   * Optional supporting assumptions
   * retained for transparent reporting.
   */
  revenueGrowthRate?:
    NullableNumber;

  operatingMargin?:
    NullableNumber;

  taxRate?:
    NullableNumber;
};

type ScenarioInputs = {
  name:
    ValuationScenario["name"];

  freeCashFlowGrowthRate:
    number;

  wacc: number;

  terminalGrowthRate:
    number;
};

const RUPEES_PER_CRORE =
  10_000_000;

function isFiniteNumber(
  value: NullableNumber
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isPositiveNumber(
  value: NullableNumber
): value is number {
  return (
    isFiniteNumber(value) &&
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
    !isFiniteNumber(
      upsideDownsidePercent
    )
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (
    upsideDownsidePercent >= 25
  ) {
    return (
      "SIGNIFICANTLY_UNDERVALUED"
    );
  }

  if (
    upsideDownsidePercent >= 10
  ) {
    return "UNDERVALUED";
  }

  if (
    upsideDownsidePercent > -10
  ) {
    return "FAIRLY_VALUED";
  }

  if (
    upsideDownsidePercent > -25
  ) {
    return "OVERVALUED";
  }

  return (
    "SIGNIFICANTLY_OVERVALUED"
  );
}

function calculateMarginOfSafety(
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
    (fairValue - currentPrice) /
    fairValue *
    100
  );
}

function calculateScenario(
  inputs: DcfCalculatorInputs,
  scenario:
    ScenarioInputs
): ValuationScenario {
  const baseFreeCashFlow =
    inputs.baseFreeCashFlow;

  const netDebt =
    inputs.netDebt;

  const dilutedShares =
    inputs.dilutedShares;

  if (
    !isPositiveNumber(
      baseFreeCashFlow
    ) ||
    !isFiniteNumber(netDebt) ||
    !isPositiveNumber(
      dilutedShares
    )
  ) {
    return {
      name: scenario.name,
      fairValuePerShare: null,
      upsideDownsidePercent:
        null,
    };
  }

  const discountRate =
    scenario.wacc / 100;

  const growthRate =
    scenario
      .freeCashFlowGrowthRate /
    100;

  const terminalGrowthRate =
    scenario
      .terminalGrowthRate /
    100;

  if (
    discountRate <=
      terminalGrowthRate ||
    discountRate <= 0
  ) {
    return {
      name: scenario.name,
      fairValuePerShare: null,
      upsideDownsidePercent:
        null,
    };
  }

  let projectedFreeCashFlow =
    baseFreeCashFlow;

  let presentValueOfForecasts =
    0;

  for (
    let year = 1;
    year <= inputs.forecastYears;
    year += 1
  ) {
    projectedFreeCashFlow *=
      1 + growthRate;

    presentValueOfForecasts +=
      projectedFreeCashFlow /
      Math.pow(
        1 + discountRate,
        year
      );
  }

  const terminalValue =
    projectedFreeCashFlow *
    (
      1 +
      terminalGrowthRate
    ) /
    (
      discountRate -
      terminalGrowthRate
    );

  const presentValueOfTerminal =
    terminalValue /
    Math.pow(
      1 + discountRate,
      inputs.forecastYears
    );

  /*
   * Free cash flow and net debt are
   * expressed in ₹ crore.
   */
  const enterpriseValue =
    presentValueOfForecasts +
    presentValueOfTerminal;

  const equityValue =
    enterpriseValue -
    netDebt;

  const fairValuePerShare =
    equityValue > 0
      ? (
          equityValue *
          RUPEES_PER_CRORE
        ) /
        dilutedShares
      : null;

  return {
    name: scenario.name,

    fairValuePerShare,

    upsideDownsidePercent:
      calculateUpsideDownside(
        fairValuePerShare,
        inputs.currentPrice
      ),
  };
}

function unavailableResult(
  reason: string,
  assumptions:
    DcfAssumptions | null
): DcfValuationResult {
  return {
    applicable: false,

    suitabilityReason:
      reason,

    assumptions,

    scenarios: [],

    selectedFairValue: null,

    marginOfSafety: null,
        valuationLabel:
      "INSUFFICIENT_DATA",
  };
}

export function calculateDcfValuation(
  inputs: DcfCalculatorInputs
): DcfValuationResult {
  const assumptions:
    DcfAssumptions = {
      forecastYears:
        inputs.forecastYears,

      revenueGrowthRate:
        inputs.revenueGrowthRate ??
        null,

      freeCashFlowGrowthRate:
        inputs
          .freeCashFlowGrowthRate,

      operatingMargin:
        inputs.operatingMargin ??
        null,

      taxRate:
        inputs.taxRate ??
        null,

      wacc:
        inputs.wacc,

      terminalGrowthRate:
        inputs.terminalGrowthRate,

      netDebt:
        inputs.netDebt,

      dilutedShares:
        inputs.dilutedShares,
    };

  if (
    !Number.isInteger(
      inputs.forecastYears
    ) ||
    inputs.forecastYears < 1 ||
    inputs.forecastYears > 10
  ) {
    return unavailableResult(
      "DCF requires a forecast period between one and ten complete years.",
      assumptions
    );
  }

  if (
    !isPositiveNumber(
      inputs.baseFreeCashFlow
    )
  ) {
    return unavailableResult(
      "DCF requires a positive verified base free cash flow.",
      assumptions
    );
  }

  if (
    !isFiniteNumber(
      inputs.freeCashFlowGrowthRate
    )
  ) {
    return unavailableResult(
      "DCF requires an explicit free-cash-flow growth assumption.",
      assumptions
    );
  }

  if (
    !isPositiveNumber(
      inputs.wacc
    )
  ) {
    return unavailableResult(
      "DCF requires a valid calculated WACC.",
      assumptions
    );
  }

  if (
    !isFiniteNumber(
      inputs.terminalGrowthRate
    )
  ) {
    return unavailableResult(
      "DCF requires an explicit terminal-growth assumption.",
      assumptions
    );
  }

  if (
    inputs.wacc <=
    inputs.terminalGrowthRate
  ) {
    return unavailableResult(
      "WACC must be greater than the terminal-growth rate.",
      assumptions
    );
  }

  if (
    !isFiniteNumber(
      inputs.netDebt
    )
  ) {
    return unavailableResult(
      "DCF requires verified net debt.",
      assumptions
    );
  }

  if (
    !isPositiveNumber(
      inputs.dilutedShares
    )
  ) {
    return unavailableResult(
      "DCF requires a verified diluted share count.",
      assumptions
    );
  }

  /*
   * Scenario spreads are explicit:
   *
   * Bear:
   * growth −2%, WACC +1%
   *
   * Base:
   * supplied assumptions
   *
   * Bull:
   * growth +2%, WACC −1%
   *
   * The terminal-growth assumption is
   * unchanged across scenarios for now.
   */
  const scenarios:
    ValuationScenario[] = [
      calculateScenario(
        inputs,
        {
          name: "BEAR",

          freeCashFlowGrowthRate:
            inputs
              .freeCashFlowGrowthRate -
            2,

          wacc:
            inputs.wacc + 1,

          terminalGrowthRate:
            inputs
              .terminalGrowthRate,
        }
      ),

      calculateScenario(
        inputs,
        {
          name: "BASE",

          freeCashFlowGrowthRate:
            inputs
              .freeCashFlowGrowthRate,

          wacc:
            inputs.wacc,

          terminalGrowthRate:
            inputs
              .terminalGrowthRate,
        }
      ),

      calculateScenario(
        inputs,
        {
          name: "BULL",

          freeCashFlowGrowthRate:
            inputs
              .freeCashFlowGrowthRate +
            2,

          wacc:
            Math.max(
              inputs.wacc - 1,
              inputs
                .terminalGrowthRate +
                0.25
            ),

          terminalGrowthRate:
            inputs
              .terminalGrowthRate,
        }
      ),
    ];

  const baseScenario =
    scenarios.find(
      (scenario) =>
        scenario.name === "BASE"
    ) ?? null;

  const selectedFairValue =
    baseScenario
      ?.fairValuePerShare ??
    null;

  return {
    applicable:
      selectedFairValue !== null,

    suitabilityReason:
      selectedFairValue !== null
        ? "DCF was calculated from verified free cash flow, net debt and share count using explicit WACC, growth and terminal-value assumptions."
        : "DCF could not produce a positive equity value under the supplied assumptions.",

    assumptions,

    scenarios,

    selectedFairValue,

    marginOfSafety:
      calculateMarginOfSafety(
        selectedFairValue,
        inputs.currentPrice
        
      ),
          valuationLabel:
      classifyValuation(
        calculateUpsideDownside(
          selectedFairValue,
          inputs.currentPrice
        )
      ),
  };
}