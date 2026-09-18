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

    const peakDate =
      requestUrl.searchParams.get(
        "peak_date"
      );

    const troughDate =
      requestUrl.searchParams.get(
        "trough_date"
      );

    const recoveryDate =
      requestUrl.searchParams.get(
        "recovery_date"
      );

    if (!peakDate || !troughDate) {
      return NextResponse.json(
        {
          status: "error",
          detail:
            "peak_date and trough_date are required.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const backendUrl = new URL(
      `${BACKEND_URL}/api/astro/historical-event-alignment`
    );

    backendUrl.searchParams.set(
      "peak_date",
      peakDate
    );

    backendUrl.searchParams.set(
      "trough_date",
      troughDate
    );

    if (recoveryDate) {
      backendUrl.searchParams.set(
        "recovery_date",
        recoveryDate
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

    const responseText =
      await response.text();

    let payload: unknown;

    try {
      payload = JSON.parse(
        responseText
      );
    } catch {
      payload = {
        status: "error",
        detail:
          response.ok
            ? "The astronomy service returned an invalid response."
            : `The astronomy service returned HTTP ${response.status}.`,
      };
    }

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
      "Historical event alignment proxy error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        detail:
          "Historical planetary alignment is temporarily unavailable.",
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