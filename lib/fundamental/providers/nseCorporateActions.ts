import "server-only";

type JsonRecord = Record<
  string,
  unknown
>;

export type NseCorporateActionType =
  | "DIVIDEND"
    | "DISTRIBUTION"
  | "BONUS"
  | "STOCK_SPLIT"
  | "RIGHTS"
  | "BUYBACK"
  | "MERGER"
  | "DEMERGER"
  | "CAPITAL_REDUCTION"
  | "INTEREST_PAYMENT"
  | "AGM"
  | "OTHER";

export type NseCorporateAction = {
  symbol: string;

  companyName:
    string | null;

  purpose:
    string | null;

  subject:
    string | null;

  exDate:
    string | null;

  recordDate:
    string | null;

  broadcastDate:
    string | null;

  isin:
    string | null;

  actionType:
    NseCorporateActionType;

  oldFaceValue:
    number | null;

  newFaceValue:
    number | null;

  shareAdjustmentFactor:
    number | null;

  raw:
    JsonRecord;
};

export type NseCorporateActionsResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

  symbol: string;

  actions:
    NseCorporateAction[];

  warnings:
    string[];

  source: {
    name: string;
    pageUrl: string;
    fetchedAt: string;
  };
};

const NSE_BASE_URL =
  "https://www.nseindia.com";

const NSE_CORPORATE_ACTIONS_PAGE =
  "/companies-listing/" +
  "corporate-filings-actions";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 " +
    "(Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 " +
    "(KHTML, like Gecko) " +
    "Chrome/124.0 Safari/537.36",

  Accept:
    "application/json,text/plain,*/*",

  "Accept-Language":
    "en-IN,en;q=0.9",

  Referer:
    `${NSE_BASE_URL}${NSE_CORPORATE_ACTIONS_PAGE}`,

  "Cache-Control":
    "no-cache",

  Pragma:
    "no-cache",
};

function asRecord(
  value: unknown
): JsonRecord | null {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return null;
}

function asString(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmedValue =
    value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

function firstString(
  record: JsonRecord,
  keys: string[]
): string | null {
  for (
    const key
    of keys
  ) {
    const value =
      asString(
        record[key]
      );

    if (value) {
      return value;
    }
  }

  return null;
}

function parseNseDate(
  value: string | null
): number {
  if (!value) {
    return 0;
  }

  const match =
    value.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
    );

  if (!match) {
    const parsedValue =
      Date.parse(value);

    return Number.isFinite(
      parsedValue
    )
      ? parsedValue
      : 0;
  }

  const monthByName:
    Record<string, number> = {
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

  const month =
    monthByName[
      match[2]
        .toUpperCase()
    ];

  if (
    month === undefined
  ) {
    return 0;
  }

  return Date.UTC(
    Number(match[3]),
    month,
    Number(match[1])
  );
}

function parsePositiveNumber(
  value: string
): number | null {
  const parsedValue =
    Number(value);

  return (
    Number.isFinite(
      parsedValue
    ) &&
    parsedValue > 0
  )
    ? parsedValue
    : null;
}

function parseStockSplit(
  description:
    string | null
): {
  actionType:
    NseCorporateActionType;

  oldFaceValue:
    number | null;

  newFaceValue:
    number | null;

  shareAdjustmentFactor:
    number | null;
} {
  if (!description) {
    return {
      actionType:
        "OTHER",

      oldFaceValue:
        null,

      newFaceValue:
        null,

      shareAdjustmentFactor:
        null,
    };
  }

  const normalized =
    description
      .replace(/\s+/g, " ")
      .trim();

  const identifiesSplit =
    /SPLIT|SUB[\s-]?DIVISION/i
      .test(normalized);

  if (!identifiesSplit) {
    return {
      actionType:
        "OTHER",

      oldFaceValue:
        null,

      newFaceValue:
        null,

      shareAdjustmentFactor:
        null,
    };
  }

  /*
   * Example supported NSE wording:
   *
   * Stock Split From Rs 5/-
   * Per Share To Re 1/- Per Share
   */
  const valueMatch =
    normalized.match(
      /FROM\s+(?:RS\.?|RE\.?|₹)\s*(\d+(?:\.\d+)?)\s*\/?\s*-?\s*PER\s+SHARE\s+TO\s+(?:RS\.?|RE\.?|₹)\s*(\d+(?:\.\d+)?)/i
    );

  if (!valueMatch) {
    return {
      actionType:
        "STOCK_SPLIT",

      oldFaceValue:
        null,

      newFaceValue:
        null,

      shareAdjustmentFactor:
        null,
    };
  }

  const oldFaceValue =
    parsePositiveNumber(
      valueMatch[1]
    );

  const newFaceValue =
    parsePositiveNumber(
      valueMatch[2]
    );

  if (
    oldFaceValue === null ||
    newFaceValue === null
  ) {
    return {
      actionType:
        "STOCK_SPLIT",

      oldFaceValue:
        null,

      newFaceValue:
        null,

      shareAdjustmentFactor:
        null,
    };
  }

  const adjustmentFactor =
    oldFaceValue /
    newFaceValue;

  const shareAdjustmentFactor =
    Number.isFinite(
      adjustmentFactor
    ) &&
    adjustmentFactor > 0
      ? adjustmentFactor
      : null;

  return {
    actionType:
      "STOCK_SPLIT",

    oldFaceValue,

    newFaceValue,

    shareAdjustmentFactor,
  };
}

function identifyActionType(
  description: string | null
): NseCorporateActionType {
  if (!description) {
    return "OTHER";
  }

  const normalized = description
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (
    /\bSTOCK\s+SPLIT\b/.test(normalized) ||
    /\bSUB[\s-]?DIVISION\b/.test(normalized) ||
    /\bSPLIT\s+FROM\b/.test(normalized)
  ) {
    return "STOCK_SPLIT";
  }

  if (/\bBONUS\b/.test(normalized)) {
    return "BONUS";
  }

  if (
    /\bBUY[\s-]?BACK\b/.test(normalized) ||
    /\bBUYBACK\b/.test(normalized)
  ) {
    return "BUYBACK";
  }

    if (
    /\bRIGHTS?\s+(?:ISSUE|ENTITLEMENT)\b/.test(
      normalized
    ) ||
    /\bRIGHTS?\s*[-:]?\s*\d+[\s\S]*:\s*\d+\b/.test(
      normalized
    )
  ) {
    return "RIGHTS";
  }

  if (
    /\bDEMERGER\b/.test(normalized) ||
    /\bDE-MERGER\b/.test(normalized) ||
    /\bDEMERGED\b/.test(normalized)
  ) {
    return "DEMERGER";
  }

  if (
    /\bMERGER\b/.test(normalized) ||
    /\bAMALGAMATION\b/.test(normalized) ||
    /\bMERGED\b/.test(normalized)
  ) {
    return "MERGER";
  }

  if (
    /\bCAPITAL\s+REDUCTION\b/.test(normalized) ||
    /\bREDUCTION\s+OF\s+(?:SHARE\s+)?CAPITAL\b/.test(
      normalized
    )
  ) {
    return "CAPITAL_REDUCTION";
  }

  if (
    /\bDIVIDEND\b/.test(normalized) ||
    /\bINTERIM\s+DIVIDEND\b/.test(normalized) ||
    /\bFINAL\s+DIVIDEND\b/.test(normalized)
  ) {
    return "DIVIDEND";
  }

  if (
    /\bINTEREST\s+(?:PAYMENT|ON)\b/.test(normalized)
  ) {
    return "INTEREST_PAYMENT";
  }

    if (
    /\bDISTRIBUTION\b/.test(
      normalized
    ) &&
    /\bPER\s+UNIT\b/.test(
      normalized
    )
  ) {
    return "DISTRIBUTION";
  }
  if (
    /\bANNUAL\s+GENERAL\s+MEETING\b/.test(normalized) ||
    /\bAGM\b/.test(normalized)
  ) {
    return "AGM";
  }

  return "OTHER";
}

function extractRows(
  payload: unknown
): JsonRecord[] {
  if (
    Array.isArray(payload)
  ) {
    return payload
      .map(asRecord)
      .filter(
        (
          row
        ): row is JsonRecord =>
          row !== null
      );
  }

  const payloadRecord =
    asRecord(payload);

  if (!payloadRecord) {
    return [];
  }

  const possibleArrayKeys = [
    "data",
    "results",
    "records",
    "corporateActions",
    "corporate_actions",
  ];

  for (
    const key
    of possibleArrayKeys
  ) {
    const value =
      payloadRecord[key];

    if (
      Array.isArray(value)
    ) {
      return value
        .map(asRecord)
        .filter(
          (
            row
          ): row is JsonRecord =>
            row !== null
        );
    }
  }

  return [];
}

function extractCookieHeader(
  response: Response
): string {
  const headersWithCookies =
    response.headers as
      Headers & {
        getSetCookie?:
          () => string[];
      };

  const setCookies =
    headersWithCookies
      .getSetCookie?.();

  if (
    Array.isArray(
      setCookies
    ) &&
    setCookies.length > 0
  ) {
    return setCookies
      .map(
        (cookie) =>
          cookie.split(";")[0]
      )
      .join("; ");
  }

  const combinedCookie =
    response.headers.get(
      "set-cookie"
    );

  if (!combinedCookie) {
    return "";
  }

  return combinedCookie
    .split(
      /,(?=[^;,]+=)/
    )
    .map(
      (cookie) =>
        cookie.split(";")[0]
    )
    .join("; ");
}

async function createNseSession(): Promise<
  string
> {
  const response =
    await fetch(
      `${NSE_BASE_URL}${NSE_CORPORATE_ACTIONS_PAGE}`,
      {
        method:
          "GET",

        headers:
          DEFAULT_HEADERS,

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to initialize the " +
        `NSE session: ${response.status}`
    );
  }

  return extractCookieHeader(
    response
  );
}

async function fetchCorporateActionsJson(
  symbol: string,
  cookieHeader: string
): Promise<unknown> {
  const query =
    new URLSearchParams({
      index:
        "equities",

      symbol,
    });

  const response =
    await fetch(
      `${NSE_BASE_URL}/api/corporates-corporateActions?${query.toString()}`,
      {
        method:
          "GET",

        headers: {
          ...DEFAULT_HEADERS,

          ...(cookieHeader
            ? {
                Cookie:
                  cookieHeader,
              }
            : {}),
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "NSE corporate-actions " +
        `request failed with status ${response.status}`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    throw new Error(
      "NSE returned an unexpected corporate-actions response format"
    );
  }

  return response.json();
}

function getRowSymbol(
  row: JsonRecord
): string | null {
  return firstString(
    row,
    [
      "symbol",
      "compSymbol",
      "nseSymbol",
      "tradingSymbol",
    ]
  );
}

function normaliseAction(
  row: JsonRecord,
  requestedSymbol: string
): NseCorporateAction {
  const purpose =
    firstString(
      row,
      [
        "purpose",
        "subject",
        "description",
      ]
    );

  const subject =
    firstString(
      row,
      [
        "subject",
        "purpose",
        "description",
      ]
    );

  const splitDetails =
    parseStockSplit(
      purpose ??
      subject
    );

  const detectedActionType =
    splitDetails
      .actionType !== "OTHER"
      ? splitDetails
          .actionType
      : identifyActionType(
          purpose ??
          subject
        );

  return {
    symbol:
      getRowSymbol(row) ??
      requestedSymbol,

    companyName:
      firstString(
        row,
        [
          "companyName",
          "company",
          "compName",
          "comp",
          "name",
        ]
      ),

    purpose,

    subject,

    exDate:
      firstString(
        row,
        [
          "exDate",
          "ex-date",
          "ex_date",
        ]
      ),

    recordDate:
      firstString(
        row,
        [
          "recordDate",
          "record-date",
          "record_date",
          "recDate",
        ]
      ),

    broadcastDate:
      firstString(
        row,
        [
          "broadcastDate",
          "broadcast-date",
          "filingDate",
          "caBroadcastDate",
        ]
      ),

    isin:
      firstString(
        row,
        [
          "isin",
          "ISIN",
        ]
      ),

    actionType:
      detectedActionType,

    oldFaceValue:
      splitDetails
        .oldFaceValue,

    newFaceValue:
      splitDetails
        .newFaceValue,

    shareAdjustmentFactor:
      splitDetails
        .shareAdjustmentFactor,

    raw:
      row,
  };
}

function actionIdentity(
  action:
    NseCorporateAction
): string {
  return [
    action.symbol,
    action.purpose ?? "",
    action.exDate ?? "",
    action.recordDate ?? "",
    action.broadcastDate ?? "",
  ].join("|");
}

function deduplicateActions(
  actions:
    NseCorporateAction[]
): NseCorporateAction[] {
  const uniqueActions =
    new Map<
      string,
      NseCorporateAction
    >();

  for (
    const action
    of actions
  ) {
    uniqueActions.set(
      actionIdentity(
        action
      ),
      action
    );
  }

  return Array.from(
    uniqueActions.values()
  );
}

export async function getNseCorporateActions(
  requestedSymbol: string
): Promise<
  NseCorporateActionsResponse
> {
  const symbol =
    requestedSymbol
      .trim()
      .toUpperCase();

  if (!symbol) {
    throw new Error(
      "A valid NSE symbol is required"
    );
  }

  const pageUrl =
    `${NSE_BASE_URL}${NSE_CORPORATE_ACTIONS_PAGE}`;

  try {
    const cookieHeader =
      await createNseSession();

    const payload =
      await fetchCorporateActionsJson(
        symbol,
        cookieHeader
      );

    const rows =
      extractRows(
        payload
      );

    const actions =
      deduplicateActions(
        rows
          .filter(
            (row) => {
              const rowSymbol =
                getRowSymbol(
                  row
                );

              return (
                !rowSymbol ||
                rowSymbol
                  .trim()
                  .toUpperCase() ===
                  symbol
              );
            }
          )
          .map(
            (row) =>
              normaliseAction(
                row,
                symbol
              )
          )
      );

    actions.sort(
      (
        first,
        second
      ) =>
        parseNseDate(
          second.exDate ??
          second.recordDate ??
          second.broadcastDate
        ) -
        parseNseDate(
          first.exDate ??
          first.recordDate ??
          first.broadcastDate
        )
    );

    const warnings:
      string[] = [];

    const unparsedSplits =
      actions.filter(
        (action) =>
          action.actionType ===
            "STOCK_SPLIT" &&
          action
            .shareAdjustmentFactor ===
            null
      );

    if (
      unparsedSplits.length >
      0
    ) {
      warnings.push(
        `${unparsedSplits.length} stock split action(s) were identified, but their adjustment factors could not be parsed safely.`
      );
    }

    return {
      status:
        actions.length === 0
          ? "unavailable"
          : warnings.length > 0
            ? "partial"
            : "success",

      symbol,

      actions,

      warnings:
        actions.length > 0
          ? warnings
          : [
              `No NSE corporate actions were found for ${symbol}.`,
            ],

      source: {
        name:
          "NSE Corporate Actions",

        pageUrl,

        fetchedAt:
          new Date()
            .toISOString(),
      },
    };
  } catch (error) {
    return {
      status:
        "unavailable",

      symbol,

      actions: [],

      warnings: [
        error instanceof Error
          ? error.message
          : "Unable to retrieve NSE corporate actions",
      ],

      source: {
        name:
          "NSE Corporate Actions",

        pageUrl,

        fetchedAt:
          new Date()
            .toISOString(),
      },
    };
  }
}
function formatNseCorporateActionDate(
  date: Date
): string {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).formatToParts(date);

  const day =
    parts.find(
      (part) => part.type === "day"
    )?.value ?? "";

  const month =
    parts.find(
      (part) => part.type === "month"
    )?.value ?? "";

  const year =
    parts.find(
      (part) => part.type === "year"
    )?.value ?? "";

  return `${day}-${month}-${year}`;
}

async function fetchMarketCorporateActionsJson(
  fromDate: Date,
  toDate: Date,
  cookieHeader: string
): Promise<unknown> {
  const query =
    new URLSearchParams({
      index: "equities",

      from_date:
        formatNseCorporateActionDate(
          fromDate
        ),

      to_date:
        formatNseCorporateActionDate(
          toDate
        ),
    });

  const response =
    await fetch(
      `${NSE_BASE_URL}/api/corporates-corporateActions?${query.toString()}`,
      {
        method: "GET",

        headers: {
          ...DEFAULT_HEADERS,

          ...(cookieHeader
            ? {
                Cookie:
                  cookieHeader,
              }
            : {}),
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "NSE market corporate-actions " +
        `request failed with status ${response.status}`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    throw new Error(
      "NSE returned an unexpected market corporate-actions response format"
    );
  }

  return response.json();
}

export async function getNseMarketCorporateActions(
  fromDate: Date,
  toDate: Date
): Promise<NseCorporateActionsResponse> {
  const pageUrl =
    `${NSE_BASE_URL}${NSE_CORPORATE_ACTIONS_PAGE}`;

  if (
    Number.isNaN(
      fromDate.getTime()
    ) ||
    Number.isNaN(
      toDate.getTime()
    )
  ) {
    throw new Error(
      "Valid corporate-action dates are required"
    );
  }

  if (
    fromDate.getTime() >
    toDate.getTime()
  ) {
    throw new Error(
      "Corporate-action start date cannot be after the end date"
    );
  }

  try {
    const cookieHeader =
      await createNseSession();

    const payload =
      await fetchMarketCorporateActionsJson(
        fromDate,
        toDate,
        cookieHeader
      );

    const rows =
      extractRows(payload);

    const actions =
      deduplicateActions(
        rows
          .map(
            (row) =>
              normaliseAction(
                row,
                "UNKNOWN"
              )
          )
          .filter(
            (action) =>
              action.symbol !==
                "UNKNOWN" &&
              Boolean(
                action.purpose ??
                  action.subject
              )
          )
      );

    actions.sort(
      (
        first,
        second
      ) =>
        parseNseDate(
          first.exDate ??
            first.recordDate ??
            first.broadcastDate
        ) -
        parseNseDate(
          second.exDate ??
            second.recordDate ??
            second.broadcastDate
        )
    );

    const warnings:
      string[] = [];

    const unparsedSplits =
      actions.filter(
        (action) =>
          action.actionType ===
            "STOCK_SPLIT" &&
          action
            .shareAdjustmentFactor ===
            null
      );

    if (
      unparsedSplits.length >
      0
    ) {
      warnings.push(
        `${unparsedSplits.length} stock split action(s) were identified, but their adjustment factors could not be parsed safely.`
      );
    }

    return {
      status:
        actions.length === 0
          ? "unavailable"
          : warnings.length > 0
            ? "partial"
            : "success",

      symbol: "ALL",

      actions,

      warnings:
        actions.length > 0
          ? warnings
          : [
              "No NSE corporate actions were found for the selected period.",
            ],

      source: {
        name:
          "NSE Corporate Actions",

        pageUrl,

        fetchedAt:
          new Date()
            .toISOString(),
      },
    };
  } catch (error) {
    return {
      status:
        "unavailable",

      symbol: "ALL",

      actions: [],

      warnings: [
        error instanceof Error
          ? error.message
          : "Unable to retrieve NSE market corporate actions",
      ],

      source: {
        name:
          "NSE Corporate Actions",

        pageUrl,

        fetchedAt:
          new Date()
            .toISOString(),
      },
    };
  }
}