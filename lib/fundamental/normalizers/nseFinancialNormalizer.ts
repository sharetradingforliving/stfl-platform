import type {
  FinancialStatementPeriod,
  FinancialPeriodType,
  NullableNumber,
} from "../types";

import type {
  ParsedNseXbrl,
  XbrlContext,
  XbrlFact,
} from "../providers/nseXbrl";

export type NseNormalizerOptions = {
  period: string;
  periodType: FinancialPeriodType;
  periodEnded: string | null;
  documentType?: string;
};

export type NormalizedNsePeriodResult = {
  financialPeriod: FinancialStatementPeriod;

  selectedContexts: {
    durationContextId: string | null;
    instantContextId: string | null;
  };

  warnings: string[];
};

const RUPEES_PER_CRORE =
  10_000_000;

const METRIC_TAGS = {
  corporateRevenue: [
    "RevenueFromOperations",
    "RevenueFromOperationsNet",
    "IncomeFromOperations",
    "Revenue",
  ],

  bankTotalIncome: [
    "TotalIncome",
  ],

  bankInterestEarned: [
    "TotalInterestEarned",
    "InterestEarned",
  ],

  otherIncome: [
    "OtherIncome",
  ],

  corporateOperatingIncome: [
    "ProfitFromOperationsBeforeOtherIncomeFinanceCostsAndExceptionalItems",
    "OperatingProfit",
  ],

  bankOperatingProfit: [
    "OperatingProfitBeforeProvisionAndContingencies",
    "OperatingProfitBeforeProvisionsAndContingencies",
  ],

  ebit: [
    "ProfitBeforeFinanceCostsExceptionalItemsAndTax",
    "EarningsBeforeInterestAndTax",
  ],

  corporateFinanceCosts: [
    "FinanceCosts",
    "FinanceCost",
    "InterestExpense",
  ],

  bankInterestExpended: [
    "InterestExpended",
    "InterestExpenseOnDeposits",
  ],

  depreciation: [
    "DepreciationDepletionAndAmortisationExpense",
    "DepreciationAndAmortisationExpense",
    "DepreciationExpense",
  ],

  profitBeforeTax: [
  "ProfitBeforeTax",
  "ProfitLossBeforeTax",
  "ProfitBeforeExceptionalItemsAndTax",

  // BANKING taxonomy
  "ProfitLossFromOrdinaryActivitiesBeforeTax",
  "ProfitLossBeforeTaxAndExceptionalItems",
  "ProfitBeforeTaxAndExceptionalItems",
],

  taxExpense: [
    "TaxExpense",
    "IncomeTaxExpense",
    "CurrentAndDeferredTax",
    "CurrentTax",
  ],

  netProfit: [
  "ProfitOrLossAttributableToOwnersOfParent",
  "ProfitLossAttributableToOwnersOfParent",
  "ProfitLossForPeriod",
  "ProfitLossForPeriodFromContinuingOperations",
  "NetProfitLossForThePeriod",

  // BANKING taxonomy
  "ProfitLossAfterTaxesMinorityInterestAndShareOfProfitLossOfAssociates",
  "ProfitLossForThePeriod",
  "ProfitLossFromOrdinaryActivitiesAfterTax",
  "NetProfitLossForPeriod",
  "NetProfitForThePeriod",
  "ProfitLossAfterTax",
  "ProfitAfterTax",
],

  epsBasic: [
  "BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
  "BasicEarningsLossPerShareFromContinuingOperations",
  "BasicEarningsPerShare",

  // BANKING taxonomy
  "BasicEarningsPerShareBeforeExtraordinaryItems",
  "BasicEPSBeforeExtraordinaryItems",
  "BasicEarningsPerShareAfterExtraordinaryItems",
],

  epsDiluted: [
  "DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
  "DilutedEarningsLossPerShareFromContinuingOperations",
  "DilutedEarningsPerShare",

  // BANKING taxonomy
  "DilutedEarningsPerShareBeforeExtraordinaryItems",
  "DilutedEPSBeforeExtraordinaryItems",
  "DilutedEarningsPerShareAfterExtraordinaryItems",
],

  totalAssets: [
    "Assets",
    "TotalAssets",
  ],

  deposits: [
  // BANKING taxonomy
  "Deposits",
],

advances: [
  // BANKING taxonomy
  "Advances",
],

grossNpaPercent: [
  // BANKING taxonomy
  "PercentageOfGrossNpa",
],

netNpaPercent: [
  // BANKING taxonomy
  "PercentageOfNpa",
],

returnOnAssetsPercent: [
  // BANKING taxonomy
  "ReturnOnAssets",
],

  totalEquity: [
    "EquityAttributableToOwnersOfParent",
    "Equity",
    "TotalEquity",
  ],

  equityShareCapital: [
  /*
   * Keep the specific paid-up-capital
   * tag first. Generic "Capital" can
   * incorrectly match face value.
   */
  "PaidUpValueOfEquityShareCapital",
  "EquityShareCapital",
],

reservesAndSurplus: [
  // BANKING taxonomy
  "ReservesAndSurplus",
],

  faceValuePerShare: [
    "FaceValueOfEquityShareCapital",
    "FaceValuePerEquityShare",
    "FaceValueOfShares",
  ],

  totalDebt: [
    "TotalDebt",
    "Debt",
  ],

  currentBorrowings: [
    "BorrowingsCurrent",
    "CurrentBorrowings",
  ],

  noncurrentBorrowings: [
    "BorrowingsNoncurrent",
    "NoncurrentBorrowings",
    "NonCurrentBorrowings",
  ],

  cashAndEquivalents: [
    "CashAndCashEquivalents",
    "CashAndBankBalances",
  ],

  currentAssets: [
    "CurrentAssets",
    "TotalCurrentAssets",
  ],

  currentLiabilities: [
    "CurrentLiabilities",
    "TotalCurrentLiabilities",
  ],

  inventory: [
    "Inventories",
    "Inventory",
  ],

  tradeReceivables: [
    "TradeReceivablesCurrent",
    "TradeReceivables",
    "CurrentTradeReceivables",
  ],

  tradePayables: [
    "TradePayablesCurrent",
    "TradePayables",
    "CurrentTradePayables",
  ],

  operatingCashFlow: [
    "CashFlowsFromUsedInOperatingActivities",
    "NetCashFlowsFromUsedInOperatingActivities",
  ],

  investingCashFlow: [
    "CashFlowsFromUsedInInvestingActivities",
    "NetCashFlowsFromUsedInInvestingActivities",
  ],

  financingCashFlow: [
    "CashFlowsFromUsedInFinancingActivities",
    "NetCashFlowsFromUsedInFinancingActivities",
  ],

  capitalExpenditure: [
    "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities",
    "PurchaseOfPropertyPlantAndEquipment",
    "PaymentsToAcquirePropertyPlantAndEquipment",
  ],

  dividendPerShare: [
    "DividendPerShare",
    "DividendsPaidPerShare",
  ],
} as const;

function normalizeName(
  value: string
): string {
  return value
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function parseDateValue(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const trimmedValue =
    value.trim();

  const monthNumbers: Record<
    string,
    number
  > = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  };

  const nseDateMatch =
    trimmedValue.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
    );

  if (nseDateMatch) {
    const month =
      monthNumbers[
        nseDateMatch[2]
          .toUpperCase()
      ];

    if (month === undefined) {
      return null;
    }

    return Date.UTC(
      Number(nseDateMatch[3]),
      month,
      Number(nseDateMatch[1])
    );
  }

  const isoDateMatch =
    trimmedValue.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (isoDateMatch) {
    return Date.UTC(
      Number(isoDateMatch[1]),
      Number(isoDateMatch[2]) - 1,
      Number(isoDateMatch[3])
    );
  }

  const parsedDate =
    Date.parse(trimmedValue);

  return Number.isFinite(
    parsedDate
  )
    ? parsedDate
    : null;
}

function daysBetween(
  startDate: string | null,
  endDate: string | null
): number | null {
  const start =
    parseDateValue(startDate);

  const end =
    parseDateValue(endDate);

  if (
    start === null ||
    end === null
  ) {
    return null;
  }

  return Math.round(
    (end - start) /
      (24 * 60 * 60 * 1000)
  );
}

function hasNoDimensions(
  context: XbrlContext
): boolean {
  return (
    Object.keys(
      context.dimensions
    ).length === 0
  );
}

function contextMatchesEndDate(
  context: XbrlContext,
  periodEnded: string | null
): boolean {
  const expectedDate =
    parseDateValue(periodEnded);

  if (expectedDate === null) {
    return true;
  }

  const contextDate =
    parseDateValue(
      context.endDate ??
        context.instant
    );

  return (
    contextDate === expectedDate
  );
}

function selectDurationContext(
  document: ParsedNseXbrl,
  periodType: FinancialPeriodType,
  periodEnded: string | null,
  isBankingTaxonomy: boolean
): XbrlContext | null {
  const candidates = document.contexts
    .filter(
      (context) =>
        context.periodType === "DURATION" &&
        hasNoDimensions(context) &&
        contextMatchesEndDate(
          context,
          periodEnded
        )
    )
    .map((context) => ({
      context,
      days: daysBetween(
        context.startDate,
        context.endDate
      ),
    }))
    .filter(
      (
        candidate
      ): candidate is {
        context: XbrlContext;
        days: number;
      } =>
        candidate.days !== null &&
        candidate.days > 0
    );

  if (candidates.length === 0) {
    return null;
  }

  const hasMetric = (
    contextId: string,
    aliases: readonly string[]
  ): boolean => {
    const fact = findFact(
      document,
      contextId,
      aliases
    );

    return (
      typeof fact?.numericValue === "number" &&
      Number.isFinite(fact.numericValue)
    );
  };

  const financialScore = (
    context: XbrlContext
  ): number => {
    const id = context.id;

    const hasRevenue = isBankingTaxonomy
      ? (
          hasMetric(
            id,
            METRIC_TAGS.bankTotalIncome
          ) ||
          (
            hasMetric(
              id,
              METRIC_TAGS.bankInterestEarned
            ) &&
            hasMetric(
              id,
              METRIC_TAGS.otherIncome
            )
          )
        )
      : hasMetric(
          id,
          METRIC_TAGS.corporateRevenue
        );

    return (
      Number(hasRevenue) * 100 +
      Number(
        hasMetric(
          id,
          METRIC_TAGS.profitBeforeTax
        )
      ) * 20 +
      Number(
        hasMetric(
          id,
          METRIC_TAGS.netProfit
        )
      ) * 20
    );
  };

  const standardCandidates =
    candidates.filter(({ days }) =>
      periodType === "ANNUAL"
        ? days >= 300 && days <= 380
        : periodType === "QUARTERLY"
          ? days >= 70 && days <= 110
          : true
    );

  /*
   * Prefer genuine annual or quarterly
   * durations before comparing facts.
   */
  if (standardCandidates.length > 0) {
    return standardCandidates
      .slice()
      .sort((first, second) => {
        const scoreDifference =
          financialScore(second.context) -
          financialScore(first.context);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        const targetDays =
          periodType === "ANNUAL"
            ? 365
            : 90;

        return (
          Math.abs(first.days - targetDays) -
          Math.abs(second.days - targetDays)
        );
      })[0]?.context ?? null;
  }

  /*
   * Preserve the existing fallback:
   * longest duration for annual requests,
   * shortest duration for quarterly requests.
   *
   * The series service still validates
   * the duration and handles cumulative Q2.
   */
  return candidates
    .slice()
    .sort((first, second) => {
      const durationDifference =
        periodType === "ANNUAL"
          ? second.days - first.days
          : first.days - second.days;

      return (
        durationDifference ||
        financialScore(second.context) -
          financialScore(first.context)
      );
    })[0]?.context ?? null;
}

function selectInstantContext(
  contexts: XbrlContext[],
  periodEnded: string | null
): XbrlContext | null {
  const candidates =
    contexts.filter(
      (context) =>
        context.periodType ===
          "INSTANT" &&
        hasNoDimensions(context) &&
        contextMatchesEndDate(
          context,
          periodEnded
        )
    );

  return candidates[0] ?? null;
}

function findFact(
  document: ParsedNseXbrl,
  contextId: string | null,
  aliases: readonly string[]
): XbrlFact | null {
  if (!contextId) {
    return null;
  }

  const contextFacts =
    document.facts.filter(
      (fact) =>
        fact.contextRef ===
          contextId &&
        fact.numericValue !== null
    );

  /*
   * Alias order is important.
   *
   * For example, shareholder PAT must
   * take priority over consolidated PAT
   * including non-controlling interests.
   */
  for (const alias of aliases) {
    const normalizedAlias =
      normalizeName(alias);

    const matchingFact =
      contextFacts.find(
        (fact) =>
          normalizeName(
            fact.localName
          ) === normalizedAlias
      );

    if (matchingFact) {
      return matchingFact;
    }
  }

  return null;
}

function isPerShareFact(
  fact: XbrlFact | null
): boolean {
  if (!fact) {
    return false;
  }

  const normalizedUnit =
    fact.unitRef
      ?.replace(/[^a-z]/gi, "")
      .toLowerCase();

  return (
    normalizedUnit?.includes(
      "pershare"
    ) ?? false
  );
}

function convertMoneyToCrores(
  fact: XbrlFact | null
): NullableNumber {
  if (
    !fact ||
    fact.numericValue === null
  ) {
    return null;
  }

  if (isPerShareFact(fact)) {
    return fact.numericValue;
  }

  const normalizedUnit =
    fact.unitRef
      ?.replace(/[^a-z]/gi, "")
      .toLowerCase();

  if (
    normalizedUnit === "inr" ||
    normalizedUnit?.endsWith(
      "inr"
    )
  ) {
    return (
      fact.numericValue /
      RUPEES_PER_CRORE
    );
  }

  return fact.numericValue;
}

function getDurationMetric(
  document: ParsedNseXbrl,
  contextId: string | null,
  aliases: readonly string[],
  assumeRupeesWhenUnitMissing = false
): NullableNumber {
  const fact =
    findFact(
      document,
      contextId,
      aliases
    );

  if (
    assumeRupeesWhenUnitMissing &&
    fact?.numericValue !== null &&
    fact?.numericValue !== undefined &&
    !fact.unitRef?.trim()
  ) {
    return (
      fact.numericValue /
      RUPEES_PER_CRORE
    );
  }

  return convertMoneyToCrores(
    fact
  );
}

function getInstantMetric(
  document: ParsedNseXbrl,
  contextId: string | null,
  aliases: readonly string[],
  assumeRupeesWhenUnitMissing = false
): NullableNumber {
  const fact =
    findFact(
      document,
      contextId,
      aliases
    );

  /*
   * Some verified NSE BANKING filings
   * omit unitRef from balance-sheet
   * monetary facts such as Assets.
   *
   * Apply this fallback only when the
   * caller has explicitly confirmed a
   * banking taxonomy.
   */
  if (
    assumeRupeesWhenUnitMissing &&
    fact?.numericValue !== null &&
    fact?.numericValue !== undefined &&
    !fact.unitRef?.trim()
  ) {
    return (
      fact.numericValue /
      RUPEES_PER_CRORE
    );
  }

  return convertMoneyToCrores(
    fact
  );
}

function getPerShareMetric(
  document: ParsedNseXbrl,
  contextId: string | null,
  aliases: readonly string[]
): NullableNumber {
  const fact =
    findFact(
      document,
      contextId,
      aliases
    );

  return (
    fact?.numericValue ?? null
  );
}

function getPercentageMetric(
  document: ParsedNseXbrl,
  contextId: string | null,
  aliases: readonly string[]
): NullableNumber {
  const fact =
    findFact(
      document,
      contextId,
      aliases
    );

  const value =
    fact?.numericValue ??
    null;

  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  /*
   * NSE BANKING XBRL commonly stores
   * percentages as decimal ratios:
   * 0.0218 means 2.18%.
   *
   * Values already expressed as a
   * percentage, such as 2.18, remain
   * unchanged.
   */
  return Math.abs(value) <= 1
    ? value * 100
    : value;
}

function addValues(
  values: NullableNumber[]
): NullableNumber {
  if (
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

function getSourceName(
  document: ParsedNseXbrl
): string {
  if (
    document.taxonomyPrefixes.includes(
      "in-capmkt"
    )
  ) {
    return (
      "NSE Integrated Filing " +
      "Financials XBRL"
    );
  }

  return (
    "NSE Corporate Financial " +
    "Results XBRL"
  );
}

export function normalizeNseXbrlPeriod(
  document: ParsedNseXbrl,
  options: NseNormalizerOptions
): NormalizedNsePeriodResult {
  const warnings: string[] = [];

  const bankingFactNames =
    new Set([
      "deposits",
      "advances",
      "interestearned",
      "totalinterestearned",
      "interestexpended",
      "percentageofgrossnpa",
      "percentageofnpa",
      "operatingprofitbeforeprovisionsandcontingencies",
    ]);

  /*
   * Legacy NSE bank filings do not
   * consistently expose the modern
   * banking taxonomy prefix or a
   * /BANKING_ URL. Strong bank-only
   * facts therefore provide a safe
   * fallback classification signal.
   */
  const hasBankingFacts =
    document.facts.some(
      (fact) =>
        bankingFactNames.has(
          normalizeName(
            fact.localName
          )
        )
    );

    /*
   * A declared namespace prefix alone
   * does not establish banking activity.
   * Use the banking filing URL or the
   * existing banking-fact detection.
   */
  const isBankingTaxonomy =
    document.sourceUrl
      .toUpperCase()
      .includes("/BANKING_") ||
    hasBankingFacts;

  const durationContext =
  selectDurationContext(
    document,
    options.periodType,
    options.periodEnded,
    isBankingTaxonomy
  );

  const instantContext =
    selectInstantContext(
      document.contexts,
      options.periodEnded
    );

  if (!durationContext) {
    warnings.push(
      "No suitable dimensionless duration context was found."
    );
  }

  if (!instantContext) {
    warnings.push(
      "No suitable dimensionless instant context was found."
    );
  }

  const durationContextId =
    durationContext?.id ?? null;

  const instantContextId =
    instantContext?.id ?? null;

  const otherIncome =
    getDurationMetric(
      document,
      durationContextId,
      METRIC_TAGS.otherIncome,
      isBankingTaxonomy
    );

  const corporateRevenue =
    isBankingTaxonomy
      ? null
      : getDurationMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .corporateRevenue
        );

  const reportedBankTotalIncome =
    isBankingTaxonomy
      ? getDurationMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .bankTotalIncome,
          true
        )
      : null;

  const bankInterestEarned =
    isBankingTaxonomy
      ? getDurationMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .bankInterestEarned,
          true
        )
      : null;

  const derivedBankTotalIncome =
    isBankingTaxonomy
      ? addValues([
          bankInterestEarned,
          otherIncome,
        ])
      : null;

  const revenue =
    isBankingTaxonomy
      ? reportedBankTotalIncome ??
        derivedBankTotalIncome
      : corporateRevenue;

  const reportedOperatingIncome =
    getDurationMetric(
      document,
      durationContextId,
      isBankingTaxonomy
        ? METRIC_TAGS
            .bankOperatingProfit
        : METRIC_TAGS
            .corporateOperatingIncome,
      isBankingTaxonomy
    );

  const reportedEbit =
    getDurationMetric(
      document,
      durationContextId,
      METRIC_TAGS.ebit
    );

  const financeCosts =
    getDurationMetric(
      document,
      durationContextId,
      isBankingTaxonomy
        ? METRIC_TAGS
            .bankInterestExpended
        : METRIC_TAGS
            .corporateFinanceCosts,
      isBankingTaxonomy
    );

  const depreciation =
    getDurationMetric(
      document,
      durationContextId,
      METRIC_TAGS.depreciation
    );

  const profitBeforeTax =
    getDurationMetric(
      document,
      durationContextId,
      METRIC_TAGS.profitBeforeTax
    );

  const taxExpense =
    getDurationMetric(
      document,
      durationContextId,
      METRIC_TAGS.taxExpense
    );

  let netProfit =
  getDurationMetric(
    document,
    durationContextId,
    METRIC_TAGS.netProfit
  );

const selectedNetProfitFact = findFact(
  document,
  durationContextId,
  METRIC_TAGS.netProfit
);

const selectedOwnersProfit =
  selectedNetProfitFact !== null &&
  [
    "profitorlossattributabletoownersofparent",
    "profitlossattributabletoownersofparent",
  ].includes(
    normalizeName(selectedNetProfitFact.localName)
  );

const reportedTotalProfit =
  getDurationMetric(
    document,
    durationContextId,
    [
      "ProfitLossForPeriod",
      "ProfitLossForThePeriod",
    ]
  );

const reportedNonControllingProfit =
  getDurationMetric(
    document,
    durationContextId,
    [
      "ProfitOrLossAttributableToNonControllingInterests",
      "ProfitLossAttributableToNonControllingInterests",
    ]
  );

/*
 * Require total tax expense, rather than the
 * CurrentTax-only fallback used by other metrics.
 */
const reportedTotalTax =
  getDurationMetric(
    document,
    durationContextId,
    [
      "TaxExpense",
      "IncomeTaxExpense",
      "CurrentAndDeferredTax",
    ]
  );

if (
  !isBankingTaxonomy &&
  selectedOwnersProfit &&
  netProfit === 0 &&
  reportedNonControllingProfit === 0 &&
  reportedTotalProfit !== null &&
  Number.isFinite(reportedTotalProfit) &&
  reportedTotalProfit !== 0 &&
  profitBeforeTax !== null &&
  Number.isFinite(profitBeforeTax) &&
  reportedTotalTax !== null &&
  Number.isFinite(reportedTotalTax) &&
  Math.abs(
    profitBeforeTax -
      reportedTotalTax -
      reportedTotalProfit
  ) <= 0.01
) {
  netProfit =
    reportedTotalProfit -
    reportedNonControllingProfit;

  warnings.push(
    "The reported owners' profit and non-controlling " +
      "profit were both zero despite nonzero total " +
      "profit. Owners' profit was reconciled as " +
      "reported total profit minus reported " +
      "non-controlling profit, after checking total " +
      "profit against PBT less total tax expense."
  );
}
    if (
  options.periodType === "ANNUAL" &&
  netProfit === 0
) {
  const selectedProfitFact = findFact(
    document,
    durationContextId,
    METRIC_TAGS.netProfit
  );

  console.log(
    "NSE ZERO PROFIT DIAGNOSTIC",
    JSON.stringify(
      {
        sourceUrl: document.sourceUrl,
        periodEnded: options.periodEnded,
        durationContext,
        profitBeforeTax,
        taxExpense,
        netProfit,

        selectedProfitFact: selectedProfitFact
          ? {
              tag: selectedProfitFact.localName,
              rawValue: selectedProfitFact.value,
              numericValue:
                selectedProfitFact.numericValue,
              unit: selectedProfitFact.unitRef,
            }
          : null,

        relatedFacts: document.facts
          .filter(
            (fact) =>
              fact.contextRef === durationContextId &&
              /profit|taxexpense|incometax/i.test(
                fact.localName
              )
          )
          .map((fact) => ({
            tag: fact.localName,
            rawValue: fact.value,
            numericValue: fact.numericValue,
            unit: fact.unitRef,
          })),
      },
      null,
      2
    )
  );
}

  const epsBasic =
    getPerShareMetric(
      document,
      durationContextId,
      METRIC_TAGS.epsBasic
    );

  const epsDiluted =
    getPerShareMetric(
      document,
      durationContextId,
      METRIC_TAGS.epsDiluted
    );

  /*
   * If EBIT is not directly published,
   * derive it from PBT + finance costs.
   */
  const derivedEbit =
    addValues([
      profitBeforeTax,
      financeCosts,
    ]);

  const ebit =
  isBankingTaxonomy
    ? null
    : reportedEbit ??
      derivedEbit;

  /*
   * EBITDA is derived only when both
   * EBIT and depreciation are present.
   */
  const ebitda =
  isBankingTaxonomy
    ? null
    : addValues([
        ebit,
        depreciation,
      ]);

  /*
   * Operating income excludes other
   * income when it can be derived.
   */
  const derivedOperatingIncome =
  !isBankingTaxonomy &&
  ebit !== null &&
  otherIncome !== null
    ? ebit - otherIncome
    : null;

  const operatingIncome =
    reportedOperatingIncome ??
    derivedOperatingIncome;

      if (
    revenue === null &&
    !options.documentType?.startsWith("Revenue diagnostic")
  ) {
    console.log(
      "NSE MISSING REVENUE CHECK:\n" +
        JSON.stringify(
          {
            sourceUrl: document.sourceUrl,
            periodEnded: options.periodEnded,
            periodType: options.periodType,
            isBankingTaxonomy,
            durationContextId,

            bankingSignals: Array.from(
              new Set(
                document.facts
                  .filter((fact) =>
                    bankingFactNames.has(
                      normalizeName(fact.localName)
                    )
                  )
                  .map((fact) => fact.localName)
              )
            ),

            revenueAndIncomeFacts: document.facts
              .filter(
                (fact) =>
                  fact.contextRef ===
                    durationContextId &&
                  /revenue|income|sales/i.test(
                    fact.localName
                  )
              )
              .map((fact) => ({
                tag: fact.localName,
                context: fact.contextRef,
                value: fact.numericValue,
                unit: fact.unitRef,
              })),
          },
          null,
          2
        )
    );
  }

  if (revenue === null) {
    warnings.push(
      isBankingTaxonomy
        ? "Bank total income was not found and could not be derived consistently from interest earned plus other income."
        : "Revenue was not found in the selected context."
    );
  }

  if (
    isBankingTaxonomy &&
    reportedBankTotalIncome === null &&
    derivedBankTotalIncome !== null
  ) {
    warnings.push(
      "Bank total income was derived consistently as interest earned plus other income."
    );
  }

  if (netProfit === null) {
    warnings.push(
      "Profit attributable to shareholders was not found in the selected context."
    );
  }

  if (
    epsBasic === null &&
    epsDiluted === null
  ) {
    warnings.push(
      "EPS was not found in the selected context."
    );
  }

    const operatingCashFlow =
    getDurationMetric(
      document,
      durationContextId,
      METRIC_TAGS.operatingCashFlow
    );

  const capitalExpenditure =
    isBankingTaxonomy
      ? null
      : getDurationMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .capitalExpenditure
        );

  const freeCashFlow =
    operatingCashFlow !== null &&
    capitalExpenditure !== null
      ? operatingCashFlow -
        Math.abs(
          capitalExpenditure
        )
      : null;

  const reportedTotalDebt =
    getInstantMetric(
      document,
      instantContextId,
      METRIC_TAGS.totalDebt
    );

  const currentBorrowings =
    getInstantMetric(
      document,
      instantContextId,
      METRIC_TAGS.currentBorrowings
    );

  const noncurrentBorrowings =
    getInstantMetric(
      document,
      instantContextId,
      METRIC_TAGS.noncurrentBorrowings
    );

  /*
   * Integrated NSE filings commonly
   * publish debt as current and
   * non-current borrowings instead of
   * one TotalDebt fact.
   */
  const totalDebt =
    isBankingTaxonomy
      ? null
      : reportedTotalDebt ??
        addValues([
          currentBorrowings,
          noncurrentBorrowings,
        ]);

  const equityShareCapitalTags =
  isBankingTaxonomy
    ? [
        "PaidUpValueOfEquityShareCapital",
      ]
    : METRIC_TAGS
        .equityShareCapital;

const reportedEquityShareCapital =
  getInstantMetric(
    document,
    instantContextId,
    equityShareCapitalTags,
    isBankingTaxonomy
  ) ??
  (
    isBankingTaxonomy
      ? getDurationMetric(
          document,
          durationContextId,
          equityShareCapitalTags
        )
      : null
  );

/*
 * A listed bank's paid-up equity
 * capital cannot reasonably be ₹10
 * crore or less. Some legacy BANKING
 * filings incorrectly expose the ₹2
 * face value through a capital fact.
 */
const equityShareCapital =
  isBankingTaxonomy &&
  reportedEquityShareCapital !== null &&
  reportedEquityShareCapital <= 10
    ? null
    : reportedEquityShareCapital;

  const reservesAndSurplus =
  isBankingTaxonomy
    ? getInstantMetric(
        document,
        instantContextId,
        METRIC_TAGS
          .reservesAndSurplus,
        true
      )
    : null;

const bankingTotalEquity =
  isBankingTaxonomy &&
  equityShareCapital !== null &&
  reservesAndSurplus !== null
    ? equityShareCapital +
      reservesAndSurplus
    : null;

    const deposits =
  isBankingTaxonomy
    ? getInstantMetric(
        document,
        instantContextId,
        METRIC_TAGS.deposits,
        true
      )
    : null;

const advances =
  isBankingTaxonomy
    ? getInstantMetric(
        document,
        instantContextId,
        METRIC_TAGS.advances,
        true
      )
    : null;

    const reportedGrossNpaPercent =
  isBankingTaxonomy
    ? (
        getPercentageMetric(
          document,
          instantContextId,
          METRIC_TAGS
            .grossNpaPercent
        ) ??
        getPercentageMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .grossNpaPercent
        )
      )
    : null;

const reportedNetNpaPercent =
  isBankingTaxonomy
    ? (
        getPercentageMetric(
          document,
          instantContextId,
          METRIC_TAGS
            .netNpaPercent
        ) ??
        getPercentageMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .netNpaPercent
        )
      )
    : null;

const reportedReturnOnAssetsPercent =
  isBankingTaxonomy
    ? (
        getPercentageMetric(
          document,
          instantContextId,
          METRIC_TAGS
            .returnOnAssetsPercent
        ) ??
        getPercentageMetric(
          document,
          durationContextId,
          METRIC_TAGS
            .returnOnAssetsPercent
        )
      )
    : null;

  /*
   * Some legacy BANKING result documents
   * publish 0.00 simultaneously for GNPA,
   * NNPA and ROA as non-disclosure
   * placeholders. Treat the complete
   * zero triplet as unavailable instead
   * of presenting it as verified data.
   *
   * A genuine zero in only one metric is
   * preserved.
   */
  const hasLegacyZeroRatioTriplet =
    isBankingTaxonomy &&
    reportedGrossNpaPercent === 0 &&
    reportedNetNpaPercent === 0 &&
    reportedReturnOnAssetsPercent === 0;

  const grossNpaPercent =
    hasLegacyZeroRatioTriplet
      ? null
      : reportedGrossNpaPercent;

  const netNpaPercent =
    hasLegacyZeroRatioTriplet
      ? null
      : reportedNetNpaPercent;

  const returnOnAssetsPercent =
    hasLegacyZeroRatioTriplet
      ? null
      : reportedReturnOnAssetsPercent;

  if (hasLegacyZeroRatioTriplet) {
    warnings.push(
      "Legacy BANKING GNPA, NNPA and ROA values were all reported as 0.00 and were treated as unavailable disclosure placeholders."
    );
  }

  const faceValuePerShare =
    getPerShareMetric(
      document,
      durationContextId,
      METRIC_TAGS.faceValuePerShare
    ) ??
    getPerShareMetric(
      document,
      instantContextId,
      METRIC_TAGS.faceValuePerShare
    );

  /*
   * Equity capital is normalized to
   * crores, so convert it back to
   * rupees before dividing by face
   * value. The result is the actual
   * number of outstanding shares.
   */
  const sharesOutstanding =
    equityShareCapital !== null &&
    faceValuePerShare !== null &&
    faceValuePerShare > 0
      ? (
          equityShareCapital *
          RUPEES_PER_CRORE
        ) /
        faceValuePerShare
      : null;

  return {
    financialPeriod: {
      period: options.period,

      periodType:
        options.periodType,

      startDate:
        durationContext?.startDate ??
        null,

      endDate:
        durationContext?.endDate ??
        instantContext?.instant ??
        options.periodEnded,

      currency: "INR",
      unit: "CRORES",

      revenue,
      operatingIncome,
      ebitda,
      ebit,
      profitBeforeTax,
      taxExpense,
      netProfit,
      epsBasic,
      epsDiluted,
      financeCosts,

      totalAssets:
  getInstantMetric(
    document,
    instantContextId,
    METRIC_TAGS.totalAssets,
    isBankingTaxonomy
  ),

      totalEquity:
  bankingTotalEquity ??
  getInstantMetric(
    document,
    instantContextId,
    METRIC_TAGS.totalEquity
  ),

      totalDebt,
      deposits,
advances,
grossNpaPercent,
netNpaPercent,
returnOnAssetsPercent,
      equityShareCapital,
      faceValuePerShare,
      sharesOutstanding,

      cashAndEquivalents:
        getInstantMetric(
          document,
          instantContextId,
          METRIC_TAGS.cashAndEquivalents
        ),

      currentAssets:
        getInstantMetric(
          document,
          instantContextId,
          METRIC_TAGS.currentAssets
        ),

      currentLiabilities:
        getInstantMetric(
          document,
          instantContextId,
          METRIC_TAGS.currentLiabilities
        ),

      inventory:
        getInstantMetric(
          document,
          instantContextId,
          METRIC_TAGS.inventory
        ),

      tradeReceivables:
        getInstantMetric(
          document,
          instantContextId,
          METRIC_TAGS.tradeReceivables
        ),

      tradePayables:
        getInstantMetric(
          document,
          instantContextId,
          METRIC_TAGS.tradePayables
        ),

      operatingCashFlow,

            investingCashFlow:
        getDurationMetric(
          document,
          durationContextId,
          METRIC_TAGS.investingCashFlow
        ),

            financingCashFlow:
        getDurationMetric(
          document,
          durationContextId,
          METRIC_TAGS.financingCashFlow
        ),

      capitalExpenditure,
      freeCashFlow,

      dividendPerShare:
        getPerShareMetric(
          document,
          durationContextId,
          METRIC_TAGS.dividendPerShare
        ),

      source: {
        name:
          getSourceName(document),

        documentType:
          options.documentType ??
          "Financial Results",

        reportingDate:
          durationContext?.endDate ??
          instantContext?.instant ??
          options.periodEnded ??
          undefined,

        sourceUrl:
          document.sourceUrl,

        fetchedAt:
          document.fetchedAt,
      },
    },

    selectedContexts: {
      durationContextId,
      instantContextId,
    },

    warnings,
  };
}
