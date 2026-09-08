import "server-only";

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
  getNseFinancialSeries,
  type NseFinancialSeriesItem,
  type NseFinancialSeriesSource,
} from "./nseFinancialSeries";

import {
  deriveAnnualFinancials,
  type DerivedAnnualFinancial,
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
  | DerivedAnnualSource;

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

function getFiscalYearLabel(
  periodEnded: string
): string {
  const yearMatch =
    periodEnded.match(
      /^(\d{4})/
    );

  if (!yearMatch) {
    return periodEnded;
  }

  return (
    `FY${yearMatch[1].slice(-2)}`
  );
}

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

function officialToRecord(
  annual: NseFinancialSeriesItem
): CombinedAnnualRecord {
  return {
    financialPeriod:
      annual.financialPeriod,

    metadata: {
      fiscalYear:
        getFiscalYearLabel(
          annual.periodEnded
        ),

      periodEnded:
        annual.periodEnded,

      sourceType:
        annual.sourceType,

      official: true,
      derived: false,

      consolidated:
        annual.consolidated,

      audited:
        annual.audited,

      contributingQuarterCount: 0,

      warnings:
        annual.warnings,
    },
  };
}

function derivedToRecord(
  annual: DerivedAnnualFinancial
): CombinedAnnualRecord {
  return {
    financialPeriod:
      annual.financialPeriod,

    metadata: {
      fiscalYear:
        annual.fiscalYear,

      periodEnded:
        annual.periodEnded,

      sourceType:
        annual.sourceType,

      official: false,
      derived: true,

      consolidated:
        annual.contributingQuarters.every(
          (quarter) =>
            quarter.consolidated === true
        )
          ? true
          : null,

      audited:
        annual.contributingQuarters.every(
          (quarter) =>
            quarter.audited === true
        )
          ? true
          : false,

      contributingQuarterCount:
        annual.contributingQuarters.length,

      warnings:
        annual.warnings,
    },
  };
}

function combineAnnualRecords(
  officialAnnual:
    NseFinancialSeriesItem[],

  derivedAnnual:
    DerivedAnnualFinancial[],

  quarterlyPeriods:
    NseFinancialSeriesItem[]
): CombinedAnnualRecord[] {
  const recordsByPeriod =
    new Map<
      string,
      CombinedAnnualRecord
    >();

  const derivedByPeriod =
    new Map<
      string,
      DerivedAnnualFinancial
    >(
      derivedAnnual.map(
        (annual) => [
          annual.periodEnded,
          annual,
        ]
      )
    );

  /*
   * Some annual XBRL documents contain
   * income-statement values but omit
   * usable point-in-time balance-sheet
   * facts.
   *
   * A verified quarterly filing ending
   * on exactly the same date can safely
   * supplement those missing fields.
   */
  const quarterlyByPeriod =
    new Map<
      string,
      NseFinancialSeriesItem
    >();

  for (
    const quarter
    of quarterlyPeriods
  ) {
    const existing =
      quarterlyByPeriod.get(
        quarter.periodEnded
      );

    if (!existing) {
      quarterlyByPeriod.set(
        quarter.periodEnded,
        quarter
      );

      continue;
    }

    /*
     * Prefer consolidated and audited
     * records when duplicate filings
     * exist for the same period end.
     */
    const existingScore =
      (existing.consolidated === true
        ? 2
        : 0) +
      (existing.audited === true
        ? 1
        : 0);

    const candidateScore =
      (quarter.consolidated === true
        ? 2
        : 0) +
      (quarter.audited === true
        ? 1
        : 0);

    if (
      candidateScore >
      existingScore
    ) {
      quarterlyByPeriod.set(
        quarter.periodEnded,
        quarter
      );
    }
  }

  /*
   * Add derived annual records first.
   * An official annual record replaces
   * a derived record for the same date.
   */
  for (
    const annual
    of derivedAnnual
  ) {
    recordsByPeriod.set(
      annual.periodEnded,
      derivedToRecord(
        annual
      )
    );
  }

  for (
    const annual
    of officialAnnual
  ) {
    const officialRecord =
      officialToRecord(
        annual
      );

    const officialPeriod =
      officialRecord
        .financialPeriod;

    const matchingDerived =
      derivedByPeriod.get(
        annual.periodEnded
      )?.financialPeriod ??
      null;

    const matchingQuarter =
      quarterlyByPeriod.get(
        annual.periodEnded
      )?.financialPeriod ??
      null;

    const supplementedFields:
      string[] = [];

    const usePointInTimeFallback = (
      fieldName: string,

      officialValue:
        | number
        | null
        | undefined,

      derivedValue:
        | number
        | null
        | undefined,

      quarterlyValue:
        | number
        | null
        | undefined
    ): number | null => {
      if (
        typeof officialValue ===
          "number" &&
        Number.isFinite(
          officialValue
        )
      ) {
        return officialValue;
      }

      if (
        typeof derivedValue ===
          "number" &&
        Number.isFinite(
          derivedValue
        )
      ) {
        supplementedFields.push(
          `${fieldName} from the matching derived annual record`
        );

        return derivedValue;
      }

      if (
        typeof quarterlyValue ===
          "number" &&
        Number.isFinite(
          quarterlyValue
        )
      ) {
        supplementedFields.push(
          `${fieldName} from the matching verified quarterly record`
        );

        return quarterlyValue;
      }

      return null;
    };

    const mergedFinancialPeriod:
      FinancialStatementPeriod = {
      ...officialPeriod,

      /*
       * Only point-in-time fields are
       * supplemented. Revenue, profit,
       * tax, finance cost and EPS always
       * remain from the official annual
       * record.
       */
      totalAssets:
        usePointInTimeFallback(
          "total assets",
          officialPeriod.totalAssets,
          matchingDerived
            ?.totalAssets,
          matchingQuarter
            ?.totalAssets
        ),

      totalEquity:
        usePointInTimeFallback(
          "total equity",
          officialPeriod.totalEquity,
          matchingDerived
            ?.totalEquity,
          matchingQuarter
            ?.totalEquity
        ),

      totalDebt:
        usePointInTimeFallback(
          "total debt",
          officialPeriod.totalDebt,
          matchingDerived
            ?.totalDebt,
          matchingQuarter
            ?.totalDebt
        ),

      deposits:
        usePointInTimeFallback(
          "deposits",
          officialPeriod.deposits,
          matchingDerived
            ?.deposits,
          matchingQuarter
            ?.deposits
        ),

      advances:
        usePointInTimeFallback(
          "advances",
          officialPeriod.advances,
          matchingDerived
            ?.advances,
          matchingQuarter
            ?.advances
        ),

      equityShareCapital:
        usePointInTimeFallback(
          "equity share capital",
          officialPeriod
            .equityShareCapital,
          matchingDerived
            ?.equityShareCapital,
          matchingQuarter
            ?.equityShareCapital
        ),

      faceValuePerShare:
        usePointInTimeFallback(
          "face value per share",
          officialPeriod
            .faceValuePerShare,
          matchingDerived
            ?.faceValuePerShare,
          matchingQuarter
            ?.faceValuePerShare
        ),

      sharesOutstanding:
        usePointInTimeFallback(
          "shares outstanding",
          officialPeriod
            .sharesOutstanding,
          matchingDerived
            ?.sharesOutstanding,
          matchingQuarter
            ?.sharesOutstanding
        ),
    };

    recordsByPeriod.set(
      annual.periodEnded,
      {
        financialPeriod:
          mergedFinancialPeriod,

        metadata: {
          ...officialRecord.metadata,

          warnings:
            supplementedFields.length >
            0
              ? [
                  ...officialRecord
                    .metadata
                    .warnings,

                  `Missing annual point-in-time values were supplemented using same-date verified records: ${supplementedFields.join(
                    ", "
                  )}.`,
                ]
              : officialRecord
                  .metadata
                  .warnings,
        },
      }
    );
  }

  return Array.from(
    recordsByPeriod.values()
  ).sort(
    (first, second) =>
      first.metadata.periodEnded
        .localeCompare(
          second.metadata
            .periodEnded
        )
  );
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

export async function getFundamentalAnalytics(
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

  /*
   * Financial filings and corporate
   * actions are independent NSE data
   * sources, so load them together.
   * A corporate-action failure does not
   * prevent the financial analysis.
   */
  const [
    series,
    corporateActions,
  ] = await Promise.all([
    getNseFinancialSeries(
      symbol,
      {
        quarterlyLimit: 20,
        annualLimit: 5,
      }
    ),

    getNseCorporateActions(
      symbol
    ),
  ]);

  const derived =
    deriveAnnualFinancials(
      series.quarterly,
      series.annual
    );

  const combinedRecords =
  combineAnnualRecords(
    series.annual,
    derived.annual,
    series.quarterly
  );

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

  const warnings: string[] = [];

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
