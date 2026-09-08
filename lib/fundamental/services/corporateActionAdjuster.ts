import "server-only";

import type {
  FinancialStatementPeriod,
  NullableNumber,
} from "../types";

import type {
  NseCorporateAction,
} from "../providers/nseCorporateActions";

export type CorporateActionAdjustment = {
  actionType:
    "STOCK_SPLIT";

  exDate:
    string;

  oldFaceValue:
    number;

  newFaceValue:
    number;

  adjustmentFactor:
    number;
};

export type AdjustedFinancialPeriod = {
  financialPeriod:
    FinancialStatementPeriod;

  appliedAdjustments:
    CorporateActionAdjustment[];

  cumulativeShareAdjustmentFactor:
    number;
};

export type CorporateActionAdjustmentResult = {
  periods:
    FinancialStatementPeriod[];

  adjustedPeriods:
    AdjustedFinancialPeriod[];

  appliedActionCount:
    number;

  warnings:
    string[];
};

function isPositiveNumber(
  value: NullableNumber | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function parseDateValue(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const nseDateMatch =
    value.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
    );

  if (nseDateMatch) {
    const monthByName:
      Record<string, number> = {
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

    const month =
      monthByName[
        nseDateMatch[2]
          .toUpperCase()
      ];

    if (
      month === undefined
    ) {
      return null;
    }

    const timestamp =
      Date.UTC(
        Number(
          nseDateMatch[3]
        ),
        month,
        Number(
          nseDateMatch[1]
        )
      );

    return Number.isFinite(
      timestamp
    )
      ? timestamp
      : null;
  }

  const timestamp =
    Date.parse(value);

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : null;
}

function dividePerShareValue(
  value:
    NullableNumber | undefined,

  factor: number
): NullableNumber {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value / factor;
}

function multiplyShareCount(
  value:
    NullableNumber | undefined,

  factor: number
): NullableNumber {
  if (
    !isPositiveNumber(value)
  ) {
    return null;
  }

  return value * factor;
}

function getValidStockSplits(
  actions:
    NseCorporateAction[],

  warnings:
    string[]
): CorporateActionAdjustment[] {
  const validSplits:
    CorporateActionAdjustment[] = [];

  for (
    const action
    of actions
  ) {
    if (
      action.actionType !==
      "STOCK_SPLIT"
    ) {
      continue;
    }

    if (
      !action.exDate
    ) {
      warnings.push(
        "A stock split was not applied because its ex-date was unavailable."
      );

      continue;
    }

    if (
      !isPositiveNumber(
        action.oldFaceValue
      ) ||
      !isPositiveNumber(
        action.newFaceValue
      ) ||
      !isPositiveNumber(
        action.shareAdjustmentFactor
      )
    ) {
      warnings.push(
        `The stock split effective ${action.exDate} was not applied because its face-value ratio could not be verified.`
      );

      continue;
    }

    const exDateValue =
      parseDateValue(
        action.exDate
      );

    if (
      exDateValue === null
    ) {
      warnings.push(
        `The stock split effective ${action.exDate} was not applied because its ex-date could not be parsed.`
      );

      continue;
    }

    validSplits.push({
      actionType:
        "STOCK_SPLIT",

      exDate:
        action.exDate,

      oldFaceValue:
        action.oldFaceValue,

      newFaceValue:
        action.newFaceValue,

      adjustmentFactor:
        action
          .shareAdjustmentFactor,
    });
  }

  return validSplits.sort(
    (
      first,
      second
    ) =>
      (
        parseDateValue(
          first.exDate
        ) ?? 0
      ) -
      (
        parseDateValue(
          second.exDate
        ) ?? 0
      )
  );
}

function getApplicableSplits(
  period:
    FinancialStatementPeriod,

  validSplits:
    CorporateActionAdjustment[]
): CorporateActionAdjustment[] {
  const periodEndDate =
    parseDateValue(
      period.endDate
    );

  if (
    periodEndDate === null
  ) {
    return [];
  }

  /*
   * Only splits occurring after the
   * financial reporting date need to
   * adjust that historical period.
   *
   * Future announced actions are not
   * applied before their ex-date.
   */
  const today =
    Date.now();

  return validSplits.filter(
    (split) => {
      const exDateValue =
        parseDateValue(
          split.exDate
        );

      return (
        exDateValue !== null &&
        exDateValue >
          periodEndDate &&
        exDateValue <= today
      );
    }
  );
}

function adjustPeriod(
  period:
    FinancialStatementPeriod,

  applicableSplits:
    CorporateActionAdjustment[]
): AdjustedFinancialPeriod {
  const cumulativeFactor =
    applicableSplits.reduce(
      (
        factor,
        split
      ) =>
        factor *
        split.adjustmentFactor,
      1
    );

  if (
    applicableSplits.length ===
      0 ||
    cumulativeFactor === 1
  ) {
    return {
      financialPeriod:
        period,

      appliedAdjustments: [],

      cumulativeShareAdjustmentFactor:
        1,
    };
  }

  /*
   * A stock split changes the number
   * of shares and per-share values.
   *
   * It does not change revenue,
   * profit, total assets, total equity,
   * deposits or paid-up equity capital.
   */
  const adjustedPeriod:
    FinancialStatementPeriod = {
      ...period,

      epsBasic:
        dividePerShareValue(
          period.epsBasic,
          cumulativeFactor
        ),

      epsDiluted:
        dividePerShareValue(
          period.epsDiluted,
          cumulativeFactor
        ),

      dividendPerShare:
        dividePerShareValue(
          period
            .dividendPerShare,
          cumulativeFactor
        ),

      faceValuePerShare:
        dividePerShareValue(
          period
            .faceValuePerShare,
          cumulativeFactor
        ),

      sharesOutstanding:
        multiplyShareCount(
          period
            .sharesOutstanding,
          cumulativeFactor
        ),
    };

  return {
    financialPeriod:
      adjustedPeriod,

    appliedAdjustments:
      applicableSplits,

    cumulativeShareAdjustmentFactor:
      cumulativeFactor,
  };
}

export function adjustFinancialPeriodsForCorporateActions(
  periods:
    FinancialStatementPeriod[],

  actions:
    NseCorporateAction[]
): CorporateActionAdjustmentResult {
  const warnings:
    string[] = [];

  const validSplits =
    getValidStockSplits(
      actions,
      warnings
    );

  const adjustedPeriods =
    periods.map(
      (period) => {
        const applicableSplits =
          getApplicableSplits(
            period,
            validSplits
          );

        return adjustPeriod(
          period,
          applicableSplits
        );
      }
    );

  const appliedActionKeys =
    new Set<string>();

  for (
    const adjustedPeriod
    of adjustedPeriods
  ) {
    for (
      const adjustment
      of adjustedPeriod
        .appliedAdjustments
    ) {
      appliedActionKeys.add(
        [
          adjustment
            .actionType,

          adjustment.exDate,

          adjustment
            .oldFaceValue,

          adjustment
            .newFaceValue,
        ].join("|")
      );
    }
  }

  return {
    periods:
      adjustedPeriods.map(
        (result) =>
          result
            .financialPeriod
      ),

    adjustedPeriods,

    appliedActionCount:
      appliedActionKeys.size,

    warnings,
  };
}