import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  synchronizeNseAnnualArchive,
} from "@/lib/fundamental/services/synchronizeNseAnnualArchive";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const headers = {
    "Cache-Control": "private, no-store",
  };

  const expectedToken =
    process.env.FINANCIAL_HISTORY_SYNC_TOKEN;

  const suppliedToken =
    request.headers.get("X-STFL-Sync-Token");

  if (!expectedToken) {
    return NextResponse.json(
      { error: "Synchronization is not configured." },
      { status: 503, headers }
    );
  }

  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken ?? "");

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers }
    );
  }

  const { symbol } = await params;
  const stockSymbol = symbol.trim().toUpperCase();

  if (!/^[A-Z0-9&._-]{1,30}$/.test(stockSymbol)) {
    return NextResponse.json(
      { error: "Invalid stock symbol." },
      { status: 400, headers }
    );
  }

  const backendUrl = (
    process.env.STFL_FINANCIAL_BACKEND_URL ||
    process.env.STFL_BACKEND_URL ||
    ""
  ).trim();

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Financial backend is not configured." },
      { status: 503, headers }
    );
  }

  try {
    const changed = await synchronizeNseAnnualArchive(
      stockSymbol,
      "NSE",
      backendUrl
    );

    return NextResponse.json(
      {
        symbol: stockSymbol,
        status: changed
          ? "synchronized"
          : "no_records_written",
      },
      { headers }
    );
  } catch (error) {
    console.error(
      "Batch financial-history synchronization failed:",
      stockSymbol,
      error
    );

    return NextResponse.json(
      {
        symbol: stockSymbol,
        error: "Financial-history synchronization failed.",
      },
      { status: 502, headers }
    );
  }
}