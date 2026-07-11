import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");

    const apiKey = process.env.UPSTOX_API_KEY;
    const apiSecret = process.env.UPSTOX_API_SECRET;
    const redirectUri = process.env.UPSTOX_REDIRECT_URI;

    if (!code) {
      return NextResponse.json(
        {
          error: "Authorization code is missing",
        },
        {
          status: 400,
        }
      );
    }

    if (!apiKey || !apiSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: "Upstox API configuration is missing",
        },
        {
          status: 500,
        }
      );
    }

    const tokenResponse = await fetch(
      "https://api.upstox.com/v2/login/authorization/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          code,
          client_id: apiKey,
          client_secret: apiSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Upstox token error:", tokenData);

      return NextResponse.json(
        {
          error: "Unable to generate Upstox access token",
          details: tokenData,
        },
        {
          status: tokenResponse.status,
        }
      );
    }

    const response = NextResponse.json({
  success: true,
  message: "Upstox authorization completed successfully.",
  instruction:
    "The access token has been stored securely for local development.",
});

response.cookies.set(
  "upstox_access_token",
  tokenData.access_token,
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  }
);

return response;
  } catch (error) {
    console.error("Upstox callback error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}