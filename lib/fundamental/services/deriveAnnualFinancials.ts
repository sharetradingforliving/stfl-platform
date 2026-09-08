import "server-only";

import type {
  FinancialStatementPeriod,
  NullableNumber,
} from "../types";

import type {
  NseFinancialSeriesItem,
} from "./nseFinancialSeries";

export type DerivedAnnualSource =
  "DERIVED_FROM_QUARTERS";

export type ContributingQuarter = {
  periodEnded: string;
  filingDate: string | null;
  sourceType:
    NseFinancialSeriesItem[
      "sourceType"
    ];
  consolidated: boolean | null;
  audited: boolean | null;
};

export type DerivedAnnualFinancial = {
  fiscalYear: string;
  periodEnded: string;

  sourceType:
    DerivedAnnualSource;

  financialPeriod:
    FinancialStatementPeriod;

  contributingQuarters:
    ContributingQuarter[];

  warnings: string[];
};

export type DerivedAnnualResult = {
  annual:
    DerivedAnnualFinancial[];

  incompleteFiscalYears: {
    fiscalYear: string;
    availableQuarters: string[];
    missingQuarterMonths:
      string[];
  }[];

  warnings: string[];
};

const REQUIRED_QUARTER_MONTHS = [
  6,
  9,
  12,
  3,
] as const;

const QUARTER_MONTH_LABELS:
  Record<number, string> = {
    3: "March",
    6: "June",
    9: "September",
    12: "December",
  };

function parseIsoDate(
  value: string
): Date | null {
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const parsedDate =
    new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    );

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? null
    : parsedDate;
}

function getFiscalYearEnd(
  periodEnded: string
): number | null {
  const date =
    parseIsoDate(periodEnded);

  if (!date) {
    return null;
  }

  const calendarYear =
    date.getUTCFullYear();

  const month =
    date.getUTCMonth() + 1;

  /*
   * Indian financial year:
   * April–March.
   */
  return month >= 4
    ? calendarYear + 1
    : calendarYear;
}

function getFiscalYearLabel(
  fiscalYearEnd: number
): string {
  return (
    `FY${String(
      fiscalYearEnd
    ).slice(-2)}`
  );
}

function getQuarterMonth(
  periodEnded: string
): number | null {
  const date =
    parseIsoDate(periodEnded);

  if (!date) {
    return null;
  }

  return (
    date.getUTCMonth() + 1
  );
}

function getExpectedPeriodEnd(
  fiscalYearEnd: number
): string {
  return `${fiscalYearEnd}-03-31`;
}

function getExpectedPeriodStart(
  fiscalYearEnd: number
): string {
  return `${fiscalYearEnd - 1}-04-01`;
}

function sumCompleteValues(
  values: NullableNumber[]
): NullableNumber {
  if (
    values.length === 0 ||
    values.some(
      (value) => value === null
    )
  ) {
    return null;
  }

  return values.reduce<number>(
    (total, value) =>
      total + (value ?? 0),
    0
  );
}

function newestFetchedAt(
  quarters:
    NseFinancialSeriesItem[]
): string {
  const fetchedTimes =
    quarters
      .map(
        (quarter) =>
          quarter
            .financialPeriod
            .source
            ?.fetchedAt
      )
      .filter(
        (
          fetchedAt
        ): fetchedAt is string =>
          typeof fetchedAt ===
            "string" &&
          fetchedAt.length > 0
      )
      .map(
        (fetchedAt) =>
          Date.parse(fetchedAt)
      )
      .filter(
        (timestamp) =>
          Number.isFinite(
            timestamp
          )
      );

  if (
    fetchedTimes.length === 0
  ) {
    return new Date()
      .toISOString();
  }

  return new Date(
    Math.max(...fetchedTimes)
  ).toISOString();
}

function uniqueWarnings(
  warnings: string[]
): string[] {
  return Array.from(
    new Set(
      warnings.filter(
        (warning) =>
          typeof warning ===
            "string" &&
          warning.trim().length > 0
      )
    )
  );
}

function buildDerivedAnnual(
  fiscalYearEnd: number,
  quarters:
    NseFinancialSeriesItem[]
): DerivedAnnualFinancial {
  const sortedQuarters =
    [...quarters].sort(
      (first, second) =>
        first.periodEnded
          .localeCompare(
            second.periodEnded
          )
    );

  const marchQuarter =
    sortedQuarters.find(
      (quarter) =>
        getQuarterMonth(
          quarter.periodEnded
        ) === 3
    );

  if (!marchQuarter) {
    throw new Error(
      "A March quarter is required to derive annual balance-sheet values."
    );
  }

  const quarterPeriods =
    sortedQuarters.map(
      (quarter) =>
        quarter.financialPeriod
    );

  const getValues = (
    selector: (
      period:
        FinancialStatementPeriod
    ) => NullableNumber
  ): NullableNumber[] =>
    quarterPeriods.map(
      selector
    );

  const revenue =
    sumCompleteValues(
      getValues(
        (period) =>
          period.revenue
      )
    );

  const operatingIncome =
    sumCompleteValues(
      getValues(
        (period) =>
          period.operatingIncome
      )
    );

  const ebitda =
    sumCompleteValues(
      getValues(
        (period) =>
          period.ebitda
      )
    );

  const ebit =
    sumCompleteValues(
      getValues(
        (period) =>
          period.ebit
      )
    );

  const profitBeforeTax =
    sumCompleteValues(
      getValues(
        (period) =>
          period.profitBeforeTax
      )
    );

  const taxExpense =
    sumCompleteValues(
      getValues(
        (period) =>
          period.taxExpense
      )
    );

  const netProfit =
    sumCompleteValues(
      getValues(
        (period) =>
          period.netProfit
      )
    );

    if (
  revenue === null ||
  profitBeforeTax === null ||
  netProfit === null
) {
  throw new Error(
    "A complete annual income statement could not be derived because one or more contributing quarters are missing Revenue, PBT or PAT."
  );
}

  const operatingCashFlow =
    sumCompleteValues(
      getValues(
        (period) =>
          period.operatingCashFlow
      )
    );

  const investingCashFlow =
    sumCompleteValues(
      getValues(
        (period) =>
          period.investingCashFlow
      )
    );

  const financingCashFlow =
    sumCompleteValues(
      getValues(
        (period) =>
          period.financingCashFlow
      )
    );

  const capitalExpenditure =
    sumCompleteValues(
      getValues(
        (period) =>
          period.capitalExpenditure
      )
    );

  const freeCashFlow =
    operatingCashFlow !== null &&
    capitalExpenditure !== null
      ? operatingCashFlow -
        Math.abs(
          capitalExpenditure
        )
      : null;

  const fiscalYear =
    getFiscalYearLabel(
      fiscalYearEnd
    );

  const warnings: string[] = [];

  /*
   * Quarterly EPS should not be added
   * blindly because weighted-average
   * share counts can change during the
   * financial year.
   */
  warnings.push(
    "Annual EPS was not derived by adding quarterly EPS. A verified annual EPS fact or weighted-average share count is required."
  );

  if (revenue === null) {
    warnings.push(
      "Annual revenue could not be derived because one or more quarterly revenue values were missing."
    );
  }

  if (netProfit === null) {
    warnings.push(
      "Annual PAT could not be derived because one or more quarterly PAT values were missing."
    );
  }

  if (
    operatingCashFlow === null
  ) {
    warnings.push(
      "Annual operating cash flow was not derived because complete discrete quarterly cash-flow values were unavailable."
    );
  }

  return {
    fiscalYear,

    periodEnded:
      getExpectedPeriodEnd(
        fiscalYearEnd
      ),

    sourceType:
      "DERIVED_FROM_QUARTERS",

    financialPeriod: {
      period: fiscalYear,
      periodType: "ANNUAL",

      startDate:
        getExpectedPeriodStart(
          fiscalYearEnd
        ),

      endDate:
        getExpectedPeriodEnd(
          fiscalYearEnd
        ),

      currency: "INR",
      unit: "CRORES",

      revenue,
      operatingIncome,
      ebitda,
      ebit,
      profitBeforeTax,
      taxExpense,
      netProfit,

      epsBasic: null,
      epsDiluted: null,

      /*
       * Balance-sheet values represent
       * the closing position and must
       * come from the March quarter.
       */
      totalAssets:
        marchQuarter
          .financialPeriod
          .totalAssets,

      totalEquity:
        marchQuarter
          .financialPeriod
          .totalEquity,

      totalDebt:
        marchQuarter
          .financialPeriod
          .totalDebt,

          deposits:
  marchQuarter
    .financialPeriod
    .deposits,

    grossNpaPercent:
  marchQuarter
    .financialPeriod
    .grossNpaPercent,

netNpaPercent:
  marchQuarter
    .financialPeriod
    .netNpaPercent,

returnOnAssetsPercent:
  marchQuarter
    .financialPeriod
    .returnOnAssetsPercent,
    
advances:
  marchQuarter
    .financialPeriod
    .advances,

    equityShareCapital:
  marchQuarter.financialPeriod
    .equityShareCapital,

faceValuePerShare:
  marchQuarter.financialPeriod
    .faceValuePerShare,

sharesOutstanding:
  marchQuarter.financialPeriod
    .sharesOutstanding,
    
      cashAndEquivalents:
        marchQuarter
          .financialPeriod
          .cashAndEquivalents,

      currentAssets:
        marchQuarter
          .financialPeriod
          .currentAssets,

      currentLiabilities:
        marchQuarter
          .financialPeriod
          .currentLiabilities,

      inventory:
        marchQuarter
          .financialPeriod
          .inventory,

      tradeReceivables:
        marchQuarter
          .financialPeriod
          .tradeReceivables,

      tradePayables:
        marchQuarter
          .financialPeriod
          .tradePayables,

      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      capitalExpenditure,
      freeCashFlow,

      dividendPerShare: null,

      source: {
        name:
          "Derived from four validated NSE quarterly XBRL filings",

        documentType:
          "Derived Annual Financial Results",

        reportingDate:
          getExpectedPeriodEnd(
            fiscalYearEnd
          ),

        sourceUrl:
  marchQuarter
    .financialPeriod
    .source
    ?.sourceUrl,

        fetchedAt:
          newestFetchedAt(
            sortedQuarters
          ),
      },
    },

    contributingQuarters:
      sortedQuarters.map(
        (quarter) => ({
          periodEnded:
            quarter.periodEnded,

          filingDate:
            quarter.filingDate,

          sourceType:
            quarter.sourceType,

          consolidated:
            quarter.consolidated,

          audited:
            quarter.audited,
        })
      ),

    warnings:
      uniqueWarnings([
        ...warnings,

        ...sortedQuarters.flatMap(
          (quarter) =>
            quarter.warnings
        ),
      ]),
  };
}

export function deriveAnnualFinancials(
  quarterly:
    NseFinancialSeriesItem[],

  officialAnnual:
    NseFinancialSeriesItem[] = []
): DerivedAnnualResult {
  const warnings: string[] = [];

  const officialAnnualDates =
    new Set(
      officialAnnual.map(
        (annual) =>
          annual.periodEnded
      )
    );

  const groupedQuarters =
    new Map<
      number,
      NseFinancialSeriesItem[]
    >();

  for (const quarter of quarterly) {
    if (
      quarter.periodType !==
      "QUARTERLY"
    ) {
      continue;
    }

    const fiscalYearEnd =
      getFiscalYearEnd(
        quarter.periodEnded
      );

    const quarterMonth =
      getQuarterMonth(
        quarter.periodEnded
      );

    if (
      fiscalYearEnd === null ||
      quarterMonth === null ||
      !REQUIRED_QUARTER_MONTHS.includes(
        quarterMonth as
          (typeof REQUIRED_QUARTER_MONTHS)[number]
      )
    ) {
      warnings.push(
        `Quarter ending ${quarter.periodEnded} could not be assigned to a recognised Indian financial quarter.`
      );

      continue;
    }

    const existing =
      groupedQuarters.get(
        fiscalYearEnd
      ) ?? [];

    /*
     * Avoid duplicate quarter-ending
     * dates inside one fiscal year.
     */
    if (
      !existing.some(
        (item) =>
          item.periodEnded ===
          quarter.periodEnded
      )
    ) {
      existing.push(quarter);
    }

    groupedQuarters.set(
      fiscalYearEnd,
      existing
    );
  }

  const annual:
    DerivedAnnualFinancial[] = [];

  const incompleteFiscalYears:
    DerivedAnnualResult[
      "incompleteFiscalYears"
    ] = [];

  for (
    const [
      fiscalYearEnd,
      fiscalYearQuarters,
    ]
    of groupedQuarters.entries()
  ) {
    const periodEnded =
      getExpectedPeriodEnd(
        fiscalYearEnd
      );

    /*
     * Official audited annual XBRL
     * always takes priority.
     */
    if (
      officialAnnualDates.has(
        periodEnded
      )
    ) {
      continue;
    }

    const availableMonths =
      new Set(
        fiscalYearQuarters
          .map(
            (quarter) =>
              getQuarterMonth(
                quarter.periodEnded
              )
          )
          .filter(
            (
              month
            ): month is number =>
              month !== null
          )
      );

    const missingMonths =
      REQUIRED_QUARTER_MONTHS.filter(
        (month) =>
          !availableMonths.has(
            month
          )
      );

    if (
      missingMonths.length > 0
    ) {
      incompleteFiscalYears.push({
        fiscalYear:
          getFiscalYearLabel(
            fiscalYearEnd
          ),

        availableQuarters:
          fiscalYearQuarters
            .map(
              (quarter) =>
                quarter.periodEnded
            )
            .sort(),

        missingQuarterMonths:
          missingMonths.map(
            (month) =>
              QUARTER_MONTH_LABELS[
                month
              ]
          ),
      });

      continue;
    }

    try {
      annual.push(
        buildDerivedAnnual(
          fiscalYearEnd,
          fiscalYearQuarters
        )
      );
    } catch (error) {
      warnings.push(
        `Unable to derive ${getFiscalYearLabel(
          fiscalYearEnd
        )}: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    }
  }

  annual.sort(
    (first, second) =>
      second.periodEnded
        .localeCompare(
          first.periodEnded
        )
  );

  incompleteFiscalYears.sort(
    (first, second) =>
      second.fiscalYear
        .localeCompare(
          first.fiscalYear
        )
  );

  return {
    annual,
    incompleteFiscalYears,
    warnings:
      uniqueWarnings(warnings),
  };
}