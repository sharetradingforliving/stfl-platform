import "server-only";

import type {
  CompositeMethodWeight,
  CompositeValuationResult,
  DcfValuationResult,
  EvidenceStrength,
  GrahamValuationResult,
  NullableNumber,
  PeerValuationResult,
  RelativeValuationResult,
  ValuationLabel,
  ValuationMethod,
} from "../types";

type CompositeMethod =
  Exclude<
    ValuationMethod,
    "COMPOSITE"
  >;

export type CompositeValuationWeights = {
  dcf: number;
  relative: number;
  peer: number;
  graham: number;
};

export type CompositeValuationInputs = {
  currentPrice: NullableNumber;

  dcf:
    DcfValuationResult | null;

  relative:
    RelativeValuationResult | null;

  peer:
    PeerValuationResult | null;

  graham:
    GrahamValuationResult | null;

  weights?:
    Partial<
      CompositeValuationWeights
    >;
};

const DEFAULT_WEIGHTS:
  CompositeValuationWeights = {
    dcf: 40,
    relative: 30,
    peer: 20,
    graham: 10,
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

function normalizeInputWeight(
  value: number | undefined,
  fallback: number
): number {
  if (
    value === undefined
  ) {
    return fallback;
  }

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function getConfiguredWeights(
  weights:
    Partial<
      CompositeValuationWeights
    > | undefined
): CompositeValuationWeights {
  return {
    dcf:
      normalizeInputWeight(
        weights?.dcf,
        DEFAULT_WEIGHTS.dcf
      ),

    relative:
      normalizeInputWeight(
        weights?.relative,
        DEFAULT_WEIGHTS.relative
      ),

    peer:
      normalizeInputWeight(
        weights?.peer,
        DEFAULT_WEIGHTS.peer
      ),

    graham:
      normalizeInputWeight(
        weights?.graham,
        DEFAULT_WEIGHTS.graham
      ),
  };
}

function getDcfScenarioValue(
  dcf:
    DcfValuationResult | null,

  scenarioName:
    "BEAR" | "BASE" | "BULL"
): NullableNumber {
  if (!dcf) {
    return null;
  }

  return (
    dcf.scenarios.find(
      (scenario) =>
        scenario.name ===
        scenarioName
    )?.fairValuePerShare ??
    null
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
  upsideDownside:
    NullableNumber
): ValuationLabel {
  if (
    !isFiniteNumber(
      upsideDownside
    )
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (
    upsideDownside >= 25
  ) {
    return (
      "SIGNIFICANTLY_UNDERVALUED"
    );
  }

  if (
    upsideDownside >= 10
  ) {
    return "UNDERVALUED";
  }

  if (
    upsideDownside > -10
  ) {
    return "FAIRLY_VALUED";
  }

  if (
    upsideDownside > -25
  ) {
    return "OVERVALUED";
  }

  return (
    "SIGNIFICANTLY_OVERVALUED"
  );
}

function buildMethod(
  method: CompositeMethod,
  configuredWeight: number,
  applicable: boolean,
  fairValue: NullableNumber,
  reason: string
): CompositeMethodWeight {
  const methodIsUsable =
    applicable &&
    isPositiveNumber(
      fairValue
    ) &&
    configuredWeight > 0;

  return {
    method,

    applicable:
      methodIsUsable,

    weight:
      methodIsUsable
        ? configuredWeight
        : 0,

    fairValue:
      methodIsUsable
        ? fairValue
        : null,

    reason,
  };
}

function normalizeMethodWeights(
  methods:
    CompositeMethodWeight[]
): CompositeMethodWeight[] {
  const totalWeight =
    methods.reduce(
      (total, method) =>
        total +
        (
          method.applicable
            ? method.weight
            : 0
        ),
      0
    );

  if (
    totalWeight <= 0
  ) {
    return methods.map(
      (method) => ({
        ...method,
        weight: 0,
      })
    );
  }

  return methods.map(
    (method) => ({
      ...method,

      weight:
        method.applicable
          ? (
              method.weight /
              totalWeight
            ) * 100
          : 0,
    })
  );
}

function calculateWeightedValue(
  methods:
    CompositeMethodWeight[],

  methodValueOverrides?:
    Partial<
      Record<
        CompositeMethod,
        NullableNumber
      >
    >
): NullableNumber {
  const applicableValues =
    methods
      .map((method) => {
        if (
          !method.applicable ||
          method.weight <= 0
        ) {
          return null;
        }

        const overrideValue =
          methodValueOverrides?.[
            method.method
          ];

        const normalizedOverrideValue:
  NullableNumber =
    overrideValue ?? null;

const selectedValue:
  NullableNumber =
    isPositiveNumber(
      normalizedOverrideValue
    )
      ? normalizedOverrideValue
      : method.fairValue;

        if (
          !isPositiveNumber(
            selectedValue
          )
        ) {
          return null;
        }

        return {
          value:
            selectedValue,

          weight:
            method.weight,
        };
      })
      .filter(
        (
          item
        ): item is {
          value: number;
          weight: number;
        } =>
          item !== null
      );

  if (
    applicableValues.length === 0
  ) {
    return null;
  }

  const totalWeight =
    applicableValues.reduce(
      (total, item) =>
        total + item.weight,
      0
    );

  if (
    totalWeight <= 0
  ) {
    return null;
  }

  return (
    applicableValues.reduce(
      (total, item) =>
        total +
        item.value *
        item.weight,
      0
    ) /
    totalWeight
  );
}

function calculateConfidence(
  methods:
    CompositeMethodWeight[]
): EvidenceStrength {
  const applicableMethods =
    methods.filter(
      (method) =>
        method.applicable &&
        isPositiveNumber(
          method.fairValue
        )
    );

  if (
    applicableMethods.length === 0
  ) {
    return "INSUFFICIENT";
  }

  const hasDcf =
    applicableMethods.some(
      (method) =>
        method.method === "DCF"
    );

  const hasRelative =
    applicableMethods.some(
      (method) =>
        method.method ===
        "RELATIVE"
    );

  if (
    applicableMethods.length >= 3 &&
    hasDcf &&
    hasRelative
  ) {
    return "HIGH";
  }

  if (
    applicableMethods.length >= 2
  ) {
    return "MODERATE";
  }

  return "LOW";
}

export function calculateCompositeValuation(
  inputs:
    CompositeValuationInputs
): CompositeValuationResult {
  const configuredWeights =
    getConfiguredWeights(
      inputs.weights
    );

  const rawMethods:
    CompositeMethodWeight[] = [
      buildMethod(
        "DCF",

        configuredWeights.dcf,

        inputs.dcf?.applicable ===
          true,

        inputs.dcf
          ?.selectedFairValue ??
          null,

        inputs.dcf
          ?.suitabilityReason ??
          "DCF valuation was unavailable."
      ),

      buildMethod(
        "RELATIVE",

        configuredWeights.relative,

        inputs.relative
          ?.applicable === true,

        inputs.relative
          ?.weightedFairValue ??
          null,

        inputs.relative
          ?.suitabilityReason ??
          "Relative valuation was unavailable."
      ),

      buildMethod(
        "PEER",

        configuredWeights.peer,

        inputs.peer?.applicable ===
          true,

        inputs.peer
          ?.impliedFairValue ??
          null,

        inputs.peer
          ?.suitabilityReason ??
          "Peer valuation was unavailable."
      ),

      buildMethod(
        "GRAHAM",

        configuredWeights.graham,

        inputs.graham
          ?.applicable === true,

        inputs.graham
          ?.fairValuePerShare ??
          null,

        inputs.graham
          ?.suitabilityReason ??
          "Graham valuation was unavailable."
      ),
    ];

  const methods =
    normalizeMethodWeights(
      rawMethods
    );

  const compositeFairValue =
    calculateWeightedValue(
      methods
    );

  /*
   * Bear and bull cases use the verified
   * DCF bear and bull scenarios.
   *
   * Other valuation methods retain their
   * calculated values. No arbitrary
   * percentage haircut or premium is
   * introduced.
   */
  const bearValue =
    calculateWeightedValue(
      methods,
      {
        DCF:
          getDcfScenarioValue(
            inputs.dcf,
            "BEAR"
          ),
      }
    );

  const baseValue =
    calculateWeightedValue(
      methods,
      {
        DCF:
          getDcfScenarioValue(
            inputs.dcf,
            "BASE"
          ),
      }
    );

  const bullValue =
    calculateWeightedValue(
      methods,
      {
        DCF:
          getDcfScenarioValue(
            inputs.dcf,
            "BULL"
          ),
      }
    );

  const upsideDownsidePercent =
    calculateUpsideDownside(
      compositeFairValue,
      inputs.currentPrice
    );

  return {
    methods,

    bearValue,

    baseValue,

    bullValue,

    compositeFairValue,

    upsideDownsidePercent,

    valuationLabel:
      classifyValuation(
        upsideDownsidePercent
      ),

    confidence:
      calculateConfidence(
        methods
      ),
  };
}