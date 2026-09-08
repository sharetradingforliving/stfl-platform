/**
 * ================================================================
 * STFL IPO Financial Statement Parser
 * File: financialStatementParser.ts
 *
 * Purpose:
 *
 * Convert automatically extracted SEBI prospectus financial text
 * into normalized STFL IPOFinancialData.
 *
 * Design principles:
 *
 * - No company-specific financial figures are hard-coded.
 * - Detect reporting periods before mapping values.
 * - Detect reporting units instead of assuming ₹ million.
 * - Prefer explicit KPI / financial rows.
 * - Keep monetary values separate from ratios / EPS.
 * - Reject ambiguous data rather than silently mapping it.
 *
 * ================================================================
 */

import type {
  IPOFinancialData,
  IPOFinancialYear,
} from "../financialTypes";

import type {
  SEBIFinancialExtraction,
} from "../providers/sebiFinancials";


/**
 * ================================================================
 * TYPES
 * ================================================================
 */

type FinancialUnit =
  | "rupees"
  | "thousand"
  | "lakh"
  | "million"
  | "crore"
  | "unknown";


interface DetectedPeriod {
  year: number;

  month?: string;

  day?: number;

  label: string;
}


interface MetricSeries {
  values: Array<
    number | undefined
  >;

  sourceLine?: string;

  unit?: FinancialUnit;
}


/**
 * ================================================================
 * NORMALIZE TEXT
 * ================================================================
 */

function normalizeText(
  value: string
): string {

  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


/**
 * ================================================================
 * NORMALIZE SEARCH TEXT
 * ================================================================
 */

function normalizeSearchText(
  value: string
): string {

  return value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * ================================================================
 * PARSE FINANCIAL NUMBER
 *
 * Examples:
 *
 * 9,41,862.12
 * 3859.50
 * (421.57)
 * 0.41%
 * ================================================================
 */

function parseFinancialNumber(
  value?: string
): number | undefined {

  if (!value) {
    return undefined;
  }


  let cleaned =
    value
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();


  if (
    !cleaned ||
    cleaned === "-"
  ) {
    return undefined;
  }


  let negative =
    false;


  if (
    cleaned.startsWith("(") &&
    cleaned.endsWith(")")
  ) {

    negative =
      true;

    cleaned =
      cleaned.slice(
        1,
        -1
      );
  }


  const result =
    Number(cleaned);


  if (
    !Number.isFinite(result)
  ) {
    return undefined;
  }


  return negative
    ? -result
    : result;
}


/**
 * ================================================================
 * EXTRACT NUMBER TOKENS
 *
 * Supports:
 *
 * 941,862.12
 * 0.41
 * (421.57)
 * ================================================================
 */

function extractNumberTokens(
  value: string
): string[] {

  return (
    value.match(
      /\(?-?\d[\d,]*(?:\.\d+)?\)?/g
    ) ?? []
  );
}


/**
 * ================================================================
 * UNIT DETECTION
 * ================================================================
 */

function detectUnit(
  text: string
): FinancialUnit {

  const normalized =
    normalizeSearchText(
      text
    );


  if (
    /(?:₹|rs\.?)?\s*(?:in\s*)?crores?\b/i.test(
      normalized
    ) ||
    /\bin crores?\b/i.test(
      normalized
    )
  ) {
    return "crore";
  }


  if (
    /(?:₹|rs\.?)?\s*(?:in\s*)?millions?\b/i.test(
      normalized
    ) ||
    /\bin millions?\b/i.test(
      normalized
    )
  ) {
    return "million";
  }


  if (
    /(?:₹|rs\.?)?\s*(?:in\s*)?lakhs?\b/i.test(
      normalized
    ) ||
    /\bin lakhs?\b/i.test(
      normalized
    )
  ) {
    return "lakh";
  }


  if (
    /(?:₹|rs\.?)?\s*(?:in\s*)?thousands?\b/i.test(
      normalized
    ) ||
    /\bin thousands?\b/i.test(
      normalized
    )
  ) {
    return "thousand";
  }


  if (
    /\brupees?\b/i.test(
      normalized
    )
  ) {
    return "rupees";
  }


  return "unknown";
}


/**
 * ================================================================
 * CONVERT MONETARY VALUE TO ₹ CRORE
 * ================================================================
 */

function convertToCrore(
  value: number | undefined,
  unit: FinancialUnit
): number | undefined {

  if (
    value === undefined
  ) {
    return undefined;
  }


  switch (unit) {

    case "crore":

      return Number(
        value.toFixed(2)
      );


    case "million":

      return Number(
        (
          value /
          10
        ).toFixed(2)
      );


    case "lakh":

      return Number(
        (
          value /
          100
        ).toFixed(2)
      );


    case "thousand":

      return Number(
        (
          value /
          10000
        ).toFixed(2)
      );


    case "rupees":

      return Number(
        (
          value /
          10000000
        ).toFixed(2)
      );


    default:

      /**
       * Unknown monetary unit:
       *
       * Do not guess.
       */

      return undefined;
  }
}


/**
 * ================================================================
 * MONTH MAP
 * ================================================================
 */

const MONTH_NUMBER:
  Record<string, number> = {

  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};


/**
 * ================================================================
 * DETECT REPORTING PERIODS
 *
 * Example:
 *
 * March 31, 2026 March 31, 2025 March 31, 2024
 *
 * becomes:
 *
 * FY26
 * FY25
 * FY24
 *
 * Values remain in source-column order.
 * ================================================================
 */

function detectPeriods(
  text: string
): DetectedPeriod[] {

  /**
   * ================================================================
   * Strategy
   *
   * Financial prospectuses use several heading formats:
   *
   * Fiscal 2025 Fiscal 2024 Fiscal 2023
   * FY2025 FY2024 FY2023
   * March 31, 2025 March 31, 2024 March 31, 2023
   * 31 March 2025 31 March 2024 31 March 2023
   *
   * We first look for a comparative multi-year heading rather than
   * simply taking the first dates appearing anywhere in the DRHP.
   * ================================================================
   */

  const normalized =
    normalizeText(
      text
    );


  const lines =
    getLines(
      normalized
    );


  /**
   * ------------------------------------------------
   * METHOD 1
   * Fiscal 2025 / FY2025 style
   * ------------------------------------------------
   */

  for (
    const line
    of lines
  ) {

    const fiscalMatches =
      Array.from(
        line.matchAll(
          /\b(?:fiscal\s*|fy\s*)?(20\d{2})\b/gi
        )
      );


    const years =
      Array.from(
        new Set(
          fiscalMatches.map(
            (
              match
            ) =>
              Number(
                match[1]
              )
          )
        )
      );


    /**
     * Require a genuine comparative table heading.
     *
     * This prevents random dates elsewhere in the DRHP
     * from becoming reporting periods.
     */

    if (
      years.length >=
      3 &&
      (
        /fiscal\s*20\d{2}/i.test(
          line
        ) ||
        /\bfy\s*20\d{2}/i.test(
          line
        )
      )
    ) {

      return years
        .slice(
          0,
          3
        )
        .map(
          (
            year
          ) => ({
            year,

            label:
              `FY${String(
                year
              ).slice(
                -2
              )}`,
          })
        );
    }
  }


  /**
   * ------------------------------------------------
   * METHOD 2
   * March 31, 2025
   * ------------------------------------------------
   */

  for (
    const line
    of lines
  ) {

    const matches =
      Array.from(
        line.matchAll(
          /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/gi
        )
      );


    const periods:
      DetectedPeriod[] = [];


    const seenYears =
      new Set<number>();


    for (
      const match
      of matches
    ) {

      const month =
        match[1];


      const day =
        Number(
          match[2]
        );


      const year =
        Number(
          match[3]
        );


      if (
        seenYears.has(
          year
        )
      ) {
        continue;
      }


      seenYears.add(
        year
      );


      const monthNumber =
        MONTH_NUMBER[
          month.toLowerCase()
        ];


      periods.push({

        year,

        month,

        day,

        label:
          monthNumber ===
            3 &&
          day ===
            31
            ? `FY${String(
                year
              ).slice(
                -2
              )}`
            : `${month.slice(
                0,
                3
              )} ${year}`,
      });
    }


    if (
      periods.length >=
      3
    ) {

      return periods.slice(
        0,
        3
      );
    }
  }


  /**
   * ------------------------------------------------
   * METHOD 3
   * 31 March 2025
   * ------------------------------------------------
   */

  for (
    const line
    of lines
  ) {

    const matches =
      Array.from(
        line.matchAll(
          /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi
        )
      );


    const periods:
      DetectedPeriod[] = [];


    const seenYears =
      new Set<number>();


    for (
      const match
      of matches
    ) {

      const day =
        Number(
          match[1]
        );


      const month =
        match[2];


      const year =
        Number(
          match[3]
        );


      if (
        seenYears.has(
          year
        )
      ) {
        continue;
      }


      seenYears.add(
        year
      );


      const monthNumber =
        MONTH_NUMBER[
          month.toLowerCase()
        ];


      periods.push({

        year,

        month,

        day,

        label:
          monthNumber ===
            3 &&
          day ===
            31
            ? `FY${String(
                year
              ).slice(
                -2
              )}`
            : `${month.slice(
                0,
                3
              )} ${year}`,
      });
    }


    if (
      periods.length >=
      3
    ) {

      return periods.slice(
        0,
        3
      );
    }
  }


  /**
   * ------------------------------------------------
   * Nothing sufficiently reliable found.
   * ------------------------------------------------
   */

  return [];
}

/**
 * ================================================================
 * FIND RELEVANT TEXT
 * ================================================================
 */

function findRelevantText(
  extraction: SEBIFinancialExtraction
): string {

  return normalizeText(
    extraction.financialPages
      .map(
        (
          page
        ) =>
          page.text
      )
      .join("\n")
  );
}


/**
 * ================================================================
 * SPLIT EXTRACTED TEXT INTO ROWS
 * ================================================================
 */

function getLines(
  text: string
): string[] {

  return text
    .split(/\n+/)
    .map(
      (
        line
      ) =>
        line.trim()
    )
    .filter(Boolean);
}


/**
 * ================================================================
 * REMOVE LABEL FROM ROW
 * ================================================================
 */

function removeMetricLabel(
  line: string,
  alias: string
): string {

  const normalizedLine =
    normalizeSearchText(
      line
    );

  const normalizedAlias =
    normalizeSearchText(
      alias
    );


  const index =
    normalizedLine.indexOf(
      normalizedAlias
    );


  if (
    index < 0
  ) {
    return line;
  }


  /**
   * normalized string and source string have similar
   * character positions for these financial labels.
   *
   * Find label case-insensitively in original text
   * as the safer option.
   */

  const escaped =
    alias.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );


  const regex =
    new RegExp(
      escaped,
      "i"
    );


  return line.replace(
    regex,
    ""
  );
}


/**
 * ================================================================
 * REMOVE LEADING FOOTNOTES / UNIT METADATA
 *
 * Examples:
 *
 * (10) (₹ million) 3,859.50 ...
 * (16) ("ROE") % 51.04 ...
 * ================================================================
 */

function removeLeadingMetadata(
  value: string
): string {

  let cleaned =
    value.trim();


  /**
   * Remove small footnote references:
   *
   * (1)
   * (10)
   * (14a)
   */

  cleaned =
    cleaned.replace(
      /^\s*\(\s*\d{1,2}[a-z]?\s*\)\s*/i,
      ""
    );


  /**
   * Remove descriptive parentheticals,
   * but keep accounting negatives such as:
   *
   * (421.57)
   */

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const match =
      cleaned.match(
        /^\s*\(([^)]*)\)\s*/
      );


    if (!match) {
      break;
    }


    const inner =
      match[1]
        .trim();


    /**
     * Numeric decimal parenthesis is probably
     * an accounting negative.
     */

    if (
      /^-?\d[\d,]*\.\d+$/.test(
        inner
      )
    ) {
      break;
    }


    /**
     * Otherwise it is metadata / unit / acronym.
     */

    cleaned =
      cleaned.slice(
        match[0].length
      );
  }


  /**
   * Remove loose unit labels before values.
   */

  cleaned =
    cleaned.replace(
      /^\s*(?:₹|rs\.?)?\s*(?:million|millions|crore|crores|lakh|lakhs|thousand|thousands)\s*/i,
      ""
    );


  cleaned =
    cleaned.replace(
      /^\s*(?:no\.?\s*of\s*times|times|percentage|percent|%)\s*/i,
      ""
    );


  return cleaned.trim();
}


/**
 * ================================================================
 * FIND BEST METRIC ROW
 *
 * The same metric can appear in:
 *
 * - summary financial table
 * - KPI table
 * - explanatory notes
 *
 * We prefer:
 *
 * 1. Exact / early label match
 * 2. Correct number count
 * 3. Explicit unit for monetary rows
 * ================================================================
 */

/**
 * ================================================================
 * FIND METRIC ALIAS POSITION
 *
 * Prevent short financial acronyms such as:
 *
 * ROCE
 * ROE
 * EPS
 * PAT
 *
 * from matching inside unrelated words.
 *
 * Example:
 *
 * "proceeds" must NOT match "ROCE".
 * ================================================================
 */

function findMetricAliasPosition(
  line: string,
  alias: string
): number {

  const normalizedLine =
    normalizeSearchText(
      line
    );

  const normalizedAlias =
    normalizeSearchText(
      alias
    );


  /**
   * Acronyms / short labels require word boundaries.
   */

  const isShortAlias =
    /^[a-z0-9/-]+$/i.test(
      normalizedAlias
    ) &&
    normalizedAlias.length <=
      6;


  if (
    isShortAlias
  ) {

    const escaped =
      normalizedAlias.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );


    const regex =
      new RegExp(
        `\\b${escaped}\\b`,
        "i"
      );


    const match =
      normalizedLine.match(
        regex
      );


    return match?.index ??
      -1;
  }


  /**
   * Longer descriptive aliases may use ordinary matching.
   */

  return normalizedLine.indexOf(
    normalizedAlias
  );
}

function findBestMetricLine(
  lines: string[],
  aliases: string[],
  expectedValues: number,
  exclusions: string[] = [],
  monetary = false
): {
  line: string;
  alias: string;
} | null {

  let best:
    {
      line: string;
      alias: string;
      score: number;
    }
    | null = null;


  for (
    const line
    of lines
  ) {

    const normalizedLine =
      normalizeSearchText(
        line
      );


    if (
      exclusions.some(
        (
          exclusion
        ) =>
          normalizedLine.includes(
            normalizeSearchText(
              exclusion
            )
          )
      )
    ) {
      continue;
    }


    for (
      const alias
      of aliases
    ) {

      const normalizedAlias =
        normalizeSearchText(
          alias
        );


      const labelPosition =
  findMetricAliasPosition(
    line,
    alias
  );

      if (
        labelPosition < 0
      ) {
        continue;
      }


      const afterLabel =
        removeLeadingMetadata(
          removeMetricLabel(
            line,
            alias
          )
        );


      const tokens =
        extractNumberTokens(
          afterLabel
        );


      if (
        tokens.length <
        expectedValues
      ) {
        continue;
      }


      let score =
        0;


      /**
       * Prefer labels close to start of row.
       */

      if (
        labelPosition <= 10
      ) {
        score += 5;
      } else if (
        labelPosition <= 30
      ) {
        score += 2;
      }


      /**
       * Exact expected value count is safest.
       */

      if (
        tokens.length ===
        expectedValues
      ) {
        score += 8;
      } else if (
        tokens.length ===
        expectedValues + 1
      ) {
        score += 2;
      }


      /**
       * Explicit reporting unit is valuable
       * for monetary rows.
       */

      if (
        monetary &&
        detectUnit(
          line
        ) !== "unknown"
      ) {
        score += 5;
      }


      /**
       * KPI / financial table rows are usually
       * reasonably short.
       */

      if (
        line.length < 300
      ) {
        score += 2;
      }


      if (
        !best ||
        score >
        best.score
      ) {

        best = {
          line,
          alias,
          score,
        };
      }
    }
  }


  if (!best) {
    return null;
  }


  return {
    line:
      best.line,

    alias:
      best.alias,
  };
}


/**
 * ================================================================
 * EXTRACT METRIC SERIES
 * ================================================================
 */

function extractMetricSeries(
  lines: string[],
  aliases: string[],
  periodCount: number,
  globalUnit: FinancialUnit,
  options?: {
    exclusions?: string[];
    monetary?: boolean;
  }
): MetricSeries {

  const monetary =
    options?.monetary ??
    false;


  const match =
    findBestMetricLine(
      lines,
      aliases,
      periodCount,
      options?.exclusions ??
        [],
      monetary
    );


  if (!match) {

    return {
      values:
        new Array(
          periodCount
        ).fill(
          undefined
        ),
    };
  }


  const remaining =
    removeLeadingMetadata(
      removeMetricLabel(
        match.line,
        match.alias
      )
    );


  const tokens =
    extractNumberTokens(
      remaining
    );


  /**
   * Only take the first periodCount values
   * after the metric metadata has been removed.
   */

  const rawValues =
    tokens
      .slice(
        0,
        periodCount
      )
      .map(
        (
          token
        ) =>
          parseFinancialNumber(
            token
          )
      );


  const rowUnit =
    monetary
      ? (
          detectUnit(
            match.line
          ) !== "unknown"
            ? detectUnit(
                match.line
              )
            : globalUnit
        )
      : undefined;


  const values =
    monetary
      ? rawValues.map(
          (
            value
          ) =>
            convertToCrore(
              value,
              rowUnit ??
                "unknown"
            )
        )
      : rawValues;


  return {
    values,
    sourceLine:
      match.line,
    unit:
      rowUnit,
  };
}

/**
 * ================================================================
 * EXTRACT BASIC EPS FROM SPLIT EPS TABLE
 *
 * Handles prospectus layouts such as:
 *
 * Earnings per share of face value of ₹4 each
 * - Basic, computed on the basis of profit attributable ...
 *   7.51 8.06 7.33
 *
 * Important:
 *
 * The face value (₹4) belongs to the heading and must NOT
 * be treated as an EPS value.
 * ================================================================
 */

function extractBasicEPSSeries(
  lines: string[],
  periodCount: number
): MetricSeries {

  for (
    let index = 0;
    index < lines.length;
    index++
  ) {

    const line =
      lines[index];


    const normalized =
      normalizeSearchText(
        line
      );


    /**
     * ------------------------------------------------
     * Find an EPS section heading.
     * ------------------------------------------------
     */

    const isEPSHeading =
      normalized.includes(
        "earnings per share"
      ) ||
      normalized.includes(
        "earnings per equity share"
      );


    if (
      !isEPSHeading
    ) {
      continue;
    }


    /**
     * ------------------------------------------------
     * Search the next few lines for the BASIC row.
     *
     * Do not extract numbers from the heading because
     * it may contain face value such as ₹4.
     * ------------------------------------------------
     */

    const searchEnd =
      Math.min(
        lines.length,
        index + 8
      );


    for (
      let rowIndex =
        index + 1;
      rowIndex <
        searchEnd;
      rowIndex++
    ) {

      const row =
        lines[
          rowIndex
        ];


      const normalizedRow =
        normalizeSearchText(
          row
        );


      /**
       * Skip diluted row.
       */

      if (
        normalizedRow.includes(
          "diluted"
        )
      ) {
        continue;
      }


      /**
       * We specifically want the BASIC row.
       */

      if (
        !/\bbasic\b/i.test(
          normalizedRow
        )
      ) {
        continue;
      }


      /**
       * ------------------------------------------------
       * First try values on the Basic row itself.
       * ------------------------------------------------
       */

      let combined =
        row;


      let tokens =
        extractNumberTokens(
          combined
        );


      /**
       * ------------------------------------------------
       * If the PDF split the values onto following lines,
       * collect up to the next three lines.
       * ------------------------------------------------
       */

      for (
        let offset = 1;
        offset <= 3 &&
        tokens.length <
          periodCount;
        offset++
      ) {

        const nextLine =
          lines[
            rowIndex +
            offset
          ];


        if (
          !nextLine
        ) {
          break;
        }


        const normalizedNext =
          normalizeSearchText(
            nextLine
          );


        /**
         * Stop if we reach the diluted row.
         */

        if (
          normalizedNext.includes(
            "diluted"
          )
        ) {
          break;
        }


        combined +=
          ` ${nextLine}`;


        tokens =
          extractNumberTokens(
            combined
          );
      }


      if (
        tokens.length >=
        periodCount
      ) {

        const values =
          tokens
            .slice(
              -periodCount
            )
            .map(
              (
                token
              ) =>
                parseFinancialNumber(
                  token
                )
            );


        return {

          values,

          sourceLine:
            `${line} → ${row} [EPS table]`,
        };
      }
    }
  }


  return {

    values:
      new Array(
        periodCount
      ).fill(
        undefined
      ),
  };
}

/**
 * ================================================================
 * CALCULATE MARGIN
 * ================================================================
 */

function calculateMargin(
  numerator?: number,
  denominator?: number
): number | undefined {

  if (
    numerator === undefined ||
    denominator === undefined ||
    denominator === 0
  ) {
    return undefined;
  }


  return Number(
    (
      numerator /
      denominator *
      100
    ).toFixed(2)
  );
}


/**
 * ================================================================
 * CAGR
 * ================================================================
 */

function calculateCAGR(
  start?: number,
  end?: number,
  years?: number
): number | undefined {

  if (
    start === undefined ||
    end === undefined ||
    years === undefined ||
    years <= 0 ||
    start <= 0 ||
    end <= 0
  ) {
    return undefined;
  }


  return Number(
    (
      (
        Math.pow(
          end / start,
          1 / years
        ) -
        1
      ) *
      100
    ).toFixed(2)
  );
}


/**
 * ================================================================
 * GET SERIES VALUE
 * ================================================================
 */

function valueAt(
  series: MetricSeries,
  index: number
): number | undefined {

  return series.values[
    index
  ];
}


/**
 * ================================================================
 * MAIN PARSER
 * ================================================================
 */

export function parseSEBIFinancials(
  extraction: SEBIFinancialExtraction,
  companyName: string,
  symbol?: string
): IPOFinancialData | null {

  const text =
    findRelevantText(
      extraction
    );


  if (!text) {

    console.warn(
      "SEBI financial parser received empty text:",
      companyName
    );

    return null;
  }


  /**
   * ------------------------------------------------
   * STEP 1
   * Detect reporting periods
   * ------------------------------------------------
   */

  const periods =
    detectPeriods(
      text
    );


  if (
    periods.length < 2
  ) {

    console.warn(
      "Unable to detect sufficient financial periods:",
      companyName
    );

    return null;
  }


  const periodCount =
    periods.length;


  /**
   * ------------------------------------------------
   * STEP 2
   * Detect global monetary unit
   * ------------------------------------------------
   */

  const globalUnit =
    detectUnit(
      text
    );


  if (
    globalUnit ===
    "unknown"
  ) {

    console.warn(
      "Unable to determine financial reporting unit:",
      companyName
    );

    /**
     * We continue because individual KPI rows
     * may explicitly contain units.
     */
  }


  /**
   * ------------------------------------------------
   * STEP 3
   * Split prospectus text into rows
   * ------------------------------------------------
   */

  const lines =
    getLines(
      text
    );


  /**
   * ------------------------------------------------
   * STEP 4
   * Monetary metrics
   * ------------------------------------------------
   */

  const revenue =
    extractMetricSeries(
      lines,
      [
        "Revenue from operations",
      ],
      periodCount,
      globalUnit,
      {
        exclusions: [
          "growth",
        ],
        monetary:
          true,
      }
    );


  const ebitda =
    extractMetricSeries(
      lines,
      [
        "EBITDA",
      ],
      periodCount,
      globalUnit,
      {
        exclusions: [
          "margin",
        ],
        monetary:
          true,
      }
    );


  const pat =
  extractMetricSeries(
    lines,
    [
      "Profit / Loss for the period/year",
      "Profit for the year",
      "Profit for the period",
      "Profit after tax",
      "Net profit",
    ],
    periodCount,
    globalUnit,
    {
      exclusions: [
        "margin",
        "growth",
        "earnings per share",

        // Exclude profits belonging to associates / JVs
        "share of net profit",
        "share of profit",
        "joint venture",
        "associate",
        "equity method",

        // Avoid attribution / reconciliation rows
        "non-controlling interest",
        "attributable to",
        "adjusted pat",
        "adjusted profit",
      ],
      monetary:
        true,
    }
  );

  const totalAssets =
    extractMetricSeries(
      lines,
      [
        "Total Assets",
        "Total assets",
      ],
      periodCount,
      globalUnit,
      {
        monetary:
          true,
      }
    );


  /**
   * Prefer Total Equity because the normalized
   * STFL model uses totalEquity.
   *
   * Net Worth remains a fallback.
   */

  const totalEquity =
    extractMetricSeries(
      lines,
      [
        "Total Equity",
        "Net Worth",
      ],
      periodCount,
      globalUnit,
      {
        exclusions: [
          "return on",
        ],
        monetary:
          true,
      }
    );


  const totalDebt =
    extractMetricSeries(
      lines,
      [
        "Total Borrowings",
        "Total borrowings",
        "Total Debt",
        "Total debt",
      ],
      periodCount,
      globalUnit,
      {
        monetary:
          true,
      }
    );


  const operatingCashFlow =
    extractMetricSeries(
      lines,
      [
        "Net cash generated from/(used in) operating activities",
        "Net cash generated from operating activities",
        "Net cash from operating activities",
        "Cash flow from operating activities",
      ],
      periodCount,
      globalUnit,
      {
        monetary:
          true,
      }
    );


  /**
   * ------------------------------------------------
   * STEP 5
   * Non-monetary metrics
   * ------------------------------------------------
   */

  const epsAliases = [
  "Earnings per share - Basic",
  "Earnings per share – Basic",
  "Earnings per share (Basic)",
  "Basic earnings per share",
  "Basic Earnings Per Share",
  "Basic EPS",

  "Earnings per equity share - Basic",
  "Earnings per equity share – Basic",
  "Earnings per equity share (Basic)",
  "Basic earnings per equity share",

  "Basic earnings per share of face value",
  "Basic earnings per equity share of face value",
];


const epsSingleLine =
  extractMetricSeries(
    lines,
    epsAliases,
    periodCount,
    globalUnit,
    {
      exclusions: [
        "diluted",
        "weighted average number of shares",
        "weighted average equity shares",
      ],
    }
  );


const epsMultiLine =
  extractMetricSeriesMultiLine(
    lines,
    epsAliases,
    periodCount,
    {
      exclusions: [
        "diluted",
        "weighted average number of shares",
        "weighted average equity shares",
      ],
    }
  );


const eps =
  epsSingleLine.values.some(
    (
      value
    ) =>
      value !==
      undefined
  )
    ? epsSingleLine

    : epsMultiLine.values.some(
        (
          value
        ) =>
          value !==
          undefined
      )
      ? epsMultiLine

      : extractBasicEPSSeries(
          lines,
          periodCount
        );
        
  const ebitdaMargin =
    extractMetricSeries(
      lines,
      [
        "EBITDA margin",
        "EBITDA Margin",
      ],
      periodCount,
      globalUnit
    );


  const patMargin =
    extractMetricSeries(
      lines,
      [
        "Profit for the year margin",
        "Profit margin",
        "PAT margin",
        "Net profit margin",
      ],
      periodCount,
      globalUnit
    );


  const roe =
    extractMetricSeries(
      lines,
      [
        "Return on Equity",
        "Return on Net Worth",
      ],
      periodCount,
      globalUnit
    );


  const roceAliases = [
  "Return on Capital Employed (C/J)%",
  "Return on Capital Employed (%)",
  "Return on Capital Employed",
  "ROCE",
];


const roceSingleLine =
  extractMetricSeries(
    lines,
    roceAliases,
    periodCount,
    globalUnit,
    {
      exclusions: [
        "reconciliation",
      ],
    }
  );


const roce =
  roceSingleLine.values.some(
    (
      value
    ) =>
      value !==
      undefined
  )
    ? roceSingleLine

    : extractMetricSeriesMultiLine(
        lines,
        roceAliases,
        periodCount,
        {
          exclusions: [
            "reconciliation",
          ],
        }
      );
      
      const debtEquity =
    extractMetricSeries(
      lines,
      [
        "Debt to Equity",
        "Debt-to-Equity",
        "Debt Equity",
      ],
      periodCount,
      globalUnit
    );

/**
 * ================================================================
 * EXTRACT METRIC SERIES ACROSS ADJACENT LINES
 *
 * Some PDF tables split:
 *
 * label
 * value1 value2 value3
 *
 * or:
 *
 * label value1
 * value2 value3
 *
 * across multiple extracted lines.
 * ================================================================
 */

function extractMetricSeriesMultiLine(
  lines: string[],
  aliases: string[],
  periodCount: number,
  options?: {
    exclusions?: string[];
  }
): MetricSeries {

  const exclusions =
    options?.exclusions ??
    [];


  for (
    let index = 0;
    index < lines.length;
    index++
  ) {

    const line =
      lines[index];


    const normalizedLine =
      normalizeSearchText(
        line
      );


    if (
      exclusions.some(
        (
          exclusion
        ) =>
          normalizedLine.includes(
            normalizeSearchText(
              exclusion
            )
          )
      )
    ) {
      continue;
    }


    for (
      const alias
      of aliases
    ) {

      const position =
        findMetricAliasPosition(
          line,
          alias
        );


      if (
        position < 0
      ) {
        continue;
      }


      /**
       * Start with the metric line itself.
       */

      let combined =
        removeLeadingMetadata(
          removeMetricLabel(
            line,
            alias
          )
        );


      let tokens =
        extractNumberTokens(
          combined
        );


      /**
       * Pull in the next few lines until we have
       * enough values.
       */

      for (
        let offset = 1;
        offset <= 3 &&
        tokens.length < periodCount;
        offset++
      ) {

        const nextLine =
          lines[
            index + offset
          ];


        if (
          !nextLine
        ) {
          break;
        }


        combined +=
          ` ${nextLine}`;


        tokens =
          extractNumberTokens(
            combined
          );
      }


      if (
        tokens.length >=
        periodCount
      ) {

        const values =
          tokens
            .slice(
              0,
              periodCount
            )
            .map(
              (
                token
              ) =>
                parseFinancialNumber(
                  token
                )
            );


        return {

          values,

          sourceLine:
            `${line} [multi-line]`,
        };
      }
    }
  }


  return {

    values:
      new Array(
        periodCount
      ).fill(
        undefined
      ),
  };
}

  /**
   * ------------------------------------------------
   * STEP 6
   * Build records in source order first
   *
   * Example source:
   *
   * FY26
   * FY25
   * FY24
   * ------------------------------------------------
   */

  const sourceOrderYears:
    IPOFinancialYear[] =
    periods.map(
      (
        period,
        index
      ) => {

        const revenueValue =
          valueAt(
            revenue,
            index
          );


        const ebitdaValue =
          valueAt(
            ebitda,
            index
          );


        const patValue =
          valueAt(
            pat,
            index
          );


        /**
         * Prefer issuer-reported margins.
         *
         * Calculate only as fallback.
         */

        const reportedEbitdaMargin =
          valueAt(
            ebitdaMargin,
            index
          );


        const reportedPatMargin =
          valueAt(
            patMargin,
            index
          );


        return {

          period:
            period.label,

          revenue:
            revenueValue,

          ebitda:
            ebitdaValue,

          pat:
            patValue,

          totalAssets:
            valueAt(
              totalAssets,
              index
            ),

          totalEquity:
            valueAt(
              totalEquity,
              index
            ),

          totalDebt:
            valueAt(
              totalDebt,
              index
            ),

          operatingCashFlow:
            valueAt(
              operatingCashFlow,
              index
            ),

          eps:
            valueAt(
              eps,
              index
            ),

          ebitdaMargin:
            reportedEbitdaMargin ??
            calculateMargin(
              ebitdaValue,
              revenueValue
            ),

          patMargin:
            reportedPatMargin ??
            calculateMargin(
              patValue,
              revenueValue
            ),

          roe:
            valueAt(
              roe,
              index
            ),

          roce:
            valueAt(
              roce,
              index
            ),

          debtEquity:
  valueAt(
    debtEquity,
    index
  ) ??
  (
    valueAt(
      totalDebt,
      index
    ) !== undefined &&
    valueAt(
      totalEquity,
      index
    ) !== undefined &&
    valueAt(
      totalEquity,
      index
    ) !== 0
      ? Number(
          (
            valueAt(
              totalDebt,
              index
            )! /
            valueAt(
              totalEquity,
              index
            )!
          ).toFixed(2)
        )
      : undefined
  ),
        };
      }
    );


  /**
   * ------------------------------------------------
   * STEP 7
   * Validate basic financial usefulness
   * ------------------------------------------------
   */

  const hasFinancialData =
    sourceOrderYears.some(
      (
        year
      ) =>
        year.revenue !==
          undefined ||
        year.pat !==
          undefined ||
        year.ebitda !==
          undefined
    );


  if (
    !hasFinancialData
  ) {

    console.warn(
      "SEBI parser found no usable financial metrics:",
      companyName
    );

    return null;
  }


  /**
   * ------------------------------------------------
   * STEP 8
   * Sort chronologically for UI:
   *
   * FY24
   * FY25
   * FY26
   * ------------------------------------------------
   */

  const years =
    [...sourceOrderYears]
      .sort(
        (
          a,
          b
        ) => {

          const aPeriod =
            periods.find(
              (
                item
              ) =>
                item.label ===
                a.period
            );


          const bPeriod =
            periods.find(
              (
                item
              ) =>
                item.label ===
                b.period
            );


          return (
            (
              aPeriod?.year ??
              0
            ) -
            (
              bPeriod?.year ??
              0
            )
          );
        }
      );


  /**
   * ------------------------------------------------
   * STEP 9
   * CAGR
   *
   * Only calculate when periods represent
   * consecutive full-year FY labels.
   * ------------------------------------------------
   */

  const oldest =
    years[0];


  const newest =
    years[
      years.length -
      1
    ];


  const oldestPeriod =
    periods.find(
      (
        item
      ) =>
        item.label ===
        oldest?.period
    );


  const newestPeriod =
    periods.find(
      (
        item
      ) =>
        item.label ===
        newest?.period
    );


  const yearDifference =
    oldestPeriod &&
    newestPeriod
      ? newestPeriod.year -
        oldestPeriod.year
      : undefined;


  const allFullYears =
    years.every(
      (
        year
      ) =>
        /^FY\d{2}$/.test(
          year.period
        )
    );


  const revenueCagr =
    allFullYears
      ? calculateCAGR(
          oldest?.revenue,
          newest?.revenue,
          yearDifference
        )
      : undefined;


  const patCagr =
    allFullYears
      ? calculateCAGR(
          oldest?.pat,
          newest?.pat,
          yearDifference
        )
      : undefined;


  /**
   * ------------------------------------------------
   * DEBUG INFORMATION
   *
   * Keep temporarily during parser validation.
   * ------------------------------------------------
   */

  console.log(
    "===== STFL FINANCIAL PARSER ====="
  );

  console.log(
    "Company:",
    companyName
  );

  console.log(
    "Periods:",
    periods.map(
      (
        period
      ) =>
        period.label
    )
  );

  console.log(
    "Global Unit:",
    globalUnit
  );

  console.log(
    "Revenue Source:",
    revenue.sourceLine
  );

  console.log(
    "EBITDA Source:",
    ebitda.sourceLine
  );

  console.log(
    "PAT Source:",
    pat.sourceLine
  );

  console.log(
    "Equity Source:",
    totalEquity.sourceLine
  );

  console.log(
    "Debt Source:",
    totalDebt.sourceLine
  );

  console.log(
    "EPS Source:",
    eps.sourceLine
  );

  console.log(
  "Assets Source:",
  totalAssets.sourceLine
);

console.log(
  "Operating Cash Flow Source:",
  operatingCashFlow.sourceLine
);

console.log(
  "EBITDA Margin Source:",
  ebitdaMargin.sourceLine
);

console.log(
  "PAT Margin Source:",
  patMargin.sourceLine
);

console.log(
  "ROE Source:",
  roe.sourceLine
);

console.log(
  "ROCE Source:",
  roce.sourceLine
);

console.log(
  "Debt Equity Source:",
  debtEquity.sourceLine
);

  console.log(
    "Years:",
    years
  );


  /**
   * ------------------------------------------------
   * STEP 10
   * Return normalized STFL model
   * ------------------------------------------------
   */

  return {

    symbol,

    companyName,

    currency:
      "INR",

    unit:
      "Cr",

    years,

    revenueCagr,

    patCagr,

    source:
      "SEBI Prospectus",

    sourceUrl:
      extraction.pdfUrl,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}