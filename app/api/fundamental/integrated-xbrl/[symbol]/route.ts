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

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } = await params;

    const stockSymbol = symbol
      .trim()
      .toUpperCase();

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

    const integratedResponse =
      await getNseIntegratedFinancialFilings(
        stockSymbol
      );

    if (
      integratedResponse.filings.length ===
      0
    ) {
      return NextResponse.json(
        {
          status: "unavailable",
          symbol: stockSymbol,

          error:
            "No NSE Integrated Filing INDAS financial statements were found.",

          warnings:
            integratedResponse.warnings,

          source:
            integratedResponse.source,
        },
        {
          status: 404,
        }
      );
    }

    const selectedFiling =
      integratedResponse.filings.find(
        (filing) =>
          filing.consolidated ===
            true &&
          filing.xbrlUrl !== null
      ) ??
      integratedResponse.filings.find(
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
            "An integrated financial filing was found, but it does not contain a usable XBRL URL.",

          filings:
            integratedResponse.filings,

          warnings:
            integratedResponse.warnings,
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

    const uniqueFactNames =
      Array.from(
        new Set(
          document.facts.map(
            (fact) =>
              fact.localName
          )
        )
      ).sort();

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

        document: {
          taxonomyPrefixes:
            document.taxonomyPrefixes,

          contextCount:
            document.contexts.length,

          unitCount:
            document.units.length,

          factCount:
            document.facts.length,

          uniqueFactCount:
            uniqueFactNames.length,

          warnings:
            document.warnings,
        },

        contexts:
          document.contexts,

        units:
          document.units,

        facts:
          document.facts,

        uniqueFactNames,

        source: {
          name:
            "NSE Integrated Filing - Financials XBRL",

          sourceUrl:
            document.sourceUrl,

          fetchedAt:
            document.fetchedAt,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "NSE Integrated XBRL route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to retrieve or parse the latest NSE Integrated Filing XBRL.",

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