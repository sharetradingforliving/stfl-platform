import { NextResponse } from "next/server";

import {
  getNseFinancialResultFilings,
  type NseFinancialFiling,
} from "@/lib/fundamental/providers/nseFinancialResults";

import {
  fetchAndParseNseXbrl,
} from "@/lib/fundamental/providers/nseXbrl";

import {
  normalizeNseXbrlPeriod,
} from "@/lib/fundamental/normalizers/nseFinancialNormalizer";

import type {
  FinancialPeriodType,
} from "@/lib/fundamental/types";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export const dynamic =
  "force-dynamic";

const MONTH_NUMBERS: Record<
  string,
  number
> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

function parseNseDate(
  value: string | null
): number {
  if (!value) {
    return 0;
  }

  const trimmedValue =
    value.trim();

  const directDate =
    Date.parse(trimmedValue);

  if (
    Number.isFinite(directDate)
  ) {
    return directDate;
  }

  const match =
    trimmedValue.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

  if (!match) {
    return 0;
  }

  const month =
    MONTH_NUMBERS[
      match[2].toUpperCase()
    ];

  if (month === undefined) {
    return 0;
  }

  return Date.UTC(
    Number(match[3]),
    month,
    Number(match[1]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0)
  );
}

function getFilingTimestamp(
  filing: NseFinancialFiling
): number {
  const periodTimestamp =
    parseNseDate(
      filing.periodEnded
    );

  const filingTimestamp =
    parseNseDate(
      filing.filingDate
    );

  return Math.max(
    periodTimestamp,
    filingTimestamp
  );
}

function selectLatestConsolidatedFiling(
  filings:
    NseFinancialFiling[]
): NseFinancialFiling | null {
  const usableFilings =
    filings.filter(
      (filing) =>
        Boolean(filing.xbrlUrl)
    );

  if (
    usableFilings.length === 0
  ) {
    return null;
  }

  const consolidatedFilings =
    usableFilings.filter(
      (filing) =>
        filing.consolidated === true
    );

  const selectionPool =
    consolidatedFilings.length > 0
      ? consolidatedFilings
      : usableFilings;

  return (
    selectionPool
      .slice()
      .sort(
        (first, second) =>
          getFilingTimestamp(
            second
          ) -
          getFilingTimestamp(
            first
          )
      )[0] ?? null
  );
}

function getFinancialPeriodType(
  filingPeriod: string
): FinancialPeriodType {
  if (
    filingPeriod === "Annual"
  ) {
    return "ANNUAL";
  }

  if (
    filingPeriod ===
      "Quarterly" ||
    filingPeriod ===
      "Half-Yearly"
  ) {
    return "QUARTERLY";
  }

  return "QUARTERLY";
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } =
      await params;

    const stockSymbol =
      decodeURIComponent(symbol)
        .trim()
        .toUpperCase();

    if (!stockSymbol) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "A valid company symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    const filingResponse =
      await getNseFinancialResultFilings(
        stockSymbol
      );

    const selectedFiling =
      selectLatestConsolidatedFiling(
        filingResponse.filings
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
            "No usable consolidated NSE XBRL filing was found.",

          warnings:
            filingResponse.warnings,
        },
        {
          status: 404,
        }
      );
    }

    const parsedDocument =
      await fetchAndParseNseXbrl(
        selectedFiling.xbrlUrl
      );

    const normalized =
      normalizeNseXbrlPeriod(
        parsedDocument,
        {
          period:
            selectedFiling.periodEnded ??
            selectedFiling.period,

          periodType:
            getFinancialPeriodType(
              selectedFiling.period
            ),

          periodEnded:
            selectedFiling.periodEnded,

          documentType:
            `${selectedFiling.period} ${
              selectedFiling.consolidated
                ? "Consolidated"
                : "Standalone"
            } Financial Results`,
        }
      );

    return NextResponse.json(
      {
        status:
          normalized.warnings.length >
          0
            ? "partial"
            : "success",

        symbol: stockSymbol,

        companyName:
          selectedFiling.companyName,

        filing: {
          period:
            selectedFiling.period,

          periodEnded:
            selectedFiling.periodEnded,

          filingDate:
            selectedFiling.filingDate,

          consolidated:
            selectedFiling.consolidated,

          audited:
            selectedFiling.audited,

          xbrlUrl:
            selectedFiling.xbrlUrl,
        },

        selectedContexts:
          normalized.selectedContexts,

        financialPeriod:
          normalized.financialPeriod,

        warnings: [
          ...filingResponse.warnings,
          ...parsedDocument.warnings,
          ...normalized.warnings,
        ],

        generatedAt:
          new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Normalized fundamental route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to normalize the NSE financial filing.",

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