import { NextResponse } from "next/server";

import {
  getNseFinancialResultFilings,
  type NseFinancialFiling,
} from "@/lib/fundamental/providers/nseFinancialResults";

import {
  fetchAndParseNseXbrl,
  type XbrlFact,
} from "@/lib/fundamental/providers/nseXbrl";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

type FactSummary = {
  name: string;
  localName: string;
  taxonomyPrefix: string | null;
  sampleValue: string;
  sampleNumericValue:
    number | null;
  sampleContextRef: string;
  sampleUnitRef: string | null;
  occurrences: number;
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

  const day = Number(match[1]);

  const month =
    MONTH_NUMBERS[
      match[2].toUpperCase()
    ];

  const year =
    Number(match[3]);

  const hour =
    Number(match[4] ?? 0);

  const minute =
    Number(match[5] ?? 0);

  const second =
    Number(match[6] ?? 0);

  if (
    month === undefined ||
    !Number.isFinite(day) ||
    !Number.isFinite(year)
  ) {
    return 0;
  }

  return Date.UTC(
    year,
    month,
    day,
    hour,
    minute,
    second
  );
}

function filingTimestamp(
  filing: NseFinancialFiling
): number {
  return Math.max(
    parseNseDate(
      filing.periodEnded
    ),
    parseNseDate(
      filing.filingDate
    )
  );
}

function selectLatestFiling(
  filings:
    NseFinancialFiling[]
): NseFinancialFiling | null {
  const withXbrl =
    filings.filter(
      (filing) =>
        Boolean(filing.xbrlUrl)
    );

  if (withXbrl.length === 0) {
    return null;
  }

  const consolidated =
    withXbrl.filter(
      (filing) =>
        filing.consolidated === true
    );

  const selectionPool =
    consolidated.length > 0
      ? consolidated
      : withXbrl;

  return (
    selectionPool
      .slice()
      .sort(
        (first, second) => {
          const dateDifference =
            filingTimestamp(second) -
            filingTimestamp(first);

          if (
            dateDifference !== 0
          ) {
            return dateDifference;
          }

          if (
            first.period === "Annual" &&
            second.period !== "Annual"
          ) {
            return -1;
          }

          if (
            second.period === "Annual" &&
            first.period !== "Annual"
          ) {
            return 1;
          }

          return 0;
        }
      )[0] ?? null
  );
}

function summarizeFacts(
  facts: XbrlFact[]
): FactSummary[] {
  const summaries =
    new Map<
      string,
      FactSummary
    >();

  for (const fact of facts) {
    const existing =
      summaries.get(fact.name);

    if (existing) {
      existing.occurrences += 1;
      continue;
    }

    summaries.set(
      fact.name,
      {
        name: fact.name,
        localName:
          fact.localName,

        taxonomyPrefix:
          fact.taxonomyPrefix,

        sampleValue:
          fact.value,

        sampleNumericValue:
          fact.numericValue,

        sampleContextRef:
          fact.contextRef,

        sampleUnitRef:
          fact.unitRef,

        occurrences: 1,
      }
    );
  }

  return Array.from(
    summaries.values()
  ).sort((first, second) =>
    first.localName.localeCompare(
      second.localName
    )
  );
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
      selectLatestFiling(
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
            "No usable NSE XBRL filing was found.",
          warnings:
            filingResponse.warnings,
        },
        {
          status: 404,
        }
      );
    }

    const parsedXbrl =
      await fetchAndParseNseXbrl(
        selectedFiling.xbrlUrl
      );

    const factSummaries =
      summarizeFacts(
        parsedXbrl.facts
      );

    return NextResponse.json(
      {
        status: "success",
        symbol: stockSymbol,

        selectedFiling: {
          companyName:
            selectedFiling.companyName,

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

        document: {
          taxonomyPrefixes:
            parsedXbrl.taxonomyPrefixes,

          contextCount:
            parsedXbrl.contexts.length,

          unitCount:
            parsedXbrl.units.length,

          factCount:
            parsedXbrl.facts.length,

          uniqueFactCount:
            factSummaries.length,

          warnings:
            parsedXbrl.warnings,
        },

        contexts:
          parsedXbrl.contexts,

        units:
          parsedXbrl.units,

        factSummaries,

        source: {
          filingPage:
            filingResponse.source
              .pageUrl,

          xbrl:
            parsedXbrl.sourceUrl,

          fetchedAt:
            parsedXbrl.fetchedAt,
        },
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
      "Fundamental XBRL route error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error:
          "Unable to inspect the NSE XBRL filing.",

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