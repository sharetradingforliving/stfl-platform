import {
  NextResponse,
} from "next/server";

export const dynamic =
  "force-dynamic";

const BACKEND_URL =
  process.env.STFL_BACKEND_URL ??
  "http://127.0.0.1:8000";

export async function GET(
  request: Request
) {
  try {
    const requestUrl =
      new URL(request.url);

    const startDate =
      requestUrl.searchParams.get(
        "start_date"
      );

    const endDate =
      requestUrl.searchParams.get(
        "end_date"
      );

    const backendUrl =
      new URL(
        "/api/market/fii-dii/history",
        BACKEND_URL
      );

    if (startDate) {
      backendUrl.searchParams.set(
        "start_date",
        startDate
      );
    }

    if (endDate) {
      backendUrl.searchParams.set(
        "end_date",
        endDate
      );
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
            "Unable to retrieve historical FII/DII data",

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
      "FII/DII history route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to retrieve historical FII/DII data",

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