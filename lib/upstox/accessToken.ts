import "server-only";

import {
  cookies,
} from "next/headers";

export type UpstoxAccessTokenSource =
  | "ANALYTICS_TOKEN"
  | "OAUTH_COOKIE";

export type UpstoxAccessTokenResult = {
  accessToken: string;
  source:
    UpstoxAccessTokenSource;
};

function getAnalyticsToken():
  string | null {
  const analyticsToken =
    process.env
      .UPSTOX_ANALYTICS_TOKEN
      ?.trim();

  return analyticsToken
    ? analyticsToken
    : null;
}

async function getOauthCookieToken():
  Promise<string | null> {
  const cookieStore =
    await cookies();

  const cookieToken =
    cookieStore
      .get(
        "upstox_access_token"
      )
      ?.value
      .trim();

  return cookieToken
    ? cookieToken
    : null;
}

export async function getUpstoxReadOnlyAccessToken():
  Promise<
    UpstoxAccessTokenResult | null
  > {
  /*
   * Prefer the one-year, read-only
   * Analytics Token for all market-data
   * and research APIs.
   */
  const analyticsToken =
    getAnalyticsToken();

  if (analyticsToken) {
    return {
      accessToken:
        analyticsToken,

      source:
        "ANALYTICS_TOKEN",
    };
  }

  /*
   * Keep the daily OAuth cookie as a
   * development fallback while the
   * migration is being completed.
   */
  const oauthCookieToken =
    await getOauthCookieToken();

  if (oauthCookieToken) {
    return {
      accessToken:
        oauthCookieToken,

      source:
        "OAUTH_COOKIE",
    };
  }

  return null;
}