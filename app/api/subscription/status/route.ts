import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        status: "error",
        authenticated: false,
        entitlement: "FREE",
        is_premium: false,
        detail: "Sign in is required.",
      },
      {
        status: 401,
      }
    );
  }

  const token = await getToken();

  if (!token) {
    return NextResponse.json(
      {
        status: "error",
        authenticated: false,
        entitlement: "FREE",
        is_premium: false,
        detail: "Unable to obtain the Clerk session token.",
      },
      {
        status: 401,
      }
    );
  }

  const backendUrl = process.env.STFL_BACKEND_URL;

  if (!backendUrl) {
    console.error(
      "STFL_BACKEND_URL is missing from frontend/.env.local"
    );

    return NextResponse.json(
      {
        status: "error",
        authenticated: true,
        entitlement: "FREE",
        is_premium: false,
        detail: "Subscription service is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl.replace(/\/$/, "")}/api/subscription/status`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const responseText = await backendResponse.text();

    let responseData: unknown;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = {
        status: "error",
        detail: "The backend returned an invalid response.",
      };
    }

    return NextResponse.json(responseData, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error(
      "Subscription status request failed:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        authenticated: true,
        entitlement: "FREE",
        is_premium: false,
        detail: "Subscription service is temporarily unavailable.",
      },
      {
        status: 503,
      }
    );
  }
}