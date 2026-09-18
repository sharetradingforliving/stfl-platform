/**
 * ================================================================
 * STFL IPO Research Engine
 * File: ipoNormalizer.ts
 *
 * Purpose:
 * Convert raw NSE IPO data into the standard STFL IPORecord format.
 * Preserves enriched subscription data from the NSE provider.
 * ================================================================
 */

import type {
  IPORecord,
  IPOStatus,
  IPOType,
} from "./types";

import type {
  NSEIPORecord,
} from "./providers/nse";


function createSlug(
  value: string
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function parseNumber(
  value?: string | number | null
): number | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : undefined;
  }

  const cleaned =
    value
      .replace(/,/g, "")
      .replace(/[^\d.eE+-]/g, "")
      .trim();

  if (!cleaned) {
    return undefined;
  }

  const result = Number(cleaned);

  return Number.isFinite(result)
    ? result
    : undefined;
}


function parsePriceBand(
  value?: string | number
): {
  low?: number;
  high?: number;
} {
  if (
    value === undefined ||
    value === null
  ) {
    return {};
  }

  const text =
    String(value)
      .replace(/₹/g, "")
      .replace(/rs\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const matches =
    text.match(/\d+(?:\.\d+)?/g);

  if (
    !matches ||
    matches.length === 0
  ) {
    return {};
  }

  if (matches.length === 1) {
    const price = Number(matches[0]);

    return {
      low: price,
      high: price,
    };
  }

  return {
    low: Number(matches[0]),
    high: Number(matches[1]),
  };
}


function calculateIssueSizeCr(
  record: NSEIPORecord,
  upperPrice?: number
): number | undefined {
  if (!upperPrice) {
    return undefined;
  }

  const shares =
    parseNumber(
      record.noOfSharesOffered
    ) ??
    parseNumber(
      record.issueSize
    );

  if (!shares) {
    return undefined;
  }

  const valueInRupees =
    shares * upperPrice;

  const valueInCrore =
    valueInRupees / 10_000_000;

  return Number(
    valueInCrore.toFixed(2)
  );
}


function determineIPOType(
  record: NSEIPORecord
): IPOType {
  const text = [
    record.series,
    record.companyName,
    record.securityType,
    record.issueType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("sme") ||
    text.includes("emerge")
  ) {
    return "SME";
  }

  return "Mainboard";
}


/**
 * Convert a provider date into YYYYMMDD for date-only comparison.
 * Explicit numeric formats are handled before Date.parse so that
 * server timezone does not move an IPO into another lifecycle day.
 */
function parseDateKey(
  value?: string | null
): number | undefined {
  if (!value) {
    return undefined;
  }

  const text = value.trim();
  if (!text) {
    return undefined;
  }

  const yearFirst =
    text.match(/^(\d{4})[-/]([01]?\d)[-/]([0-3]?\d)/);

  if (yearFirst) {
    return (
      Number(yearFirst[1]) * 10_000 +
      Number(yearFirst[2]) * 100 +
      Number(yearFirst[3])
    );
  }

  const dayFirst =
    text.match(/^([0-3]?\d)[-/]([01]?\d)[-/](\d{4})/);

  if (dayFirst) {
    return (
      Number(dayFirst[3]) * 10_000 +
      Number(dayFirst[2]) * 100 +
      Number(dayFirst[1])
    );
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return (
    parsed.getUTCFullYear() * 10_000 +
    (parsed.getUTCMonth() + 1) * 100 +
    parsed.getUTCDate()
  );
}


function indiaTodayKey(): number {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value,
        ]
      )
    );

  return (
    Number(values.year) * 10_000 +
    Number(values.month) * 100 +
    Number(values.day)
  );
}


/**
 * Determine lifecycle from dates first. Provider status is a fallback
 * because upstream labels may remain Open after the issue has closed.
 */
function determineIPOStatus(
  record: NSEIPORecord
): IPOStatus {
  const rawStatus =
    record.status
      ?.toLowerCase()
      .trim() || "";

  const today = indiaTodayKey();
  const openDate =
    parseDateKey(record.issueStartDate);
  const closeDate =
    parseDateKey(record.issueEndDate);
  const listingDate =
    parseDateKey(record.listingDate);

  if (
    listingDate !== undefined &&
    today >= listingDate
  ) {
    return "Listed";
  }

  if (
    openDate !== undefined &&
    today < openDate
  ) {
    return "Upcoming";
  }

  if (
    openDate !== undefined &&
    closeDate !== undefined &&
    today >= openDate &&
    today <= closeDate
  ) {
    return "Open";
  }

  if (
    closeDate !== undefined &&
    today > closeDate
  ) {
    if (rawStatus.includes("listed")) {
      return "Listed";
    }

    if (rawStatus.includes("allot")) {
      return "Allotment";
    }

    return "Closed";
  }

  if (rawStatus.includes("listed")) {
    return "Listed";
  }

  if (rawStatus.includes("allot")) {
    return "Allotment";
  }

  if (
    rawStatus.includes("closed") ||
    rawStatus.includes("close")
  ) {
    return "Closed";
  }

  if (
    rawStatus.includes("open") ||
    rawStatus.includes("active")
  ) {
    return "Open";
  }

  if (
    rawStatus.includes("upcoming") ||
    rawStatus.includes("forthcoming") ||
    record.sourceType === "upcoming"
  ) {
    return "Upcoming";
  }

  return "Upcoming";
}


function normalizeSubscription(
  record: NSEIPORecord
): IPORecord["subscription"] {
  const qib =
    record.subscription?.qib;

  const nii =
    record.subscription?.nii;

  const retail =
    record.subscription?.retail;

  const providerTotal =
    record.subscription?.total;

  const fallbackTotal =
    parseNumber(
      record.noOfTime
    );

  const total =
    providerTotal ??
    fallbackTotal;

  if (
    qib === undefined &&
    nii === undefined &&
    retail === undefined &&
    total === undefined
  ) {
    return undefined;
  }

  return {
    qib,
    nii,
    retail,
    total:
      total !== undefined
        ? Number(
            total.toFixed(2)
          )
        : undefined,
  };
}


export function normalizeNSEIPO(
  record: NSEIPORecord
): IPORecord | null {
  const companyName =
    record.companyName?.trim();

  if (!companyName) {
    return null;
  }

  const priceBand =
    parsePriceBand(
      record.issuePrice ??
      record.priceBand
    );

  const slug =
    createSlug(
      companyName
    );

  const issueSizeCr =
    calculateIssueSizeCr(
      record,
      priceBand.high
    );

  const normalized: IPORecord = {
    id:
      record.symbol?.trim() ||
      slug,

    slug,

    companyName,

    symbol:
      record.symbol?.trim(),

    type:
      determineIPOType(
        record
      ),

    exchange:
      "NSE",

    status:
      determineIPOStatus(
        record
      ),

    openDate:
      record.issueStartDate,

    closeDate:
      record.issueEndDate,

    listingDate:
      record.listingDate,

    priceBandLow:
      priceBand.low,

    priceBandHigh:
      priceBand.high,

    issuePrice:
      priceBand.high,

    lotSize:
      record.lotSize,

    issueSizeCr,

    subscription:
      normalizeSubscription(
        record
      ),

    source:
      "NSE",

    sourceUrl:
      "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",

    lastUpdated:
      new Date().toISOString(),
  };

  return normalized;
}


export function normalizeNSEIPOData(
  records: NSEIPORecord[]
): IPORecord[] {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .map(
      normalizeNSEIPO
    )
    .filter(
      (
        record
      ): record is IPORecord =>
        record !== null
    );
}
