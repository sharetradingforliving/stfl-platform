import "server-only";

import type {
  DcfValuationResult,
  FinancialStatementPeriod,
  FundamentalMetrics,
  MarketSnapshot,
  NullableNumber,
} from "../types";

import type {
  WaccResult,
} from "./waccCalculator";

import {
  calculateDcfValuation,
} from "./dcfCalculator";

export type CompanyDcfAssumptions = {
  forecastYears:
    number | null;

  /*
   * Rates use percentage points:
   * 8 means 8%.
   */
  freeCashFlowGrowthRate:
    NullableNumber;

  terminalGrowthRate:
    NullableNumber;
};

function isFiniteNumber(
  value: NullableNumber
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function getLatestAnnualPeriod(
  periods:
    FinancialStatementPeriod[]
): FinancialStatementPeriod | null {
  return (
    periods
      .filter(
        (period) =>
          period.periodType ===
          "ANNUAL"
      )
      .slice()
      .sort(
        (first, second) =>
          (
            first.endDate ??
            first.period
          ).localeCompare(
            second.endDate ??
            second.period
          )
      )
      .at(-1) ??
    null
  );
}

function getFreeCashFlow(
  period:
    FinancialStatementPeriod | null
): NullableNumber {
  if (!period) {
    return null;
  }

  if (
    isFiniteNumber(
      period.freeCashFlow
    )
  ) {
    return period.freeCashFlow;
  }

  if (
    isFiniteNumber(
      period.operatingCashFlow
    ) &&
    isFiniteNumber(
      period.capitalExpenditure
    )
  ) {
    return (
      period.operatingCashFlow -
      Math.abs(
        period.capitalExpenditure
      )
    );
  }

  return null;
}

function getNetDebt(
  period:
    FinancialStatementPeriod | null
): NullableNumber {
  if (
    !period ||
    !isFiniteNumber(
      period.totalDebt
    ) ||
    !isFiniteNumber(
      period.cashAndEquivalents
    )
  ) {
    return null;
  }

  return (
    period.totalDebt -
    period.cashAndEquivalents
  );
}

function getEffectiveTaxRate(
  period:
    FinancialStatementPeriod | null
): NullableNumber {
  if (
    !period ||
    !isFiniteNumber(
      period.taxExpense
    ) ||
    !isFiniteNumber(
      period.profitBeforeTax
    ) ||
    period.profitBeforeTax <= 0
  ) {
    return null;
  }

  return (
    period.taxExpense /
    period.profitBeforeTax *
    100
  );
}

export function calculateCompanyDcf(
  annualPeriods:
    FinancialStatementPeriod[],

  metrics:
    FundamentalMetrics | null,

  market:
    MarketSnapshot | null,

  wacc:
    WaccResult,

  assumptions:
    CompanyDcfAssumptions
): DcfValuationResult {
  const latestAnnual =
    getLatestAnnualPeriod(
      annualPeriods
    );

    /*
 * Conventional FCFF/WACC DCF is not
 * suitable for banking companies.
 *
 * Bank detection uses verified banking
 * metrics or banking balance-sheet
 * fields—never a hard-coded symbol.
 */
const isBankingCompany =
  metrics?.industrySpecific
    .bank !== undefined ||
  (
    latestAnnual
      ?.deposits !== null &&
    latestAnnual
      ?.deposits !== undefined
  ) ||
  (
    latestAnnual
      ?.advances !== null &&
    latestAnnual
      ?.advances !== undefined
  );

if (isBankingCompany) {
  return {
    applicable: false,

    suitabilityReason:
      "Conventional DCF valuation is not applicable to banking companies. Banks require valuation based on book value, regulatory capital, profitability, asset quality and comparable bank multiples.",

    assumptions:
      null,

    scenarios: [],

    selectedFairValue:
      null,

    marginOfSafety:
      null,

    valuationLabel:
      "INSUFFICIENT_DATA",
  };
}

  return calculateDcfValuation({
    baseFreeCashFlow:
      getFreeCashFlow(
        latestAnnual
      ),

    currentPrice:
      market?.currentPrice ??
      null,

    forecastYears:
      assumptions
        .forecastYears ??
      0,

    freeCashFlowGrowthRate:
      assumptions
        .freeCashFlowGrowthRate,

    wacc:
      wacc.wacc,

    terminalGrowthRate:
      assumptions
        .terminalGrowthRate,

    netDebt:
      getNetDebt(
        latestAnnual
      ),

    dilutedShares:
      latestAnnual
        ?.sharesOutstanding ??
      market
        ?.sharesOutstanding ??
      null,

    revenueGrowthRate:
      metrics
        ?.growth
        .revenueCagrAvailable ??
      null,

    operatingMargin:
      metrics
        ?.profitability
        .ebitMargin ??
      null,

    taxRate:
      getEffectiveTaxRate(
        latestAnnual
      ),
  });
}