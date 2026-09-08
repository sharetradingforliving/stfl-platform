/**
 * ================================================================
 * STFL IPO Research Engine
 * File: providers/nse.ts
 *
 * Purpose:
 * Fetch current + upcoming IPO data from NSE and enrich IPOs with:
 *
 * - Category-wise subscription
 * - Bid Lot / Lot Size
 *
 * Data sources:
 * 1. /api/ipo-current-issue
 * 2. /api/all-upcoming-issues?category=ipo
 * 3. /api/ipo-active-category?symbol=SYMBOL
 * 4. /api/ipo-detail?symbol=SYMBOL&series=SERIES
 * ================================================================
 */


/**
 * ================================================================
 * SUBSCRIPTION TYPE
 * ================================================================
 */

export interface NSEIPOSubscription {
  qib?: number;
  nii?: number;
  retail?: number;
  total?: number;
}


/**
 * ================================================================
 * NSE IPO RECORD
 * ================================================================
 */

export interface NSEIPORecord {
  symbol?: string;

  companyName?: string;

  issueStartDate?: string;

  issueEndDate?: string;

  listingDate?: string;

  priceBand?: string;

  issuePrice?: string | number;

  issueSize?: string | number;

  noOfSharesOffered?: string | number;

  noOfsharesBid?: string | number;

  noOfTime?: string | number;

  status?: string;

  series?: string;

  securityType?: string;

  issueType?: string;

  category?: string;

  lotSize?: number;

  sourceType?:
    | "current"
    | "upcoming";

  subscription?: NSEIPOSubscription;
}


/**
 * ================================================================
 * NSE ACTIVE CATEGORY RECORD
 * ================================================================
 */

interface NSECategoryRecord {
  category?: string;

  noOfShareOffered?:
    | string
    | number;

  noOfSharesBid?:
    | string
    | number;

  srNo?: string;
}


interface NSECategoryResponse {
  dataList?: NSECategoryRecord[];

  heading?: string | null;

  symbol?: string | null;

  updateTime?: string;
}


/**
 * ================================================================
 * NSE IPO DETAIL RECORD
 *
 * Example:
 *
 * {
 *   title: "Bid Lot",
 *   value: "19 Equity Shares and in multiples thereof"
 * }
 * ================================================================
 */

interface NSEIPODetailItem {
  title?: string;
  value?: string;
}


/**
 * ================================================================
 * SAFE NUMBER PARSER
 * ================================================================
 */

function parseNSENumber(
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
      .trim();


  if (
    !cleaned ||
    cleaned === "-"
  ) {
    return undefined;
  }


  const result =
    Number(cleaned);


  return Number.isFinite(result)
    ? result
    : undefined;
}


/**
 * ================================================================
 * EXTRACT FIRST NUMBER FROM TEXT
 *
 * Example:
 *
 * "19 Equity Shares and in multiples thereof"
 *      ↓
 * 19
 * ================================================================
 */

function extractFirstNumber(
  value?: string
): number | undefined {

  if (!value) {
    return undefined;
  }


  const match =
    value.match(
      /\d[\d,]*/
    );


  if (!match) {
    return undefined;
  }


  const parsed =
    Number(
      match[0]
        .replace(/,/g, "")
    );


  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}


/**
 * ================================================================
 * CALCULATE SUBSCRIPTION MULTIPLE
 *
 * Subscription = Shares Bid / Shares Offered
 * ================================================================
 */

function calculateSubscription(
  offered?: string | number,
  bids?: string | number
): number | undefined {

  const offeredShares =
    parseNSENumber(offered);

  const bidShares =
    parseNSENumber(bids);


  if (
    offeredShares === undefined ||
    bidShares === undefined ||
    offeredShares <= 0
  ) {
    return undefined;
  }


  return Number(
    (
      bidShares /
      offeredShares
    ).toFixed(2)
  );
}


/**
 * ================================================================
 * COMMON NSE REQUEST
 * ================================================================
 */

async function fetchNSEEndpoint(
  url: string
): Promise<unknown> {

  try {

    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",

            Accept:
              "application/json,text/plain,*/*",

            "Accept-Language":
              "en-US,en;q=0.9",

            Referer:
              "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
          },

          cache: "no-store",
        }
      );


    if (!response.ok) {

      console.error(
        "NSE request failed:",
        url,
        response.status,
        response.statusText
      );

      return null;
    }


    return await response.json();

  } catch (error) {

    console.error(
      "NSE endpoint error:",
      url,
      error
    );

    return null;
  }
}


/**
 * ================================================================
 * EXTRACT IPO ARRAY
 * ================================================================
 */

function extractRecords(
  data: unknown
): NSEIPORecord[] {

  if (!data) {
    return [];
  }


  if (Array.isArray(data)) {
    return data as NSEIPORecord[];
  }


  if (
    typeof data === "object" &&
    data !== null
  ) {

    const value =
      data as {
        data?: unknown;
        records?: unknown;
      };


    if (
      Array.isArray(value.data)
    ) {
      return value.data as NSEIPORecord[];
    }


    if (
      Array.isArray(value.records)
    ) {
      return value.records as NSEIPORecord[];
    }
  }


  return [];
}


/**
 * ================================================================
 * CURRENT / ACTIVE IPOs
 * ================================================================
 */

export async function fetchNSECurrentIPOs():
Promise<NSEIPORecord[]> {

  try {

    const data =
      await fetchNSEEndpoint(
        "https://www.nseindia.com/api/ipo-current-issue"
      );


    return extractRecords(data).map(
      (record) => ({

        ...record,

        sourceType:
          "current",

      })
    );

  } catch (error) {

    console.error(
      "Unable to fetch NSE current IPOs:",
      error
    );


    return [];
  }
}


/**
 * ================================================================
 * UPCOMING IPOs
 * ================================================================
 */

export async function fetchNSEUpcomingIPOs():
Promise<NSEIPORecord[]> {

  try {

    const data =
      await fetchNSEEndpoint(
        "https://www.nseindia.com/api/all-upcoming-issues?category=ipo"
      );


    return extractRecords(data).map(
      (record) => ({

        ...record,

        sourceType:
          "upcoming",

      })
    );

  } catch (error) {

    console.error(
      "Unable to fetch NSE upcoming IPOs:",
      error
    );


    return [];
  }
}


/**
 * ================================================================
 * ACTIVE IPO SUBSCRIPTION
 * ================================================================
 */

export async function fetchNSEIPOSubscription(
  symbol: string
): Promise<
  NSEIPOSubscription | undefined
> {

  try {

    if (!symbol) {
      return undefined;
    }


    const url =
      `https://www.nseindia.com/api/ipo-active-category?symbol=${encodeURIComponent(
        symbol
      )}`;


    const rawData =
      await fetchNSEEndpoint(url);


    if (
      !rawData ||
      typeof rawData !== "object"
    ) {
      return undefined;
    }


    const data =
      rawData as NSECategoryResponse;


    if (
      !Array.isArray(
        data.dataList
      )
    ) {

      return undefined;
    }


    const rows =
      data.dataList;


    function findCategory(
      matcher: (
        category: string
      ) => boolean
    ):
      | NSECategoryRecord
      | undefined {

      return rows.find(
        (row) => {

          const category =
            row.category
              ?.trim()
              .toLowerCase() ||
            "";


          return matcher(
            category
          );
        }
      );
    }


    const qibRow =
      findCategory(
        (category) =>
          category.includes(
            "qualified institutional buyers"
          )
      );


    const niiRow =
      findCategory(
        (category) =>
          category ===
          "non institutional investors"
      );


    const retailRow =
      findCategory(
        (category) =>
          category.includes(
            "retail individual investors"
          )
      );


    const totalRow =
      findCategory(
        (category) =>
          category ===
          "total"
      );


    return {

      qib:
        calculateSubscription(
          qibRow?.noOfShareOffered,
          qibRow?.noOfSharesBid
        ),

      nii:
        calculateSubscription(
          niiRow?.noOfShareOffered,
          niiRow?.noOfSharesBid
        ),

      retail:
        calculateSubscription(
          retailRow?.noOfShareOffered,
          retailRow?.noOfSharesBid
        ),

      total:
        calculateSubscription(
          totalRow?.noOfShareOffered,
          totalRow?.noOfSharesBid
        ),
    };

  } catch (error) {

    console.error(
      `Unable to fetch NSE IPO subscription for ${symbol}:`,
      error
    );


    return undefined;
  }
}


/**
 * ================================================================
 * RECURSIVELY FIND IPO DETAIL ITEMS
 * ================================================================
 */

function collectDetailItems(
  value: unknown
): NSEIPODetailItem[] {

  const results: NSEIPODetailItem[] = [];


  if (Array.isArray(value)) {

    for (const item of value) {

      if (
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "value" in item
      ) {

        const detail =
          item as NSEIPODetailItem;

        results.push(detail);
      }


      results.push(
        ...collectDetailItems(item)
      );
    }


    return results;
  }


  if (
    typeof value === "object" &&
    value !== null
  ) {

    for (
      const child
      of Object.values(
        value as Record<
          string,
          unknown
        >
      )
    ) {

      results.push(
        ...collectDetailItems(child)
      );
    }
  }


  return results;
}


/**
 * ================================================================
 * IPO DETAIL / BID LOT
 * ================================================================
 */

export async function fetchNSEIPODetail(
  symbol: string,
  series = "EQ"
): Promise<{
  lotSize?: number;
}> {

  try {

    if (!symbol) {
      return {};
    }


    const url =
      `https://www.nseindia.com/api/ipo-detail?symbol=${encodeURIComponent(
        symbol
      )}&series=${encodeURIComponent(
        series
      )}`;


    const rawData =
      await fetchNSEEndpoint(url);


    if (!rawData) {
      return {};
    }


    /**
     * Recursively search the entire NSE response
     * for title/value records.
     */

    const items =
      collectDetailItems(
        rawData
      );


    console.log(
      `IPO DETAIL ITEMS ${symbol}:`,
      items
    );


    const bidLotRow =
      items.find(
        (item) => {

          const title =
            item.title
              ?.trim()
              .toLowerCase();


          return (
            title === "bid lot" ||
            title?.includes(
              "bid lot"
            )
          );
        }
      );


    console.log(
      `BID LOT ROW ${symbol}:`,
      bidLotRow
    );


    const lotSize =
      extractFirstNumber(
        bidLotRow?.value
      );


    console.log(
      `LOT SIZE ${symbol}:`,
      lotSize
    );


    return {
      lotSize,
    };

  } catch (error) {

    console.error(
      `Unable to fetch NSE IPO detail for ${symbol}:`,
      error
    );


    return {};
  }
}

/**
 * ================================================================
 * ENRICH ONE IPO
 *
 * Works for both current and upcoming IPOs.
 * ================================================================
 */

async function enrichIPO(
  ipo: NSEIPORecord
): Promise<NSEIPORecord> {

  if (!ipo.symbol) {
    return ipo;
  }


  const series =
    ipo.series ||
    ipo.securityType ||
    "EQ";


  const [
    subscriptionResult,
    detailResult,
  ] =
    await Promise.allSettled([

      ipo.sourceType === "current"
        ? fetchNSEIPOSubscription(
            ipo.symbol
          )
        : Promise.resolve(
            undefined
          ),

      fetchNSEIPODetail(
        ipo.symbol,
        series
      ),

    ]);


  const categorySubscription =
    subscriptionResult.status ===
    "fulfilled"
      ? subscriptionResult.value
      : undefined;


  const detail =
    detailResult.status ===
    "fulfilled"
      ? detailResult.value
      : {};


  const fallbackTotal =
    parseNSENumber(
      ipo.noOfTime
    );


  const subscription =
    ipo.sourceType === "current"
      ? {

          qib:
            categorySubscription
              ?.qib,

          nii:
            categorySubscription
              ?.nii,

          retail:
            categorySubscription
              ?.retail,

          total:
            categorySubscription
              ?.total ??
            fallbackTotal,

        }
      : undefined;


  return {
  ...ipo,

  lotSize:
    detail.lotSize ??
    ipo.lotSize,

  subscription:
    subscription ??
    ipo.subscription,
};
}


/**
 * ================================================================
 * COMBINED NSE IPO PROVIDER
 * ================================================================
 */

export async function fetchNSEIPOData():
Promise<NSEIPORecord[]> {
  try {
    const [
      currentResult,
      upcomingResult,
    ] =
      await Promise.allSettled([
        fetchNSECurrentIPOs(),
        fetchNSEUpcomingIPOs(),
      ]);

    const currentIPOs =
      currentResult.status ===
      "fulfilled"
        ? currentResult.value
        : [];

    const upcomingIPOs =
      upcomingResult.status ===
      "fulfilled"
        ? upcomingResult.value
        : [];

    /*
     * Current IPOs receive live
     * subscription and lot information.
     *
     * Upcoming IPOs receive available
     * detail information.
     */
    const enrichedCurrent =
      await Promise.all(
        currentIPOs.map(
          enrichIPO
        )
      );

    const enrichedUpcoming =
      await Promise.all(
        upcomingIPOs.map(
          enrichIPO
        )
      );

    const combined = [
      ...enrichedCurrent,
      ...enrichedUpcoming,
    ];

    /*
     * Merge records representing the
     * same IPO instead of discarding
     * either the current or upcoming
     * version.
     */
    const recordsByKey =
      new Map<
        string,
        NSEIPORecord
      >();

    for (const ipo of combined) {
      const key =
        (
          ipo.symbol ||
          ipo.companyName ||
          ""
        )
          .trim()
          .toLowerCase();

      if (!key) {
        continue;
      }

      const existing =
        recordsByKey.get(key);

      if (!existing) {
        recordsByKey.set(
          key,
          ipo
        );

        continue;
      }

      const currentRecord =
        existing.sourceType ===
        "current"
          ? existing
          : ipo.sourceType ===
              "current"
            ? ipo
            : existing;

      const supplementaryRecord =
        currentRecord === existing
          ? ipo
          : existing;

      recordsByKey.set(
        key,
        {
          ...supplementaryRecord,
          ...currentRecord,

          symbol:
            currentRecord.symbol ??
            supplementaryRecord
              .symbol,

          companyName:
            currentRecord
              .companyName ??
            supplementaryRecord
              .companyName,

          issueStartDate:
            currentRecord
              .issueStartDate ??
            supplementaryRecord
              .issueStartDate,

          issueEndDate:
            currentRecord
              .issueEndDate ??
            supplementaryRecord
              .issueEndDate,

          listingDate:
            currentRecord
              .listingDate ??
            supplementaryRecord
              .listingDate,

          priceBand:
            currentRecord.priceBand ??
            supplementaryRecord
              .priceBand,

          issuePrice:
            currentRecord.issuePrice ??
            supplementaryRecord
              .issuePrice,

          issueSize:
            currentRecord.issueSize ??
            supplementaryRecord
              .issueSize,

          noOfSharesOffered:
            currentRecord
              .noOfSharesOffered ??
            supplementaryRecord
              .noOfSharesOffered,

          noOfsharesBid:
            currentRecord
              .noOfsharesBid ??
            supplementaryRecord
              .noOfsharesBid,

          noOfTime:
            currentRecord.noOfTime ??
            supplementaryRecord
              .noOfTime,

          lotSize:
            currentRecord.lotSize ??
            supplementaryRecord
              .lotSize,

          series:
            currentRecord.series ??
            supplementaryRecord
              .series,

          securityType:
            currentRecord
              .securityType ??
            supplementaryRecord
              .securityType,

          issueType:
            currentRecord.issueType ??
            supplementaryRecord
              .issueType,

          category:
            currentRecord.category ??
            supplementaryRecord
              .category,

          status:
            currentRecord.status ??
            supplementaryRecord
              .status,

          sourceType:
            currentRecord.sourceType,

          subscription:
            currentRecord
              .subscription ??
            supplementaryRecord
              .subscription,
        }
      );
    }

    const unique =
      Array.from(
        recordsByKey.values()
      );

    console.log(
      "===== NSE IPO PROVIDER ====="
    );

    console.log(
      "Current IPOs:",
      currentIPOs.length
    );

    console.log(
      "Upcoming IPOs:",
      upcomingIPOs.length
    );

    console.log(
      "Lot enriched:",
      unique.filter(
        (ipo) =>
          ipo.lotSize !==
          undefined
      ).length
    );

    console.log(
      "Subscription enriched:",
      unique.filter(
        (ipo) =>
          ipo.subscription !==
          undefined
      ).length
    );

    console.log(
      "Unique IPO records:",
      unique.length
    );

    return unique;
  } catch (error) {
    console.error(
      "Unable to fetch NSE IPO data:",
      error
    );

    return [];
  }
}