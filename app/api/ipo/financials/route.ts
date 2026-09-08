import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  findIPOProspectus,
} from "@/lib/ipo/providers/prospectus";

import {
  extractSEBIFinancialPages,
} from "@/lib/ipo/providers/sebiFinancials";

import {
  parseSEBIFinancials,
} from "@/lib/ipo/parsers/financialStatementParser";


export const dynamic =
  "force-dynamic";


export async function GET(
  request: NextRequest
) {

  const company =
    request.nextUrl
      .searchParams
      .get("company");


  const symbol =
    request.nextUrl
      .searchParams
      .get("symbol") ??
    undefined;


  if (!company) {

    return NextResponse.json(
      {
        error:
          "Company name is required.",
      },
      {
        status: 400,
      }
    );
  }


  /**
   * ------------------------------------------------
   * STEP 1
   * Discover SEBI prospectus
   * ------------------------------------------------
   */

  const prospectus =
    await findIPOProspectus(
      company
    );


  if (
    !prospectus ||
    !prospectus.pdfUrl
  ) {

    return NextResponse.json(
      {
        company,
        symbol,

        error:
          "Prospectus PDF not found.",
      },
      {
        status: 404,
      }
    );
  }


  /**
   * ------------------------------------------------
   * STEP 2
   * Extract financial pages
   * ------------------------------------------------
   */

  const extraction =
    await extractSEBIFinancialPages(
      prospectus.pdfUrl
    );


  if (!extraction) {

    return NextResponse.json(
      {
        company,
        symbol,

        prospectus: {
          type:
            prospectus.type,

          title:
            prospectus.title,

          pdfUrl:
            prospectus.pdfUrl,
        },

        error:
          "Unable to extract financial pages from prospectus.",
      },
      {
        status: 500,
      }
    );
  }


  /**
   * ------------------------------------------------
   * STEP 3
   * Parse extracted text into IPOFinancialData
   * ------------------------------------------------
   */

  const financials =
    parseSEBIFinancials(
      extraction,
      company,
      symbol
    );


  /**
   * ------------------------------------------------
   * STEP 4
   * Return development result
   * ------------------------------------------------
   */

  return NextResponse.json({

    company,

    symbol,

    prospectus: {

      type:
        prospectus.type,

      title:
        prospectus.title,

      pdfUrl:
        prospectus.pdfUrl,

      source:
        prospectus.source,
    },

    extractionSummary: {

      totalPages:
        extraction.totalPages,

      financialPages:
        extraction.financialPages
          .map(
            (page) =>
              page.pageNumber
          ),

      matchedKeywords:
        extraction.matchedKeywords,
    },

    financials,
  });
}