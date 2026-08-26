import "server-only";

import type {
  FinancialStatementPeriod,
  FundamentalMetrics,
  MarketSnapshot,
  NullableNumber,
  RelativeValuationMultiple,
  RelativeValuationResult,
} from "../types";

export type RelativeBenchmark = {
  historicalMedian:
    NullableNumber;

  industryMedian:
    NullableNumber;

  weight: number;
};

export type RelativeValuationBenchmarks = {
  priceToEarnings:
    RelativeBenchmark;

  priceToBook:
    RelativeBenchmark;

  enterpriseValueToEbitda:
    RelativeBenchmark;

  enterpriseValueToSales:
    RelativeBenchmark;
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
): RelativeValuationResult[
  "valuationLabel"
] {
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
    return "SIGNIFICANTLY_UNDERVALUED";
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

  return "SIGNIFICANTLY_OVERVALUED";
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

function selectedBenchmark(
  historicalMedian:
    NullableNumber,

  industryMedian:
    NullableNumber
): NullableNumber {
  const validBenchmarks = [
    historicalMedian,
    industryMedian,
  ].filter(
    isPositiveNumber
  );

  if (
    validBenchmarks.length === 0
  ) {
    return null;
  }

  /*
   * When both historical and industry
   * medians are available, use their
   * simple average as a balanced
   * benchmark.
   */
  return (
    validBenchmarks.reduce(
      (total, value) =>
        total + value,
      0
    ) /
    validBenchmarks.length
  );
}

function fairValueFromEquityMultiple(
  perShareValue:
    NullableNumber,

  benchmark:
    NullableNumber
): NullableNumber {
  if (
    !isPositiveNumber(
      perShareValue
    ) ||
    !isPositiveNumber(
      benchmark
    )
  ) {
    return null;
  }

  return (
    perShareValue *
    benchmark
  );
}

function fairValueFromEnterpriseMultiple(
  financialValue:
    NullableNumber,

  benchmark:
    NullableNumber,

  netDebt:
    NullableNumber,

  sharesOutstanding:
    NullableNumber
): NullableNumber {
  if (
    !isPositiveNumber(
      financialValue
    ) ||
    !isPositiveNumber(
      benchmark
    ) ||
    !isFiniteNumber(netDebt) ||
    !isPositiveNumber(
      sharesOutstanding
    )
  ) {
    return null;
  }

  /*
   * EBITDA/revenue and net debt use
   * ₹ crore. Convert equity value back
   * to rupees before dividing by the
   * actual number of shares.
   */
  const impliedEnterpriseValue =
    financialValue *
    benchmark;

  const impliedEquityValue =
    impliedEnterpriseValue -
    netDebt;

  if (
    impliedEquityValue <= 0
  ) {
    return null;
  }

  return (
    impliedEquityValue *
    RUPEES_PER_CRORE /
    sharesOutstanding
  );
}

function normalizeWeight(
  weight: number
): number {
  if (
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return 0;
  }

  return weight;
}

function buildMultiple(
  name:
    RelativeValuationMultiple[
      "name"
    ],

  companyMultiple:
    NullableNumber,

  benchmark:
    RelativeBenchmark,

  impliedFairValue:
    NullableNumber
): RelativeValuationMultiple {
  return {
    name,

    companyMultiple,

    historicalMedian:
      benchmark
        .historicalMedian,

    industryMedian:
      benchmark
        .industryMedian,

    impliedFairValue,

    weight:
      impliedFairValue !== null
        ? normalizeWeight(
            benchmark.weight
          )
        : 0,
  };
}

export function calculateRelativeValuation(
  annualPeriods:
    FinancialStatementPeriod[],

  metrics:
    FundamentalMetrics | null,

  market:
    MarketSnapshot | null,

  benchmarks:
    RelativeValuationBenchmarks
): RelativeValuationResult {
  const latestAnnual =
    getLatestAnnualPeriod(
      annualPeriods
    );

  if (
    !latestAnnual ||
    !metrics
  ) {
    return {
      applicable: false,

      suitabilityReason:
        "Relative valuation requires verified annual financial metrics.",

      multiples: [],

      weightedFairValue: null,

      upsideDownsidePercent:
        null,
        valuationLabel:
  "INSUFFICIENT_DATA",

    };
  }

  const netDebt =
    isFiniteNumber(
      latestAnnual.totalDebt
    ) &&
    isFiniteNumber(
      latestAnnual
        .cashAndEquivalents
    )
      ? latestAnnual.totalDebt -
        latestAnnual
          .cashAndEquivalents
      : null;

  const sharesOutstanding =
    latestAnnual
      .sharesOutstanding ??
    market
      ?.sharesOutstanding ??
    null;

  const peBenchmark =
    selectedBenchmark(
      benchmarks
        .priceToEarnings
        .historicalMedian,

      benchmarks
        .priceToEarnings
        .industryMedian
    );

  const pbBenchmark =
    selectedBenchmark(
      benchmarks
        .priceToBook
        .historicalMedian,

      benchmarks
        .priceToBook
        .industryMedian
    );

  const evEbitdaBenchmark =
    selectedBenchmark(
      benchmarks
        .enterpriseValueToEbitda
        .historicalMedian,

      benchmarks
        .enterpriseValueToEbitda
        .industryMedian
    );

  const evSalesBenchmark =
    selectedBenchmark(
      benchmarks
        .enterpriseValueToSales
        .historicalMedian,

      benchmarks
        .enterpriseValueToSales
        .industryMedian
    );

  const multiples:
    RelativeValuationMultiple[] = [
      buildMultiple(
        "P/E",

        metrics.valuation
          .priceToEarnings,

        benchmarks
          .priceToEarnings,

        fairValueFromEquityMultiple(
          metrics.valuation
            .earningsPerShare,
          peBenchmark
        )
      ),

      buildMultiple(
        "P/B",

        metrics.valuation
          .priceToBook,

        benchmarks
          .priceToBook,

        fairValueFromEquityMultiple(
          metrics.valuation
            .bookValuePerShare,
          pbBenchmark
        )
      ),

      buildMultiple(
        "EV/EBITDA",

        metrics.valuation
          .enterpriseValueToEbitda,

        benchmarks
          .enterpriseValueToEbitda,

        fairValueFromEnterpriseMultiple(
          latestAnnual.ebitda,
          evEbitdaBenchmark,
          netDebt,
          sharesOutstanding
        )
      ),

      buildMultiple(
        "EV/SALES",

        metrics.valuation
          .enterpriseValueToSales,

        benchmarks
          .enterpriseValueToSales,

        fairValueFromEnterpriseMultiple(
          latestAnnual.revenue,
          evSalesBenchmark,
          netDebt,
          sharesOutstanding
        )
      ),
    ];

  const applicableMultiples =
    multiples.filter(
      (multiple) =>
        isPositiveNumber(
          multiple.impliedFairValue
        ) &&
        multiple.weight > 0
    );

  const totalWeight =
    applicableMultiples.reduce(
      (total, multiple) =>
        total +
        multiple.weight,
      0
    );

  const weightedFairValue =
    totalWeight > 0
      ? applicableMultiples.reduce(
          (total, multiple) =>
            total +
            (
              multiple
                .impliedFairValue ??
              0
            ) *
            multiple.weight,
          0
        ) /
        totalWeight
      : null;

      const upsideDownsidePercent =
  calculateUpsideDownside(
    weightedFairValue,
    market?.currentPrice ??
      null
  );
  
  return {
  applicable:
    weightedFairValue !== null,

  suitabilityReason:
    weightedFairValue !== null
      ? "Relative fair value was calculated from applicable weighted market multiples. When both historical and industry medians were supplied, their average was used."
      : "Relative valuation requires at least one valid historical or industry benchmark with a positive weight.",

  multiples,

  weightedFairValue,

  upsideDownsidePercent,

  valuationLabel:
    classifyValuation(
      upsideDownsidePercent
    ),
};
}