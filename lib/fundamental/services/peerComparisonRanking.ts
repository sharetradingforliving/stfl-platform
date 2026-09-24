import "server-only";

import type {
  NullableNumber,
  PeerCompany,
} from "../types";

export type PeerRankingDirection =
  | "HIGHER_IS_BETTER"
  | "LOWER_IS_BETTER"
  | "COMPARISON_ONLY";

export type PeerMedianPosition =
  | "ABOVE"
  | "NEAR"
  | "BELOW"
  | "INSUFFICIENT_DATA";

export type PeerMetricKey =
  | "REVENUE_GROWTH"
  | "PAT_GROWTH"
  | "DEPOSIT_GROWTH"
  | "CREDIT_GROWTH"
  | "RETURN_ON_ASSETS"
  | "EBITDA_MARGIN"
  | "RETURN_ON_EQUITY"
  | "RETURN_ON_CAPITAL_EMPLOYED"
  | "DEBT_TO_EQUITY"
  | "PRICE_TO_EARNINGS"
  | "PRICE_TO_BOOK"
  | "ENTERPRISE_VALUE_TO_EBITDA";

export type PeerMetricRanking = {
  key: PeerMetricKey;
  label: string;

  direction:
    PeerRankingDirection;

  selectedValue:
    NullableNumber;

  rank: number | null;

  totalCompanies:
    number;

  peerMedian:
    NullableNumber;

  differenceFromPeerMedianPercent:
    NullableNumber;

  medianPosition:
    PeerMedianPosition;

  validPeerObservations:
    number;
};

export type PeerComparisonRankingResult = {
  available: boolean;

  suitabilityReason: string;

  selectedCompany: PeerCompany;

  peers: PeerCompany[];

  qualityRankings:
    PeerMetricRanking[];

  valuationComparisons:
    PeerMetricRanking[];

  summary: string[];

  warnings: string[];
};

type MetricDefinition = {
  key: PeerMetricKey;
  label: string;

  direction:
    PeerRankingDirection;

  getValue: (
    company: PeerCompany
  ) => NullableNumber;

  requiresPositiveValue:
    boolean;
};

const NEAR_MEDIAN_THRESHOLD_PERCENT =
  10;

const NON_BANK_QUALITY_METRICS:
  MetricDefinition[] = [
    {
      key: "REVENUE_GROWTH",

      label: "Revenue CAGR (3Y)",

      direction:
        "HIGHER_IS_BETTER",

      getValue: (company) =>
        company.revenueGrowth,

      requiresPositiveValue:
        false,
    },

    {
      key: "PAT_GROWTH",

      label: "PAT CAGR (3Y)",

      direction:
        "HIGHER_IS_BETTER",

      getValue: (company) =>
        company.patGrowth,

      requiresPositiveValue:
        false,
    },

    {
      key: "EBITDA_MARGIN",

      label: "EBITDA Margin",

      direction:
        "HIGHER_IS_BETTER",

      getValue: (company) =>
        company.ebitdaMargin,

      requiresPositiveValue:
        false,
    },

    {
      key: "RETURN_ON_EQUITY",

      label: "Return on Equity",

      direction:
        "HIGHER_IS_BETTER",

      getValue: (company) =>
        company.returnOnEquity,

      requiresPositiveValue:
        false,
    },

    {
      key:
        "RETURN_ON_CAPITAL_EMPLOYED",

      label:
        "Return on Capital Employed",

      direction:
        "HIGHER_IS_BETTER",

      getValue: (company) =>
        company
          .returnOnCapitalEmployed,

      requiresPositiveValue:
        false,
    },

    {
      key: "DEBT_TO_EQUITY",

      label: "Debt to Equity",

      direction:
        "LOWER_IS_BETTER",

      getValue: (company) =>
        company.debtToEquity,

      requiresPositiveValue:
        false,
    },
  ];

const BANK_QUALITY_METRICS:
  MetricDefinition[] = [
    {
      key: "REVENUE_GROWTH",
      label:
        "Total Income Growth (YoY)",
      direction:
        "HIGHER_IS_BETTER",
      getValue: (company) =>
        company.revenueGrowth,
      requiresPositiveValue: false,
    },
    {
      key: "PAT_GROWTH",
      label: "PAT Growth (YoY)",
      direction:
        "HIGHER_IS_BETTER",
      getValue: (company) =>
        company.patGrowth,
      requiresPositiveValue: false,
    },
    {
      key: "DEPOSIT_GROWTH",
      label:
        "Deposit Growth (YoY)",
      direction:
        "HIGHER_IS_BETTER",
      getValue: (company) =>
        company.depositGrowth,
      requiresPositiveValue: false,
    },
    {
      key: "CREDIT_GROWTH",
      label:
        "Credit Growth (YoY)",
      direction:
        "HIGHER_IS_BETTER",
      getValue: (company) =>
        company.creditGrowth,
      requiresPositiveValue: false,
    },
    {
      key: "RETURN_ON_ASSETS",
      label: "Return on Assets",
      direction:
        "HIGHER_IS_BETTER",
      getValue: (company) =>
        company.returnOnAssets,
      requiresPositiveValue: false,
    },
    {
      key: "RETURN_ON_EQUITY",
      label: "Return on Equity",
      direction:
        "HIGHER_IS_BETTER",
      getValue: (company) =>
        company.returnOnEquity,
      requiresPositiveValue: false,
    },
  ];

const NON_BANK_VALUATION_METRICS:
  MetricDefinition[] = [
    {
      key: "PRICE_TO_EARNINGS",

      label: "P/E",

      direction:
        "COMPARISON_ONLY",

      getValue: (company) =>
        company.priceToEarnings,

      requiresPositiveValue:
        true,
    },

    {
      key: "PRICE_TO_BOOK",

      label: "P/B",

      direction:
        "COMPARISON_ONLY",

      getValue: (company) =>
        company.priceToBook,

      requiresPositiveValue:
        true,
    },

    {
      key:
        "ENTERPRISE_VALUE_TO_EBITDA",

      label: "EV/EBITDA",

      direction:
        "COMPARISON_ONLY",

      getValue: (company) =>
        company
          .enterpriseValueToEbitda,

      requiresPositiveValue:
        true,
    },
  ];

const BANK_VALUATION_METRICS:
  MetricDefinition[] =
    NON_BANK_VALUATION_METRICS.filter(
      (definition) =>
        definition.key !==
        "ENTERPRISE_VALUE_TO_EBITDA"
    );

function isFiniteNumber(
  value: NullableNumber
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isValidMetricValue(
  value: NullableNumber,
  requiresPositiveValue: boolean
): value is number {
  if (!isFiniteNumber(value)) {
    return false;
  }

  if (
    requiresPositiveValue &&
    value <= 0
  ) {
    return false;
  }

  return true;
}

function calculateMedian(
  values: number[]
): NullableNumber {
  if (values.length === 0) {
    return null;
  }

  const sortedValues =
    values
      .slice()
      .sort(
        (first, second) =>
          first - second
      );

  const middleIndex =
    Math.floor(
      sortedValues.length / 2
    );

  if (
    sortedValues.length % 2 === 1
  ) {
    return (
      sortedValues[
        middleIndex
      ]
    );
  }

  return (
    (
      sortedValues[
        middleIndex - 1
      ] +
      sortedValues[
        middleIndex
      ]
    ) /
    2
  );
}

function calculateDifferencePercent(
  selectedValue: NullableNumber,
  peerMedian: NullableNumber
): NullableNumber {
  if (
    !isFiniteNumber(
      selectedValue
    ) ||
    !isFiniteNumber(peerMedian) ||
    peerMedian === 0
  ) {
    return null;
  }

  return (
    (selectedValue / peerMedian - 1) *
    100
  );
}

function classifyMedianPosition(
  differencePercent:
    NullableNumber
): PeerMedianPosition {
  if (
    !isFiniteNumber(
      differencePercent
    )
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (
    differencePercent >
    NEAR_MEDIAN_THRESHOLD_PERCENT
  ) {
    return "ABOVE";
  }

  if (
    differencePercent <
    -NEAR_MEDIAN_THRESHOLD_PERCENT
  ) {
    return "BELOW";
  }

  return "NEAR";
}

function calculateRank(
  selectedCompany:
    PeerCompany,

  peers:
    PeerCompany[],

  definition:
    MetricDefinition
): {
  rank: number | null;
  totalCompanies: number;
} {
  const selectedValue =
    definition.getValue(
      selectedCompany
    );

  if (
    !isValidMetricValue(
      selectedValue,
      definition
        .requiresPositiveValue
    )
  ) {
    return {
      rank: null,
      totalCompanies: 0,
    };
  }

  const validCompanies = [
    selectedCompany,
    ...peers,
  ].filter((company) =>
    isValidMetricValue(
      definition.getValue(
        company
      ),
      definition
        .requiresPositiveValue
    )
  );

  const sortedCompanies =
    validCompanies
      .slice()
      .sort(
        (first, second) => {
          const firstValue =
            definition.getValue(
              first
            ) as number;

          const secondValue =
            definition.getValue(
              second
            ) as number;

          if (
            definition.direction ===
            "HIGHER_IS_BETTER"
          ) {
            return (
              secondValue -
              firstValue
            );
          }

          /*
           * Lower is better for leverage.
           * Valuation multiples are also
           * ordered from lower to higher,
           * but the rank is descriptive,
           * not a quality judgement.
           */
          return (
            firstValue -
            secondValue
          );
        }
      );

  const selectedIndex =
    sortedCompanies.findIndex(
      (company) =>
        company.symbol
          .trim()
          .toUpperCase() ===
        selectedCompany.symbol
          .trim()
          .toUpperCase()
    );

  return {
    rank:
      selectedIndex >= 0
        ? selectedIndex + 1
        : null,

    totalCompanies:
      sortedCompanies.length,
  };
}

function prepareMetricRanking(
  selectedCompany:
    PeerCompany,

  peers:
    PeerCompany[],

  definition:
    MetricDefinition
): PeerMetricRanking {
  const selectedValue =
    definition.getValue(
      selectedCompany
    );

  const validPeerValues =
    peers
      .map((peer) =>
        definition.getValue(peer)
      )
      .filter(
        (
          value
        ): value is number =>
          isValidMetricValue(
            value,
            definition
              .requiresPositiveValue
          )
      );

  const peerMedian =
    calculateMedian(
      validPeerValues
    );

  const differenceFromPeerMedianPercent =
    calculateDifferencePercent(
      selectedValue,
      peerMedian
    );

  const ranking =
    calculateRank(
      selectedCompany,
      peers,
      definition
    );

  return {
    key:
      definition.key,

    label:
      definition.label,

    direction:
      definition.direction,

    selectedValue:
      isValidMetricValue(
        selectedValue,
        definition
          .requiresPositiveValue
      )
        ? selectedValue
        : null,

    rank:
      ranking.rank,

    totalCompanies:
      ranking.totalCompanies,

    peerMedian,

    differenceFromPeerMedianPercent,

    medianPosition:
      classifyMedianPosition(
        differenceFromPeerMedianPercent
      ),

    validPeerObservations:
      validPeerValues.length,
  };
}

function removeDuplicatePeers(
  selectedCompany:
    PeerCompany,

  peers:
    PeerCompany[]
): PeerCompany[] {
  const selectedSymbol =
    selectedCompany.symbol
      .trim()
      .toUpperCase();

  const seenSymbols =
    new Set<string>();

  return peers.filter((peer) => {
    const peerSymbol =
      peer.symbol
        .trim()
        .toUpperCase();

    if (
      !peerSymbol ||
      peerSymbol ===
        selectedSymbol ||
      seenSymbols.has(
        peerSymbol
      )
    ) {
      return false;
    }

    seenSymbols.add(peerSymbol);

    return true;
  });
}

function ordinal(
  value: number
): string {
  const remainder100 =
    value % 100;

  if (
    remainder100 >= 11 &&
    remainder100 <= 13
  ) {
    return `${value}th`;
  }

  const remainder10 =
    value % 10;

  if (remainder10 === 1) {
    return `${value}st`;
  }

  if (remainder10 === 2) {
    return `${value}nd`;
  }

  if (remainder10 === 3) {
    return `${value}rd`;
  }

  return `${value}th`;
}

function formatDifference(
  value: number
): string {
  return Math.abs(value).toFixed(2);
}

function buildSummary(
  selectedCompany:
    PeerCompany,

  qualityRankings:
    PeerMetricRanking[],

  valuationComparisons:
    PeerMetricRanking[]
): string[] {
  const summary: string[] = [];

  const availableQualityRankings =
    qualityRankings.filter(
      (metric) =>
        metric.rank !== null &&
        metric.totalCompanies > 1
    );

  const strongestMetric =
    availableQualityRankings
      .slice()
      .sort(
        (first, second) =>
          (
            first.rank ??
            Number.MAX_SAFE_INTEGER
          ) -
          (
            second.rank ??
            Number.MAX_SAFE_INTEGER
          )
      )[0];

  if (
    strongestMetric?.rank !== null &&
    strongestMetric?.rank !==
      undefined
  ) {
    summary.push(
      `${selectedCompany.companyName} ranks ${ordinal(
        strongestMetric.rank
      )} out of ${
        strongestMetric.totalCompanies
      } companies for ${
        strongestMetric.label
      }.`
    );
  }

  const valuationStatements =
    valuationComparisons
      .filter(
        (metric) =>
          metric.medianPosition !==
            "INSUFFICIENT_DATA" &&
          isFiniteNumber(
            metric
              .differenceFromPeerMedianPercent
          )
      )
      .map((metric) => {
        const difference =
          metric
            .differenceFromPeerMedianPercent as number;

        if (
          metric.medianPosition ===
          "NEAR"
        ) {
          return `${metric.label} is near the selected-peer median.`;
        }

        const position =
          metric.medianPosition ===
          "ABOVE"
            ? "above"
            : "below";

        return `${metric.label} is ${formatDifference(
          difference
        )}% ${position} the selected-peer median.`;
      });

  summary.push(
    ...valuationStatements
  );

  if (summary.length === 0) {
    summary.push(
      "Insufficient comparable financial information is available to prepare a ranking summary."
    );
  }

  return summary;
}

export function calculatePeerComparisonRanking(
  selectedCompany:
    PeerCompany,

  inputPeers:
    PeerCompany[]
): PeerComparisonRankingResult {
  const peers =
    removeDuplicatePeers(
      selectedCompany,
      inputPeers
    );

  if (peers.length === 0) {
    return {
      available: false,

      suitabilityReason:
        "At least one comparable company is required for peer ranking.",

      selectedCompany,

      peers,

      qualityRankings: [],

      valuationComparisons: [],

      summary: [],

      warnings: [
        "No valid comparable companies were available.",
      ],
    };
  }

  const isBankingComparison =
    selectedCompany.isBanking ===
    true;

  const qualityDefinitions =
    isBankingComparison
      ? BANK_QUALITY_METRICS
      : NON_BANK_QUALITY_METRICS;

  const valuationDefinitions =
    isBankingComparison
      ? BANK_VALUATION_METRICS
      : NON_BANK_VALUATION_METRICS;

  const qualityRankings =
    qualityDefinitions.map(
      (definition) =>
        prepareMetricRanking(
          selectedCompany,
          peers,
          definition
        )
    );

  const valuationComparisons =
    valuationDefinitions.map(
      (definition) =>
        prepareMetricRanking(
          selectedCompany,
          peers,
          definition
        )
    );

  const warnings:
    string[] = [];

  const missingQualityMetrics =
    qualityRankings.filter(
      (metric) =>
        metric.selectedValue ===
          null ||
        metric.validPeerObservations ===
          0
    );

  if (
    missingQualityMetrics.length > 0
  ) {
    warnings.push(
      `Comparison coverage is unavailable for: ${missingQualityMetrics
        .map(
          (metric) =>
            metric.label
        )
        .join(", ")}.`
    );
  }

  const missingValuationMetrics =
    valuationComparisons.filter(
      (metric) =>
        metric.selectedValue ===
          null ||
        metric.validPeerObservations ===
          0
    );

  if (
    missingValuationMetrics.length > 0
  ) {
    warnings.push(
      `Valuation-multiple comparison is unavailable for: ${missingValuationMetrics
        .map(
          (metric) =>
            metric.label
        )
        .join(", ")}.`
    );
  }

  return {
    available: true,

    suitabilityReason:
      isBankingComparison
        ? "The selected bank was compared with user-selected banks from the same published industry. Growth metrics use latest annual year-on-year changes; P/E and P/B describe relative market positioning and do not independently establish fair value."
        : "The selected company was compared with user-selected Nifty 500 companies from the same published industry. Revenue and PAT growth use verified three-year CAGR; valuation multiples describe relative market positioning and do not independently establish fair value.",

    selectedCompany,

    peers,

    qualityRankings,

    valuationComparisons,

    summary:
      buildSummary(
        selectedCompany,
        qualityRankings,
        valuationComparisons
      ),

    warnings,
  };
}
