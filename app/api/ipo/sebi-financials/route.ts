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


export const dynamic =
  "force-dynamic";


export async function GET(
  request: NextRequest
) {

  const company =
    request.nextUrl
      .searchParams
      .get("company");


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
   * Locate SEBI prospectus
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


  return NextResponse.json({

    company,

    prospectus: {
      type:
        prospectus.type,

      title:
        prospectus.title,

      pdfUrl:
        prospectus.pdfUrl,
    },

    extraction,
  });
}