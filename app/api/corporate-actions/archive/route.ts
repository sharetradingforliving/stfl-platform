import {
  NextRequest,
  NextResponse,
} from "next/server";

export const dynamic =
  "force-dynamic";

const BACKEND_URL =
  process.env.STFL_BACKEND_URL ??
  "http://127.0.0.1:8001";

const FORWARDED_PARAMETERS = [
  "view",
  "action_type",
  "search",
  "from_date",
  "to_date",
  "page",
  "page_size",
] as const;

export async function GET(
  request: NextRequest
) {
  try {
    const backendUrl =
      new URL(
        "/api/corporate-actions",
        BACKEND_URL
      );

    for (
      const parameter
      of FORWARDED_PARAMETERS
    ) {
      const value =
        request.nextUrl.searchParams.get(
          parameter
        );

      if (value) {
        backendUrl.searchParams.set(
          parameter,
          value
        );
      }
    }

    const response =
      await fetch(
        backendUrl.toString(),
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
          cache:
            "no-store",
        }
      );

    const responseData =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "Unable to retrieve stored corporate actions.",
          details:
            responseData.detail ??
            responseData.error ??
            "Backend request failed",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      responseData,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Corporate-actions archive route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "Unable to retrieve stored corporate actions.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 503,
      }
    );
  }
}
