/**
 * ================================================================
 * STFL SEBI Financial Extractor
 * File: providers/sebiFinancials.ts
 *
 * Strategy
 *
 * SMALL DOCUMENTS
 *   → read complete document page-by-page
 *
 * LARGE DRHP / RHP
 *   → read TOC pages only
 *   → locate Restated Financial Information page reference
 *   → jump close to that page
 *   → locate actual financial statement
 *   → extract a bounded financial section
 *
 * No company-specific page numbers are hard-coded.
 * ================================================================
 */

import {
  getDocumentProxy,
} from "unpdf";


/**
 * ================================================================
 * TYPES
 * ================================================================
 */

export interface SEBIPDFPage {
  pageNumber: number;
  text: string;
}


export interface SEBIFinancialExtraction {
  pdfUrl: string;

  totalPages: number;

  financialPages: SEBIPDFPage[];

  matchedKeywords: string[];

  extractedAt: string;
}


type PDFDocument =
  Awaited<
    ReturnType<
      typeof getDocumentProxy
    >
  >;


/**
 * ================================================================
 * CONFIGURATION
 * ================================================================
 */

const SHORT_DOCUMENT_THRESHOLD =
  80;


/**
 * Large prospectuses normally contain TOC within the
 * first few pages.
 */
const TOC_SCAN_PAGES =
  30;


/**
 * A prospectus page number and physical PDF page number
 * can differ because of covers and preliminary pages.
 *
 * Therefore search around the TOC reference.
 */
const TOC_SEARCH_BEFORE =
  20;

const TOC_SEARCH_AFTER =
  35;


/**
 * Once the actual financial statement is located,
 * keep a controlled financial section.
 */
const FINANCIAL_SECTION_BEFORE =
  2;

const FINANCIAL_SECTION_AFTER =
  45;


/**
 * If TOC parsing fails, scan every Nth page.
 *
 * This is far cheaper than reading all 500–700 pages.
 */
const FALLBACK_SCAN_STEP =
  5;

  /**
 * ================================================================
 * FINANCIAL SUMMARY LOCATOR CONFIG
 *
 * Used to locate high-value comparative financial tables such as:
 *
 * FY2025 | FY2024 | FY2023
 * Revenue
 * PAT
 * EBITDA
 * EPS
 *
 * We do not require any one exact phrase.
 * ================================================================
 */

const SUMMARY_SCAN_STEP =
  4;

const SUMMARY_REFINE_RADIUS =
  6;

const SUMMARY_WINDOW_BEFORE =
  2;

const SUMMARY_WINDOW_AFTER =
  5;

const SUMMARY_TOP_CANDIDATES =
  6;

const SUMMARY_MIN_SCORE =
  45;

  /**
 * ================================================================
 * FINANCIAL KPI LOCATOR CONFIG
 *
 * Used to locate KPI / valuation tables containing combinations of:
 *
 * EPS
 * RoNW / ROE
 * NAV per share
 * EBITDA
 * Debt / Equity
 * comparative fiscal years
 *
 * No company-specific page numbers are used.
 * ================================================================
 */

const KPI_SCAN_STEP =
  4;

const KPI_REFINE_RADIUS =
  6;

const KPI_WINDOW_BEFORE =
  1;

const KPI_WINDOW_AFTER =
  3;

const KPI_TOP_CANDIDATES =
  6;

const KPI_MIN_SCORE =
  50;

/**
 * ================================================================
 * TOC ANCHORS
 * ================================================================
 */

const TOC_FINANCIAL_ANCHORS = [

  "restated consolidated financial information",

  "restated financial information",

  "restated consolidated financial statements",

  "restated financial statements",

];


/**
 * ================================================================
 * ACTUAL FINANCIAL STATEMENT SIGNALS
 *
 * These are stronger than generic words such as profit/debt.
 * ================================================================
 */

const STATEMENT_SIGNALS = [

  "restated consolidated statement of assets and liabilities",

  "restated statement of assets and liabilities",

  "statement of assets and liabilities",

  "restated consolidated statement of profit and loss",

  "restated statement of profit and loss",

  "statement of profit and loss",

  "restated consolidated statement of cash flows",

  "restated statement of cash flows",

  "statement of cash flows",

  "cash flow statement",

];


/**
 * ================================================================
 * FINANCIAL KEYWORDS
 * ================================================================
 */

const FINANCIAL_KEYWORDS = [

  "restated consolidated financial information",

  "restated financial information",

  "restated consolidated financial statements",

  "restated financial statements",

  "statement of assets and liabilities",

  "statement of profit and loss",

  "statement of cash flows",

  "cash flow statement",

  "revenue from operations",

  "total income",

  "ebitda",

  "profit before tax",

  "profit after tax",

  "profit for the year",

  "profit for the period",

  "net profit",

  "net worth",

  "total equity",

  "total borrowings",

  "borrowings",

  "earnings per share",

  "basic earnings per share",

  "diluted earnings per share",

  "return on net worth",

  "return on equity",

  "return on capital employed",

  "debt to equity",

  "debt-equity",

];


/**
 * ================================================================
 * NORMALIZE TEXT
 * ================================================================
 */

function normalizeText(
  value: string
): string {

  return value
    .replace(
      /\u00a0/g,
      " "
    )
    .replace(
      /\r/g,
      "\n"
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}


function normalizeSearchText(
  value: string
): string {

  return value
    .toLowerCase()
    .replace(
      /[–—]/g,
      "-"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/**
 * ================================================================
 * DOWNLOAD PDF
 * ================================================================
 */

async function fetchPDF(
  pdfUrl: string
): Promise<
  Uint8Array | null
> {

  try {

    const response =
      await fetch(
        pdfUrl,
        {
          method:
            "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",

            Accept:
              "application/pdf,*/*",

            "Accept-Language":
              "en-US,en;q=0.9",

            Referer:
              "https://www.sebi.gov.in/",
          },

          cache:
            "no-store",
        }
      );


    if (
      !response.ok
    ) {

      console.error(
        "SEBI PDF request failed:",
        response.status,
        response.statusText
      );


      return null;
    }


    const buffer =
      await response.arrayBuffer();


    if (
      buffer.byteLength ===
      0
    ) {

      console.error(
        "SEBI returned an empty PDF."
      );


      return null;
    }


    console.log(
      "SEBI PDF downloaded:",
      (
        buffer.byteLength /
        1024 /
        1024
      ).toFixed(2),
      "MB"
    );


    return new Uint8Array(
      buffer
    );

  } catch (error) {

    console.error(
      "Unable to download SEBI PDF:",
      error
    );


    return null;
  }
}


/**
 * ================================================================
 * EXTRACT ONE PDF PAGE
 *
 * We deliberately do NOT call extractText() for the full PDF.
 * ================================================================
 */

async function extractSinglePage(
  pdf: PDFDocument,
  pageNumber: number
): Promise<string> {

  try {

    const page =
      await pdf.getPage(
        pageNumber
      );


    const content =
      await page.getTextContent();


    const output:
      string[] = [];


    for (
      const item
      of content.items
    ) {

      if (
        "str" in item &&
        typeof item.str ===
          "string"
      ) {

        output.push(
          item.str
        );


        if (
          "hasEOL" in item &&
          item.hasEOL
        ) {

          output.push(
            "\n"
          );

        } else {

          output.push(
            " "
          );
        }
      }
    }


    const text =
      normalizeText(
        output.join(
          ""
        )
      );


    page.cleanup();


    return text;

  } catch (error) {

    console.warn(
      "Unable to extract SEBI PDF page:",
      pageNumber,
      error
    );


    return "";
  }
}


/**
 * ================================================================
 * PAGE CACHE
 * ================================================================
 */

async function getPageText(
  pdf: PDFDocument,
  cache: Map<
    number,
    string
  >,
  pageNumber: number
): Promise<string> {

  const cached =
    cache.get(
      pageNumber
    );


  if (
    cached !==
    undefined
  ) {

    return cached;
  }


  const text =
    await extractSinglePage(
      pdf,
      pageNumber
    );


  cache.set(
    pageNumber,
    text
  );


  return text;
}


/**
 * ================================================================
 * FINANCIAL KEYWORDS
 * ================================================================
 */

function findKeywords(
  text: string
): string[] {

  const normalized =
    normalizeSearchText(
      text
    );


  return FINANCIAL_KEYWORDS.filter(
    (
      keyword
    ) =>
      normalized.includes(
        keyword
      )
  );
}


/**
 * ================================================================
 * PAGE QUALITY
 * ================================================================
 */

function statementScore(
  text: string
): number {

  const normalized =
    normalizeSearchText(
      text
    );


  if (
    normalized.includes(
      "table of contents"
    )
  ) {

    return -100;
  }


  let score =
    0;


  if (
    normalized.includes(
      "restated consolidated statement of assets and liabilities"
    )
  ) {
    score += 120;
  }


  if (
    normalized.includes(
      "restated statement of assets and liabilities"
    )
  ) {
    score += 110;
  }


  if (
    normalized.includes(
      "statement of assets and liabilities"
    )
  ) {
    score += 100;
  }


  if (
    normalized.includes(
      "restated consolidated statement of profit and loss"
    )
  ) {
    score += 110;
  }


  if (
    normalized.includes(
      "statement of profit and loss"
    )
  ) {
    score += 90;
  }


  if (
    normalized.includes(
      "statement of cash flows"
    )
  ) {
    score += 80;
  }


  if (
    normalized.includes(
      "independent auditor"
    ) &&
    normalized.includes(
      "restated consolidated financial information"
    )
  ) {
    score += 50;
  }


  if (
    normalized.includes(
      "revenue from operations"
    )
  ) {
    score += 15;
  }


  if (
    normalized.includes(
      "net worth"
    )
  ) {
    score += 10;
  }


  if (
    normalized.includes(
      "earnings per share"
    )
  ) {
    score += 10;
  }


  return score;
}


/**
 * ================================================================
 * DOES PAGE LOOK FINANCIAL?
 * ================================================================
 */

function isUsefulFinancialPage(
  text: string
): boolean {

  const normalized =
    normalizeSearchText(
      text
    );


  if (
    !normalized
  ) {
    return false;
  }


  if (
    STATEMENT_SIGNALS.some(
      (
        signal
      ) =>
        normalized.includes(
          signal
        )
    )
  ) {

    return true;
  }


  if (
    normalized.includes(
      "revenue from operations"
    ) &&
    (
      normalized.includes(
        "profit"
      ) ||
      normalized.includes(
        "ebitda"
      )
    )
  ) {

    return true;
  }


  if (
    findKeywords(
      text
    ).length >=
    4
  ) {

    return true;
  }


  return false;
}

/**
 * ================================================================
 * COUNT DISTINCT FINANCIAL YEARS
 *
 * Examples:
 *
 * Fiscal 2025
 * March 31, 2024
 * FY2023
 * ================================================================
 */

function countFinancialYears(
  text: string
): number {

  const matches =
    text.match(
      /\b20\d{2}\b/g
    ) ?? [];


  return new Set(
    matches
  ).size;
}


/**
 * ================================================================
 * FINANCIAL SUMMARY PAGE SCORE
 *
 * Important:
 *
 * No single phrase is mandatory.
 *
 * Pages receive a higher score when multiple financial concepts,
 * comparative years and profitability metrics appear together.
 * ================================================================
 */

function financialSummaryScore(
  text: string
): number {

  const normalized =
    normalizeSearchText(
      text
    );


  if (
    !normalized
  ) {
    return 0;
  }


  /**
   * Avoid obvious false positives.
   */

  if (
    normalized.includes(
      "table of contents"
    ) ||
    normalized.includes(
      "definitions and abbreviations"
    )
  ) {

    return -100;
  }


  let score =
    0;


  const hasRevenue =
    normalized.includes(
      "revenue from operations"
    );


  const hasTotalIncome =
    normalized.includes(
      "total income"
    );


  const hasEBITDA =
    normalized.includes(
      "ebitda"
    );


  const hasPAT =
    normalized.includes(
      "profit after tax"
    ) ||
    normalized.includes(
      "profit for the year"
    ) ||
    normalized.includes(
      "profit for the period"
    ) ||
    normalized.includes(
      "net profit"
    );


  const hasEPS =
    normalized.includes(
      "earnings per share"
    );


  const hasNetWorth =
    normalized.includes(
      "net worth"
    ) ||
    normalized.includes(
      "total equity"
    );


  const hasBorrowings =
    normalized.includes(
      "borrowings"
    ) ||
    normalized.includes(
      "total debt"
    );


  /**
   * ------------------------------------------------
   * Individual financial signals
   * ------------------------------------------------
   */

  if (
    hasRevenue
  ) {
    score += 25;
  }


  if (
    hasTotalIncome
  ) {
    score += 10;
  }


  if (
    hasEBITDA
  ) {
    score += 15;
  }


  if (
    hasPAT
  ) {
    score += 25;
  }


  if (
    hasEPS
  ) {
    score += 15;
  }


  if (
    hasNetWorth
  ) {
    score += 12;
  }


  if (
    hasBorrowings
  ) {
    score += 10;
  }


  /**
   * ------------------------------------------------
   * Useful heading signals
   *
   * These improve the score but are NOT mandatory.
   * ------------------------------------------------
   */

  if (
    normalized.includes(
      "results of operations"
    )
  ) {
    score += 12;
  }


  if (
    normalized.includes(
      "selected financial data"
    )
  ) {
    score += 15;
  }


  if (
    normalized.includes(
      "summary of financial information"
    ) ||
    normalized.includes(
      "summary financial information"
    )
  ) {
    score += 15;
  }


  if (
    normalized.includes(
      "financial performance"
    )
  ) {
    score += 10;
  }


  /**
   * ------------------------------------------------
   * Comparative year structure
   * ------------------------------------------------
   */

  const yearCount =
    countFinancialYears(
      text
    );


  if (
    yearCount >=
    3
  ) {

    score += 30;

  } else if (
    yearCount ===
    2
  ) {

    score += 15;
  }


  /**
   * ------------------------------------------------
   * Combination bonuses
   *
   * These are especially important.
   * ------------------------------------------------
   */

  if (
    hasRevenue &&
    hasPAT
  ) {

    score += 30;
  }


  if (
    hasRevenue &&
    hasPAT &&
    yearCount >=
      3
  ) {

    score += 25;
  }


  if (
    hasRevenue &&
    hasEBITDA &&
    hasPAT
  ) {

    score += 30;
  }


  if (
    hasRevenue &&
    hasPAT &&
    hasEPS
  ) {

    score += 25;
  }


  return score;
}


/**
 * ================================================================
 * LOCATE BEST FINANCIAL SUMMARY PAGE
 *
 * Two-stage search:
 *
 * PASS 1
 * Sparse scan every few pages.
 *
 * PASS 2
 * Fully scan around the strongest candidate zones.
 *
 * This avoids reading all 500–700 pages.
 * ================================================================
 */

async function locateFinancialSummaryPage(
  pdf: PDFDocument,
  totalPages: number,
  cache: Map<
    number,
    string
  >
): Promise<
  number | undefined
> {

  const coarseCandidates:
    {
      pageNumber: number;
      score: number;
    }[] = [];


  /**
   * ------------------------------------------------
   * PASS 1 — sparse scan
   * ------------------------------------------------
   */

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += SUMMARY_SCAN_STEP
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    const score =
      financialSummaryScore(
        text
      );


    if (
      score >
      0
    ) {

      coarseCandidates.push({
        pageNumber,
        score,
      });
    }
  }


  coarseCandidates.sort(
    (
      a,
      b
    ) =>
      b.score -
      a.score
  );


  const strongestZones =
    coarseCandidates.slice(
      0,
      SUMMARY_TOP_CANDIDATES
    );


  if (
    strongestZones.length ===
    0
  ) {

    console.log(
      "No financial summary candidates found."
    );


    return undefined;
  }


  /**
   * ------------------------------------------------
   * PASS 2 — refine around strong zones
   * ------------------------------------------------
   */

  let bestPage:
    number | undefined;


  let bestScore =
    0;


  const inspected =
    new Set<number>();


  for (
    const candidate
    of strongestZones
  ) {

    const start =
      Math.max(
        1,
        candidate.pageNumber -
          SUMMARY_REFINE_RADIUS
      );


    const end =
      Math.min(
        totalPages,
        candidate.pageNumber +
          SUMMARY_REFINE_RADIUS
      );


    for (
      let pageNumber = start;
      pageNumber <= end;
      pageNumber++
    ) {

      if (
        inspected.has(
          pageNumber
        )
      ) {
        continue;
      }


      inspected.add(
        pageNumber
      );


      const text =
        await getPageText(
          pdf,
          cache,
          pageNumber
        );


      const score =
        financialSummaryScore(
          text
        );


      if (
        score >
        bestScore
      ) {

        bestScore =
          score;

        bestPage =
          pageNumber;
      }
    }
  }


  if (
    bestPage !==
      undefined &&
    bestScore >=
      SUMMARY_MIN_SCORE
  ) {

    console.log(
      "Best financial summary page:",
      bestPage,
      "score:",
      bestScore
    );


    return bestPage;
  }


  console.log(
    "No sufficiently strong financial summary page found.",
    "Best score:",
    bestScore
  );


  return undefined;
}


/**
 * ================================================================
 * EXTRACT FINANCIAL SUMMARY WINDOW
 * ================================================================
 */

async function extractFinancialSummaryWindow(
  pdf: PDFDocument,
  totalPages: number,
  summaryPage: number,
  cache: Map<
    number,
    string
  >
): Promise<{
  pages: SEBIPDFPage[];
  keywords: Set<string>;
}> {

  const start =
    Math.max(
      1,
      summaryPage -
        SUMMARY_WINDOW_BEFORE
    );


  const end =
    Math.min(
      totalPages,
      summaryPage +
        SUMMARY_WINDOW_AFTER
    );


  console.log(
    "Extracting financial summary window:",
    start,
    "to",
    end
  );


  const pages:
    SEBIPDFPage[] = [];


  const keywords =
    new Set<string>();


  for (
    let pageNumber = start;
    pageNumber <= end;
    pageNumber++
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    if (
      !text
    ) {
      continue;
    }


    pages.push({
      pageNumber,
      text,
    });


    findKeywords(
      text
    ).forEach(
      (
        keyword
      ) =>
        keywords.add(
          keyword
        )
    );
  }


  return {
    pages,
    keywords,
  };
}

/**
 * ================================================================
 * FINANCIAL KPI PAGE SCORE
 *
 * Looks for dense financial KPI tables.
 *
 * No single phrase is mandatory.
 * ================================================================
 */

function financialKPIScore(
  text: string
): number {

  const normalized =
    normalizeSearchText(
      text
    );


  if (
    !normalized
  ) {
    return 0;
  }


  if (
    normalized.includes(
      "table of contents"
    ) ||
    normalized.includes(
      "definitions and abbreviations"
    )
  ) {

    return -100;
  }


  let score =
    0;


  const hasBasicEPS =
    normalized.includes(
      "basic eps"
    ) ||
    normalized.includes(
      "basic earnings per share"
    ) ||
    normalized.includes(
      "basic earnings per equity share"
    );


  const hasDilutedEPS =
    normalized.includes(
      "diluted eps"
    ) ||
    normalized.includes(
      "diluted earnings per share"
    ) ||
    normalized.includes(
      "diluted earnings per equity share"
    );


  const hasROE =
    normalized.includes(
      "return on equity"
    ) ||
    normalized.includes(
      "return on net worth"
    ) ||
    normalized.includes(
      "ronw"
    );


  const hasNAV =
    normalized.includes(
      "net asset value per equity share"
    ) ||
    normalized.includes(
      "net asset value per share"
    ) ||
    normalized.includes(
      "nav per share"
    );


  const hasEBITDA =
    normalized.includes(
      "ebitda"
    );


  const hasDebtEquity =
    normalized.includes(
      "debt to equity"
    ) ||
    normalized.includes(
      "debt-to-equity"
    ) ||
    normalized.includes(
      "debt equity"
    );


  const hasNetWorth =
    normalized.includes(
      "net worth"
    );


  /**
   * ------------------------------------------------
   * Individual KPI signals
   * ------------------------------------------------
   */

  if (
    hasBasicEPS
  ) {
    score += 30;
  }


  if (
    hasDilutedEPS
  ) {
    score += 15;
  }


  if (
    hasROE
  ) {
    score += 25;
  }


  if (
    hasNAV
  ) {
    score += 20;
  }


  if (
    hasEBITDA
  ) {
    score += 15;
  }


  if (
    hasDebtEquity
  ) {
    score += 15;
  }


  if (
    hasNetWorth
  ) {
    score += 10;
  }


  /**
   * ------------------------------------------------
   * Comparative year structure
   * ------------------------------------------------
   */

  const yearCount =
    countFinancialYears(
      text
    );


  if (
    yearCount >=
    3
  ) {

    score += 30;

  } else if (
    yearCount ===
    2
  ) {

    score += 15;
  }


  /**
   * ------------------------------------------------
   * Combination bonuses
   * ------------------------------------------------
   */

  if (
    hasBasicEPS &&
    hasROE
  ) {

    score += 25;
  }


  if (
    hasBasicEPS &&
    hasNAV
  ) {

    score += 20;
  }


  if (
    hasBasicEPS &&
    hasEBITDA
  ) {

    score += 20;
  }


  if (
    hasBasicEPS &&
    hasROE &&
    hasEBITDA
  ) {

    score += 30;
  }


  if (
    hasBasicEPS &&
    yearCount >=
      3
  ) {

    score += 25;
  }


  return score;
}


/**
 * ================================================================
 * LOCATE BEST FINANCIAL KPI PAGE
 *
 * PASS 1
 * Sparse scan
 *
 * PASS 2
 * Refine strongest candidate areas
 * ================================================================
 */

async function locateFinancialKPIPage(
  pdf: PDFDocument,
  totalPages: number,
  cache: Map<
    number,
    string
  >
): Promise<
  number | undefined
> {

  const coarseCandidates:
    {
      pageNumber: number;
      score: number;
    }[] = [];


  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += KPI_SCAN_STEP
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    const score =
      financialKPIScore(
        text
      );


    if (
      score >
      0
    ) {

      coarseCandidates.push({
        pageNumber,
        score,
      });
    }
  }


  coarseCandidates.sort(
    (
      a,
      b
    ) =>
      b.score -
      a.score
  );


  const strongestZones =
    coarseCandidates.slice(
      0,
      KPI_TOP_CANDIDATES
    );


  if (
    strongestZones.length ===
    0
  ) {

    console.log(
      "No financial KPI candidates found."
    );


    return undefined;
  }


  let bestPage:
    number | undefined;


  let bestScore =
    0;


  const inspected =
    new Set<number>();


  for (
    const candidate
    of strongestZones
  ) {

    const start =
      Math.max(
        1,
        candidate.pageNumber -
          KPI_REFINE_RADIUS
      );


    const end =
      Math.min(
        totalPages,
        candidate.pageNumber +
          KPI_REFINE_RADIUS
      );


    for (
      let pageNumber = start;
      pageNumber <= end;
      pageNumber++
    ) {

      if (
        inspected.has(
          pageNumber
        )
      ) {
        continue;
      }


      inspected.add(
        pageNumber
      );


      const text =
        await getPageText(
          pdf,
          cache,
          pageNumber
        );


      const score =
        financialKPIScore(
          text
        );


      if (
        score >
        bestScore
      ) {

        bestScore =
          score;

        bestPage =
          pageNumber;
      }
    }
  }


  if (
    bestPage !==
      undefined &&
    bestScore >=
      KPI_MIN_SCORE
  ) {

    console.log(
      "Best financial KPI page:",
      bestPage,
      "score:",
      bestScore
    );


    return bestPage;
  }


  console.log(
    "No sufficiently strong financial KPI page found.",
    "Best score:",
    bestScore
  );


  return undefined;
}


/**
 * ================================================================
 * EXTRACT FINANCIAL KPI WINDOW
 * ================================================================
 */

async function extractFinancialKPIWindow(
  pdf: PDFDocument,
  totalPages: number,
  kpiPage: number,
  cache: Map<
    number,
    string
  >
): Promise<{
  pages: SEBIPDFPage[];
  keywords: Set<string>;
}> {

  const start =
    Math.max(
      1,
      kpiPage -
        KPI_WINDOW_BEFORE
    );


  const end =
    Math.min(
      totalPages,
      kpiPage +
        KPI_WINDOW_AFTER
    );


  console.log(
    "Extracting financial KPI window:",
    start,
    "to",
    end
  );


  const pages:
    SEBIPDFPage[] = [];


  const keywords =
    new Set<string>();


  for (
    let pageNumber = start;
    pageNumber <= end;
    pageNumber++
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    if (
      !text
    ) {
      continue;
    }


    pages.push({
      pageNumber,
      text,
    });


    findKeywords(
      text
    ).forEach(
      (
        keyword
      ) =>
        keywords.add(
          keyword
        )
    );
  }


  return {
    pages,
    keywords,
  };
}


/**
 * ================================================================
 * MERGE FINANCIAL PAGE SETS
 *
 * Formal statements + summary tables may overlap.
 * ================================================================
 */

function mergeFinancialPages(
  ...pageSets:
    SEBIPDFPage[][]
): SEBIPDFPage[] {

  const map =
    new Map<
      number,
      SEBIPDFPage
    >();


  for (
    const pageSet
    of pageSets
  ) {

    for (
      const page
      of pageSet
    ) {

      map.set(
        page.pageNumber,
        page
      );
    }
  }


  return Array.from(
    map.values()
  ).sort(
    (
      a,
      b
    ) =>
      a.pageNumber -
      b.pageNumber
  );
}

/**
 * ================================================================
 * EXTRACT TOC TARGET PAGE NUMBERS
 *
 * Example TOC:
 *
 * Restated Consolidated Financial Information ........ 334
 *
 * We extract 334.
 * ================================================================
 */

function extractTOCTargetPages(
  text: string,
  totalPages: number
): number[] {

  const normalized =
    normalizeSearchText(
      text
    );


  const results =
    new Set<number>();


  for (
    const anchor
    of TOC_FINANCIAL_ANCHORS
  ) {

    let searchFrom =
      0;


    while (
      true
    ) {

      const index =
        normalized.indexOf(
          anchor,
          searchFrom
        );


      if (
        index ===
        -1
      ) {
        break;
      }


      const snippet =
        normalized.slice(
          index,
          index + 250
        );


      const numberMatches =
        snippet.match(
          /\b\d{1,4}\b/g
        ) ??
        [];


      const candidates =
        numberMatches
          .map(
            Number
          )
          .filter(
            (
              value
            ) =>
              Number.isInteger(
                value
              ) &&
              value >
                TOC_SCAN_PAGES &&
              value <=
                totalPages
          );


      /**
       * The page number in a TOC is normally the
       * last sensible number after the section name.
       */

      if (
        candidates.length >
        0
      ) {

        results.add(
          candidates[
            candidates.length -
            1
          ]
        );
      }


      searchFrom =
        index +
        anchor.length;
    }
  }


  return Array.from(
    results
  );
}


/**
 * ================================================================
 * READ TABLE OF CONTENTS
 * ================================================================
 */

async function findTOCFinancialTargets(
  pdf: PDFDocument,
  totalPages: number,
  cache: Map<
    number,
    string
  >
): Promise<number[]> {

  const limit =
    Math.min(
      totalPages,
      TOC_SCAN_PAGES
    );


  const targets =
    new Set<number>();


  for (
    let pageNumber = 1;
    pageNumber <= limit;
    pageNumber++
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    const found =
      extractTOCTargetPages(
        text,
        totalPages
      );


    found.forEach(
      (
        value
      ) =>
        targets.add(
          value
        )
    );
  }


  return Array.from(
    targets
  );
}


/**
 * ================================================================
 * SEARCH AROUND TOC TARGET
 *
 * TOC page numbers are prospectus page numbers.
 * Physical PDF pages may have a small offset.
 * ================================================================
 */

async function locateActualFinancialStart(
  pdf: PDFDocument,
  totalPages: number,
  targetPages: number[],
  cache: Map<
    number,
    string
  >
): Promise<
  number | undefined
> {

  let bestPage:
    number | undefined;


  let bestScore =
    0;


  for (
    const target
    of targetPages
  ) {

    const start =
      Math.max(
        1,
        target -
          TOC_SEARCH_BEFORE
      );


    const end =
      Math.min(
        totalPages,
        target +
          TOC_SEARCH_AFTER
      );


    console.log(
      "Searching financial section around TOC target:",
      target,
      "PDF pages",
      start,
      "to",
      end
    );


    for (
      let pageNumber = start;
      pageNumber <= end;
      pageNumber++
    ) {

      const text =
        await getPageText(
          pdf,
          cache,
          pageNumber
        );


      const score =
        statementScore(
          text
        );


      if (
        score >
        bestScore
      ) {

        bestScore =
          score;

        bestPage =
          pageNumber;
      }
    }
  }


  if (
    bestPage !==
    undefined
  ) {

    console.log(
      "Actual financial statement start located:",
      bestPage,
      "score:",
      bestScore
    );
  }


  return bestPage;
}


/**
 * ================================================================
 * SPARSE FALLBACK
 *
 * Used only when TOC parsing fails.
 *
 * We inspect every fifth page rather than all pages.
 * ================================================================
 */

async function sparseFallbackSearch(
  pdf: PDFDocument,
  totalPages: number,
  cache: Map<
    number,
    string
  >
): Promise<
  number | undefined
> {

  console.warn(
    "TOC financial location unavailable. Starting sparse fallback scan."
  );


  let bestPage:
    number | undefined;


  let bestScore =
    0;


  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += FALLBACK_SCAN_STEP
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    const score =
      statementScore(
        text
      );


    if (
      score >
        bestScore
    ) {

      bestScore =
        score;

      bestPage =
        pageNumber;
    }
  }


  /**
   * Refine around the strongest sampled page.
   */

  if (
    bestPage !==
    undefined &&
    bestScore >
    0
  ) {

    const start =
      Math.max(
        1,
        bestPage -
          FALLBACK_SCAN_STEP
      );


    const end =
      Math.min(
        totalPages,
        bestPage +
          FALLBACK_SCAN_STEP
      );


    for (
      let pageNumber = start;
      pageNumber <= end;
      pageNumber++
    ) {

      const text =
        await getPageText(
          pdf,
          cache,
          pageNumber
        );


      const score =
        statementScore(
          text
        );


      if (
        score >
        bestScore
      ) {

        bestScore =
          score;

        bestPage =
          pageNumber;
      }
    }
  }


  return bestScore >
    0
      ? bestPage
      : undefined;
}


/**
 * ================================================================
 * EXTRACT BOUNDED FINANCIAL SECTION
 * ================================================================
 */

async function extractFinancialSection(
  pdf: PDFDocument,
  totalPages: number,
  startPage: number,
  cache: Map<
    number,
    string
  >
): Promise<{
  pages: SEBIPDFPage[];
  keywords: Set<string>;
}> {

  const start =
    Math.max(
      1,
      startPage -
        FINANCIAL_SECTION_BEFORE
    );


  const end =
    Math.min(
      totalPages,
      startPage +
        FINANCIAL_SECTION_AFTER
    );


  console.log(
    "Extracting bounded financial section:",
    start,
    "to",
    end
  );


  const pages:
    SEBIPDFPage[] = [];


  const keywords =
    new Set<string>();


  for (
    let pageNumber = start;
    pageNumber <= end;
    pageNumber++
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    if (
      !text
    ) {
      continue;
    }


    /**
     * We intentionally retain the complete bounded section.
     *
     * It is already the audited/restated financial area,
     * so this is safer than removing continuation pages.
     */

    pages.push({
      pageNumber,
      text,
    });


    findKeywords(
      text
    ).forEach(
      (
        keyword
      ) =>
        keywords.add(
          keyword
        )
    );
  }


  return {
    pages,
    keywords,
  };
}


/**
 * ================================================================
 * SMALL DOCUMENT EXTRACTION
 *
 * For a short abridged prospectus, processing all pages
 * is inexpensive and avoids over-engineering.
 * ================================================================
 */

async function extractShortDocument(
  pdf: PDFDocument,
  totalPages: number,
  cache: Map<
    number,
    string
  >
): Promise<{
  pages: SEBIPDFPage[];
  keywords: Set<string>;
}> {

  const candidates:
    SEBIPDFPage[] = [];


  const keywords =
    new Set<string>();


  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber++
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    if (
      !text
    ) {
      continue;
    }


    if (
      isUsefulFinancialPage(
        text
      )
    ) {

      candidates.push({
        pageNumber,
        text,
      });


      findKeywords(
        text
      ).forEach(
        (
          keyword
        ) =>
          keywords.add(
            keyword
          )
      );
    }
  }


  /**
   * Add immediate neighbours.
   */

  const numbers =
    new Set<number>();


  candidates.forEach(
    (
      page
    ) => {

      numbers.add(
        page.pageNumber
      );


      if (
        page.pageNumber >
        1
      ) {

        numbers.add(
          page.pageNumber -
            1
        );
      }


      if (
        page.pageNumber <
        totalPages
      ) {

        numbers.add(
          page.pageNumber +
            1
        );
      }
    }
  );


  const pages:
    SEBIPDFPage[] = [];


  for (
    const pageNumber
    of Array.from(
      numbers
    ).sort(
      (
        a,
        b
      ) =>
        a - b
    )
  ) {

    const text =
      await getPageText(
        pdf,
        cache,
        pageNumber
      );


    pages.push({
      pageNumber,
      text,
    });
  }


  return {
    pages,
    keywords,
  };
}


/**
 * ================================================================
 * IN-MEMORY EXTRACTION CACHE
 *
 * Prevents repeated extraction of the same PDF during one
 * development server session.
 * ================================================================
 */

const extractionCache =
  new Map<
    string,
    Promise<
      SEBIFinancialExtraction | null
    >
  >();


/**
 * ================================================================
 * INTERNAL EXTRACTION
 * ================================================================
 */

async function runExtraction(
  pdfUrl: string
): Promise<
  SEBIFinancialExtraction | null
> {

  const pdfData =
    await fetchPDF(
      pdfUrl
    );


  if (
    !pdfData
  ) {

    return null;
  }


  const pdf =
    await getDocumentProxy(
      pdfData
    );


  const totalPages =
    pdf.numPages;


  console.log(
    "SEBI prospectus total pages:",
    totalPages
  );


  const pageCache =
    new Map<
      number,
      string
    >();


  let pages:
    SEBIPDFPage[] = [];


  let keywordSet =
    new Set<string>();


  /**
   * ================================================================
   * SMALL DOCUMENT
   * ================================================================
   */

  if (
    totalPages <=
    SHORT_DOCUMENT_THRESHOLD
  ) {

    console.log(
      "Using short-document extraction."
    );


    const shortResult =
      await extractShortDocument(
        pdf,
        totalPages,
        pageCache
      );


    pages =
      shortResult.pages;


    keywordSet =
      shortResult.keywords;

  } else {

    /**
     * ================================================================
     * LARGE DRHP / RHP
     * ================================================================
     */


    /**
     * ------------------------------------------------
     * STEP 1
     * Locate formal financial section using TOC
     * ------------------------------------------------
     */

    console.log(
      "Using TOC-directed large-document extraction."
    );


    const tocTargets =
      await findTOCFinancialTargets(
        pdf,
        totalPages,
        pageCache
      );


    console.log(
      "TOC financial targets:",
      tocTargets
    );


    /**
     * ------------------------------------------------
     * STEP 2
     * Locate actual PDF page containing formal
     * financial statements
     * ------------------------------------------------
     */

    let financialStart =
      tocTargets.length >
      0
        ? await locateActualFinancialStart(
            pdf,
            totalPages,
            tocTargets,
            pageCache
          )
        : undefined;


    /**
     * ------------------------------------------------
     * STEP 3
     * Fallback when TOC cannot be interpreted
     * ------------------------------------------------
     */

    if (
      financialStart ===
      undefined
    ) {

      financialStart =
        await sparseFallbackSearch(
          pdf,
          totalPages,
          pageCache
        );
    }


    /**
     * ------------------------------------------------
     * STEP 4
     * Extract formal Restated Financial Information
     * ------------------------------------------------
     */

    let formalResult:
      {
        pages: SEBIPDFPage[];
        keywords: Set<string>;
      } = {

      pages:
        [],

      keywords:
        new Set<string>(),
    };


    if (
      financialStart !==
      undefined
    ) {

      formalResult =
        await extractFinancialSection(
          pdf,
          totalPages,
          financialStart,
          pageCache
        );

    } else {

      console.warn(
        "Formal financial section could not be located."
      );
    }


    /**
     * ------------------------------------------------
     * STEP 5
     * Independently locate comparative financial
     * summary / results pages
     *
     * This uses multi-anchor scoring.
     * No single exact phrase is mandatory.
     * ------------------------------------------------
     */

    const summaryPage =
      await locateFinancialSummaryPage(
        pdf,
        totalPages,
        pageCache
      );


    let summaryResult:
      {
        pages: SEBIPDFPage[];
        keywords: Set<string>;
      } = {

      pages:
        [],

      keywords:
        new Set<string>(),
    };


    if (
      summaryPage !==
      undefined
    ) {

      console.log(
        "Financial summary page located:",
        summaryPage
      );


      summaryResult =
        await extractFinancialSummaryWindow(
          pdf,
          totalPages,
          summaryPage,
          pageCache
        );

    } else {

      console.warn(
        "Comparative financial summary page not located."
      );
    }


    /**
     * ------------------------------------------------
     * STEP 6
     * Merge both evidence sources
     *
     * Formal statements:
     * - Assets & Liabilities
     * - P&L
     * - Cash Flow
     *
     * Summary:
     * - Revenue
     * - PAT
     * - EBITDA
     * - Multi-year comparative tables
     * ------------------------------------------------
     */

    /**
 * ------------------------------------------------
 * STEP 6
 * Independently locate Financial KPI tables
 * ------------------------------------------------
 */

const kpiPage =
  await locateFinancialKPIPage(
    pdf,
    totalPages,
    pageCache
  );


let kpiResult:
  {
    pages: SEBIPDFPage[];
    keywords: Set<string>;
  } = {

  pages: [],

  keywords:
    new Set<string>(),
};


if (
  kpiPage !==
  undefined
) {

  console.log(
    "Financial KPI page located:",
    kpiPage
  );


  kpiResult =
    await extractFinancialKPIWindow(
      pdf,
      totalPages,
      kpiPage,
      pageCache
    );

} else {

  console.warn(
    "Financial KPI page not located."
  );
}


/**
 * ------------------------------------------------
 * STEP 7
 * Merge formal + summary + KPI evidence
 * ------------------------------------------------
 */

pages =
  mergeFinancialPages(
    formalResult.pages,
    summaryResult.pages,
    kpiResult.pages
  );


keywordSet =
  new Set<string>([
    ...formalResult.keywords,
    ...summaryResult.keywords,
    ...kpiResult.keywords,
  ]);
  
    pages =
  mergeFinancialPages(
    formalResult.pages,
    summaryResult.pages,
    kpiResult.pages
  );


keywordSet =
  new Set<string>([
    ...formalResult.keywords,
    ...summaryResult.keywords,
    ...kpiResult.keywords,
  ]);
  }


  /**
   * ================================================================
   * RESULT
   * ================================================================
   */

  const result:
    SEBIFinancialExtraction = {

    pdfUrl,

    totalPages,

    financialPages:
      pages,

    matchedKeywords:
      Array.from(
        keywordSet
      ),

    extractedAt:
      new Date()
        .toISOString(),
  };


  /**
   * ================================================================
   * DEBUG LOGGING
   * ================================================================
   */

  console.log(
    "========================================"
  );


  console.log(
    "SEBI FINANCIAL EXTRACTION COMPLETE"
  );


  console.log(
    "Total PDF pages:",
    totalPages
  );


  console.log(
    "PDF pages actually read:",
    pageCache.size
  );


  console.log(
    "Final financial page numbers:",
    pages.map(
      (
        page
      ) =>
        page.pageNumber
    )
  );


  console.log(
    "Returned financial pages:",
    result.financialPages.length
  );


  console.log(
    "Financial page range:",
    result.financialPages[0]
      ?.pageNumber,
    "to",
    result.financialPages[
      result.financialPages.length -
      1
    ]?.pageNumber
  );


  console.log(
    "Matched keywords:",
    result.matchedKeywords
  );


  console.log(
    "========================================"
  );


  return result;
}

/**
 * ================================================================
 * PUBLIC API
 * ================================================================
 */

export async function extractSEBIFinancialPages(
  pdfUrl: string
): Promise<
  SEBIFinancialExtraction | null
> {

  if (
    !pdfUrl
  ) {

    return null;
  }


  const existing =
    extractionCache.get(
      pdfUrl
    );


  if (
    existing
  ) {

    console.log(
      "Using cached SEBI financial extraction."
    );


    return existing;
  }


  console.log(
    "========================================"
  );

  console.log(
    "STFL SEBI FINANCIAL EXTRACTION"
  );

  console.log(
    "PDF:",
    pdfUrl
  );

  console.log(
    "========================================"
  );


  const promise =
    runExtraction(
      pdfUrl
    );


  extractionCache.set(
    pdfUrl,
    promise
  );


  try {

    const result =
      await promise;


    if (
      !result
    ) {

      extractionCache.delete(
        pdfUrl
      );
    }


    return result;

  } catch (error) {

    extractionCache.delete(
      pdfUrl
    );


    console.error(
      "Unable to extract SEBI financial data:",
      error
    );


    return null;
  }
}