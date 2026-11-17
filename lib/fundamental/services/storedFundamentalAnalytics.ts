import "server-only";

import { getStoredFinancialHistory } from "./storedFinancialHistory";

import type {
  DcfValuationResult,
  FinancialStatementPeriod,
  FundamentalMetrics,
  GrahamValuationResult,
  MarketSnapshot,
  RelativeValuationResult,
} from "../types";

import {
  calculateFundamentalMetrics,
} from "../calculations";

import {
  calculateGrahamValuation,
} from "./fundamentalValuation";

import {
  calculateCompanyWacc,
  type CompanyWaccAssumptions,
} from "./companyWacc";

import {
  calculateCompanyDcf,
  type CompanyDcfAssumptions,
} from "./companyDcf";

import {
  calculateRelativeValuation,
  type RelativeValuationBenchmarks,
} from "./relativeValuationCalculator";

import type {
  WaccResult,
} from "./waccCalculator";

import {
  type NseFinancialSeriesItem,
  type NseFinancialSeriesSource,
} from "./nseFinancialSeries";

import {
  deriveAnnualFinancials,
  type DerivedAnnualSource,
} from "./deriveAnnualFinancials";

import {
  getNseCorporateActions,
} from "../providers/nseCorporateActions";

import {
  adjustFinancialPeriodsForCorporateActions,
} from "./corporateActionAdjuster";

export type AnalyticsAnnualSource =
  | NseFinancialSeriesSource
  | DerivedAnnualSource
  | "STORED_ANNUAL";

export type AnalyticsAnnualMetadata = {
  fiscalYear: string;
  periodEnded: string;

  sourceType:
    AnalyticsAnnualSource;

  official: boolean;
  derived: boolean;

  consolidated: boolean | null;
  audited: boolean | null;

  contributingQuarterCount:
    number;

  warnings: string[];
};

export type FundamentalAnalyticsCoverage = {
  annualPeriods: number;

  officialAnnualPeriods:
    number;

  derivedAnnualPeriods:
    number;

  newestPeriod: string | null;
  oldestPeriod: string | null;

  elapsedYears: number | null;

  sufficientForAvailableCagr:
    boolean;

  sufficientFor3YearCagr:
    boolean;

  sufficientFor5YearCagr:
    boolean;
};

export type FundamentalAnalyticsResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

    symbol: string;
  companyName: string | null;

  /*
   * Live price combined with the
   * verified NSE annual share count.
   */
  market: MarketSnapshot | null;

  annualFinancials:
    FinancialStatementPeriod[];

  annualMetadata:
    AnalyticsAnnualMetadata[];

  metrics:
    FundamentalMetrics | null;
        valuation: {
    graham:
      GrahamValuationResult;

    wacc:
      WaccResult;

    dcf:
      DcfValuationResult;

    relative:
      RelativeValuationResult;
  };

  coverage:
    FundamentalAnalyticsCoverage;

  warnings: string[];
  diagnostics: string[];

  generatedAt: string;
};

type CombinedAnnualRecord = {
  financialPeriod:
    FinancialStatementPeriod;

  metadata:
    AnalyticsAnnualMetadata;
};

function getPeriodYear(
  periodEnded: string | null
): number | null {
  if (!periodEnded) {
    return null;
  }

  const match =
    periodEnded.match(
      /^(\d{4})/
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  return Number.isFinite(year)
    ? year
    : null;
}

function getElapsedYears(
  oldestPeriod: string | null,
  newestPeriod: string | null
): number | null {
  const oldestYear =
    getPeriodYear(
      oldestPeriod
    );

  const newestYear =
    getPeriodYear(
      newestPeriod
    );

  if (
    oldestYear === null ||
    newestYear === null
  ) {
    return null;
  }

  const elapsedYears =
    newestYear - oldestYear;

  return elapsedYears > 0
    ? elapsedYears
    : null;
}

function uniqueMessages(
  messages: string[]
): string[] {
  return Array.from(
    new Set(
      messages.filter(
        (message) =>
          message.trim().length > 0
      )
    )
  );
}

export async function getStoredFundamentalAnalytics(
  requestedSymbol: string,

  market:
    MarketSnapshot | null = null,

  waccAssumptions:
    CompanyWaccAssumptions = {
      riskFreeRate: null,
      beta: null,
      equityRiskPremium: null,
    },

  dcfAssumptions:
    CompanyDcfAssumptions = {
      forecastYears: null,
      freeCashFlowGrowthRate:
        null,
      terminalGrowthRate: null,
    },

  relativeBenchmarks:
    RelativeValuationBenchmarks = {
      priceToEarnings: {
        historicalMedian: null,
        industryMedian: null,
        weight: 0,
      },

      priceToBook: {
        historicalMedian: null,
        industryMedian: null,
        weight: 0,
      },

      enterpriseValueToEbitda: {
        historicalMedian: null,
        industryMedian: null,
        weight: 0,
      },

      enterpriseValueToSales: {
        historicalMedian: null,
        industryMedian: null,
        weight: 0,
      },
    }
): Promise<
  FundamentalAnalyticsResponse
> {
      const symbol =
    requestedSymbol
      .trim()
      .toUpperCase();

  if (!symbol) {
    throw new Error(
      "A valid NSE symbol is required."
    );
  }

  // Read saved statements, not live NSE filing discovery or XBRL.
  // Keep the existing corporate-action adjustment path intact.
  const [stored, corporateActions] = await Promise.all([
    getStoredFinancialHistory(symbol),
    getNseCorporateActions(symbol),
  ]);
  const series = {
    companyName: stored.companyName,
    quarterly: [] as NseFinancialSeriesItem[],
    warnings: stored.warnings,
  };
  const derived = deriveAnnualFinancials([], []);
  const combinedRecords: CombinedAnnualRecord[] = stored.records;

  const unadjustedAnnualFinancials =
    combinedRecords.map(
      (record) =>
        record.financialPeriod
    );

  /*
   * Restate historical per-share data
   * onto the current share basis before
   * calculating market capitalization,
   * valuation multiples or fair value.
   *
   * Revenue, profit, assets, equity and
   * other absolute financial values are
   * left unchanged by the adjuster.
   */
  const corporateActionAdjustment =
    adjustFinancialPeriodsForCorporateActions(
      unadjustedAnnualFinancials,
      corporateActions.actions
    );

  const annualFinancials =
    corporateActionAdjustment
      .periods;

    const annualMetadata =
    combinedRecords.map(
      (record) =>
        record.metadata
    );

  const latestAnnual =
    annualFinancials.at(-1) ??
    null;

  /*
   * Prefer the verified NSE annual
   * share count over any externally
   * supplied market-data share count.
   */
  const verifiedShares =
    latestAnnual
      ?.sharesOutstanding ??
    market?.sharesOutstanding ??
    null;

  const marketCapitalization =
    market !== null &&
    typeof market.currentPrice ===
      "number" &&
    Number.isFinite(
      market.currentPrice
    ) &&
    typeof verifiedShares ===
      "number" &&
    Number.isFinite(
      verifiedShares
    )
      ? (
          market.currentPrice *
          verifiedShares
        ) /
        10_000_000
      : null;

  /*
   * Financial-statement values use
   * crores, so market capitalization
   * and enterprise value are also
   * stored in crores here.
   */
  const netDebt =
    latestAnnual !== null &&
    typeof latestAnnual.totalDebt ===
      "number" &&
    typeof latestAnnual
      .cashAndEquivalents ===
      "number"
      ? latestAnnual.totalDebt -
        latestAnnual
          .cashAndEquivalents
      : null;

  const enterpriseValue =
    marketCapitalization !== null &&
    netDebt !== null
      ? marketCapitalization +
        netDebt
      : null;

  const enrichedMarket:
    MarketSnapshot | null =
      market
        ? {
            ...market,

            sharesOutstanding:
              verifiedShares,

            marketCapitalization,

            enterpriseValue,
          }
        : null;

  const quarterlyFinancialPeriods =
  series.quarterly.map(
    (quarter) =>
      quarter.financialPeriod
  );

const metrics =
  calculateFundamentalMetrics(
    annualFinancials,
    enrichedMarket,
    quarterlyFinancialPeriods
  );

      const grahamValuation =
    calculateGrahamValuation(
      metrics,
      enrichedMarket
    );

      const wacc =
    calculateCompanyWacc(
      annualFinancials,
      enrichedMarket,
      waccAssumptions
    );

  const dcf =
    calculateCompanyDcf(
      annualFinancials,
      metrics,
      enrichedMarket,
      wacc,
      dcfAssumptions
    );

  const relative =
    calculateRelativeValuation(
      annualFinancials,
      metrics,
      enrichedMarket,
      relativeBenchmarks
    );

  const oldestPeriod =
    annualMetadata[0]
      ?.periodEnded ?? null;

  const newestPeriod =
    annualMetadata.at(-1)
      ?.periodEnded ?? null;

  const elapsedYears =
    getElapsedYears(
      oldestPeriod,
      newestPeriod
    );

  const officialAnnualPeriods =
    annualMetadata.filter(
      (period) =>
        period.official
    ).length;

  const derivedAnnualPeriods =
    annualMetadata.filter(
      (period) =>
        period.derived
    ).length;

  const warnings: string[] = [
    ...stored.warnings,
    ...combinedRecords.flatMap(record => record.metadata.warnings.map(
      message => `${record.metadata.fiscalYear}: ${message}`
    )),
    ...corporateActions.warnings.map(message => `Corporate actions: ${message}`),
    "Historical EPS comparisons require a consistent share basis. The existing adjustment engine handles stock splits, not all bonus or restructuring events.",
  ];

  if (
    annualFinancials.length === 0
  ) {
    warnings.push(
      "No usable annual financial periods were available."
    );
  }

  if (
    annualFinancials.length > 0 &&
    annualFinancials.length < 3
  ) {
    warnings.push(
      "Fewer than three annual periods are available. Historical growth analysis is limited."
    );
  }

  const periodWarnings =
    annualMetadata.flatMap(
      (period) =>
        period.warnings.map(
          (warning) =>
            `${period.fiscalYear}: ${warning}`
        )
    );

  const diagnostics =
    uniqueMessages([
      ...series.warnings,
      ...derived.warnings,
      ...periodWarnings,

      ...corporateActions
        .warnings
        .map(
          (warning) =>
            `Corporate actions: ${warning}`
        ),

      ...corporateActionAdjustment
        .warnings
        .map(
          (warning) =>
            `Corporate-action adjustment: ${warning}`
        ),

      ...corporateActionAdjustment
        .adjustedPeriods
        .filter(
          (period) =>
            period
              .appliedAdjustments
              .length > 0
        )
        .map(
          (period) => {
            const reportingPeriod =
              period
                .financialPeriod
                .endDate ??
              period
                .financialPeriod
                .period;

            const adjustments =
              period
                .appliedAdjustments
                .map(
                  (adjustment) =>
                    `stock split ${adjustment.oldFaceValue}:${adjustment.newFaceValue} effective ${adjustment.exDate}`
                )
                .join(", ");

            return `Adjusted ${reportingPeriod} to the current share basis by factor ${period.cumulativeShareAdjustmentFactor} for ${adjustments}.`;
          }
        ),

      ...derived
        .incompleteFiscalYears
        .map(
          (period) =>
            `${period.fiscalYear} is incomplete. Missing quarters: ${period.missingQuarterMonths.join(
              ", "
            )}.`
        ),
    ]);

  const cleanWarnings =
    uniqueMessages(warnings);

  return {
    status:
      annualFinancials.length === 0
        ? "unavailable"
        : cleanWarnings.length > 0
          ? "partial"
          : "success",

    symbol,

        companyName:
      series.companyName,

    market:
      enrichedMarket,

        annualFinancials,
    annualMetadata,
    metrics,

              valuation: {
      graham:
        grahamValuation,

      wacc,

      dcf,

      relative,
    },

    coverage: {
      annualPeriods:
        annualFinancials.length,

      officialAnnualPeriods,

      derivedAnnualPeriods,

      newestPeriod,
      oldestPeriod,
      elapsedYears,

      sufficientForAvailableCagr:
        elapsedYears !== null &&
        elapsedYears >= 1,

      /*
       * A genuine three-year CAGR needs
       * four annual observations.
       */
      sufficientFor3YearCagr:
        elapsedYears !== null &&
        elapsedYears >= 3,

      sufficientFor5YearCagr:
        elapsedYears !== null &&
        elapsedYears >= 5,
    },

    warnings:
      cleanWarnings,

    diagnostics,

    generatedAt:
      new Date().toISOString(),
  };
}
