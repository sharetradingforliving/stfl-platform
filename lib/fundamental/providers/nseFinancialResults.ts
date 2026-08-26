import "server-only";

type JsonRecord = Record<
  string,
  unknown
>;

export type NseFinancialPeriod =
  | "Quarterly"
  | "Annual"
  | "Half-Yearly"
  | "Others";

export type NseFinancialFiling = {
  symbol: string;
  companyName: string | null;
  period: NseFinancialPeriod;
  periodEnded: string | null;
  filingDate: string | null;
  consolidated: boolean | null;
  audited: boolean | null;
  xbrlUrl: string | null;
  attachmentUrl: string | null;
  raw: JsonRecord;
};

export type NseFinancialResultResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

  symbol: string;
  filings: NseFinancialFiling[];
  warnings: string[];

  source: {
    name: string;
    pageUrl: string;
    fetchedAt: string;
  };
};

const NSE_BASE_URL =
  "https://www.nseindia.com";

const NSE_FINANCIAL_RESULTS_PAGE =
  "/companies-listing/" +
  "corporate-filings-financial-results";

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
    `${NSE_BASE_URL}${NSE_FINANCIAL_RESULTS_PAGE}`,

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

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

function asBoolean(
  value: unknown
): boolean | null {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalizedValue =
    value.trim().toUpperCase();

  if (
    normalizedValue === "YES" ||
    normalizedValue === "TRUE" ||
    normalizedValue ===
      "CONSOLIDATED" ||
    normalizedValue === "AUDITED"
  ) {
    return true;
  }

  if (
    normalizedValue === "NO" ||
    normalizedValue === "FALSE" ||
    normalizedValue ===
      "STANDALONE" ||
    normalizedValue === "UNAUDITED"
  ) {
    return false;
  }

  return null;
}

function firstString(
  record: JsonRecord,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = asString(
      record[key]
    );

    if (value) {
      return value;
    }
  }

  return null;
}

function firstBoolean(
  record: JsonRecord,
  keys: string[]
): boolean | null {
  for (const key of keys) {
    const value = asBoolean(
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
    "financialResults",
    "financial_results",
  ];

  for (
    const key of possibleArrayKeys
  ) {
    const value =
      payloadRecord[key];

    if (Array.isArray(value)) {
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
    response.headers as Headers & {
      getSetCookie?: () => string[];
    };

  const setCookies =
    headersWithCookies.getSetCookie?.();

  if (
    Array.isArray(setCookies) &&
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
  const response = await fetch(
    `${NSE_BASE_URL}${NSE_FINANCIAL_RESULTS_PAGE}`,
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

async function fetchNseJson(
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
              Cookie: cookieHeader,
            }
          : {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `NSE request failed with status ${response.status}`
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
      "NSE returned an unexpected response format"
    );
  }

  return response.json();
}

function getRowSymbol(
  row: JsonRecord
): string | null {
  return firstString(row, [
    "symbol",
    "reSymbol",
    "nseSymbol",
    "nse_symbol",
    "tradingSymbol",
  ]);
}

function rowMatchesSymbol(
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

function normaliseFiling(
  row: JsonRecord,
  requestedSymbol: string,
  period: NseFinancialPeriod
): NseFinancialFiling {
  const filingType =
    firstString(row, [
      "consolidated",
      "reConsolidated",
      "consolidatedOrStandalone",
      "natureOfReport",
    ]);

  const consolidated =
    filingType
      ?.toUpperCase()
      .includes("CONSOLIDATED") ??
    false;

  const auditedText =
    firstString(row, [
      "audited",
      "reAudited",
      "auditedUnaudited",
    ]);

  return {
    symbol:
      getRowSymbol(row) ??
      requestedSymbol,

    companyName:
      firstString(row, [
        "companyName",
        "company",
        "reCompanyName",
        "name",
      ]),

    period,

    periodEnded:
      firstString(row, [
        "toDate",
        "periodEnded",
        "periodEndDate",
        "reToDate",
        "date",
      ]),

    filingDate:
      firstString(row, [
        "filingDate",
        "broadcastDate",
        "submissionDate",
        "reBroadcastDate",
      ]),

    consolidated:
      filingType
        ? consolidated
        : firstBoolean(row, [
            "isConsolidated",
          ]),

    audited:
      auditedText
        ? auditedText
            .toUpperCase()
            .includes("AUDITED") &&
          !auditedText
            .toUpperCase()
            .includes("UNAUDITED")
        : firstBoolean(row, [
            "isAudited",
          ]),

    xbrlUrl:
      firstString(row, [
        "xbrl",
        "xbrlUrl",
        "xbrlLink",
        "reXbrl",
      ]),

    attachmentUrl:
      firstString(row, [
        "attachment",
        "attachmentUrl",
        "fileName",
        "pdfUrl",
      ]),

    raw: row,
  };
}

function filingIdentity(
  filing: NseFinancialFiling
): string {
  return [
    filing.symbol,
    filing.period,
    filing.periodEnded ?? "",
    filing.filingDate ?? "",
    filing.consolidated ?? "",
    filing.xbrlUrl ?? "",
  ].join("|");
}

function deduplicateFilings(
  filings: NseFinancialFiling[]
): NseFinancialFiling[] {
  const uniqueFilings =
    new Map<
      string,
      NseFinancialFiling
    >();

  for (const filing of filings) {
    uniqueFilings.set(
      filingIdentity(filing),
      filing
    );
  }

  return Array.from(
    uniqueFilings.values()
  );
}

async function fetchPeriodFilings(
  symbol: string,
  period: NseFinancialPeriod,
  cookieHeader: string
): Promise<NseFinancialFiling[]> {
  const query =
    new URLSearchParams({
      index: "equities",
      period,
      symbol,
    });

  const payload =
    await fetchNseJson(
      `/api/corporates-financial-results?${query.toString()}`,
      cookieHeader
    );

  const rows =
    extractRows(payload);

  return rows
    .filter((row) =>
      rowMatchesSymbol(
        row,
        symbol
      )
    )
    .map((row) =>
      normaliseFiling(
        row,
        symbol,
        period
      )
    );
}

async function fetchPastResults(
  symbol: string,
  cookieHeader: string
): Promise<NseFinancialFiling[]> {
  const query =
    new URLSearchParams({
      symbol,
    });

  const payload =
    await fetchNseJson(
      `/api/results-comparision?${query.toString()}`,
      cookieHeader
    );

  const rows =
    extractRows(payload);

  return rows
    .filter((row) => {
      const rowSymbol =
        getRowSymbol(row);

      return (
        !rowSymbol ||
        rowMatchesSymbol(
          row,
          symbol
        )
      );
    })
    .map((row) =>
      normaliseFiling(
        row,
        symbol,
        "Quarterly"
      )
    );
}

export async function getNseFinancialResultFilings(
  requestedSymbol: string
): Promise<NseFinancialResultResponse> {
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
  const filings:
    NseFinancialFiling[] = [];

  try {
    const cookieHeader =
      await createNseSession();

    const periods:
      NseFinancialPeriod[] = [
        "Quarterly",
        "Annual",
      ];

    for (const period of periods) {
      try {
        const periodFilings =
          await fetchPeriodFilings(
            symbol,
            period,
            cookieHeader
          );

        filings.push(
          ...periodFilings
        );
      } catch (error) {
        warnings.push(
          `${period} filing request failed: ${
            error instanceof Error
              ? error.message
              : "Unknown error"
          }`
        );
      }
    }

    try {
      const pastResults =
        await fetchPastResults(
          symbol,
          cookieHeader
        );

      filings.push(
        ...pastResults
      );
    } catch (error) {
      warnings.push(
        `Historical comparison request failed: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    }

    const uniqueFilings =
      deduplicateFilings(
        filings
      );

    uniqueFilings.sort(
      (first, second) =>
        (
          second.periodEnded ??
          second.filingDate ??
          ""
        ).localeCompare(
          first.periodEnded ??
            first.filingDate ??
            ""
        )
    );

    return {
      status:
        uniqueFilings.length > 0
          ? warnings.length > 0
            ? "partial"
            : "success"
          : "unavailable",

      symbol,
      filings: uniqueFilings,
      warnings:
        uniqueFilings.length === 0 &&
        warnings.length === 0
          ? [
              "No NSE financial-result filings were found for this symbol.",
            ]
          : warnings,

      source: {
        name:
          "NSE Corporate Financial Results",

        pageUrl:
          `${NSE_BASE_URL}${NSE_FINANCIAL_RESULTS_PAGE}`,

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
          : "Unable to retrieve NSE financial-result filings",
      ],

      source: {
        name:
          "NSE Corporate Financial Results",

        pageUrl:
          `${NSE_BASE_URL}${NSE_FINANCIAL_RESULTS_PAGE}`,

        fetchedAt:
          new Date().toISOString(),
      },
    };
  }
}