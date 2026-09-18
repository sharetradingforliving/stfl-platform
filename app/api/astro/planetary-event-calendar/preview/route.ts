import {
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = (
  process.env.STFL_BACKEND_URL ??
  "http://127.0.0.1:8001"
).replace(/\/$/, "");

function errorResponse(
  detail: string,
  status: number
) {
  return NextResponse.json(
    {
      status: "error",
      detail,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET() {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/astro/planetary-event-calendar/preview`,
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
          "The astronomy service returned an invalid response.",
      };
    }

    return NextResponse.json(
      payload,
      {
        status: response.status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Planetary calendar preview proxy error:",
      error
    );

    return errorResponse(
      "The planetary event calendar preview is temporarily unavailable.",
      503
    );
  }
}