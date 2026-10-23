/**
 * ================================================================
 * STFL IPO API
 * Route: /api/ipo
 *
 * Fetch live normalized IPO data, synchronize it into the permanent
 * FastAPI/Neon catalogue, and return the complete retained history.
 * ================================================================
 */

import { NextResponse } from "next/server";

import { runIPOEngine } from "@/lib/ipo/ipoEngine";


export const dynamic = "force-dynamic";


const BACKEND_BASE_URL =
  (
    process.env.STFL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8001"
  ).replace(/\/$/, "");


async function readStoredCatalogue(): Promise<unknown | null> {
  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/ipos`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Stored IPO catalogue request failed:",
        response.status,
        response.statusText
      );

      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Stored IPO catalogue is unavailable:",
      error
    );

    return null;
  }
}


async function synchronizeCatalogue(
  ipos: unknown[]
): Promise<unknown | null> {
  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/ipos/sync`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ipos }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "IPO persistence synchronization failed:",
        response.status,
        detail
      );

      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(
      "IPO persistence synchronization is unavailable:",
      error
    );

    return null;
  }
}


const IPO_REFRESH_INTERVAL_MS =
  15 * 60 * 1000;

let lastIPORefreshStartedAt = 0;

let ipoRefreshPromise:
  Promise<void> | null = null;

const IPO_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=3600";

function refreshCatalogueInBackground() {
  const now = Date.now();

  const refreshIsRecent =
    now - lastIPORefreshStartedAt <
    IPO_REFRESH_INTERVAL_MS;

  if (
    refreshIsRecent ||
    ipoRefreshPromise
  ) {
    return;
  }

  lastIPORefreshStartedAt = now;

  ipoRefreshPromise = (async () => {
    const liveResult =
      await runIPOEngine();

    if (liveResult.ipos.length > 0) {
      await synchronizeCatalogue(
        liveResult.ipos
      );
    }
  })()
    .catch((error) => {
      console.error(
        "Background IPO refresh failed:",
        error
      );
    })
    .finally(() => {
      ipoRefreshPromise = null;
    });
}

export async function GET() {
  try {
    /*
     * Serve the permanent catalogue first.
     * The visitor must not wait for external
     * IPO fetching and database synchronization.
     */
    const stored =
      await readStoredCatalogue();

    if (stored) {
      void refreshCatalogueInBackground();

      return NextResponse.json(
        stored,
        {
          status: 200,
          headers: {
            "Cache-Control":
              IPO_CACHE_CONTROL,
            "X-STFL-IPO-Source":
              "persistent-catalogue",
          },
        }
      );
    }

    /*
     * If the stored catalogue is unavailable,
     * perform one live load as a fallback.
     */
    const liveResult =
      await runIPOEngine();

    if (liveResult.ipos.length > 0) {
      const synchronized =
        await synchronizeCatalogue(
          liveResult.ipos
        );

      if (synchronized) {
        return NextResponse.json(
          synchronized,
          {
            status: 200,
            headers: {
              "Cache-Control":
                IPO_CACHE_CONTROL,
              "X-STFL-IPO-Source":
                "live-synchronized",
            },
          }
        );
      }
    }

    return NextResponse.json(
      liveResult,
      {
        status: 200,
        headers: {
          "Cache-Control":
            IPO_CACHE_CONTROL,
          "X-STFL-IPO-Source":
            "live-fallback",
        },
      }
    );
  } catch (error) {
    console.error(
      "IPO API Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load IPO data.",
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
