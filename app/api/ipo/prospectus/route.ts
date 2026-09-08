import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  findIPOProspectus,
} from "@/lib/ipo/providers/prospectus";


export const dynamic =
  "force-dynamic";


export async function GET(
  request: NextRequest
) {

  const searchParams =
    request.nextUrl.searchParams;

  const company =
    searchParams.get(
      "company"
    );


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


  const prospectus =
    await findIPOProspectus(
      company
    );


  return NextResponse.json({
    company,
    prospectus,
  });
}