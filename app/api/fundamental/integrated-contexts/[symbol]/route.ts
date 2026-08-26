import { NextResponse } from "next/server";

import {
  getNseIntegratedFinancialFilings,
} from "@/lib/fundamental/providers/nseIntegratedFinancialResults";

import {
  fetchAndParseNseXbrl,
} from "@/lib/fundamental/providers/nseXbrl";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

const DAY_IN_MILLISECONDS =
  24 * 60 * 60 * 1000;

function parseDate(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const monthNumbers: Record<
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

  const nseMatch =
    value.trim().match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
    );

  if (nseMatch) {
    const month =
      monthNumbers[
        nseMatch[2]
          .toUpperCase()
      ];

    if (month === undefined) {
      return null;
    }

    return Date.UTC(
      Number(nseMatch[3]),
      month,
      Number(nseMatch[1])
    );
  }

  const parsed =
    Date.parse(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getDurationDays(
  startDate: string | null,
  endDate: string | null
): number | null {
  const start =
    parseDate(startDate);

  const end =
    parseDate(endDate);

  if (
    start === null ||
    end === null ||
    end < start
  ) {
    return null;
  }

  return Math.round(
    (end - start) /
      DAY_IN_MILLISECONDS
  );
}

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

    /*
     * Select the latest audited,
     * consolidated March filing.
     */
    const marchFiling =
      filingResponse.filings.find(
        (filing) =>
          filing.consolidated ===
            true &&
          filing.audited === true &&
          filing.xbrlUrl !== null &&
          (
            filing.quarterEnded
              ?.toUpperCase()
              .includes("-MAR-") ??
            false
          )
      );

    if (
      !marchFiling ||
      !marchFiling.xbrlUrl
    ) {
      return NextResponse.json(
        {
          status: "unavailable",
          symbol: stockSymbol,

          error:
            "No audited consolidated March Integrated Filing was found.",

          availableFilings:
            filingResponse.filings.map(
              (filing) => ({
                quarterEnded:
                  filing.quarterEnded,

                consolidated:
                  filing.consolidated,

                audited:
                  filing.audited,

                hasXbrl:
                  filing.xbrlUrl !==
                  null,
              })
            ),

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
        marchFiling.xbrlUrl
      );

    const dimensionlessContexts =
      document.contexts
        .filter(
          (context) =>
            Object.keys(
              context.dimensions
            ).length === 0
        )
        .map((context) => {
          const durationDays =
            context.periodType ===
              "DURATION"
              ? getDurationDays(
                  context.startDate,
                  context.endDate
                )
              : null;

          const factCount =
            document.facts.filter(
              (fact) =>
                fact.contextRef ===
                context.id
            ).length;

          let suggestedPeriod:
            | "QUARTERLY"
            | "HALF_YEARLY"
            | "NINE_MONTHS"
            | "ANNUAL"
            | "INSTANT"
            | "UNKNOWN" =
            "UNKNOWN";

          if (
            context.periodType ===
            "INSTANT"
          ) {
            suggestedPeriod =
              "INSTANT";
          } else if (
            durationDays !== null &&
            durationDays >= 70 &&
            durationDays <= 110
          ) {
            suggestedPeriod =
              "QUARTERLY";
          } else if (
            durationDays !== null &&
            durationDays >= 160 &&
            durationDays <= 200
          ) {
            suggestedPeriod =
              "HALF_YEARLY";
          } else if (
            durationDays !== null &&
            durationDays >= 240 &&
            durationDays <= 290
          ) {
            suggestedPeriod =
              "NINE_MONTHS";
          } else if (
            durationDays !== null &&
            durationDays >= 300 &&
            durationDays <= 380
          ) {
            suggestedPeriod =
              "ANNUAL";
          }

          return {
            ...context,
            durationDays,
            factCount,
            suggestedPeriod,
          };
        })
        .sort(
          (first, second) =>
            (
              second.durationDays ??
              -1
            ) -
            (
              first.durationDays ??
              -1
            )
        );

    return NextResponse.json(
      {
        status: "success",
        symbol: stockSymbol,

        selectedFiling: {
          companyName:
            marchFiling.companyName,

          quarterEnded:
            marchFiling.quarterEnded,

          filingDate:
            marchFiling.filingDate,

          consolidated:
            marchFiling.consolidated,

          audited:
            marchFiling.audited,

          xbrlUrl:
            marchFiling.xbrlUrl,
        },

        taxonomyPrefixes:
          document.taxonomyPrefixes,

        dimensionlessContexts,

        fullYearContexts:
          dimensionlessContexts.filter(
            (context) =>
              context
                .suggestedPeriod ===
              "ANNUAL"
          ),

        warnings: [
          ...filingResponse.warnings,
          ...document.warnings,
        ],
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
      "Integrated context inspection error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to inspect the March Integrated Filing contexts.",

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