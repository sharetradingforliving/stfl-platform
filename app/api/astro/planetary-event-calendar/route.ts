import {
  auth,
} from "@clerk/nextjs/server";

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

export async function GET(
  request: NextRequest
) {
  try {
    const {
      userId,
      getToken,
    } = await auth();

    if (!userId) {
      return errorResponse(
        "Please sign in to access the Premium planetary event calendar.",
        401
      );
    }

    const token = await getToken();

    if (!token) {
      return errorResponse(
        "A valid Clerk session is required.",
        401
      );
    }

    const requestUrl = new URL(
      request.url
    );

    const startDate =
      requestUrl.searchParams.get(
        "start_date"
      );

    const endDate =
      requestUrl.searchParams.get(
        "end_date"
      );

    const backendUrl = new URL(
      `${BACKEND_URL}/api/astro/planetary-event-calendar`
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
          Authorization:
            `Bearer ${token}`,
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
      "Premium planetary calendar proxy error:",
      error
    );

    return errorResponse(
      "The planetary event calendar is temporarily unavailable.",
      503
    );
  }
}