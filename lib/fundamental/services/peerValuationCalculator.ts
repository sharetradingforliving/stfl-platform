import "server-only";

import type {
  EvidenceStrength,
  FinancialStatementPeriod,
  FundamentalMetrics,
  MarketSnapshot,
  NullableNumber,
  PeerCompany,
  PeerValuationResult,
  ValuationLabel,
} from "../types";

const RUPEES_PER_CRORE =
  10_000_000;

const MINIMUM_PEERS = 3;

const MINIMUM_VALUES_PER_MULTIPLE =
  3;

const MINIMUM_VALUES_FOR_OUTLIER_CHECK =
  5;

type PreparedMultiple = {
  median: NullableNumber;
  coverage: number;
  excludedCount: number;
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

function calculateMedianFromNumbers(
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

function calculateQuartiles(
  values: number[]
): {
  firstQuartile: number;
  thirdQuartile: number;
} | null {
  if (
    values.length <
    MINIMUM_VALUES_FOR_OUTLIER_CHECK
  ) {
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

  const lowerHalf =
    sortedValues.slice(
      0,
      middleIndex
    );

  const upperHalf =
    sortedValues.slice(
      sortedValues.length % 2 === 0
        ? middleIndex
        : middleIndex + 1
    );

  const firstQuartile =
    calculateMedianFromNumbers(
      lowerHalf
    );

  const thirdQuartile =
    calculateMedianFromNumbers(
      upperHalf
    );

  if (
    firstQuartile === null ||
    thirdQuartile === null
  ) {
    return null;
  }

  return {
    firstQuartile,
    thirdQuartile,
  };
}

function removeOutliers(
  values: number[]
): {
  values: number[];
  excludedCount: number;
} {
  const quartiles =
    calculateQuartiles(values);

  if (!quartiles) {
    return {
      values,
      excludedCount: 0,
    };
  }

  const interquartileRange =
    quartiles.thirdQuartile -
    quartiles.firstQuartile;

  /*
   * If every value is identical, there
   * is no meaningful outlier range.
   */
  if (
    interquartileRange <= 0
  ) {
    return {
      values,
      excludedCount: 0,
    };
  }

  const lowerLimit =
    quartiles.firstQuartile -
    1.5 * interquartileRange;

  const upperLimit =
    quartiles.thirdQuartile +
    1.5 * interquartileRange;

  const filteredValues =
    values.filter(
      (value) =>
        value >= lowerLimit &&
        value <= upperLimit
    );

  /*
   * Do not allow outlier filtering to
   * reduce a multiple below the minimum
   * evidence requirement.
   */
  if (
    filteredValues.length <
    MINIMUM_VALUES_PER_MULTIPLE
  ) {
    return {
      values,
      excludedCount: 0,
    };
  }

  return {
    values: filteredValues,

    excludedCount:
      values.length -
      filteredValues.length,
  };
}

function prepareMultiple(
  values: NullableNumber[]
): PreparedMultiple {
  const validValues =
    values.filter(
      isPositiveNumber
    );

  if (
    validValues.length <
    MINIMUM_VALUES_PER_MULTIPLE
  ) {
    return {
      median: null,
      coverage:
        validValues.length,
      excludedCount: 0,
    };
  }

  const filtered =
    removeOutliers(
      validValues
    );

  return {
    median:
      calculateMedianFromNumbers(
        filtered.values
      ),

    coverage:
      filtered.values.length,

    excludedCount:
      filtered.excludedCount,
  };
}

function calculateAverage(
  values: NullableNumber[]
): NullableNumber {
  const validValues =
    values.filter(
      isPositiveNumber
    );

  if (
    validValues.length === 0
  ) {
    return null;
  }

  return (
    validValues.reduce(
      (total, value) =>
        total + value,
      0
    ) /
    validValues.length
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

function fairValueFromEquityMultiple(
  perShareValue:
    NullableNumber,

  peerMedian:
    NullableNumber
): NullableNumber {
  if (
    !isPositiveNumber(
      perShareValue
    ) ||
    !isPositiveNumber(
      peerMedian
    )
  ) {
    return null;
  }

  return (
    perShareValue *
    peerMedian
  );
}

function fairValueFromEnterpriseMultiple(
  ebitda:
    NullableNumber,

  peerMedian:
    NullableNumber,

  netDebt:
    NullableNumber,

  sharesOutstanding:
    NullableNumber
): NullableNumber {
  if (
    !isPositiveNumber(ebitda) ||
    !isPositiveNumber(
      peerMedian
    ) ||
    !isFiniteNumber(netDebt) ||
    !isPositiveNumber(
      sharesOutstanding
    )
  ) {
    return null;
  }

  const impliedEnterpriseValue =
    ebitda *
    peerMedian;

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

function calculatePremiumDiscount(
  currentPrice:
    NullableNumber,

  impliedFairValue:
    NullableNumber
): NullableNumber {
  if (
    !isPositiveNumber(
      currentPrice
    ) ||
    !isPositiveNumber(
      impliedFairValue
    )
  ) {
    return null;
  }

  /*
   * Positive:
   * market price is above peer value.
   *
   * Negative:
   * market price is below peer value.
   */
  return (
    (
      currentPrice /
      impliedFairValue
    ) -
    1
  ) *
    100;
}

function classifyPeerValuation(
  premiumDiscount:
    NullableNumber
): ValuationLabel {
  if (
    !isFiniteNumber(
      premiumDiscount
    )
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (
    premiumDiscount >= 25
  ) {
    return (
      "SIGNIFICANTLY_OVERVALUED"
    );
  }

  if (
    premiumDiscount >= 10
  ) {
    return "OVERVALUED";
  }

  if (
    premiumDiscount > -10
  ) {
    return "FAIRLY_VALUED";
  }

  if (
    premiumDiscount > -25
  ) {
    return "UNDERVALUED";
  }

  return (
    "SIGNIFICANTLY_UNDERVALUED"
  );
}

function calculateConfidence(
  peerCount: number,

  coverage: {
    priceToEarnings: number;
    priceToBook: number;
    enterpriseValueToEbitda:
      number;
  },

  impliedFairValue:
    NullableNumber
): EvidenceStrength {
  if (
    !isPositiveNumber(
      impliedFairValue
    )
  ) {
    return "INSUFFICIENT";
  }

  const coverageValues = [
    coverage.priceToEarnings,
    coverage.priceToBook,
    coverage
      .enterpriseValueToEbitda,
  ];

  const applicableMethods =
    coverageValues.filter(
      (count) =>
        count >=
        MINIMUM_VALUES_PER_MULTIPLE
    ).length;

  const strongMethods =
    coverageValues.filter(
      (count) =>
        count >= 5
    ).length;

  if (
    peerCount >= 5 &&
    strongMethods === 3
  ) {
    return "HIGH";
  }

  if (
    peerCount >= 3 &&
    applicableMethods >= 2
  ) {
    return "MODERATE";
  }

  return "LOW";
}

function describePremiumDiscount(
  premiumDiscount:
    NullableNumber
): string {
  if (
    !isFiniteNumber(
      premiumDiscount
    )
  ) {
    return (
      "The premium or discount could not be calculated because a valid current market price was unavailable."
    );
  }

  const absolutePercentage =
    Math.abs(
      premiumDiscount
    ).toFixed(2);

  if (
    premiumDiscount > 0
  ) {
    return (
      `The current market price is ${absolutePercentage}% above the peer-implied fair value.`
    );
  }

  if (
    premiumDiscount < 0
  ) {
    return (
      `The current market price is ${absolutePercentage}% below the peer-implied fair value.`
    );
  }

  return (
    "The current market price is equal to the peer-implied fair value."
  );
}

function createUnavailableResult(
  reason: string,
  peers: PeerCompany[],
  pe:
    PreparedMultiple,
  pb:
    PreparedMultiple,
  evEbitda:
    PreparedMultiple,
  outlierWarnings:
    string[]
): PeerValuationResult {
  return {
    applicable: false,

    suitabilityReason:
      reason,

    peers,

    peerCount:
      peers.length,

    multipleCoverage: {
      priceToEarnings:
        pe.coverage,

      priceToBook:
        pb.coverage,

      enterpriseValueToEbitda:
        evEbitda.coverage,
    },

    peerMedianPe:
      pe.median,

    peerMedianPb:
      pb.median,

    peerMedianEvEbitda:
      evEbitda.median,

    impliedFairValue:
      null,

    premiumDiscountToPeers:
      null,

    valuationLabel:
      "INSUFFICIENT_DATA",

    confidence:
      "INSUFFICIENT",

    outlierWarnings,
  };
}

export function calculatePeerValuation(
  annualPeriods:
    FinancialStatementPeriod[],

  metrics:
    FundamentalMetrics | null,

  market:
    MarketSnapshot | null,

  peers:
    PeerCompany[]
): PeerValuationResult {
  const latestAnnual =
    getLatestAnnualPeriod(
      annualPeriods
    );

  const validPeers =
    peers.filter(
      (peer) =>
        peer.symbol
          .trim()
          .length > 0
    );

  const preparedPe =
    prepareMultiple(
      validPeers.map(
        (peer) =>
          peer.priceToEarnings
      )
    );

  const preparedPb =
    prepareMultiple(
      validPeers.map(
        (peer) =>
          peer.priceToBook
      )
    );

  const preparedEvEbitda =
    prepareMultiple(
      validPeers.map(
        (peer) =>
          peer
            .enterpriseValueToEbitda
      )
    );

  const outlierWarnings:
    string[] = [];

  if (
    preparedPe.excludedCount > 0
  ) {
    outlierWarnings.push(
      `${preparedPe.excludedCount} P/E outlier value(s) were excluded using the interquartile-range method.`
    );
  }

  if (
    preparedPb.excludedCount > 0
  ) {
    outlierWarnings.push(
      `${preparedPb.excludedCount} P/B outlier value(s) were excluded using the interquartile-range method.`
    );
  }

  if (
    preparedEvEbitda
      .excludedCount > 0
  ) {
    outlierWarnings.push(
      `${preparedEvEbitda.excludedCount} EV/EBITDA outlier value(s) were excluded using the interquartile-range method.`
    );
  }

  if (
    !latestAnnual ||
    !metrics
  ) {
    return createUnavailableResult(
      "Peer valuation requires verified annual financial metrics.",
      validPeers,
      preparedPe,
      preparedPb,
      preparedEvEbitda,
      outlierWarnings
    );
  }

  if (
    validPeers.length <
    MINIMUM_PEERS
  ) {
    return createUnavailableResult(
      "Peer valuation requires at least three valid comparable companies.",
      validPeers,
      preparedPe,
      preparedPb,
      preparedEvEbitda,
      outlierWarnings
    );
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

  const peFairValue =
    fairValueFromEquityMultiple(
      metrics.valuation
        .earningsPerShare,

      preparedPe.median
    );

  const pbFairValue =
    fairValueFromEquityMultiple(
      metrics.valuation
        .bookValuePerShare,

      preparedPb.median
    );

  const evEbitdaFairValue =
    fairValueFromEnterpriseMultiple(
      latestAnnual.ebitda,

      preparedEvEbitda.median,

      netDebt,

      sharesOutstanding
    );

  /*
   * Each available valuation method
   * currently receives equal weight.
   */
  const impliedFairValue =
    calculateAverage([
      peFairValue,
      pbFairValue,
      evEbitdaFairValue,
    ]);

  const premiumDiscountToPeers =
    calculatePremiumDiscount(
      market?.currentPrice ??
        null,

      impliedFairValue
    );

  const multipleCoverage = {
    priceToEarnings:
      preparedPe.coverage,

    priceToBook:
      preparedPb.coverage,

    enterpriseValueToEbitda:
      preparedEvEbitda
        .coverage,
  };

  const confidence =
    calculateConfidence(
      validPeers.length,
      multipleCoverage,
      impliedFairValue
    );

  const valuationLabel =
    classifyPeerValuation(
      premiumDiscountToPeers
    );

  const availableMethods = [
    peFairValue,
    pbFairValue,
    evEbitdaFairValue,
  ].filter(
    isPositiveNumber
  ).length;

  return {
    applicable:
      impliedFairValue !== null,

    suitabilityReason:
      impliedFairValue !== null
        ? [
            "Peer fair value was calculated from the median valuation multiples of the selected comparable companies.",
            `${availableMethods} valuation method(s) were applicable and received equal weight.`,
            describePremiumDiscount(
              premiumDiscountToPeers
            ),
            "Industry membership alone does not guarantee full business-model comparability.",
          ].join(" ")
        : "The selected peers did not provide at least three valid observations for any supported valuation multiple.",

    peers:
      validPeers,

    peerCount:
      validPeers.length,

    multipleCoverage,

    peerMedianPe:
      preparedPe.median,

    peerMedianPb:
      preparedPb.median,

    peerMedianEvEbitda:
      preparedEvEbitda
        .median,

    impliedFairValue,

    premiumDiscountToPeers,

    valuationLabel,

    confidence,

    outlierWarnings,
  };
}