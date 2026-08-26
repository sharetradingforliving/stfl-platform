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

function normalizeDate(
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  const nseDateMatch =
    value.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
    );

  if (!nseDateMatch) {
    return value;
  }

  const months: Record<
    string,
    string
  > = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };

  const month =
    months[
      nseDateMatch[2]
        .toUpperCase()
    ];

  if (!month) {
    return value;
  }

  return (
    `${nseDateMatch[3]}-` +
    `${month}-` +
    nseDateMatch[1].padStart(
      2,
      "0"
    )
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
            "No usable integrated XBRL filing was found.",
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

    const expectedEndDate =
      normalizeDate(
        selectedFiling.quarterEnded
      );

    const durationContext =
      document.contexts.find(
        (context) =>
          context.periodType ===
            "DURATION" &&
          Object.keys(
            context.dimensions
          ).length === 0 &&
          (
            !expectedEndDate ||
            context.endDate ===
              expectedEndDate
          )
      ) ?? null;

    const instantContext =
      document.contexts.find(
        (context) =>
          context.periodType ===
            "INSTANT" &&
          Object.keys(
            context.dimensions
          ).length === 0 &&
          (
            !expectedEndDate ||
            context.instant ===
              expectedEndDate
          )
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
            first.localName.localeCompare(
              second.localName
            )
        );
    };

    const durationFacts =
      formatFacts(
        durationContext?.id ??
          null
      );

    const instantFacts =
      formatFacts(
        instantContext?.id ??
          null
      );

    return NextResponse.json(
      {
        status: "success",
        symbol: stockSymbol,

        selectedFiling: {
          companyName:
            selectedFiling.companyName,

          quarterEnded:
            selectedFiling.quarterEnded,

          consolidated:
            selectedFiling.consolidated,

          audited:
            selectedFiling.audited,

          xbrlUrl:
            selectedFiling.xbrlUrl,
        },

        taxonomyPrefixes:
          document.taxonomyPrefixes,

        selectedContexts: {
          duration:
            durationContext,

          instant:
            instantContext,
        },

        counts: {
          durationFacts:
            durationFacts.length,

          instantFacts:
            instantFacts.length,
        },

        durationFacts,
        instantFacts,
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
      "Integrated financial facts route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to inspect the integrated financial facts.",

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