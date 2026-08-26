import { NextResponse } from "next/server";

import {
  getNseIntegratedFinancialFilings,
} from "@/lib/fundamental/providers/nseIntegratedFinancialResults";

import {
  fetchAndParseNseXbrl,
} from "@/lib/fundamental/providers/nseXbrl";

import {
  normalizeNseXbrlPeriod,
} from "@/lib/fundamental/normalizers/nseFinancialNormalizer";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } = await params;

    const stockSymbol =
      symbol.trim().toUpperCase();

    if (!stockSymbol) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "Stock symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const filingResponse =
      await getNseIntegratedFinancialFilings(
        stockSymbol
      );

    const selectedFiling =
      filingResponse.filings.find(
        (filing) =>
          filing.consolidated ===
            true &&
          filing.xbrlUrl !== null
      ) ??
      filingResponse.filings.find(
        (filing) =>
          filing.xbrlUrl !== null
      );

    if (
      !selectedFiling ||
      !selectedFiling.xbrlUrl
    ) {
      return NextResponse.json(
        {
          status: "unavailable",
          symbol: stockSymbol,

          error:
            "No usable NSE Integrated Filing XBRL was found.",

          warnings:
            filingResponse.warnings,
        },
        {
          status: 404,
        }
      );
    }

    const document =
      await fetchAndParseNseXbrl(
        selectedFiling.xbrlUrl
      );

    const normalized =
      normalizeNseXbrlPeriod(
        document,
        {
          period:
            selectedFiling
              .quarterEnded ??
            "Latest Quarter",

          periodType:
            "QUARTERLY",

          periodEnded:
            selectedFiling
              .quarterEnded,

          documentType:
            selectedFiling
              .consolidated
              ? "Integrated Filing - Consolidated Financial Results"
              : "Integrated Filing - Standalone Financial Results",
        }
      );

    return NextResponse.json(
      {
        status: "success",
        symbol: stockSymbol,

        companyName:
          selectedFiling.companyName,

        filing: {
          quarterEnded:
            selectedFiling
              .quarterEnded,

          filingDate:
            selectedFiling
              .filingDate,

          consolidated:
            selectedFiling
              .consolidated,

          audited:
            selectedFiling
              .audited,

          xbrlUrl:
            selectedFiling
              .xbrlUrl,
        },

        selectedContexts:
          normalized
            .selectedContexts,

        financialPeriod:
          normalized
            .financialPeriod,

        warnings: [
          ...filingResponse.warnings,
          ...document.warnings,
          ...normalized.warnings,
        ],

        generatedAt:
          new Date().toISOString(),
      },
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
      "Integrated normalized financial route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to normalize the latest integrated financial filing.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}