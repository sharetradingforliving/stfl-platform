import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = (
  process.env.STFL_BACKEND_URL ??
  "http://127.0.0.1:8001"
).replace(/\/$/, "");

export async function GET(
  request: NextRequest
) {
  try {
    const requestUrl = new URL(
      request.url
    );

    const indexCode =
      requestUrl.searchParams.get(
        "index_code"
      ) ?? "NIFTY_50";

    const startDate =
      requestUrl.searchParams.get(
        "start_date"
      );

    const endDate =
      requestUrl.searchParams.get(
        "end_date"
      );

    const backendUrl = new URL(
      `${BACKEND_URL}/api/astro/historical-market-events`
    );

    backendUrl.searchParams.set(
      "index_code",
      indexCode
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

    const response = await fetch(
      backendUrl,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const payload =
      await response.json();

    return NextResponse.json(
      payload,
      {
        status: response.status,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Historical market events proxy error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        detail:
          "Historical market events are temporarily unavailable.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}