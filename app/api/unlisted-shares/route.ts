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
  "industry",
  "status",
  "page",
  "pageSize",
] as const;

const RETRYABLE_STATUS_CODES =
  new Set([
    502,
    503,
    504,
  ]);

type BackendPayload = {
  status?: string;
  detail?: string;
  error?: string;
  [key: string]: unknown;
};

type BackendResult = {
  ok: boolean;
  status: number;
  payload: BackendPayload;
};

function wait(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function parsePayload(
  responseText: string
): BackendPayload | null {
  if (!responseText.trim()) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(responseText);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as BackendPayload;
  } catch {
    return null;
  }
}

async function fetchBackendWithRetry(
  backendUrl: string
): Promise<BackendResult> {
  const maximumAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      const response = await fetch(
        backendUrl,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      const payload =
        parsePayload(responseText);

      const shouldRetry =
        payload === null ||
        RETRYABLE_STATUS_CODES.has(
          response.status
        );

      if (
        shouldRetry &&
        attempt < maximumAttempts
      ) {
        await wait(
          attempt * 500
        );

        continue;
      }

      if (payload === null) {
        return {
          ok: false,
          status: 502,
          payload: {
            status: "error",
            error:
              "The backend returned an invalid response.",
          },
        };
      }

      return {
        ok: response.ok,
        status: response.status,
        payload,
      };
    } catch (error) {
      if (
        attempt < maximumAttempts
      ) {
        await wait(
          attempt * 500
        );

        continue;
      }

      console.error(
        "Unlisted-share backend request failed:",
        error
      );

      return {
        ok: false,
        status: 503,
        payload: {
          status: "error",
          error:
            "The unlisted-share service is temporarily unavailable.",
        },
      };
    }
  }

  return {
    ok: false,
    status: 503,
    payload: {
      status: "error",
      error:
        "The unlisted-share service is temporarily unavailable.",
    },
  };
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

    const result =
      await fetchBackendWithRetry(
        backendUrl.toString()
      );

    if (!result.ok) {
      return NextResponse.json(
        {
          status: "error",
          error:
            result.payload.error ??
            result.payload.detail ??
            "Unable to retrieve unlisted shares.",
        },
        {
          status: result.status,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      result.payload,
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