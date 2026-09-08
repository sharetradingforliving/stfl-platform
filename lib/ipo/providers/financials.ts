import type {
  IPOFinancialData,
} from "../financialTypes";

import {
  findIPOProspectus,
} from "./prospectus";

import {
  extractSEBIFinancialPages,
} from "./sebiFinancials";

import {
  parseSEBIFinancials,
} from "../parsers/financialStatementParser";


/**
 * ================================================================
 * STFL IPO FINANCIAL PROVIDER
 * File: providers/financials.ts
 *
 * Purpose:
 *
 * End-to-end automated IPO financial data pipeline.
 *
 * Flow:
 *
 * Company
 *   ↓
 * SEBI Prospectus Discovery
 *   ↓
 * Prospectus PDF
 *   ↓
 * PDF Financial Extraction
 *   ↓
 * Financial Statement Parser
 *   ↓
 * IPOFinancialData
 *
 * No company-specific financial values are hard-coded.
 * ================================================================
 */


/**
 * ================================================================
 * FETCH IPO FINANCIALS
 * ================================================================
 */

export async function fetchIPOFinancials(
  companyName: string,
  symbol?: string
): Promise<IPOFinancialData | null> {

  try {

    console.log(
      "========================================"
    );

    console.log(
      "STFL IPO FINANCIAL REQUEST"
    );

    console.log(
      {
        companyName,
        symbol,
      }
    );

    console.log(
      "========================================"
    );


    /**
     * ------------------------------------------------
     * STEP 1
     * Discover SEBI prospectus
     * ------------------------------------------------
     */

    const prospectus =
      await findIPOProspectus(
        companyName
      );


    if (
      !prospectus
    ) {

      console.warn(
        "IPO financials unavailable: prospectus not found",
        {
          companyName,
          symbol,
        }
      );


      return null;
    }


    if (
      !prospectus.pdfUrl
    ) {

      console.warn(
        "IPO financials unavailable: prospectus PDF not found",
        {
          companyName,
          symbol,
          prospectusType:
            prospectus.type,
        }
      );


      return null;
    }


    /**
     * ------------------------------------------------
     * STEP 2
     * Extract likely financial pages from PDF
     * ------------------------------------------------
     */

    const extraction =
      await extractSEBIFinancialPages(
        prospectus.pdfUrl
      );


    if (
      !extraction
    ) {

      console.warn(
        "IPO financials unavailable: PDF extraction failed",
        {
          companyName,
          symbol,
          pdfUrl:
            prospectus.pdfUrl,
        }
      );


      return null;
    }


    if (
      extraction.financialPages.length ===
      0
    ) {

      console.warn(
        "IPO financials unavailable: no financial pages detected",
        {
          companyName,
          symbol,
          totalPages:
            extraction.totalPages,
        }
      );


      return null;
    }


    /**
     * ------------------------------------------------
     * STEP 3
     * Parse extracted financial information
     * ------------------------------------------------
     */

    const financials =
      parseSEBIFinancials(
        extraction,
        companyName,
        symbol
      );


    if (
      !financials
    ) {

      console.warn(
        "IPO financials unavailable: parser returned no usable data",
        {
          companyName,
          symbol,
        }
      );


      return null;
    }


    /**
     * ------------------------------------------------
     * STEP 4
     * Return normalized STFL financial data
     * ------------------------------------------------
     */

    console.log(
      "========================================"
    );

    console.log(
      "STFL IPO FINANCIAL DATA READY"
    );

    console.log(
      {
        companyName,
        symbol,
        years:
          financials.years.map(
            (
              year
            ) =>
              year.period
          ),
        source:
          financials.source,
      }
    );

    console.log(
      "========================================"
    );


    return financials;

  } catch (error) {

    console.error(
      "STFL IPO financial provider failed:",
      error
    );


    return null;
  }
}