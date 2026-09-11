import {
  NextResponse,
} from "next/server";

import {
  getNseMarketCorporateActions,
} from "@/lib/fundamental/providers/nseCorporateActions";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const BACKEND_URL =
  process.env.STFL_BACKEND_URL ??
  "http://127.0.0.1:8000";

type SyncRequestBody = {
  from?: string;
  to?: string;
};

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

function parseIsoDate(
  value: string | undefined
): Date | null {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return null;
  }

  const parsed =
    new Date(
      `${value}T06:00:00.000Z`
    );

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;
}

function convertNseDateToIso(
  value: string | null
): string | null {
  if (
    !value ||
    value.trim() === "-"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized
    )
  ) {
    return normalized;
  }

  const match =
    normalized.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
    );

  if (!match) {
    return null;
  }

  const months:
    Record<string, string> = {
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
      match[2].toUpperCase()
    ];

  if (!month) {
    return null;
  }

  const day =
    match[1].padStart(
      2,
      "0"
    );

  return `${match[3]}-${month}-${day}`;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(
          () =>
            ({}) as SyncRequestBody
        ) as SyncRequestBody;

    const today =
      new Date();

    const fromDate =
      body.from
        ? parseIsoDate(
            body.from
          )
        : addDays(
            today,
            -30
          );

    const toDate =
      body.to
        ? parseIsoDate(
            body.to
          )
        : addDays(
            today,
            120
          );

    if (
      !fromDate ||
      !toDate
    ) {
      return NextResponse.json(
        {
          status: "error",

          error:
            "Dates must use YYYY-MM-DD format.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fromDate.getTime() >
      toDate.getTime()
    ) {
      return NextResponse.json(
        {
          status: "error",

          error:
            "The from date cannot be after the to date.",
        },
        {
          status: 400,
        }
      );
    }

    const nseResult =
      await getNseMarketCorporateActions(
        fromDate,
        toDate
      );

    if (
      nseResult.status ===
      "unavailable"
    ) {
      return NextResponse.json(
        {
          status: "error",

          error:
            "NSE corporate actions are currently unavailable.",

          warnings:
            nseResult.warnings,
        },
        {
          status: 502,
        }
      );
    }

    const actions =
      nseResult.actions.map(
        (action) => ({
          symbol:
            action.symbol,

          company_name:
            action.companyName,

          isin:
            action.isin,

          action_type:
            action.actionType,

          purpose:
            action.purpose,

          subject:
            action.subject,

          announcement_date:
            convertNseDateToIso(
              action.broadcastDate
            ),

          ex_date:
            convertNseDateToIso(
              action.exDate
            ),

          record_date:
            convertNseDateToIso(
              action.recordDate
            ),

          dividend_amount:
            null,

          ratio_numerator:
            null,

          ratio_denominator:
            null,

          old_face_value:
            action.oldFaceValue,

          new_face_value:
            action.newFaceValue,

          share_adjustment_factor:
            action
              .shareAdjustmentFactor,

          source:
            nseResult.source.name,

          source_fetched_at:
            nseResult.source
              .fetchedAt,

          raw_payload:
            action.raw,
        })
      );

    const backendUrl =
      new URL(
        "/api/corporate-actions/sync",
        BACKEND_URL
      );

    const response =
      await fetch(
        backendUrl.toString(),
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              actions,
            }),

          cache:
            "no-store",
        }
      );

    const responseData =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",

          error:
            "Unable to save corporate actions.",

          details:
            responseData.detail ??
            responseData.error ??
            "Backend synchronization failed",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      {
        ...responseData,

        nse_status:
          nseResult.status,

        period: {
          from:
            fromDate
              .toISOString()
              .slice(0, 10),

          to:
            toDate
              .toISOString()
              .slice(0, 10),
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
      "Corporate-action synchronization error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",

        error:
          "Unable to synchronize corporate actions.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 503,
      }
    );
  }
}