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

  const months: Record<
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
      months[
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

    const selectedFiling =
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
      !selectedFiling ||
      !selectedFiling.xbrlUrl
    ) {
      return NextResponse.json(
        {
          status: "unavailable",
          symbol: stockSymbol,

          error:
            "No audited consolidated March Integrated Filing was found.",

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

    const annualContexts =
      document.contexts
        .filter((context) => {
          if (
            context.periodType !==
              "DURATION" ||
            Object.keys(
              context.dimensions
            ).length > 0
          ) {
            return false;
          }

          const durationDays =
            getDurationDays(
              context.startDate,
              context.endDate
            );

          return (
            durationDays !== null &&
            durationDays >= 300 &&
            durationDays <= 380
          );
        })
        .map((context) => ({
          context,

          durationDays:
            getDurationDays(
              context.startDate,
              context.endDate
            ) ?? 0,

          factCount:
            document.facts.filter(
              (fact) =>
                fact.contextRef ===
                context.id
            ).length,
        }))
        .sort(
          (first, second) =>
            second.factCount -
            first.factCount
        );

    const annualContext =
      annualContexts[0] ?? null;

    if (!annualContext) {
      return NextResponse.json(
        {
          status: "unavailable",
          symbol: stockSymbol,

          error:
            "The audited March filing does not contain a usable full-year context.",

          filing:
            selectedFiling,
        },
        {
          status: 404,
        }
      );
    }

    const annualEndDate =
      annualContext
        .context
        .endDate;

    const instantContext =
      document.contexts.find(
        (context) =>
          context.periodType ===
            "INSTANT" &&
          Object.keys(
            context.dimensions
          ).length === 0 &&
          context.instant ===
            annualEndDate
      ) ?? null;

    const formatFacts = (
      contextId: string | null
    ) => {
      if (!contextId) {
        return [];
      }

      return document.facts
        .filter(
          (fact) =>
            fact.contextRef ===
            contextId
        )
        .map((fact) => ({
          name: fact.name,

          localName:
            fact.localName,

          value: fact.value,

          numericValue:
            fact.numericValue,

          unitRef:
            fact.unitRef,

          decimals:
            fact.decimals,

          scale:
            fact.scale,
        }))
        .sort(
          (first, second) =>
            first.localName
              .localeCompare(
                second.localName
              )
        );
    };

    const annualFacts =
      formatFacts(
        annualContext
          .context
          .id
      );

    const instantFacts =
      formatFacts(
        instantContext?.id ??
          null
      );

    const importantPatterns = [
      "debt",
      "borrow",
      "loan",
      "cash",
      "equity",
      "capital",
      "asset",
      "liabil",
      "share",
      "financecost",
      "interest",
      "propertyplant",
      "purchase",
    ];

    const importantFacts = [
      ...annualFacts,
      ...instantFacts,
    ].filter((fact) => {
      const normalizedName =
        fact.localName
          .replace(
            /[^a-z0-9]/gi,
            ""
          )
          .toLowerCase();

      return importantPatterns.some(
        (pattern) =>
          normalizedName.includes(
            pattern
          )
      );
    });

    return NextResponse.json(
      {
        status: "success",
        symbol: stockSymbol,

        selectedFiling: {
          companyName:
            selectedFiling.companyName,

          quarterEnded:
            selectedFiling.quarterEnded,

          filingDate:
            selectedFiling.filingDate,

          consolidated:
            selectedFiling.consolidated,

          audited:
            selectedFiling.audited,

          xbrlUrl:
            selectedFiling.xbrlUrl,
        },

        selectedContexts: {
          annual: {
            ...annualContext.context,

            durationDays:
              annualContext
                .durationDays,

            factCount:
              annualContext
                .factCount,
          },

          instant:
            instantContext,
        },

        counts: {
          annualFacts:
            annualFacts.length,

          instantFacts:
            instantFacts.length,

          importantFacts:
            importantFacts.length,
        },

        importantFacts,
        annualFacts,
        instantFacts,

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
      "Integrated annual facts route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to inspect the integrated annual financial facts.",

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