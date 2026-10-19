import {
  NextResponse,
} from "next/server";


export const dynamic =
  "force-dynamic";


const BACKEND_BASE_URL = (
  process.env.STFL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8001"
).replace(/\/$/, "");


type BackendPayload = {
  detail?: string;
  error?: string;
  [key: string]: unknown;
};


type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
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
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      slug,
    } = await context.params;

    if (!slug.trim()) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "The company slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    const backendUrl =
      `${BACKEND_BASE_URL}` +
      `/api/unlisted-shares/` +
      encodeURIComponent(slug);

    const response = await fetch(
      backendUrl,
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
            "Unable to retrieve the unlisted company.",
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
      "Unlisted-company proxy error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "The unlisted-company service is temporarily unavailable.",
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