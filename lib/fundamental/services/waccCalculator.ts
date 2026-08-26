import "server-only";

import type {
  NullableNumber,
} from "../types";

export type WaccInputSource =
  | "REPORTED"
  | "CALCULATED"
  | "MARKET_DATA"
  | "USER_ASSUMPTION"
  | "DEFAULT_ASSUMPTION"
  | "UNAVAILABLE";

export type WaccInput = {
  value: NullableNumber;
  source: WaccInputSource;
  explanation: string;
};

export type WaccInputs = {
  riskFreeRate: WaccInput;
  beta: WaccInput;
  equityRiskPremium: WaccInput;

  marketCapitalization: WaccInput;
  totalDebt: WaccInput;

  financeCosts: WaccInput;
  profitBeforeTax: WaccInput;
  taxExpense: WaccInput;
};

export type WaccResult = {
  applicable: boolean;
  suitabilityReason: string;

  inputs: WaccInputs;

  costOfEquity:
    NullableNumber;

  preTaxCostOfDebt:
    NullableNumber;

  effectiveTaxRate:
    NullableNumber;

  afterTaxCostOfDebt:
    NullableNumber;

  equityWeight:
    NullableNumber;

  debtWeight:
    NullableNumber;

  wacc:
    NullableNumber;

  warnings: string[];
};

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

function safeDivide(
  numerator: NullableNumber,
  denominator: NullableNumber
): NullableNumber {
  if (
    !isFiniteNumber(numerator) ||
    !isPositiveNumber(denominator)
  ) {
    return null;
  }

  return numerator / denominator;
}

function percentage(
  numerator: NullableNumber,
  denominator: NullableNumber
): NullableNumber {
  const ratio =
    safeDivide(
      numerator,
      denominator
    );

  return ratio === null
    ? null
    : ratio * 100;
}

function clampPercentage(
  value: NullableNumber,
  minimum: number,
  maximum: number
): NullableNumber {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

function uniqueWarnings(
  warnings: string[]
): string[] {
  return Array.from(
    new Set(
      warnings.filter(
        (warning) =>
          warning.trim().length > 0
      )
    )
  );
}

/*
 * All rates supplied to this calculator
 * use percentage points:
 *
 * 6.8 means 6.8%, not 0.068.
 */
export function calculateWacc(
  inputs: WaccInputs
): WaccResult {
  const warnings: string[] = [];

  const riskFreeRate =
    inputs.riskFreeRate.value;

  const beta =
    inputs.beta.value;

  const equityRiskPremium =
    inputs.equityRiskPremium.value;

  const marketCapitalization =
    inputs.marketCapitalization.value;

  const totalDebt =
    inputs.totalDebt.value;

  const financeCosts =
    inputs.financeCosts.value;

  const profitBeforeTax =
    inputs.profitBeforeTax.value;

  const taxExpense =
    inputs.taxExpense.value;

  const costOfEquity =
    isFiniteNumber(
      riskFreeRate
    ) &&
    isFiniteNumber(beta) &&
    isFiniteNumber(
      equityRiskPremium
    )
      ? riskFreeRate +
        beta *
          equityRiskPremium
      : null;

  /*
   * Finance cost divided by closing
   * debt is a practical approximation.
   * A debt-average calculation can
   * replace it when complete historical
   * debt data is available.
   */
  const preTaxCostOfDebt =
    percentage(
      financeCosts,
      totalDebt
    );

  const calculatedTaxRate =
    percentage(
      taxExpense,
      profitBeforeTax
    );

  /*
   * Prevent unusual tax items from
   * creating an unusable WACC.
   */
  const effectiveTaxRate =
    clampPercentage(
      calculatedTaxRate,
      0,
      40
    );

  const afterTaxCostOfDebt =
    isFiniteNumber(
      preTaxCostOfDebt
    ) &&
    isFiniteNumber(
      effectiveTaxRate
    )
      ? preTaxCostOfDebt *
        (
          1 -
          effectiveTaxRate /
            100
        )
      : null;

  const totalCapital =
    isFiniteNumber(
      marketCapitalization
    ) &&
    isFiniteNumber(
      totalDebt
    )
      ? marketCapitalization +
        totalDebt
      : null;

  const equityWeight =
    safeDivide(
      marketCapitalization,
      totalCapital
    );

  const debtWeight =
    safeDivide(
      totalDebt,
      totalCapital
    );

  const wacc =
    isFiniteNumber(
      costOfEquity
    ) &&
    isFiniteNumber(
      afterTaxCostOfDebt
    ) &&
    isFiniteNumber(
      equityWeight
    ) &&
    isFiniteNumber(
      debtWeight
    )
      ? costOfEquity *
          equityWeight +
        afterTaxCostOfDebt *
          debtWeight
      : null;

  if (
    !isPositiveNumber(
      marketCapitalization
    )
  ) {
    warnings.push(
      "Market capitalization is unavailable."
    );
  }

  if (
    !isPositiveNumber(
      totalDebt
    )
  ) {
    warnings.push(
      "Verified total debt is unavailable."
    );
  }

  if (
    !isPositiveNumber(
      financeCosts
    )
  ) {
    warnings.push(
      "Verified finance cost is unavailable."
    );
  }

  if (
    !isFiniteNumber(
      riskFreeRate
    )
  ) {
    warnings.push(
      "Risk-free rate is unavailable."
    );
  }

  if (!isFiniteNumber(beta)) {
    warnings.push(
      "Equity beta is unavailable."
    );
  }

  if (
    !isFiniteNumber(
      equityRiskPremium
    )
  ) {
    warnings.push(
      "Equity risk premium is unavailable."
    );
  }

  const cleanWarnings =
    uniqueWarnings(warnings);

  return {
    applicable:
      wacc !== null,

    suitabilityReason:
      wacc !== null
        ? "WACC was calculated using market-value capital weights, CAPM cost of equity and the after-tax cost of debt."
        : "WACC could not be calculated because one or more required market or assumption inputs are unavailable.",

    inputs,

    costOfEquity,
    preTaxCostOfDebt,
    effectiveTaxRate,
    afterTaxCostOfDebt,
    equityWeight,
    debtWeight,
    wacc,

    warnings:
      cleanWarnings,
  };
}