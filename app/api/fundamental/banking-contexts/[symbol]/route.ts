import {
  NextResponse,
} from "next/server";

import {
  getNseFinancialResultFilings,
} from "@/lib/fundamental/providers/nseFinancialResults";

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
): number {
  if (!value) {
    return 0;
  }

  const parsedValue =
    Date.parse(value);

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : 0;
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { symbol } =
      await params;

    const stockSymbol =
      symbol
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

    const filingResponse =
      await getNseFinancialResultFilings(
        stockSymbol
      );

    const bankingFilings =
  filingResponse.filings
    .filter(
      (filing) =>
        filing.xbrlUrl
          ?.toUpperCase()
          .includes(
            "/BANKING_"
          )
    )
    .slice()
    .sort(
      (first, second) =>
        normalizeDate(
          second.periodEnded
        ) -
        normalizeDate(
          first.periodEnded
        )
    );

const selectedFiling =
  bankingFilings.find(
    (filing) =>
      filing.periodEnded ===
        "31-Mar-2024" &&
      filing.consolidated ===
        true
  ) ??
  bankingFilings.find(
    (filing) =>
      filing.periodEnded ===
        "31-Mar-2024"
  ) ??
  null;

    if (
      !selectedFiling ||
      !selectedFiling.xbrlUrl
    ) {
      return NextResponse.json(
        {
          status:
            "unavailable",

          symbol:
            stockSymbol,

          error:
            "No matching BANKING XBRL filing was found.",

          availableBankingFilings:
  bankingFilings.map(
    (filing) => ({
      period:
        filing.period,

      periodEnded:
        filing.periodEnded,

      filingDate:
        filing.filingDate,

      consolidated:
        filing.consolidated,

      audited:
        filing.audited,

      xbrlUrl:
        filing.xbrlUrl,
    })
  ),
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

    const contextSummaries =
      document.contexts.map(
        (context) => {
          const facts =
            document.facts.filter(
              (fact) =>
                fact.contextRef ===
                context.id
            );

          const numericFacts =
            facts.filter(
              (fact) =>
                fact.numericValue !==
                null
            );

          return {
            id:
              context.id,

            entityIdentifier:
              context
                .entityIdentifier,

            periodType:
              context.periodType,

            startDate:
              context.startDate,

            endDate:
              context.endDate,

            instant:
              context.instant,

            dimensions:
              context.dimensions,

            dimensionCount:
              Object.keys(
                context.dimensions
              ).length,

            factCount:
              facts.length,

            numericFactCount:
              numericFacts.length,

            sampleFacts:
              numericFacts
                .slice(0, 25)
                .map(
                  (fact) => ({
                    name:
                      fact.name,

                    localName:
                      fact.localName,

                    numericValue:
                      fact.numericValue,

                    unitRef:
                      fact.unitRef,
                  })
                ),
          };
        }
      );

      const targetDurationContexts =
  contextSummaries
    .filter(
      (context) =>
        context.periodType ===
          "DURATION" &&
        context.startDate ===
          "2023-04-01" &&
        context.endDate ===
          "2023-06-30"
    )
    .sort(
      (first, second) =>
        second.numericFactCount -
        first.numericFactCount
    );

    const importantFactPattern =
  /revenue|interest|income|profit|loss|earning|asset|advance|deposit|equity|capital|share|npa|provision/i;

const importantFacts =
  document.facts
    .filter(
      (fact) =>
        fact.numericValue !==
          null &&
        importantFactPattern.test(
          fact.localName
        )
    )
    .map(
      (fact) => {
        const context =
          document.contexts.find(
            (candidate) =>
              candidate.id ===
              fact.contextRef
          );

        return {
          name:
            fact.name,

          localName:
            fact.localName,

          numericValue:
            fact.numericValue,

          unitRef:
            fact.unitRef,

          contextRef:
            fact.contextRef,

          periodType:
            context?.periodType ??
            null,

          startDate:
            context?.startDate ??
            null,

          endDate:
            context?.endDate ??
            null,

          instant:
            context?.instant ??
            null,

          dimensions:
            context?.dimensions ??
            {},
        };
      }
    );

    return NextResponse.json(
      {
        status: "success",

        symbol:
          stockSymbol,
          bankingFilings: bankingFilings.map(
  (filing) => ({
    period: filing.period,
    periodEnded: filing.periodEnded,
    filingDate: filing.filingDate,
    consolidated: filing.consolidated,
    audited: filing.audited,
    xbrlUrl: filing.xbrlUrl,
  })
),

        selectedFiling: {
          period:
            selectedFiling.period,

          periodEnded:
            selectedFiling
              .periodEnded,

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

        taxonomyPrefixes:
          document
            .taxonomyPrefixes,

        contextCount:
          document.contexts
            .length,

        factCount:
          document.facts
            .length,

            targetDurationContexts,
importantFacts,
        contexts:
          contextSummaries,

        warnings:
          document.warnings,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Banking XBRL context diagnostic error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to inspect the banking XBRL filing.",

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