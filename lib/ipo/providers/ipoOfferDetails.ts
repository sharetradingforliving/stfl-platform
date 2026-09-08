/**
 * ================================================================
 * STFL IPO Research Engine
 * File: providers/ipoOfferDetails.ts
 *
 * Purpose:
 * Fill missing IPO offer details from a secondary public IPO
 * catalogue.
 *
 * NSE remains the primary provider. This provider only fills:
 *
 * - Price band
 * - Lot size
 * - Issue size
 *
 * Existing NSE values are never overwritten.
 * ================================================================
 */

import "server-only";

import type {
  IPORecord,
} from "../types";


const IPO_CATALOGUE_URL =
  "https://zerodha.com/ipo/";


type IPOOfferDetails = {
  companyName: string;

  priceBandLow?: number;

  priceBandHigh?: number;

  lotSize?: number;

  issueSizeCr?: number;

  subscription?:
  IPORecord["subscription"];

  sourceUrl: string;
};


/**
 * ------------------------------------------------
 * Normalize text for safe matching
 * ------------------------------------------------
 */

function normalizeText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(
      /\b(limited|ltd|private|pvt|india)\b/g,
      ""
    )
    .replace(/[^a-z0-9]/g, "")
    .trim();
}


/**
 * ------------------------------------------------
 * Create a comparable slug
 * ------------------------------------------------
 */

function createSlug(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(
      /\b(limited|ltd|private|pvt)\b/g,
      ""
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


/**
 * ------------------------------------------------
 * Decode common HTML entities
 * ------------------------------------------------
 */

function decodeHtml(
  value: string
): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&#8377;/gi, "₹")
    .replace(/&#x20b9;/gi, "₹");
}


/**
 * ------------------------------------------------
 * Convert HTML into searchable text
 * ------------------------------------------------
 */

function htmlToText(
  html: string
): string {
  return decodeHtml(
    html
      .replace(
        /<script\b[^>]*>[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style\b[^>]*>[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * ------------------------------------------------
 * Parse a safe positive number
 * ------------------------------------------------
 */

function parsePositiveNumber(
  value?: string | null
): number | undefined {
  if (!value) {
    return undefined;
  }

  const match =
    value.match(
      /\d[\d,]*(?:\.\d+)?/
    );

  if (!match) {
    return undefined;
  }

  const parsed =
    Number(
      match[0].replace(/,/g, "")
    );

  return (
    Number.isFinite(parsed) &&
    parsed > 0
  )
    ? parsed
    : undefined;
}


/**
 * ------------------------------------------------
 * Return true when offer details are incomplete
 * ------------------------------------------------
 */

function needsOfferDetails(
  ipo: IPORecord
): boolean {
  return (
    ipo.priceBandLow ===
      undefined ||
    ipo.priceBandHigh ===
      undefined ||
    ipo.lotSize ===
      undefined ||
    ipo.issueSizeCr ===
      undefined
  );
}


/**
 * ------------------------------------------------
 * Download a public HTML page safely
 * ------------------------------------------------
 */

async function fetchHtml(
  url: string
): Promise<string | null> {
  try {
    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            Accept:
              "text/html,application/xhtml+xml",

            "User-Agent":
              "Mozilla/5.0 (compatible; STFLResearch/1.0)",
          },

          next: {
            revalidate: 1800,
          },
        }
      );

    if (!response.ok) {
      console.warn(
        "IPO offer-details request failed:",
        url,
        response.status
      );

      return null;
    }

    return await response.text();
  } catch (error) {
    console.warn(
      "Unable to fetch IPO offer details:",
      url,
      error
    );

    return null;
  }
}


/**
 * ------------------------------------------------
 * Extract IPO detail links from catalogue HTML
 * ------------------------------------------------
 */

function extractIPOLinks(
  html: string
): string[] {
  const links =
    new Set<string>();

  const linkPattern =
    /href=["']([^"']*\/ipo\/\d+\/[^"'?#]+)[^"']*["']/gi;

  let match:
    RegExpExecArray | null;

  while (
    (
      match =
        linkPattern.exec(html)
    ) !== null
  ) {
    const href =
      decodeHtml(
        match[1]
      );

    try {
      links.add(
        new URL(
          href,
          IPO_CATALOGUE_URL
        ).toString()
      );
    } catch {
      // Ignore malformed links.
    }
  }

  return Array.from(links);
}


/**
 * ------------------------------------------------
 * Find the most likely detail link
 * ------------------------------------------------
 */

function findDetailLink(
  ipo: IPORecord,
  links: string[]
): string | undefined {
  const companySlug =
    createSlug(
      ipo.companyName
    );

  const symbol =
    ipo.symbol
      ?.toLowerCase()
      .trim();

  const exactSlugMatch =
    links.find(
      (link) => {
        const normalizedLink =
          link.toLowerCase();

        return (
          companySlug.length >= 5 &&
          normalizedLink.includes(
            companySlug
          )
        );
      }
    );

  if (exactSlugMatch) {
    return exactSlugMatch;
  }

  const significantWords =
    companySlug
      .split("-")
      .filter(
        (word) =>
          word.length >= 4
      );

  const wordMatch =
    links.find(
      (link) => {
        const normalizedLink =
          link.toLowerCase();

        return (
          significantWords.length > 0 &&
          significantWords.every(
            (word) =>
              normalizedLink.includes(
                word
              )
          )
        );
      }
    );

  if (wordMatch) {
    return wordMatch;
  }

  if (
    symbol &&
    symbol.length >= 4
  ) {
    return links.find(
      (link) =>
        link
          .toLowerCase()
          .includes(symbol)
    );
  }

  return undefined;
}


/**
 * ------------------------------------------------
 * Parse price range
 *
 * Examples:
 *
 * Price range ₹120 – ₹127
 * Price band Rs. 120 to Rs. 127
 * ------------------------------------------------
 */

function parsePriceBand(
  text: string
): {
  low?: number;
  high?: number;
} {
  const match =
    text.match(
      /(?:price\s*(?:range|band)|issue\s*price)[^\d]{0,30}₹?\s*([\d,]+(?:\.\d+)?)\s*(?:-|–|—|to)\s*₹?\s*([\d,]+(?:\.\d+)?)/i
    );

  if (!match) {
    return {};
  }

  const first =
    parsePositiveNumber(
      match[1]
    );

  const second =
    parsePositiveNumber(
      match[2]
    );

  if (
    first === undefined ||
    second === undefined
  ) {
    return {};
  }

  return {
    low:
      Math.min(
        first,
        second
      ),

    high:
      Math.max(
        first,
        second
      ),
  };
}


/**
 * ------------------------------------------------
 * Parse lot size
 * ------------------------------------------------
 */

function parseLotSize(
  text: string
): number | undefined {
  const match =
    text.match(
      /lot\s*size[^\d]{0,30}([\d,]+)/i
    );

  return parsePositiveNumber(
    match?.[1]
  );
}


/**
 * ------------------------------------------------
 * Parse issue size in ₹ crore
 * ------------------------------------------------
 */

function parseIssueSizeCr(
  text: string
): number | undefined {
  const pattern =
    /(?:total\s+)?issue\s*size[^\d]{0,50}(?:₹|rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/gi;

  const values:
    number[] = [];

  let match:
    RegExpExecArray | null;

  while (
    (
      match =
        pattern.exec(text)
    ) !== null
  ) {
    const parsed =
      parsePositiveNumber(
        match[1]
      );

    if (
      parsed !== undefined
    ) {
      values.push(parsed);
    }
  }

  if (values.length === 0) {
    return undefined;
  }

  /*
   * Prefer a precise decimal value
   * over a rounded whole-crore value.
   */
  const preciseValue =
    values.find(
      (value) =>
        !Number.isInteger(value)
    );

  return (
    preciseValue ??
    values[0]
  );
}

function parseSubscription(
  text: string
): IPORecord["subscription"] {
  function findMultiple(
    categoryPattern: string
  ): number | undefined {
    const pattern =
      new RegExp(
        `${categoryPattern}[\\s\\S]{0,160}?([\\d,]+(?:\\.\\d+)?)\\s*x\\b`,
        "i"
      );

    const match =
      text.match(pattern);

    return parsePositiveNumber(
      match?.[1]
    );
  }

  const qib =
    findMultiple(
      "(?:qualified\\s+institutional\\s+buyers?|institutional)"
    );

  const nii =
    findMultiple(
      "(?:non[-\\s]*institutional\\s+investors?|nii)"
    );

  const retail =
    findMultiple(
      "(?:retail\\s+individual\\s+investors?|retail)"
    );

  const total =
    findMultiple(
      "(?:total\\s+subscription|total)"
    );

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
    total,
  };
}

/**
 * ------------------------------------------------
 * Read one IPO detail page
 * ------------------------------------------------
 */

async function fetchOneOfferDetail(
  ipo: IPORecord,
  detailUrl: string
): Promise<
  IPOOfferDetails | null
> {
  const html =
    await fetchHtml(
      detailUrl
    );

  if (!html) {
    return null;
  }

  const text =
    htmlToText(html);

  const normalizedPage =
    normalizeText(text);

  const normalizedCompany =
    normalizeText(
      ipo.companyName
    );

  /*
   * Reject an accidental URL match.
   */
  if (
    normalizedCompany.length >= 5 &&
    !normalizedPage.includes(
      normalizedCompany
    )
  ) {
    return null;
  }

  const priceBand =
    parsePriceBand(text);

  const lotSize =
    parseLotSize(text);

  const issueSizeCr =
    parseIssueSizeCr(text);

    const subscription =
  parseSubscription(text);

  if (
  priceBand.low === undefined &&
  priceBand.high === undefined &&
  lotSize === undefined &&
  issueSizeCr === undefined &&
  subscription === undefined
) {
    return null;
  }

  return {
    companyName:
      ipo.companyName,

    priceBandLow:
      priceBand.low,

    priceBandHigh:
      priceBand.high,

    lotSize,

    issueSizeCr,

    subscription,

    sourceUrl:
      detailUrl,
  };
}


/**
 * ================================================================
 * ENRICH IPO OFFER DETAILS
 *
 * NSE values remain authoritative.
 * Fallback values only fill undefined properties.
 * ================================================================
 */

export async function enrichIPOOfferDetails(
  ipos: IPORecord[]
): Promise<{
  ipos: IPORecord[];
  enrichedCount: number;
  providerAvailable: boolean;
}> {
  const incompleteIPOs =
    ipos.filter(
      needsOfferDetails
    );

  if (
    incompleteIPOs.length === 0
  ) {
    return {
      ipos,
      enrichedCount: 0,
      providerAvailable: true,
    };
  }

  const catalogueHtml =
    await fetchHtml(
      IPO_CATALOGUE_URL
    );

  if (!catalogueHtml) {
    return {
      ipos,
      enrichedCount: 0,
      providerAvailable: false,
    };
  }

  const detailLinks =
    extractIPOLinks(
      catalogueHtml
    );

  if (
    detailLinks.length === 0
  ) {
    console.warn(
      "No IPO detail links were found in the fallback catalogue."
    );

    return {
      ipos,
      enrichedCount: 0,
      providerAvailable: false,
    };
  }

  const detailsByIPOId =
    new Map<
      string,
      IPOOfferDetails
    >();

  /*
   * Limit concurrency by processing
   * incomplete records sequentially.
   */
  for (
    const ipo
    of incompleteIPOs
  ) {
    const detailLink =
      findDetailLink(
        ipo,
        detailLinks
      );

    if (!detailLink) {
      continue;
    }

    const details =
      await fetchOneOfferDetail(
        ipo,
        detailLink
      );

    if (details) {
      detailsByIPOId.set(
        ipo.id,
        details
      );
    }
  }

  let enrichedCount = 0;

  const enrichedIPOs =
    ipos.map(
      (ipo) => {
        const details =
          detailsByIPOId.get(
            ipo.id
          );

        if (!details) {
          return ipo;
        }

        const enriched: IPORecord = {
          ...ipo,

          priceBandLow:
            ipo.priceBandLow ??
            details.priceBandLow,

          priceBandHigh:
            ipo.priceBandHigh ??
            details.priceBandHigh,

          issuePrice:
            ipo.issuePrice ??
            details.priceBandHigh,

          lotSize:
            ipo.lotSize ??
            details.lotSize,

          issueSizeCr:
            ipo.issueSizeCr ??
            details.issueSizeCr,

            subscription:
  details.subscription
    ? {
        qib:
          ipo.subscription?.qib ??
          details.subscription.qib,

        nii:
          ipo.subscription?.nii ??
          details.subscription.nii,

        retail:
          ipo.subscription?.retail ??
          details.subscription
            .retail,

        total:
          ipo.subscription?.total ??
          details.subscription.total,
      }
    : ipo.subscription,
    
        };

        const changed =
          enriched.priceBandLow !==
            ipo.priceBandLow ||
          enriched.priceBandHigh !==
            ipo.priceBandHigh ||
          enriched.lotSize !==
            ipo.lotSize ||
          enriched.issueSizeCr !==
            ipo.issueSizeCr;

        if (changed) {
          enrichedCount += 1;
        }

        return enriched;
      }
    );

  console.log(
    "IPO offer-details enriched:",
    enrichedCount
  );

  return {
    ipos:
      enrichedIPOs,

    enrichedCount,

    providerAvailable: true,
  };
}