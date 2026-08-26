import "server-only";

import type {
  FinancialStatementPeriod,
  MarketSnapshot,
  NullableNumber,
} from "../types";

import {
  calculateWacc,
  type WaccInput,
  type WaccResult,
} from "./waccCalculator";

export type CompanyWaccAssumptions = {
  /*
   * Rates use percentage points:
   * 6.8 means 6.8%.
   */
  riskFreeRate:
    NullableNumber;

  beta:
    NullableNumber;

  equityRiskPremium:
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

function assumptionInput(
  value: NullableNumber,
  explanation: string
): WaccInput {
  return {
    value:
      isFiniteNumber(value)
        ? value
        : null,

    source:
      isFiniteNumber(value)
        ? "USER_ASSUMPTION"
        : "UNAVAILABLE",

    explanation,
  };
}

function reportedInput(
  value: NullableNumber,
  explanation: string
): WaccInput {
  return {
    value:
      isFiniteNumber(value)
        ? value
        : null,

    source:
      isFiniteNumber(value)
        ? "REPORTED"
        : "UNAVAILABLE",

    explanation,
  };
}

function marketInput(
  value: NullableNumber,
  explanation: string
): WaccInput {
  return {
    value:
      isFiniteNumber(value)
        ? value
        : null,

    source:
      isFiniteNumber(value)
        ? "MARKET_DATA"
        : "UNAVAILABLE",

    explanation,
  };
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

export function calculateCompanyWacc(
  annualPeriods:
    FinancialStatementPeriod[],

  market:
    MarketSnapshot | null,

  assumptions:
    CompanyWaccAssumptions
): WaccResult {
  const latestAnnual =
    getLatestAnnualPeriod(
      annualPeriods
    );

  return calculateWacc({
    riskFreeRate:
      assumptionInput(
        assumptions
          .riskFreeRate,

        "Risk-free rate supplied by the user or valuation API."
      ),

    beta:
      assumptionInput(
        assumptions.beta,

        "Equity beta supplied by the user or an approved market-data provider."
      ),

    equityRiskPremium:
      assumptionInput(
        assumptions
          .equityRiskPremium,

        "Equity-risk premium supplied by the user or valuation API."
      ),

    marketCapitalization:
      marketInput(
        market
          ?.marketCapitalization ??
          null,

        "Market capitalization calculated from the Upstox price and verified NSE shares outstanding. Value is in ₹ crore."
      ),

    totalDebt:
      reportedInput(
        latestAnnual
          ?.totalDebt ??
          null,

        "Total debt calculated from verified current and non-current NSE borrowings. Value is in ₹ crore."
      ),

    financeCosts:
      reportedInput(
        latestAnnual
          ?.financeCosts ??
          null,

        "Finance cost reported in the latest verified NSE annual filing. Value is in ₹ crore."
      ),

    profitBeforeTax:
      reportedInput(
        latestAnnual
          ?.profitBeforeTax ??
          null,

        "Profit before tax reported in the latest verified NSE annual filing. Value is in ₹ crore."
      ),

    taxExpense:
      reportedInput(
        latestAnnual
          ?.taxExpense ??
          null,

        "Tax expense reported in the latest verified NSE annual filing. Value is in ₹ crore."
      ),
  });
}