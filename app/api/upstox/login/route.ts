import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.UPSTOX_API_KEY;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;

  if (!apiKey || !redirectUri) {
    return NextResponse.json(
      {
        error: "Upstox API configuration is missing",
      },
      {
        status: 500,
      }
    );
  }

  const authorizationUrl =
    `https://api.upstox.com/v2/login/authorization/dialog` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(apiKey)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authorizationUrl);
}