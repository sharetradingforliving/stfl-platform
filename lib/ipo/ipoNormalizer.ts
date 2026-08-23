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


/**
 * ------------------------------------------------
 * Create URL-safe slug
 * ------------------------------------------------
 */

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


/**
 * ------------------------------------------------
 * Parse numbers safely
 * ------------------------------------------------
 */

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

  const result =
    Number(cleaned);

  return Number.isFinite(result)
    ? result
    : undefined;
}


/**
 * ------------------------------------------------
 * Parse NSE price band
 *
 * Examples:
 * Rs.285 to Rs.300
 * ₹285 - ₹300
 * 285-300
 * 300
 * ------------------------------------------------
 */

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

    const price =
      Number(matches[0]);

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


/**
 * ------------------------------------------------
 * Calculate estimated issue size in ₹ crore
 *
 * Shares offered × upper price band ÷ 1 crore
 * ------------------------------------------------
 */

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


/**
 * ------------------------------------------------
 * Determine IPO type
 * ------------------------------------------------
 */

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
 * ------------------------------------------------
 * Determine IPO status
 * ------------------------------------------------
 */

function determineIPOStatus(
  record: NSEIPORecord
): IPOStatus {

  if (
    record.sourceType === "upcoming"
  ) {
    return "Upcoming";
  }

  const rawStatus =
    record.status
      ?.toLowerCase()
      .trim() || "";

  if (
    rawStatus.includes("open") ||
    rawStatus.includes("active")
  ) {
    return "Open";
  }

  if (
    rawStatus.includes("upcoming") ||
    rawStatus.includes("forthcoming")
  ) {
    return "Upcoming";
  }

  if (
    rawStatus.includes("allot")
  ) {
    return "Allotment";
  }

  if (
    rawStatus.includes("listed")
  ) {
    return "Listed";
  }

  if (
    rawStatus.includes("closed") ||
    rawStatus.includes("close")
  ) {
    return "Closed";
  }

  /**
   * Date fallback
   */

  const now =
    new Date();

  const openDate =
    record.issueStartDate
      ? new Date(
          record.issueStartDate
        )
      : undefined;

  const closeDate =
    record.issueEndDate
      ? new Date(
          record.issueEndDate
        )
      : undefined;

  const listingDate =
    record.listingDate
      ? new Date(
          record.listingDate
        )
      : undefined;

  if (
    listingDate &&
    !Number.isNaN(
      listingDate.getTime()
    ) &&
    now >= listingDate
  ) {
    return "Listed";
  }

  if (
    openDate &&
    !Number.isNaN(
      openDate.getTime()
    ) &&
    now < openDate
  ) {
    return "Upcoming";
  }

  if (
    openDate &&
    closeDate &&
    !Number.isNaN(
      openDate.getTime()
    ) &&
    !Number.isNaN(
      closeDate.getTime()
    ) &&
    now >= openDate &&
    now <= closeDate
  ) {
    return "Open";
  }

  if (
    closeDate &&
    !Number.isNaN(
      closeDate.getTime()
    ) &&
    now > closeDate
  ) {
    return "Closed";
  }

  return "Upcoming";
}


/**
 * ------------------------------------------------
 * Normalize subscription
 *
 * Preserve provider-enriched category values.
 * Fall back to NSE noOfTime for Total.
 * ------------------------------------------------
 */

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


/**
 * ------------------------------------------------
 * Normalize one NSE IPO record
 * ------------------------------------------------
 */

export function normalizeNSEIPO(
  record: NSEIPORecord
): IPORecord | null {

  const companyName =
    record.companyName?.trim();

  if (!companyName) {
    return null;
  }


  /**
   * NSE uses issuePrice for
   * current issue price-band data.
   */

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


  const normalized:
    IPORecord = {

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


/**
 * ------------------------------------------------
 * Normalize complete NSE IPO response
 * ------------------------------------------------
 */

export function normalizeNSEIPOData(
  records: NSEIPORecord[]
): IPORecord[] {

  if (
    !Array.isArray(records)
  ) {
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