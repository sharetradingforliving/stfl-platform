import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getNseMarketCorporateActions,
} from "@/lib/fundamental/providers/nseCorporateActions";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

function addDays(
  date: Date,
  days: number
): Date {
  const result =
    new Date(date);

  result.setUTCDate(
    result.getUTCDate() +
      days
  );

  return result;
}

function parseDateParameter(
  value: string | null
): Date | null {
  if (!value) {
    return null;
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const parsed =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        6
      )
    );

  if (
    parsed.getUTCFullYear() !==
      year ||
    parsed.getUTCMonth() !==
      month - 1 ||
    parsed.getUTCDate() !==
      day
  ) {
    return null;
  }

  return parsed;
}

function formatDate(
  date: Date
): string {
  return date
    .toISOString()
    .slice(0, 10);
}

export async function GET(
  request: NextRequest
) {
  try {
    const today =
      new Date();

    const requestedFrom =
      request.nextUrl.searchParams.get(
        "from"
      );

    const requestedTo =
      request.nextUrl.searchParams.get(
        "to"
      );

    const parsedFrom =
      parseDateParameter(
        requestedFrom
      );

    const parsedTo =
      parseDateParameter(
        requestedTo
      );

    if (
      requestedFrom &&
      !parsedFrom
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "The from date must use YYYY-MM-DD format.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      requestedTo &&
      !parsedTo
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "The to date must use YYYY-MM-DD format.",
        },
        {
          status: 400,
        }
      );
    }

    const fromDate =
      parsedFrom ??
      addDays(
        today,
        -30
      );

    const toDate =
      parsedTo ??
      addDays(
        today,
        120
      );

    if (
      fromDate.getTime() >
      toDate.getTime()
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "The from date cannot be after the to date.",
        },
        {
          status: 400,
        }
      );
    }

    const maximumRange =
      366 *
      24 *
      60 *
      60 *
      1000;

    if (
      toDate.getTime() -
        fromDate.getTime() >
      maximumRange
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "The selected period cannot exceed 366 days.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await getNseMarketCorporateActions(
        fromDate,
        toDate
      );

    return NextResponse.json(
      {
        ...result,

        period: {
          from:
            formatDate(
              fromDate
            ),

          to:
            formatDate(
              toDate
            ),
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",

        message:
          error instanceof Error
            ? error.message
            : "Unable to retrieve corporate actions",
      },
      {
        status: 500,
      }
    );
  }
}