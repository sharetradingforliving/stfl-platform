import type {
  BalanceSheetMetrics,
  CashFlowMetrics,
  FinancialStatementPeriod,
  FundamentalMetrics,
  GrowthMetrics,
  MarketSnapshot,
  MarketValuationMetrics,
  NullableNumber,
  ProfitabilityMetrics,
  BankSpecificMetrics,
} from "./types";

function isValidNumber(
  value: NullableNumber
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function safeDivide(
  numerator: NullableNumber,
  denominator: NullableNumber
): NullableNumber {
  if (
    !isValidNumber(numerator) ||
    !isValidNumber(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return numerator / denominator;
}

function percentage(
  numerator: NullableNumber,
  denominator: NullableNumber
): NullableNumber {
  const result = safeDivide(
    numerator,
    denominator
  );

  return result === null
    ? null
    : result * 100;
}

function average(
  first: NullableNumber,
  second: NullableNumber
): NullableNumber {
  if (
    !isValidNumber(first) ||
    !isValidNumber(second)
  ) {
    return null;
  }

  return (first + second) / 2;
}

function subtract(
  first: NullableNumber,
  second: NullableNumber
): NullableNumber {
  if (
    !isValidNumber(first) ||
    !isValidNumber(second)
  ) {
    return null;
  }

  return first - second;
}

function add(
  values: NullableNumber[]
): NullableNumber {
  if (
    values.some(
      (value) => !isValidNumber(value)
    )
  ) {
    return null;
  }

  return (
    values as number[]
  ).reduce(
    (total, value) => total + value,
    0
  );
}

function calculateGrowth(
  current: NullableNumber,
  previous: NullableNumber
): NullableNumber {
  if (
    !isValidNumber(current) ||
    !isValidNumber(previous) ||
    previous === 0
  ) {
    return null;
  }

  return (
    ((current - previous) /
      Math.abs(previous)) *
    100
  );
}

function calculateCagr(
  endingValue: NullableNumber,
  beginningValue: NullableNumber,
  years: number
): NullableNumber {
  if (
    !isValidNumber(endingValue) ||
    !isValidNumber(beginningValue) ||
    beginningValue <= 0 ||
    endingValue <= 0 ||
    years <= 0
  ) {
    return null;
  }

  return (
    (Math.pow(
      endingValue / beginningValue,
      1 / years
    ) -
      1) *
    100
  );
}

function getFreeCashFlow(
  period: FinancialStatementPeriod
): NullableNumber {
  if (
    isValidNumber(period.freeCashFlow)
  ) {
    return period.freeCashFlow;
  }

  if (
    !isValidNumber(
      period.operatingCashFlow
    ) ||
    !isValidNumber(
      period.capitalExpenditure
    )
  ) {
    return null;
  }

  return (
    period.operatingCashFlow -
    Math.abs(period.capitalExpenditure)
  );
}

function convertToRupees(
  value: NullableNumber,
  unit: FinancialStatementPeriod["unit"]
): NullableNumber {
  if (!isValidNumber(value)) {
    return null;
  }

  const multiplier: Record<
    FinancialStatementPeriod["unit"],
    number
  > = {
    RUPEES: 1,
    THOUSANDS: 1_000,
    LAKHS: 100_000,
    CRORES: 10_000_000,
  };

  return value * multiplier[unit];
}

function valuePerShare(
  value: NullableNumber,
  sharesOutstanding: NullableNumber,
  unit: FinancialStatementPeriod["unit"]
): NullableNumber {
  const valueInRupees =
    convertToRupees(value, unit);

  return safeDivide(
    valueInRupees,
    sharesOutstanding
  );
}

function sortAnnualPeriods(
  periods: FinancialStatementPeriod[]
): FinancialStatementPeriod[] {
  return periods
    .filter(
      (period) =>
        period.periodType === "ANNUAL"
    )
    .slice()
    .sort((first, second) => {
      const firstDate =
        first.endDate ??
        first.period;

      const secondDate =
        second.endDate ??
        second.period;

      return firstDate.localeCompare(
        secondDate
      );
    });
}

function findHistoricalPeriod(
  annualPeriods:
    FinancialStatementPeriod[],
  yearsBack: number
): FinancialStatementPeriod | null {
  const targetIndex =
    annualPeriods.length -
    1 -
    yearsBack;

  if (targetIndex < 0) {
    return null;
  }

  return (
    annualPeriods[targetIndex] ??
    null
  );
}

function getPeriodEndYear(
  period:
    FinancialStatementPeriod | null
): number | null {
  if (!period) {
    return null;
  }

  const dateValue =
    period.endDate ??
    period.period;

  const yearMatch =
    dateValue.match(
      /^(\d{4})/
    );

  if (!yearMatch) {
    return null;
  }

  const year =
    Number(yearMatch[1]);

  return Number.isFinite(year)
    ? year
    : null;
}

function getAvailableCagrYears(
  oldest:
    FinancialStatementPeriod | null,

  latest:
    FinancialStatementPeriod | null
): number | null {
  const oldestYear =
    getPeriodEndYear(oldest);

  const latestYear =
    getPeriodEndYear(latest);

  if (
    oldestYear === null ||
    latestYear === null
  ) {
    return null;
  }

  const difference =
    latestYear - oldestYear;

  return difference > 0
    ? difference
    : null;
}

function calculateGrowthMetrics(
  annualPeriods:
    FinancialStatementPeriod[]
): GrowthMetrics {
  const latest =
    annualPeriods.at(-1) ?? null;

  const oldest =
    annualPeriods[0] ?? null;

  const isBankingCompany =
    annualPeriods.some(
      (period) =>
        isValidNumber(
          period.deposits
        ) ||
        isValidNumber(
          period.advances
        ) ||
        isValidNumber(
          period.grossNpaPercent
        ) ||
        isValidNumber(
          period.netNpaPercent
        ) ||
        isValidNumber(
          period.returnOnAssetsPercent
        )
    );

  const availableCagrYears =
    getAvailableCagrYears(
      oldest,
      latest
    );

  /*
   * Generic corporate growth metrics
   * are not presented for banks.
   *
   * Banking XBRL filings can change
   * taxonomy and income definitions
   * between annual and reconstructed
   * periods. Comparing those values can
   * create misleading growth rates.
   *
   * Banks should instead use verified
   * deposit growth, advance/credit
   * growth and bank-specific ratios.
   */
  if (isBankingCompany) {
    return {
      availableCagrYears,

      revenueGrowth1Y: null,
      revenueCagrAvailable: null,
      revenueCagr3Y: null,
      revenueCagr5Y: null,
      revenueCagr10Y: null,

      ebitdaGrowth1Y: null,
      ebitdaCagrAvailable: null,
      ebitdaCagr3Y: null,
      ebitdaCagr5Y: null,

      patGrowth1Y: null,
      patCagrAvailable: null,
      patCagr3Y: null,
      patCagr5Y: null,
      patCagr10Y: null,

      epsGrowth1Y: null,
      epsCagrAvailable: null,
      epsCagr3Y: null,
      epsCagr5Y: null,
    };
  }

  const previous =
    findHistoricalPeriod(
      annualPeriods,
      1
    );

  const threeYearsAgo =
    findHistoricalPeriod(
      annualPeriods,
      3
    );

  const fiveYearsAgo =
    findHistoricalPeriod(
      annualPeriods,
      5
    );

  const tenYearsAgo =
    findHistoricalPeriod(
      annualPeriods,
      10
    );

  const latestEps =
    latest?.epsDiluted ??
    latest?.epsBasic ??
    null;

  const oldestEps =
    oldest?.epsDiluted ??
    oldest?.epsBasic ??
    null;

  return {
    availableCagrYears,

    revenueGrowth1Y:
      calculateGrowth(
        latest?.revenue ?? null,
        previous?.revenue ?? null
      ),

    revenueCagrAvailable:
      availableCagrYears !== null
        ? calculateCagr(
            latest?.revenue ??
              null,

            oldest?.revenue ??
              null,

            availableCagrYears
          )
        : null,

    revenueCagr3Y:
      calculateCagr(
        latest?.revenue ?? null,

        threeYearsAgo
          ?.revenue ?? null,

        3
      ),

    revenueCagr5Y:
      calculateCagr(
        latest?.revenue ?? null,

        fiveYearsAgo
          ?.revenue ?? null,

        5
      ),

    revenueCagr10Y:
      calculateCagr(
        latest?.revenue ?? null,

        tenYearsAgo
          ?.revenue ?? null,

        10
      ),

    ebitdaGrowth1Y:
      calculateGrowth(
        latest?.ebitda ?? null,

        previous?.ebitda ??
          null
      ),

    ebitdaCagrAvailable:
      availableCagrYears !== null
        ? calculateCagr(
            latest?.ebitda ??
              null,

            oldest?.ebitda ??
              null,

            availableCagrYears
          )
        : null,

    ebitdaCagr3Y:
      calculateCagr(
        latest?.ebitda ?? null,

        threeYearsAgo
          ?.ebitda ?? null,

        3
      ),

    ebitdaCagr5Y:
      calculateCagr(
        latest?.ebitda ?? null,

        fiveYearsAgo
          ?.ebitda ?? null,

        5
      ),

    patGrowth1Y:
      calculateGrowth(
        latest?.netProfit ??
          null,

        previous?.netProfit ??
          null
      ),

    patCagrAvailable:
      availableCagrYears !== null
        ? calculateCagr(
            latest?.netProfit ??
              null,

            oldest?.netProfit ??
              null,

            availableCagrYears
          )
        : null,

    patCagr3Y:
      calculateCagr(
        latest?.netProfit ??
          null,

        threeYearsAgo
          ?.netProfit ?? null,

        3
      ),

    patCagr5Y:
      calculateCagr(
        latest?.netProfit ??
          null,

        fiveYearsAgo
          ?.netProfit ?? null,

        5
      ),

    patCagr10Y:
      calculateCagr(
        latest?.netProfit ??
          null,

        tenYearsAgo
          ?.netProfit ?? null,

        10
      ),

    epsGrowth1Y:
      calculateGrowth(
        latestEps,

        previous?.epsDiluted ??
          previous?.epsBasic ??
          null
      ),

    epsCagrAvailable:
      availableCagrYears !== null
        ? calculateCagr(
            latestEps,
            oldestEps,
            availableCagrYears
          )
        : null,

    epsCagr3Y:
      calculateCagr(
        latestEps,

        threeYearsAgo
          ?.epsDiluted ??
          threeYearsAgo
            ?.epsBasic ??
          null,

        3
      ),

    epsCagr5Y:
      calculateCagr(
        latestEps,

        fiveYearsAgo
          ?.epsDiluted ??
          fiveYearsAgo
            ?.epsBasic ??
          null,

        5
      ),
  };
}
function calculateProfitabilityMetrics(
  annualPeriods:
    FinancialStatementPeriod[]
): ProfitabilityMetrics {
  const latest =
    annualPeriods.at(-1) ?? null;

  const previous =
    findHistoricalPeriod(
      annualPeriods,
      1
    );

  if (!latest) {
    return {
      grossMargin: null,
      ebitdaMargin: null,
      ebitMargin: null,
      patMargin: null,
      returnOnAssets: null,
      returnOnEquity: null,
      returnOnCapitalEmployed:
        null,
      returnOnInvestedCapital:
        null,
      assetTurnover: null,
    };
  }

  /*
   * Automatically identify banking
   * companies from verified banking
   * financial fields.
   */
  const isBankingCompany =
    annualPeriods.some(
      (period) =>
        isValidNumber(
          period.deposits
        ) ||
        isValidNumber(
          period.advances
        ) ||
        isValidNumber(
          period.grossNpaPercent
        ) ||
        isValidNumber(
          period.netNpaPercent
        ) ||
        isValidNumber(
          period.returnOnAssetsPercent
        )
    );

  const averageAssets =
    average(
      latest.totalAssets,
      previous?.totalAssets ??
        null
    );

  const averageEquity =
    average(
      latest.totalEquity,
      previous?.totalEquity ??
        null
    );

  /*
   * Conventional operating margins,
   * ROCE, ROIC and asset turnover are
   * not directly comparable for banks.
   *
   * Deposits and advances are operating
   * balance-sheet items rather than
   * conventional debt and working
   * capital.
   */
  if (isBankingCompany) {
    const reportedReturnOnAssets =
      isValidNumber(
        latest.returnOnAssetsPercent
      )
        ? latest
            .returnOnAssetsPercent
        : null;

    const calculatedReturnOnAssets =
      percentage(
        latest.netProfit,
        averageAssets ??
          latest.totalAssets
      );

    return {
      grossMargin: null,

      ebitdaMargin: null,

      ebitMargin: null,

      patMargin: null,

      returnOnAssets:
        reportedReturnOnAssets ??
        calculatedReturnOnAssets,

      returnOnEquity:
        percentage(
          latest.netProfit,
          averageEquity ??
            latest.totalEquity
        ),

      returnOnCapitalEmployed:
        null,

      returnOnInvestedCapital:
        null,

      assetTurnover: null,
    };
  }

  const latestCapitalEmployed =
    subtract(
      latest.totalAssets,
      latest.currentLiabilities
    );

  const previousCapitalEmployed =
    previous
      ? subtract(
          previous.totalAssets,
          previous.currentLiabilities
        )
      : null;

  const averageCapitalEmployed =
    average(
      latestCapitalEmployed,
      previousCapitalEmployed
    ) ?? latestCapitalEmployed;

  const investedCapital =
    add([
      latest.totalEquity,
      latest.totalDebt,

      isValidNumber(
        latest.cashAndEquivalents
      )
        ? -latest
            .cashAndEquivalents
        : null,
    ]);

  const taxRate =
    percentage(
      latest.taxExpense,
      latest.profitBeforeTax
    );

  const nopat =
    isValidNumber(
      latest.ebit
    ) &&
    isValidNumber(
      taxRate
    )
      ? latest.ebit *
        (1 - taxRate / 100)
      : null;

  return {
    grossMargin: null,

    ebitdaMargin:
      percentage(
        latest.ebitda,
        latest.revenue
      ),

    ebitMargin:
      percentage(
        latest.ebit,
        latest.revenue
      ),

    patMargin:
      percentage(
        latest.netProfit,
        latest.revenue
      ),

    returnOnAssets:
      percentage(
        latest.netProfit,
        averageAssets ??
          latest.totalAssets
      ),

    returnOnEquity:
      percentage(
        latest.netProfit,
        averageEquity ??
          latest.totalEquity
      ),

    returnOnCapitalEmployed:
      percentage(
        latest.ebit,
        averageCapitalEmployed
      ),

    returnOnInvestedCapital:
      percentage(
        nopat,
        investedCapital
      ),

    assetTurnover:
      safeDivide(
        latest.revenue,
        averageAssets ??
          latest.totalAssets
      ),
  };
}

function calculateBalanceSheetMetrics(
  annualPeriods:
    FinancialStatementPeriod[]
): BalanceSheetMetrics {
  const latest =
    annualPeriods.at(-1) ?? null;

  if (!latest) {
    return {
      debtToEquity: null,
      netDebt: null,
      netDebtToEbitda: null,
      interestCoverage: null,
      currentRatio: null,
      quickRatio: null,
      workingCapital: null,
    };
  }

  const netDebt = subtract(
    latest.totalDebt,
    latest.cashAndEquivalents
  );

  const quickAssets =
    subtract(
      latest.currentAssets,
      latest.inventory
    );

  return {
    debtToEquity:
      safeDivide(
        latest.totalDebt,
        latest.totalEquity
      ),

    netDebt,

    netDebtToEbitda:
      safeDivide(
        netDebt,
        latest.ebitda
      ),

        interestCoverage:
      safeDivide(
        latest.ebit,
        latest.financeCosts ?? null
      ),

    currentRatio:
      safeDivide(
        latest.currentAssets,
        latest.currentLiabilities
      ),

    quickRatio:
      safeDivide(
        quickAssets,
        latest.currentLiabilities
      ),

    workingCapital:
      subtract(
        latest.currentAssets,
        latest.currentLiabilities
      ),
  };
}

function calculateCashFlowMetrics(
  annualPeriods:
    FinancialStatementPeriod[]
): CashFlowMetrics {
  const latest =
    annualPeriods.at(-1) ?? null;

  if (!latest) {
    return {
      operatingCashFlowToPat: null,
      freeCashFlowToPat: null,
      freeCashFlowMargin: null,
      capitalExpenditureToRevenue:
        null,
      cumulativeOperatingCashFlow:
        null,
      cumulativeNetProfit: null,
      cumulativeOcfToPat: null,
      cashConversionLabel:
        "INSUFFICIENT_DATA",
    };
  }

  /*
   * Deposits and advances are operating
   * balance-sheet items for banks.
   * Therefore, conventional corporate
   * cash-conversion and free-cash-flow
   * ratios are not meaningful for them.
   *
   * This detection is based entirely on
   * verified banking fields and contains
   * no company-specific hardcoding.
   */
  const isBankingCompany =
    annualPeriods.some(
      (period) =>
        isValidNumber(
          period.deposits
        ) ||
        isValidNumber(
          period.advances
        ) ||
        isValidNumber(
          period.grossNpaPercent
        ) ||
        isValidNumber(
          period.netNpaPercent
        ) ||
        isValidNumber(
          period
            .returnOnAssetsPercent
        )
    );

  if (isBankingCompany) {
    return {
      operatingCashFlowToPat: null,
      freeCashFlowToPat: null,
      freeCashFlowMargin: null,
      capitalExpenditureToRevenue:
        null,
      cumulativeOperatingCashFlow:
        null,
      cumulativeNetProfit: null,
      cumulativeOcfToPat: null,
      cashConversionLabel:
        "INSUFFICIENT_DATA",
    };
  }

  const latestFreeCashFlow =
    getFreeCashFlow(latest);

  const validCashFlowPeriods =
    annualPeriods.filter(
      (period) =>
        isValidNumber(
          period.operatingCashFlow
        ) &&
        isValidNumber(
          period.netProfit
        )
    );

  const cumulativeOperatingCashFlow =
    validCashFlowPeriods.reduce(
      (total, period) =>
        total +
        (period.operatingCashFlow ??
          0),
      0
    );

  const cumulativeNetProfit =
    validCashFlowPeriods.reduce(
      (total, period) =>
        total +
        (period.netProfit ?? 0),
      0
    );

  const cumulativeOcfToPat =
    validCashFlowPeriods.length > 0
      ? safeDivide(
          cumulativeOperatingCashFlow,
          cumulativeNetProfit
        )
      : null;

  let cashConversionLabel:
    CashFlowMetrics["cashConversionLabel"] =
    "INSUFFICIENT_DATA";

  if (
    isValidNumber(
      cumulativeOcfToPat
    )
  ) {
    if (cumulativeOcfToPat >= 1) {
      cashConversionLabel =
        "STRONG";
    } else if (
      cumulativeOcfToPat >= 0.8
    ) {
      cashConversionLabel =
        "HEALTHY";
    } else if (
      cumulativeOcfToPat >= 0.6
    ) {
      cashConversionLabel =
        "MODERATE";
    } else {
      cashConversionLabel =
        "WEAK";
    }
  }

  return {
    operatingCashFlowToPat:
      safeDivide(
        latest.operatingCashFlow,
        latest.netProfit
      ),

    freeCashFlowToPat:
      safeDivide(
        latestFreeCashFlow,
        latest.netProfit
      ),

    freeCashFlowMargin:
      percentage(
        latestFreeCashFlow,
        latest.revenue
      ),

    capitalExpenditureToRevenue:
      percentage(
        isValidNumber(
          latest.capitalExpenditure
        )
          ? Math.abs(
              latest.capitalExpenditure
            )
          : null,
        latest.revenue
      ),

    cumulativeOperatingCashFlow:
      validCashFlowPeriods.length > 0
        ? cumulativeOperatingCashFlow
        : null,

    cumulativeNetProfit:
      validCashFlowPeriods.length > 0
        ? cumulativeNetProfit
        : null,

    cumulativeOcfToPat,

    cashConversionLabel,
  };
}
    
function calculateMarketValuation(
  annualPeriods:
    FinancialStatementPeriod[],
  market: MarketSnapshot | null
): MarketValuationMetrics {
  const latest =
    annualPeriods.at(-1) ?? null;

  if (!latest || !market) {
    return {
      earningsPerShare: null,
      bookValuePerShare: null,
      freeCashFlowPerShare:
        null,
      priceToEarnings: null,
      priceToBook: null,
      priceToSales: null,
      enterpriseValueToEbitda:
        null,
      enterpriseValueToSales:
        null,
      pegRatio: null,
      dividendYield: null,
    };
  }

  /*
 * Banks are identified from verified
 * banking statement fields—not from a
 * hard-coded company symbol.
 */
const isBankingCompany =
  (
    isValidNumber(
      latest.deposits
    ) &&
    latest.deposits > 0
  ) ||
  (
    isValidNumber(
      latest.advances
    ) &&
    latest.advances > 0
  );

    /*
   * Prefer the verified NSE annual
   * share count. Use the market record
   * only as a fallback.
   */
  const sharesOutstanding =
    latest.sharesOutstanding ??
    market.sharesOutstanding;
    
  /*
 * Prefer reported diluted/basic EPS.
 *
 * Banking annual periods derived from
 * four validated quarters may not carry
 * a reported annual EPS. In that case,
 * calculate EPS from verified annual PAT
 * and the verified share count.
 */
const reportedEarningsPerShare =
  latest.epsDiluted ??
  latest.epsBasic;

const calculatedBankEarningsPerShare =
  isBankingCompany
    ? valuePerShare(
        latest.netProfit,
        sharesOutstanding,
        latest.unit
      )
    : null;

const earningsPerShare =
  reportedEarningsPerShare ??
  calculatedBankEarningsPerShare;

  const bookValuePerShare =
    valuePerShare(
      latest.totalEquity,
      sharesOutstanding,
      latest.unit
    );

  /*
 * Conventional free cash flow is not
 * comparable for banks because deposits,
 * advances and regulatory capital are
 * integral operating balance-sheet items.
 */
const freeCashFlowPerShare =
  isBankingCompany
    ? null
    : valuePerShare(
        getFreeCashFlow(
          latest
        ),
        sharesOutstanding,
        latest.unit
      );

  const revenuePerShare =
  isBankingCompany
    ? null
    : valuePerShare(
        latest.revenue,
        sharesOutstanding,
        latest.unit
      );

  const marketCapitalization =
    isValidNumber(
      market.currentPrice
    ) &&
    isValidNumber(
      sharesOutstanding
    )
      ? market.currentPrice *
        sharesOutstanding
      : null;

  const marketCapitalizationInUnit =
    marketCapitalization === null
      ? null
      : latest.unit === "CRORES"
        ? marketCapitalization /
          10_000_000
        : latest.unit === "LAKHS"
          ? marketCapitalization /
            100_000
          : latest.unit ===
                "THOUSANDS"
            ? marketCapitalization /
              1_000
            : marketCapitalization;

  /*
 * Corporate net debt and enterprise
 * value are not meaningful valuation
 * bases for banking companies.
 */
const netDebt =
  isBankingCompany
    ? null
    : subtract(
        latest.totalDebt,
        latest.cashAndEquivalents
      );

  const enterpriseValueInUnit =
    add([
      marketCapitalizationInUnit,
      netDebt,
    ]);

  const priceToEarnings =
    safeDivide(
      market.currentPrice,
      earningsPerShare
    );

  const epsGrowth =
    calculateGrowthMetrics(
      annualPeriods
    ).epsCagr3Y;

  return {
    earningsPerShare,

    bookValuePerShare,

    freeCashFlowPerShare,

    priceToEarnings,

    priceToBook:
      safeDivide(
        market.currentPrice,
        bookValuePerShare
      ),

    priceToSales:
  isBankingCompany
    ? null
    : safeDivide(
        market.currentPrice,
        revenuePerShare
      ),

enterpriseValueToEbitda:
  isBankingCompany
    ? null
    : safeDivide(
        enterpriseValueInUnit,
        latest.ebitda
      ),

enterpriseValueToSales:
  isBankingCompany
    ? null
    : safeDivide(
        enterpriseValueInUnit,
        latest.revenue
      ),

pegRatio:
  !isBankingCompany &&
  isValidNumber(epsGrowth) &&
  epsGrowth > 0
    ? safeDivide(
        priceToEarnings,
        epsGrowth
      )
    : null,

    dividendYield:
      percentage(
        latest.dividendPerShare,
        market.currentPrice
      ),
  };
}

function calculateBankingGrowth(
  currentValue: NullableNumber,
  previousValue: NullableNumber
): NullableNumber {
  if (
    !isValidNumber(currentValue) ||
    !isValidNumber(previousValue) ||
    previousValue <= 0
  ) {
    return null;
  }

  return (
    (
      currentValue /
      previousValue -
      1
    ) *
    100
  );
}

function calculateBankSpecificMetrics(
  annualPeriods:
    FinancialStatementPeriod[],

  quarterlyPeriods:
    FinancialStatementPeriod[] = []
): BankSpecificMetrics | undefined {
  /*
   * Bank detection is based entirely
   * on verified banking fields.
   */
  const getBankingPeriods = (
    periods:
      FinancialStatementPeriod[]
  ) =>
    periods
      .filter(
        (period) =>
          (
            isValidNumber(
              period.deposits
            ) &&
            period.deposits > 0
          ) ||
          (
            isValidNumber(
              period.advances
            ) &&
            period.advances > 0
          )
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
      );

  const bankingAnnualPeriods =
    getBankingPeriods(
      annualPeriods
    );

  const bankingQuarterlyPeriods =
    getBankingPeriods(
      quarterlyPeriods
    );

  const latestAnnual =
    bankingAnnualPeriods.at(-1) ??
    null;

  const latestQuarter =
    bankingQuarterlyPeriods.at(-1) ??
    null;

  const latest =
    latestAnnual ??
    latestQuarter;

  if (!latest) {
    return undefined;
  }

  /*
   * Annual growth remains the preferred
   * source whenever two valid annual
   * observations are available.
   */
  let growthLatest:
    FinancialStatementPeriod | null =
    null;

  let growthPrevious:
    FinancialStatementPeriod | null =
    null;

  if (
    bankingAnnualPeriods.length >= 2
  ) {
    growthLatest =
      bankingAnnualPeriods.at(-1) ??
      null;

    growthPrevious =
      bankingAnnualPeriods.at(-2) ??
      null;
  } else {
    /*
     * When consecutive annual banking
     * balance-sheet values are missing,
     * use exact year-on-year comparable
     * quarters.
     *
     * For example:
     * June 2024 versus June 2023.
     *
     * Sequential quarters are never
     * compared because that would
     * misrepresent annual growth.
     */
    for (
      let latestIndex =
        bankingQuarterlyPeriods.length -
        1;

      latestIndex >= 0;
      latestIndex -= 1
    ) {
      const candidateLatest =
        bankingQuarterlyPeriods[
          latestIndex
        ];

      const latestDateValue =
        candidateLatest.endDate ??
        candidateLatest.period;

      const latestMatch =
        latestDateValue.match(
          /^(\d{4})-(\d{2})-(\d{2})$/
        );

      if (!latestMatch) {
        continue;
      }

      const latestYear =
        Number(latestMatch[1]);

      const latestMonthDay =
        `${latestMatch[2]}-${latestMatch[3]}`;

      const matchingPrevious =
        bankingQuarterlyPeriods.find(
          (candidatePrevious) => {
            const previousDateValue =
              candidatePrevious.endDate ??
              candidatePrevious.period;

            const previousMatch =
              previousDateValue.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
              );

            if (!previousMatch) {
              return false;
            }

            const previousYear =
              Number(
                previousMatch[1]
              );

            const previousMonthDay =
              `${previousMatch[2]}-${previousMatch[3]}`;

            return (
              previousYear ===
                latestYear - 1 &&
              previousMonthDay ===
                latestMonthDay
            );
          }
        ) ?? null;

      if (matchingPrevious) {
        growthLatest =
          candidateLatest;

        growthPrevious =
          matchingPrevious;

        break;
      }
    }
  }
const hasPlaceholderBankRatios =
  latest.grossNpaPercent === 0 &&
  latest.netNpaPercent === 0 &&
  latest.returnOnAssetsPercent === 0;

  return {
    netInterestMargin: null,

    grossNpa:
  hasPlaceholderBankRatios
    ? null
    : latest.grossNpaPercent,

netNpa:
  hasPlaceholderBankRatios
    ? null
    : latest.netNpaPercent,

returnOnAssets:
  hasPlaceholderBankRatios
    ? null
    : latest.returnOnAssetsPercent,

    provisionCoverageRatio:
      null,

    capitalAdequacyRatio:
      null,

    casaRatio:
      null,

    creditGrowth:
      calculateBankingGrowth(
        growthLatest?.advances ??
          null,

        growthPrevious?.advances ??
          null
      ),

    depositGrowth:
      calculateBankingGrowth(
        growthLatest?.deposits ??
          null,

        growthPrevious?.deposits ??
          null
      ),

    costToIncomeRatio: null,

    creditCost: null,
  };
}

export function calculateFundamentalMetrics(
  financialPeriods:
    FinancialStatementPeriod[],

  market:
    MarketSnapshot | null,

  quarterlyPeriods:
    FinancialStatementPeriod[] = []
): FundamentalMetrics | null {
  const annualPeriods =
    sortAnnualPeriods(
      financialPeriods
    );

  if (
    annualPeriods.length === 0
  ) {
    return null;
  }

  return {
    growth:
      calculateGrowthMetrics(
        annualPeriods
      ),

    profitability:
      calculateProfitabilityMetrics(
        annualPeriods
      ),

    balanceSheet:
      calculateBalanceSheetMetrics(
        annualPeriods
      ),

    cashFlow:
      calculateCashFlowMetrics(
        annualPeriods
      ),

    valuation:
      calculateMarketValuation(
        annualPeriods,
        market
      ),

    industrySpecific: {
      bank:
        calculateBankSpecificMetrics(
          annualPeriods,
          quarterlyPeriods
        ),

      additionalMetrics: {},
    },
  };
}