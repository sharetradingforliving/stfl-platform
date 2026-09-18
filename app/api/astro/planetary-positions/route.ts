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

    const at =
      requestUrl.searchParams.get(
        "at"
      );

    const backendUrl = new URL(
      `${BACKEND_URL}/api/astro/planetary-positions`
    );

    if (at) {
      backendUrl.searchParams.set(
        "at",
        at
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

    const payload = await response.json();

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
      "Planetary positions proxy error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        detail:
          "Planetary data is temporarily unavailable.",
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