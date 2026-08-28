import { NextResponse } from "next/server";

import {
  getNseFinancialSeries,
} from "@/lib/fundamental/services/nseFinancialSeries";

import {
  deriveAnnualFinancials,
} from "@/lib/fundamental/services/deriveAnnualFinancials";

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

    const series =
      await getNseFinancialSeries(
        stockSymbol,
        {
          quarterlyLimit: 20,
          annualLimit: 10,
        }
      );

    const derived =
      deriveAnnualFinancials(
        series.quarterly,
        series.annual
      );

    const officialAnnual =
      series.annual.map(
        (annual) => ({
          fiscalYear:
            `FY${annual.periodEnded
              .slice(2, 4)}`,

          periodEnded:
            annual.periodEnded,

          sourceType:
            annual.sourceType,

          durationDays:
            annual.durationDays,

          consolidated:
            annual.consolidated,

          audited:
            annual.audited,

          taxonomyPrefixes:
            annual.taxonomyPrefixes,

          financialPeriod:
            annual.financialPeriod,

          selectedContexts:
            annual.selectedContexts,

          warnings:
            annual.warnings,
        })
      );

    const combinedAnnual = [
      ...officialAnnual,
      ...derived.annual,
    ].sort(
      (first, second) =>
        second.periodEnded
          .localeCompare(
            first.periodEnded
          )
    );

    const diagnostics = [
      ...series.warnings,
      ...derived.warnings,
    ];

    const oldestPeriod =
      combinedAnnual.at(-1)
        ?.periodEnded ?? null;

    const newestPeriod =
      combinedAnnual[0]
        ?.periodEnded ?? null;

    return NextResponse.json(
      {
        status:
          combinedAnnual.length > 0
            ? "success"
            : "unavailable",

        symbol: stockSymbol,

        companyName:
          series.companyName,

quarterly: series.quarterly,

        annual:
          combinedAnnual,

        coverage: {
          annualPeriods:
            combinedAnnual.length,

          officialAnnualPeriods:
            officialAnnual.length,

          derivedAnnualPeriods:
            derived.annual.length,

          newestPeriod,
          oldestPeriod,

          sufficientForCagr:
            combinedAnnual.length >= 3,
        },

        incompleteFiscalYears:
          derived
            .incompleteFiscalYears,

        /*
         * Diagnostics are retained for
         * auditability but should not be
         * presented as active user-facing
         * errors.
         */
        diagnostics,

        warnings: [],

        generatedAt:
          new Date().toISOString(),
      },
      {
        status:
          combinedAnnual.length > 0
            ? 200
            : 404,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Annual financial series route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to prepare the annual financial series.",

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