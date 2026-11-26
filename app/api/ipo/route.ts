/** STFL IPO API: retained catalogue with GMP-related fields excluded. */
import { NextResponse } from "next/server";
import { runIPOEngine } from "@/lib/ipo/ipoEngine";
export const dynamic = "force-dynamic";
const BACKEND_BASE_URL = (
  process.env.STFL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8001"
).replace(/\/$/, "");

/** JSON field filter, not a free-text content audit. Official listing prices remain. */
function withoutGMP(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutGMP);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => {
      const name = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      return !(
        name.includes("gmp") ||
        name.includes("greymarket") ||
        name.includes("graymarket") ||
        name.includes("prelistingpremium") ||
        name.includes("kostak") ||
        name.includes("subjecttosauda") ||
        ["expectedlistingprice", "estimatedlistingprice", "indicativelistingprice",
         "expectedlistinggain", "expectedlistinggainpercent", "expectedlistinggainpct",
         "estimatedlistinggain", "estimatedlistinggainpercent", "estimatedlistinggainpct"
        ].includes(name)
      );
    }).map(([key, item]) => [key, withoutGMP(item)])
  );
}

async function readStoredCatalogue(): Promise<unknown | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/ipos`, {
      method: "GET", cache: "no-store", headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      console.error("Stored IPO catalogue request failed:", response.status);
      return null;
    }
    return withoutGMP(await response.json());
  } catch {
    console.error("Stored IPO catalogue is unavailable.");
    return null;
  }
}
async function synchronizeCatalogue(ipos: unknown[]): Promise<unknown | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/ipos/sync`, {
      method: "POST", cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ipos: withoutGMP(ipos) }),
    });
    if (!response.ok) {
      console.error("IPO persistence synchronization failed:", response.status);
      return null;
    }
    return withoutGMP(await response.json());
  } catch {
    console.error("IPO persistence synchronization is unavailable.");
    return null;
  }
}
const IPO_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
let lastIPORefreshStartedAt = 0;
let ipoRefreshPromise: Promise<void> | null = null;
// Prevent newly served responses from extending the life of old GMP-bearing caches.
// Previously cached responses must also be purged at the deployment/CDN layer.
const IPO_CACHE_CONTROL = "no-store";
function catalogueResponse(value:unknown,source:string) {
  return NextResponse.json(withoutGMP(value), {
    status: 200,
    headers: { "Cache-Control": IPO_CACHE_CONTROL, "X-STFL-IPO-Source": source },
  });
}
function refreshCatalogueInBackground() {
  const now = Date.now();
  if (now - lastIPORefreshStartedAt < IPO_REFRESH_INTERVAL_MS || ipoRefreshPromise) return;
  lastIPORefreshStartedAt = now;
  ipoRefreshPromise = (async () => {
    const liveResult = await runIPOEngine();
    if (liveResult.ipos.length > 0) await synchronizeCatalogue(liveResult.ipos);
  })().catch(() => {
    console.error("Background IPO refresh failed.");
  }).finally(() => { ipoRefreshPromise = null; });
}
export async function GET() {
  try {
    const stored = await readStoredCatalogue();
    if (stored) {
      refreshCatalogueInBackground();
      return catalogueResponse(stored, "persistent-catalogue");
    }
    const liveResult = await runIPOEngine();
    if (liveResult.ipos.length > 0) {
      const synchronized = await synchronizeCatalogue(liveResult.ipos);
      if (synchronized) return catalogueResponse(synchronized, "live-synchronized");
    }
    return catalogueResponse(liveResult, "live-fallback");
  } catch {
    console.error("IPO API request failed.");
    return NextResponse.json({ error: "Unable to load IPO data." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
