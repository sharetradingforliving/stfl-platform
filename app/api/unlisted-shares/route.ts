import {
  NextRequest,
  NextResponse,
} from "next/server";


export const dynamic =
  "force-dynamic";


const BACKEND_BASE_URL = (
  process.env.STFL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8001"
).replace(/\/$/, "");


const ALLOWED_QUERY_PARAMETERS = [
  "search",
  "sector",
  "status",
  "page",
  "pageSize",
] as const;


type BackendPayload = {
  detail?: string;
  error?: string;
  [key: string]: unknown;
};


async function parseBackendResponse(
  response: Response
): Promise<BackendPayload> {
  const responseText =
    await response.text();

  if (!responseText.trim()) {
    return {};
  }

  try {
    return JSON.parse(
      responseText
    ) as BackendPayload;
  } catch {
    return {
      error:
        "The backend returned an invalid response.",
    };
  }
}


export async function GET(
  request: NextRequest
) {
  try {
    const backendUrl = new URL(
      "/api/unlisted-shares",
      BACKEND_BASE_URL
    );

    for (
      const parameter
      of ALLOWED_QUERY_PARAMETERS
    ) {
      const value =
        request.nextUrl.searchParams.get(
          parameter
        );

      if (value !== null) {
        backendUrl.searchParams.set(
          parameter,
          value
        );
      }
    }

    const response = await fetch(
      backendUrl.toString(),
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const payload =
      await parseBackendResponse(
        response
      );

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          error:
            payload.error ??
            payload.detail ??
            "Unable to retrieve unlisted shares.",
        },
        {
          status: response.status,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      payload,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Unlisted-share proxy error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "The unlisted-share service is temporarily unavailable.",
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