import "server-only";

type JsonRecord = Record<string, unknown>;

export type NseIntegratedFiling = {
  symbol: string;
  companyName: string | null;
  quarterEnded: string | null;
  filingDate: string | null;
  consolidated: boolean | null;
  audited: boolean | null;
  xbrlUrl: string | null;
  attachmentUrl: string | null;
  raw: JsonRecord;
};

export type NseIntegratedResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

  symbol: string;
  filings: NseIntegratedFiling[];
  warnings: string[];
  attemptedEndpoints: string[];

  source: {
    name: string;
    pageUrl: string;
    fetchedAt: string;
  };
};

const NSE_BASE_URL =
  "https://www.nseindia.com";

const INTEGRATED_PAGE =
  "/companies-listing/" +
  "corporate-integrated-filing";

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
    `${NSE_BASE_URL}${INTEGRATED_PAGE}`,

  "Cache-Control":
    "no-cache",

  Pragma:
    "no-cache",
};

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function toStringValue(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

function firstString(
  record: JsonRecord,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = toStringValue(
      record[key]
    );

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function toBoolean(
  value: unknown
): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    normalizeText(value);

  if (
    normalized === "YES" ||
    normalized === "TRUE" ||
    normalized === "CONSOLIDATED" ||
    normalized === "AUDITED"
  ) {
    return true;
  }

  if (
    normalized === "NO" ||
    normalized === "FALSE" ||
    normalized === "STANDALONE" ||
    normalized === "UNAUDITED"
  ) {
    return false;
  }

  return null;
}

function firstBoolean(
  record: JsonRecord,
  keys: string[]
): boolean | null {
  for (const key of keys) {
    const value = toBoolean(
      record[key]
    );

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function extractRows(
  payload: unknown
): JsonRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const possibleKeys = [
    "data",
    "results",
    "records",
    "integratedFilings",
    "integratedFiling",
    "financialResults",
  ];

  for (const key of possibleKeys) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }

    if (isRecord(value)) {
      for (
        const nestedValue
        of Object.values(value)
      ) {
        if (
          Array.isArray(nestedValue)
        ) {
          return nestedValue.filter(
            isRecord
          );
        }
      }
    }
  }

  return [];
}

function extractCookieHeader(
  response: Response
): string {
  const headersWithCookies =
    response.headers as Headers & {
      getSetCookie?: () => string[];
    };

  const setCookies =
    headersWithCookies
      .getSetCookie?.();

  if (
    setCookies &&
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
    .split(/,(?=[^;,]+=)/)
    .map(
      (cookie) =>
        cookie.split(";")[0]
    )
    .join("; ");
}

async function createNseSession(): Promise<
  string
> {
  const response = await fetch(
    `${NSE_BASE_URL}${INTEGRATED_PAGE}`,
    {
      method: "GET",
      headers: DEFAULT_HEADERS,
      cache: "no-store",
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

async function requestJson(
  path: string,
  cookieHeader: string
): Promise<unknown> {
  const response = await fetch(
    `${NSE_BASE_URL}${path}`,
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
      `HTTP ${response.status}`
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
      "Unexpected response format"
    );
  }

  return response.json();
}

function getRowSymbol(
  row: JsonRecord
): string | null {
  return firstString(row, [
    "symbol",
    "nseSymbol",
    "nse_symbol",
    "reSymbol",
    "tradingSymbol",
    "companySymbol",
  ]);
}

function matchesSymbol(
  row: JsonRecord,
  symbol: string
): boolean {
  const rowSymbol =
    getRowSymbol(row);

  return (
    rowSymbol?.toUpperCase() ===
    symbol.toUpperCase()
  );
}

function cleanDocumentUrl(
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.toLowerCase() ===
      "null" ||
    normalized.toLowerCase() ===
      "undefined" ||
    normalized.endsWith("/null") ||
    normalized.endsWith(
      "/undefined"
    )
  ) {
    return null;
  }

  if (
    !normalized.startsWith(
      "https://"
    )
  ) {
    return null;
  }

  return normalized;
}

function getXbrlUrl(
  row: JsonRecord
): string | null {
  return cleanDocumentUrl(
    firstString(row, [
      "xbrl",
      "xbrlUrl",
      "xbrlLink",
      "xmlUrl",
      "xmlFile",
    ])
  );
}

function getIxbrlUrl(
  row: JsonRecord
): string | null {
  return cleanDocumentUrl(
    firstString(row, [
      "ixbrl",
      "ixbrlUrl",
      "ixbrlLink",
    ])
  );
}

function isIndasFinancialFiling(
  row: JsonRecord
): boolean {
  const xbrlUrl =
    getXbrlUrl(row);

  const ixbrlUrl =
    getIxbrlUrl(row);

  const searchableText = [
    xbrlUrl,
    ixbrlUrl,
    firstString(row, [
      "subject",
      "category",
      "filingType",
      "documentType",
    ]),
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(value)
    )
    .join(" ")
    .toUpperCase();

  return (
    searchableText.includes(
      "INTEGRATED FILING INDAS"
    ) ||
    searchableText.includes(
      "INTEGRATED_FILING_INDAS"
    ) ||
    searchableText.includes(
      "INTEGRATED%20FILING%20INDAS"
    )
  );
}

function normalizeFiling(
  row: JsonRecord,
  requestedSymbol: string
): NseIntegratedFiling {
  const consolidated =
    firstBoolean(row, [
      "consolidated",
      "consolidatedOrStandalone",
      "natureOfReport",
      "reportType",
      "typeOfResult",
      "isConsolidated",
    ]);

  const audited =
    firstBoolean(row, [
      "audited",
      "auditedUnaudited",
      "auditStatus",
      "isAudited",
    ]);

  return {
    symbol:
      getRowSymbol(row) ??
      requestedSymbol,

    companyName:
      firstString(row, [
        "cmName",
        "companyName",
        "company",
        "name",
        "reCompanyName",
      ]),

    quarterEnded:
      firstString(row, [
        "qe_Date",
        "quarterEnded",
        "forQuarterEnded",
        "periodEnded",
        "periodEndDate",
        "toDate",
        "date",
      ]),

    filingDate:
      firstString(row, [
        "broadcast_Date",
        "creation_Date",
        "filingDate",
        "broadcastDate",
        "submissionDate",
        "timestamp",
        "disseminationDate",
      ]),

    consolidated,
    audited,

    xbrlUrl:
      getXbrlUrl(row),

    attachmentUrl:
      cleanDocumentUrl(
        firstString(row, [
          "pdf_attach",
          "attachment",
          "attachmentUrl",
          "pdfUrl",
          "fileName",
        ])
      ),

    raw: row,
  };
}

function parseNseDate(
  value: string | null
): number {
  if (!value) {
    return 0;
  }

  const normalized =
    value.trim();

  const dateTimeMatch =
    normalized.match(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/
    );

  if (dateTimeMatch) {
    const monthMap: Record<
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

    const month =
      monthMap[
        dateTimeMatch[2]
          .toUpperCase()
      ];

    if (month !== undefined) {
      return Date.UTC(
        Number(dateTimeMatch[3]),
        month,
        Number(dateTimeMatch[1]),
        Number(
          dateTimeMatch[4] ?? 0
        ),
        Number(
          dateTimeMatch[5] ?? 0
        ),
        Number(
          dateTimeMatch[6] ?? 0
        )
      );
    }
  }

  const parsedTime =
    Date.parse(normalized);

  return Number.isNaN(parsedTime)
    ? 0
    : parsedTime;
}

function sortFilings(
  filings: NseIntegratedFiling[]
): NseIntegratedFiling[] {
  return [...filings].sort(
    (first, second) => {
      const quarterDifference =
        parseNseDate(
          second.quarterEnded
        ) -
        parseNseDate(
          first.quarterEnded
        );

      if (quarterDifference !== 0) {
        return quarterDifference;
      }

      const filingDifference =
        parseNseDate(
          second.filingDate
        ) -
        parseNseDate(
          first.filingDate
        );

      if (filingDifference !== 0) {
        return filingDifference;
      }

      if (
        first.consolidated !==
        second.consolidated
      ) {
        return first.consolidated
          ? -1
          : 1;
      }

      return 0;
    }
  );
}

function uniqueFilings(
  filings: NseIntegratedFiling[]
): NseIntegratedFiling[] {
  const map = new Map<
    string,
    NseIntegratedFiling
  >();

  for (const filing of filings) {
    const identity = [
      filing.symbol,
      filing.quarterEnded ?? "",
      filing.filingDate ?? "",
      filing.xbrlUrl ?? "",
      String(
        filing.consolidated
      ),
    ].join("|");

    map.set(
      identity,
      filing
    );
  }

  return Array.from(
    map.values()
  );
}

export async function getNseIntegratedFinancialFilings(
  requestedSymbol: string
): Promise<NseIntegratedResponse> {
  const symbol =
    requestedSymbol
      .trim()
      .toUpperCase();

  if (!symbol) {
    throw new Error(
      "A valid NSE symbol is required"
    );
  }

  const warnings: string[] = [];

  const attemptedEndpoints:
    string[] = [];

  const filings:
    NseIntegratedFiling[] = [];

  const sourcePage =
    `${NSE_BASE_URL}${INTEGRATED_PAGE}`;

  try {
    const cookieHeader =
      await createNseSession();

    const query =
      new URLSearchParams({
        index: "equities",
        symbol,
      }).toString();

    const endpointCandidates = [
      `/api/integrated-filing-results?${query}`,
      `/api/corporate-integrated-filing?${query}`,
    ];

    for (
      const endpoint
      of endpointCandidates
    ) {
      attemptedEndpoints.push(
        endpoint
      );

      try {
        const payload =
          await requestJson(
            endpoint,
            cookieHeader
          );

        const rows =
          extractRows(payload);

        const matchingRows =
          rows.filter((row) =>
            matchesSymbol(
              row,
              symbol
            )
          );

        const financialRows =
          matchingRows.filter(
            isIndasFinancialFiling
          );

        filings.push(
          ...financialRows.map(
            (row) =>
              normalizeFiling(
                row,
                symbol
              )
          )
        );

        if (
          financialRows.length > 0
        ) {
          break;
        }

        if (
          matchingRows.length > 0
        ) {
          warnings.push(
            `${endpoint} returned ${matchingRows.length} ` +
              `${symbol} records, but none were ` +
              "Integrated Filing INDAS financial statements."
          );
        } else {
          warnings.push(
            `${endpoint} returned no matching ${symbol} filings.`
          );
        }
      } catch (error) {
        warnings.push(
          `${endpoint} failed: ${
            error instanceof Error
              ? error.message
              : "Unknown error"
          }`
        );
      }
    }

    const normalizedFilings =
      sortFilings(
        uniqueFilings(filings)
      );

    const filingsWithXbrl =
      normalizedFilings.filter(
        (filing) =>
          filing.xbrlUrl !== null
      );

    if (
      normalizedFilings.length > 0 &&
      filingsWithXbrl.length === 0
    ) {
      warnings.push(
        "Financial filings were found, but no usable XBRL XML URL was available."
      );
    }

    return {
      status:
        normalizedFilings.length > 0
          ? warnings.length > 0
            ? "partial"
            : "success"
          : "unavailable",

      symbol,
      filings:
        normalizedFilings,

      warnings,
      attemptedEndpoints,

      source: {
        name:
          "NSE Integrated Filing - Financials",

        pageUrl:
          sourcePage,

        fetchedAt:
          new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: "unavailable",
      symbol,
      filings: [],

      warnings: [
        error instanceof Error
          ? error.message
          : "Unable to retrieve integrated financial filings",
      ],

      attemptedEndpoints,

      source: {
        name:
          "NSE Integrated Filing - Financials",

        pageUrl:
          sourcePage,

        fetchedAt:
          new Date().toISOString(),
      },
    };
  }
}