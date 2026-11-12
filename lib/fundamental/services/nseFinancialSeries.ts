  import "server-only";

  import type {
    FinancialPeriodType,
    FinancialStatementPeriod,
  } from "../types";

  import {
    getNseFinancialResultFilings,
    type NseFinancialFiling,
  } from "../providers/nseFinancialResults";

  import {
    getNseIntegratedFinancialFilings,
    type NseIntegratedFiling,
  } from "../providers/nseIntegratedFinancialResults";

  import {
    fetchAndParseNseXbrl,
    type ParsedNseXbrl,
  } from "../providers/nseXbrl";

  import {
    normalizeNseXbrlPeriod,
  } from "../normalizers/nseFinancialNormalizer";

  export type NseFinancialSeriesSource =
    | "NSE_INTEGRATED"
    | "NSE_LEGACY";

  export type NseFinancialSeriesItem = {
    periodType: FinancialPeriodType;
    periodEnded: string;
    filingDate: string | null;

    durationDays: number;

    consolidated: boolean | null;
    audited: boolean | null;

    sourceType:
      NseFinancialSeriesSource;

    taxonomyPrefixes: string[];

    financialPeriod:
      FinancialStatementPeriod;

    selectedContexts: {
      durationContextId:
        string | null;

      instantContextId:
        string | null;
    };

    warnings: string[];
  };

  export type NseFinancialSeriesResponse = {
    status:
      | "success"
      | "partial"
      | "unavailable";

    symbol: string;
    companyName: string | null;

    quarterly:
      NseFinancialSeriesItem[];

    annual:
      NseFinancialSeriesItem[];

    warnings: string[];

    source: {
      name: string;
      generatedAt: string;
    };
  };

  export type NseFinancialSeriesOptions = {
    quarterlyLimit?: number;
    annualLimit?: number;
  };

  type FilingCandidate = {
    symbol: string;
    companyName: string | null;

    periodType:
      FinancialPeriodType;

    periodEnded: string | null;
    filingDate: string | null;

    consolidated: boolean | null;
    audited: boolean | null;

    xbrlUrl: string | null;

    sourceType:
      NseFinancialSeriesSource;
  };

  const MONTH_NUMBERS: Record<
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

  const MILLISECONDS_PER_DAY =
    24 * 60 * 60 * 1000;

  function parseDateValue(
    value: string | null
  ): number | null {
    if (!value) {
      return null;
    }

    const trimmedValue =
      value.trim();

    const nseDateMatch =
      trimmedValue.match(
        /^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/
      );

    if (nseDateMatch) {
      const month =
        MONTH_NUMBERS[
          nseDateMatch[2]
            .toUpperCase()
        ];

      if (month === undefined) {
        return null;
      }

      return Date.UTC(
        Number(nseDateMatch[3]),
        month,
        Number(nseDateMatch[1]),
        Number(
          nseDateMatch[4] ?? 0
        ),
        Number(
          nseDateMatch[5] ?? 0
        ),
        Number(
          nseDateMatch[6] ?? 0
        )
      );
    }

    const isoDateMatch =
      trimmedValue.match(
        /^(\d{4})-(\d{2})-(\d{2})/
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

  function normalizePeriodDate(
    value: string | null
  ): string | null {
    const timestamp =
      parseDateValue(value);

    if (timestamp === null) {
      return value?.trim() ?? null;
    }

    return new Date(timestamp)
      .toISOString()
      .slice(0, 10);
  }

  function calculateDurationDays(
    startDate: string | null,
    endDate: string | null
  ): number | null {
    const start =
      parseDateValue(startDate);

    const end =
      parseDateValue(endDate);

    if (
      start === null ||
      end === null ||
      end < start
    ) {
      return null;
    }

    return Math.round(
      (end - start) /
        MILLISECONDS_PER_DAY
    );
  }

  function isValidPeriodDuration(
    periodType: FinancialPeriodType,
    durationDays: number
  ): boolean {
    if (
      periodType === "QUARTERLY"
    ) {
      return (
        durationDays >= 70 &&
        durationDays <= 110
      );
    }

    if (
      periodType === "ANNUAL"
    ) {
      return (
        durationDays >= 300 &&
        durationDays <= 380
      );
    }

    return true;
  }

  /*
  * Some NSE quarterly filings contain
  * cumulative half-year figures rather
  * than standalone second-quarter
  * figures.
  *
  * These records are not accepted as
  * normal quarters. They are only
  * candidates for a later, strictly
  * validated Q2 reconstruction.
  */
  function isCumulativeHalfYearQuarter(
    periodType:
      FinancialPeriodType,

    durationDays:
      number
  ): boolean {
    return (
      periodType ===
        "QUARTERLY" &&
      durationDays >= 150 &&
      durationDays <= 210
    );
  }

  function expectedDurationDescription(
    periodType: FinancialPeriodType
  ): string {
    if (
      periodType === "ANNUAL"
    ) {
      return "300–380 days";
    }

    if (
      periodType === "QUARTERLY"
    ) {
      return "70–110 days";
    }

    return "a valid reporting period";
  }

  function isMarchPeriod(
    periodEnded: string | null
  ): boolean {
    const timestamp =
      parseDateValue(periodEnded);

    if (timestamp === null) {
      return false;
    }

    return (
      new Date(timestamp)
        .getUTCMonth() === 2
    );
  }

  function getCandidateScore(
    candidate: FilingCandidate
  ): number {
    let score = 0;

    if (
      candidate.sourceType ===
      "NSE_INTEGRATED"
    ) {
      score += 100;
    }

    if (
      candidate.consolidated === true
    ) {
      score += 20;
    }

    if (
      candidate.audited === true
    ) {
      score += 5;
    }

    if (candidate.xbrlUrl) {
      score += 2;
    }

    return score;
  }

  function deduplicateCandidates(
  candidates: FilingCandidate[]
): FilingCandidate[] {
  const unique = new Map<
    string,
    FilingCandidate
  >();

  for (const candidate of candidates) {
    const date = normalizePeriodDate(
      candidate.periodEnded
    );

    const url = candidate.xbrlUrl?.trim();

    if (
      !date ||
      !url ||
      url === "-" ||
      /\/-(?:[?#].*)?$/.test(url)
    ) {
      continue;
    }

    // Preserve different documents for the
    // same reporting period as alternatives.
    const key = JSON.stringify([
      candidate.periodType,
      date,
      candidate.consolidated,
      url,
    ]);

    const existing = unique.get(key);

    if (
      !existing ||
      getCandidateScore(candidate) >
        getCandidateScore(existing)
    ) {
      unique.set(key, candidate);
    }
  }

  return [...unique.values()].sort(
    (first, second) => {
      const dateDifference =
        (parseDateValue(second.periodEnded) ?? 0) -
        (parseDateValue(first.periodEnded) ?? 0);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      const scoreDifference =
        getCandidateScore(second) -
        getCandidateScore(first);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return (
        (parseDateValue(second.filingDate) ?? 0) -
        (parseDateValue(first.filingDate) ?? 0)
      );
    }
  );
}


  /*
  * Every Integrated Filing is treated
  * as a quarterly filing.
  *
  * An audited March filing is also added
  * as an annual candidate. It will only
  * survive if the normalizer finds a
  * genuine 300–380-day context.
  */
  function integratedToCandidates(
    filing: NseIntegratedFiling
  ): FilingCandidate[] {
    const baseCandidate = {
      symbol: filing.symbol,

      companyName:
        filing.companyName,

      periodEnded:
        filing.quarterEnded,

      filingDate:
        filing.filingDate,

      consolidated:
        filing.consolidated,

      audited:
        filing.audited,

      xbrlUrl:
        filing.xbrlUrl,

      sourceType:
        "NSE_INTEGRATED" as const,
    };

    const candidates:
      FilingCandidate[] = [
        {
          ...baseCandidate,
          periodType:
            "QUARTERLY",
        },
      ];

    if (
      filing.audited === true &&
      isMarchPeriod(
        filing.quarterEnded
      )
    ) {
      candidates.push({
        ...baseCandidate,
        periodType: "ANNUAL",
      });
    }

    return candidates;
  }

  function legacyToCandidate(
    filing: NseFinancialFiling
  ): FilingCandidate | null {
    if (
      filing.period !==
        "Quarterly" &&
      filing.period !==
        "Annual"
    ) {
      return null;
    }

    return {
      symbol: filing.symbol,

      companyName:
        filing.companyName,

      periodType:
        filing.period === "Annual"
          ? "ANNUAL"
          : "QUARTERLY",

      periodEnded:
        filing.periodEnded,

      filingDate:
        filing.filingDate,

      consolidated:
        filing.consolidated,

      audited:
        filing.audited,

      xbrlUrl:
        filing.xbrlUrl,

      sourceType:
        "NSE_LEGACY",
    };
  }

  function createPeriodLabel(
    candidate: FilingCandidate
  ): string {
    return (
      normalizePeriodDate(
        candidate.periodEnded
      ) ??
      candidate.periodEnded ??
      (
        candidate.periodType ===
          "ANNUAL"
          ? "Annual Period"
          : "Quarterly Period"
      )
    );
  }

  async function getParsedDocument(
    xbrlUrl: string,
    documentCache: Map<
      string,
      Promise<ParsedNseXbrl>
    >
  ): Promise<ParsedNseXbrl> {
    let documentPromise =
      documentCache.get(xbrlUrl);

    if (!documentPromise) {
      documentPromise =
        fetchAndParseNseXbrl(
          xbrlUrl
        );

      documentCache.set(
        xbrlUrl,
        documentPromise
      );
    }

    return documentPromise;
  }

  function subtractCumulativeValue(
    cumulativeValue:
      number | null | undefined,

    firstQuarterValue:
      number | null | undefined
  ): number | null {
    if (
      typeof cumulativeValue !==
        "number" ||
      !Number.isFinite(
        cumulativeValue
      ) ||
      typeof firstQuarterValue !==
        "number" ||
      !Number.isFinite(
        firstQuarterValue
      )
    ) {
      return null;
    }

    return (
      cumulativeValue -
      firstQuarterValue
    );
  }

  function getFollowingDate(
    value: string | null
  ): string | null {
    const timestamp =
      parseDateValue(value);

    if (timestamp === null) {
      return null;
    }

    return new Date(
      timestamp +
        MILLISECONDS_PER_DAY
    )
      .toISOString()
      .slice(0, 10);
  }

  function reconstructSecondQuarter(
    cumulativeHalfYear:
      NseFinancialSeriesItem,

    firstQuarter:
      NseFinancialSeriesItem
  ): NseFinancialSeriesItem | null {
    const cumulativePeriod =
      cumulativeHalfYear
        .financialPeriod;

    const firstQuarterPeriod =
      firstQuarter
        .financialPeriod;

    const sameFiscalYearStart =
      normalizePeriodDate(
        cumulativePeriod.startDate
      ) ===
      normalizePeriodDate(
        firstQuarterPeriod.startDate
      );

    const sameCurrencyAndUnit =
      cumulativePeriod.currency ===
        firstQuarterPeriod.currency &&
      cumulativePeriod.unit ===
        firstQuarterPeriod.unit;

    const sameReportingBasis =
      cumulativeHalfYear
        .consolidated ===
        firstQuarter.consolidated &&
      cumulativeHalfYear
        .sourceType ===
        firstQuarter.sourceType;

    const reconstructedStartDate =
      getFollowingDate(
        firstQuarterPeriod.endDate
      );

    const reconstructedDuration =
      calculateDurationDays(
        reconstructedStartDate,
        cumulativePeriod.endDate
      );

    if (
      cumulativeHalfYear
        .periodType !==
        "QUARTERLY" ||
      firstQuarter.periodType !==
        "QUARTERLY" ||
      !isCumulativeHalfYearQuarter(
        cumulativeHalfYear
          .periodType,
        cumulativeHalfYear
          .durationDays
      ) ||
      !isValidPeriodDuration(
        firstQuarter.periodType,
        firstQuarter.durationDays
      ) ||
      !sameFiscalYearStart ||
      !sameCurrencyAndUnit ||
      !sameReportingBasis ||
      reconstructedStartDate ===
        null ||
      reconstructedDuration ===
        null ||
      !isValidPeriodDuration(
        "QUARTERLY",
        reconstructedDuration
      )
    ) {
      return null;
    }

    return {
      ...cumulativeHalfYear,

      durationDays:
        reconstructedDuration,

      financialPeriod: {
        ...cumulativePeriod,

        periodType:
          "QUARTERLY",

        startDate:
          reconstructedStartDate,

        revenue:
          subtractCumulativeValue(
            cumulativePeriod.revenue,
            firstQuarterPeriod
              .revenue
          ),

        operatingIncome:
          subtractCumulativeValue(
            cumulativePeriod
              .operatingIncome,
            firstQuarterPeriod
              .operatingIncome
          ),

        ebitda:
          subtractCumulativeValue(
            cumulativePeriod.ebitda,
            firstQuarterPeriod
              .ebitda
          ),

        ebit:
          subtractCumulativeValue(
            cumulativePeriod.ebit,
            firstQuarterPeriod.ebit
          ),

        profitBeforeTax:
          subtractCumulativeValue(
            cumulativePeriod
              .profitBeforeTax,
            firstQuarterPeriod
              .profitBeforeTax
          ),

        taxExpense:
          subtractCumulativeValue(
            cumulativePeriod
              .taxExpense,
            firstQuarterPeriod
              .taxExpense
          ),

        netProfit:
          subtractCumulativeValue(
            cumulativePeriod.netProfit,
            firstQuarterPeriod
              .netProfit
          ),

        /*
  * EPS is not subtracted because cumulative
  * and quarterly EPS may use different
  * weighted-average share counts.
  */
  epsBasic: null,
  epsDiluted: null,

        financeCosts:
          subtractCumulativeValue(
            cumulativePeriod
              .financeCosts,
            firstQuarterPeriod
              .financeCosts
          ),

        operatingCashFlow:
          subtractCumulativeValue(
            cumulativePeriod
              .operatingCashFlow,
            firstQuarterPeriod
              .operatingCashFlow
          ),

        investingCashFlow:
          subtractCumulativeValue(
            cumulativePeriod
              .investingCashFlow,
            firstQuarterPeriod
              .investingCashFlow
          ),

        financingCashFlow:
          subtractCumulativeValue(
            cumulativePeriod
              .financingCashFlow,
            firstQuarterPeriod
              .financingCashFlow
          ),

        capitalExpenditure:
          subtractCumulativeValue(
            cumulativePeriod
              .capitalExpenditure,
            firstQuarterPeriod
              .capitalExpenditure
          ),

        freeCashFlow:
          subtractCumulativeValue(
            cumulativePeriod
              .freeCashFlow,
            firstQuarterPeriod
              .freeCashFlow
          ),

        dividendPerShare:
          subtractCumulativeValue(
            cumulativePeriod
              .dividendPerShare,
            firstQuarterPeriod
              .dividendPerShare
          ),
      },

      warnings: [
        ...cumulativeHalfYear
          .warnings,

        "Standalone second-quarter flow values were derived from a verified cumulative half-year filing after subtracting the matching verified first-quarter values. Balance-sheet and banking snapshot values were retained directly from the half-year filing.",
      ],
    };
  }

  async function normalizeCandidate(
    candidate:
      FilingCandidate,

    documentCache:
      Map<
        string,
        Promise<ParsedNseXbrl>
      >,

        allowCumulativeHalfYear:
      boolean = false,

    requiredConsolidated:
      boolean = true
  ): Promise<
    NseFinancialSeriesItem
  > {
    if (!candidate.xbrlUrl) {
      throw new Error(
        "The selected filing does not contain an XBRL URL."
      );
    }

    const document =
      await getParsedDocument(
        candidate.xbrlUrl,
        documentCache
      );

    const normalized =
      normalizeNseXbrlPeriod(
        document,
        {
          period:
            createPeriodLabel(
              candidate
            ),

          periodType:
            candidate.periodType,

          periodEnded:
            candidate.periodEnded,

          documentType:
            candidate.sourceType ===
              "NSE_INTEGRATED"
              ? candidate
                  .consolidated
                ? "Integrated Filing - Consolidated Financial Results"
                : "Integrated Filing - Standalone Financial Results"
              : candidate
                  .consolidated
                ? "Legacy Consolidated Financial Results"
                : "Legacy Standalone Financial Results",
        }
      );

      const contextId =
    normalized.selectedContexts.durationContextId;

  const reportingBasisValues = [
    ...new Set(
      document.facts
        .filter(
          (fact) =>
            fact.contextRef === contextId &&
            fact.localName ===
              "NatureOfReportStandaloneConsolidated"
        )
        .map((fact) =>
          fact.value.trim().toLowerCase()
        )
        .filter(Boolean)
    ),
  ];

  if (
    reportingBasisValues.length > 1 ||
    (
      reportingBasisValues.length === 1 &&
      !["consolidated", "standalone"].includes(
        reportingBasisValues[0]
      )
    )
  ) {
    throw new Error(
      "The selected context has ambiguous reporting-basis metadata."
    );
  }

  const xmlConsolidated =
    reportingBasisValues.length === 1
      ? reportingBasisValues[0] === "consolidated"
      : null;

    const verifiedConsolidated =
    xmlConsolidated ??
    candidate.consolidated;

  if (requiredConsolidated) {
    // Preserve the existing consolidated checks.
    if (
      candidate.consolidated === false ||
      xmlConsolidated === false
    ) {
      throw new Error(
        "Standalone filing excluded from consolidated financial history."
      );
    }

    if (
      candidate.consolidated !== true &&
      xmlConsolidated !== true
    ) {
      throw new Error(
        "The filing's consolidated reporting basis could not be verified."
      );
    }
  } else {
    // Standalone fallback must have a known,
    // explicitly standalone reporting basis.
    if (verifiedConsolidated !== false) {
      throw new Error(
        "Non-standalone or unverified filing excluded from standalone financial history."
      );
    }
  }

  if (
    ![
      normalized.financialPeriod.revenue,
      normalized.financialPeriod.profitBeforeTax,
      normalized.financialPeriod.netProfit,
    ].every(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value)
    )
  ) {
    throw new Error(
      "The selected context is missing Revenue, PBT or PAT."
    );
  }

      const durationDays =
      calculateDurationDays(
        normalized
          .financialPeriod
          .startDate,

        normalized
          .financialPeriod
          .endDate
      );

    if (durationDays === null) {
      throw new Error(
        "The filing does not contain a usable dimensionless duration context."
      );
    }

    const validStandardDuration =
    isValidPeriodDuration(
      candidate.periodType,
      durationDays
    );

  const validCumulativeHalfYear =
    allowCumulativeHalfYear &&
    isCumulativeHalfYearQuarter(
      candidate.periodType,
      durationDays
    );

  if (
    !validStandardDuration &&
    !validCumulativeHalfYear
  ) {

      throw new Error(
        `The filing is labelled ${candidate.periodType}, ` +
          `but its XBRL duration is ${durationDays} days. ` +
          `Expected ${expectedDurationDescription(
            candidate.periodType
          )}. The period was excluded to prevent incorrect financial data.`
      );
    }

    return {
      periodType:
        candidate.periodType,

      periodEnded:
        normalizePeriodDate(
          candidate.periodEnded
        ) ??
        candidate.periodEnded ??
        createPeriodLabel(
          candidate
        ),

      filingDate:
        candidate.filingDate,

      durationDays,

          consolidated:
      xmlConsolidated ??
      candidate.consolidated,

      audited:
        candidate.audited,

      sourceType:
        candidate.sourceType,

      taxonomyPrefixes:
        document.taxonomyPrefixes,

      financialPeriod:
        normalized.financialPeriod,

      selectedContexts:
        normalized.selectedContexts,

      warnings: [
        ...document.warnings,
        ...normalized.warnings,
      ],
    };
  }

  async function buildSeriesItems(
    candidates: FilingCandidate[],
    requestedLimit: number,
    documentCache: Map<
      string,
      Promise<ParsedNseXbrl>
    >,
       warnings: string[],
    requiredConsolidated: boolean = true
  ): Promise<
    NseFinancialSeriesItem[]
  > {
    const items:
      NseFinancialSeriesItem[] = [];

    /*
    * Cumulative half-year filings are
    * temporarily retained so that Q2
    * can be reconstructed after the
    * matching standalone Q1 is loaded.
    */
    const cumulativeHalfYears: {
      item: NseFinancialSeriesItem;
      exclusionWarning: string;
    }[] = [];

    for (const candidate of candidates) {
          const candidateDate =
      normalizePeriodDate(candidate.periodEnded);

    // Once a valid consolidated period is
    // accepted, skip its remaining alternatives.
    if (
      items.some(
        (item) =>
          item.periodType === candidate.periodType &&
          normalizePeriodDate(item.periodEnded) ===
            candidateDate
      )
    ) {
      continue;
    }
      if (
        items.length >=
        requestedLimit
      ) {
        break;
      }

      try {
        const item =
                    await normalizeCandidate(
            candidate,
            documentCache,
            false,
            requiredConsolidated
          );

        items.push(item);
      } catch (error) {
        const exclusionWarning =
          `Excluded ${
            candidate.periodType
          } filing ending ${
            candidate.periodEnded ??
            "unknown date"
          }: ${
            error instanceof Error
              ? error.message
              : "Unknown error"
          }`;

        /*
        * Preserve the existing strict
        * quarterly-duration validation.
        *
        * Only a rejected quarterly filing
        * is retried as a possible cumulative
        * half-year filing.
        */
        if (
          candidate.periodType ===
          "QUARTERLY"
        ) {
          try {
            const cumulativeItem =
                            await normalizeCandidate(
                candidate,
                documentCache,
                true,
                requiredConsolidated
              );

            if (
              isCumulativeHalfYearQuarter(
                cumulativeItem.periodType,
                cumulativeItem.durationDays
              )
            ) {
              cumulativeHalfYears.push({
                item:
                  cumulativeItem,

                exclusionWarning,
              });

              continue;
            }
          } catch {
            /*
            * The candidate was not a usable
            * cumulative half-year filing.
            * Preserve the original warning.
            */
          }
        }

        warnings.push(
          exclusionWarning
        );
      }
    }

    /*
    * Convert verified cumulative half-year
    * filings into standalone Q2 periods by
    * subtracting the matching standalone Q1
    * flow values.
    */
    for (
      const cumulativeHalfYear
      of cumulativeHalfYears
    ) {
      const firstQuarter =
        items.find((item) => {
          const cumulativePeriod =
            cumulativeHalfYear
              .item
              .financialPeriod;

          const itemPeriod =
            item.financialPeriod;

          return (
            item.periodType ===
              "QUARTERLY" &&
            isValidPeriodDuration(
              item.periodType,
              item.durationDays
            ) &&
            normalizePeriodDate(
              itemPeriod.startDate
            ) ===
              normalizePeriodDate(
                cumulativePeriod
                  .startDate
              ) &&
            parseDateValue(
              itemPeriod.endDate
            ) !== null &&
            parseDateValue(
              cumulativePeriod.endDate
            ) !== null &&
            (
              parseDateValue(
                itemPeriod.endDate
              ) ?? 0
            ) <
              (
                parseDateValue(
                  cumulativePeriod
                    .endDate
                ) ?? 0
              )
          );
        }) ?? null;

      if (!firstQuarter) {
        warnings.push(
          `${cumulativeHalfYear.exclusionWarning} A matching verified first-quarter filing was not available for cumulative half-year reconstruction.`
        );

        continue;
      }

      const reconstructedQuarter =
        reconstructSecondQuarter(
          cumulativeHalfYear.item,
          firstQuarter
        );

      if (!reconstructedQuarter) {
        warnings.push(
          `${cumulativeHalfYear.exclusionWarning} The cumulative half-year filing could not be safely converted into a standalone second quarter.`
        );

        continue;
      }

      const reconstructedEndDate =
        normalizePeriodDate(
          reconstructedQuarter
            .periodEnded
        );

      const duplicateExists =
        items.some(
          (item) =>
            normalizePeriodDate(
              item.periodEnded
            ) ===
              reconstructedEndDate &&
            item.periodType ===
              "QUARTERLY"
        );

      if (!duplicateExists) {
        items.push(
          reconstructedQuarter
        );
      }
    }

    return items
      .sort(
        (first, second) =>
          (
            parseDateValue(
              second.periodEnded
            ) ?? 0
          ) -
          (
            parseDateValue(
              first.periodEnded
            ) ?? 0
          )
      )
      .slice(
        0,
        requestedLimit
      );
  }

  export async function getNseFinancialSeries(
    requestedSymbol: string,
    options:
      NseFinancialSeriesOptions = {}
  ): Promise<NseFinancialSeriesResponse> {
    const symbol =
      requestedSymbol
        .trim()
        .toUpperCase();

    if (!symbol) {
      throw new Error(
        "A valid NSE symbol is required."
      );
    }

    const quarterlyLimit =
    Math.max(
      1,
      Math.min(
        options.quarterlyLimit ??
          20,
        24
      )
    );

    const annualLimit =
      Math.max(
        1,
        Math.min(
          options.annualLimit ??
            5,
          10
        )
      );

    const warnings: string[] = [];

    const integratedResponse =
      await getNseIntegratedFinancialFilings(
        symbol
      );

    const legacyResponse =
      await getNseFinancialResultFilings(
        symbol
      );

  console.log(
    `${symbol} MARCH FILING INVENTORY:\n${JSON.stringify(
      {
        integrated: integratedResponse.filings
          .filter((filing) =>
            isMarchPeriod(filing.quarterEnded)
          )
          .map((filing) => ({
            periodEnded: filing.quarterEnded,
            filingDate: filing.filingDate,
            consolidated: filing.consolidated,
            audited: filing.audited,
            xbrlUrl: filing.xbrlUrl,
          })),

        legacy: legacyResponse.filings
          .filter((filing) =>
            isMarchPeriod(filing.periodEnded)
          )
          .map((filing) => ({
            period: filing.period,
            periodEnded: filing.periodEnded,
            filingDate: filing.filingDate,
            consolidated: filing.consolidated,
            audited: filing.audited,
            xbrlUrl: filing.xbrlUrl,
          })),
      },
      null,
      2
    )}`
  );
    warnings.push(
      ...integratedResponse.warnings,
      ...legacyResponse.warnings
    );

    const integratedCandidates =
      integratedResponse.filings.flatMap(
        integratedToCandidates
      );

    const legacyCandidates =
      legacyResponse.filings
        .map(legacyToCandidate)
        .filter(
          (
            candidate
          ): candidate is FilingCandidate =>
            candidate !== null
        );

      const quarterlyCandidates =
      deduplicateCandidates([
        ...integratedCandidates.filter(
          (candidate) =>
            candidate.periodType ===
            "QUARTERLY"
        ),

        ...legacyCandidates.filter(
          (candidate) =>
            candidate.periodType ===
            "QUARTERLY"
        ),

        /*
        * Some legacy filings labelled Annual
        * contain only January–March results.
        *
        * Also consider them as quarterly
        * candidates. normalizeCandidate()
        * still requires a genuine quarterly
        * duration before accepting them.
        *
        * Keep the original annual candidates
        * so genuine annual contexts remain
        * eligible for annual validation.
        */
        ...legacyCandidates
          .filter(
            (candidate) =>
              candidate.periodType ===
                "ANNUAL" &&
              isMarchPeriod(
                candidate.periodEnded
              )
          )
          .map(
            (candidate): FilingCandidate => ({
              ...candidate,
              periodType: "QUARTERLY",
            })
          ),
      ]);

    const annualCandidates =
      deduplicateCandidates([
        ...integratedCandidates.filter(
          (candidate) =>
            candidate.periodType ===
            "ANNUAL"
        ),

        ...legacyCandidates.filter(
          (candidate) =>
            candidate.periodType ===
            "ANNUAL"
        ),
      ]);

    const documentCache =
      new Map<
        string,
        Promise<ParsedNseXbrl>
      >();

       let quarterly =
      await buildSeriesItems(
        quarterlyCandidates,
        quarterlyLimit,
        documentCache,
        warnings
      );

    let annual =
      await buildSeriesItems(
        annualCandidates,
        annualLimit,
        documentCache,
        warnings
      );

    /*
 * Prefer validated consolidated annual statements.
 *
 * If none are available, try standalone annual
 * statements and use standalone quarters alongside
 * them. Never mix the two reporting bases.
 */
if (annual.length === 0) {
  const standaloneWarnings: string[] = [];

  const standaloneAnnual =
    await buildSeriesItems(
      annualCandidates,
      annualLimit,
      documentCache,
      standaloneWarnings,
      false
    );

  if (
    standaloneAnnual.length > 0 ||
    quarterly.length === 0
  ) {
    const standaloneQuarterly =
      await buildSeriesItems(
        quarterlyCandidates,
        quarterlyLimit,
        documentCache,
        standaloneWarnings,
        false
      );

    if (
      standaloneAnnual.length > 0 ||
      standaloneQuarterly.length > 0
    ) {
      annual = standaloneAnnual;
      quarterly = standaloneQuarterly;

      warnings.push(
        "No validated consolidated annual statements were available. Using a standalone financial series consistently; these records must not be labelled or stored as consolidated."
      );
    }
  }

  warnings.push(...standaloneWarnings);
}

    const companyName =
      integratedResponse.filings.find(
        (filing) =>
          filing.companyName !== null
      )?.companyName ??
      legacyResponse.filings.find(
        (filing) =>
          filing.companyName !== null
      )?.companyName ??
      null;

    const totalPeriods =
      quarterly.length +
      annual.length;

    return {
      status:
        totalPeriods > 0
          ? warnings.length > 0
            ? "partial"
            : "success"
          : "unavailable",

      symbol,
      companyName,
      quarterly,
      annual,
      warnings,

      source: {
        name:
          "NSE Integrated and Corporate Financial Results XBRL",

        generatedAt:
          new Date().toISOString(),
      },
    };
  }