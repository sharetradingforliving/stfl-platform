/**
 * ================================================================
 * STFL IPO Research Engine
 * File: ipoEngine.ts
 *
 * Purpose:
 * Combine official NSE IPO information with additional
 * IPO intelligence providers such as GMP.
 * ================================================================
 */

import {
  fetchNSEIPOData,
} from "./providers/nse";

import {
  enrichIPOOfferDetails,
} from "./providers/ipoOfferDetails";

import {
  fetchGMPData,
  type GMPRecord,
} from "./providers/gmp";

import {
  normalizeNSEIPOData,
} from "./ipoNormalizer";

import type {
  IPORecord,
} from "./types";


/**
 * ================================================================
 * ENGINE RESPONSE
 * ================================================================
 */

export interface IPOEngineResult {

  ipos: IPORecord[];

  summary: {

    total: number;

    open: number;

    upcoming: number;

    closed: number;

    allotment: number;

    listed: number;

    mainboard: number;

    sme: number;
  };

  providers: {
  nse: boolean;
  offerDetails: boolean;
  gmp: boolean;
};

  lastUpdated: string;
}


/**
 * ================================================================
 * NORMALIZE COMPANY NAME
 *
 * Used to match:
 *
 * Augmont Enterprises Limited
 * Augmont Enterprises Ltd
 * AUGMONT ENTERPRISES
 *
 * ================================================================
 */

function normalizeCompanyName(
  value: string
): string {

  return value
    .toLowerCase()

    .replace(/&/g, "and")

    .replace(
      /\b(limited|ltd|private|pvt|india)\b/g,
      ""
    )

    .replace(
      /[^a-z0-9]/g,
      ""
    )

    .trim();
}


/**
 * ================================================================
 * FIND GMP RECORD
 * ================================================================
 */

function findGMPRecord(
  ipo: IPORecord,
  gmpRecords: GMPRecord[]
):
  | GMPRecord
  | undefined {

  const ipoName =
    normalizeCompanyName(
      ipo.companyName
    );


  /**
   * First attempt:
   * Exact normalized match
   */

  const exactMatch =
    gmpRecords.find(
      (record) =>
        normalizeCompanyName(
          record.companyName
        ) === ipoName
    );


  if (exactMatch) {
    return exactMatch;
  }


  /**
   * Second attempt:
   * Controlled partial match
   *
   * Useful when one provider includes words
   * such as Industries / India / Limited.
   */

  return gmpRecords.find(
    (record) => {

      const gmpName =
        normalizeCompanyName(
          record.companyName
        );


      if (
        ipoName.length < 5 ||
        gmpName.length < 5
      ) {
        return false;
      }


      return (
        ipoName.includes(gmpName) ||
        gmpName.includes(ipoName)
      );
    }
  );
}


/**
 * ================================================================
 * MERGE GMP INTO IPO RECORD
 * ================================================================
 */

function enrichWithGMP(
  ipo: IPORecord,
  gmpRecords: GMPRecord[]
): IPORecord {

  const gmpRecord =
    findGMPRecord(
      ipo,
      gmpRecords
    );


  if (!gmpRecord) {
    return ipo;
  }


  let gmp =
    gmpRecord.gmp;


  let gmpPercent =
    gmpRecord.gmpPercent;


  /**
   * ------------------------------------------------
   * Calculate GMP %
   *
   * If provider gives GMP but not percentage.
   * ------------------------------------------------
   */

  if (
    gmpPercent === undefined &&
    gmp !== undefined &&
    ipo.priceBandHigh !== undefined &&
    ipo.priceBandHigh > 0
  ) {

    gmpPercent =
      Number(
        (
          (
            gmp /
            ipo.priceBandHigh
          ) *
          100
        ).toFixed(2)
      );
  }


  /**
   * ------------------------------------------------
   * Estimated listing price
   *
   * Upper price band + GMP
   * ------------------------------------------------
   */

  const estimatedListingPrice =
    gmp !== undefined &&
    ipo.priceBandHigh !== undefined
      ? Number(
          (
            ipo.priceBandHigh +
            gmp
          ).toFixed(2)
        )
      : undefined;


  return {

    ...ipo,

    gmp,

    gmpPercent,

    estimatedListingPrice,


    /**
     * GMP provider may occasionally contain
     * useful fallback lot-size information.
     *
     * NSE remains primary source.
     */

    lotSize:
      ipo.lotSize ??
      gmpRecord.lotSize,
  };
}


/**
 * ================================================================
 * SORT IPOs
 * ================================================================
 */

function sortIPOs(
  ipos: IPORecord[]
): IPORecord[] {

  const statusPriority:
    Record<
      IPORecord["status"],
      number
    > = {

    Open: 1,

    Upcoming: 2,

    Closed: 3,

    Allotment: 4,

    Listed: 5,
  };


  return [...ipos].sort(
    (a, b) => {

      const statusDifference =
        statusPriority[
          a.status
        ] -
        statusPriority[
          b.status
        ];


      if (
        statusDifference !== 0
      ) {
        return statusDifference;
      }


      const dateA =
        a.openDate
          ? new Date(
              a.openDate
            ).getTime()
          : Number.MAX_SAFE_INTEGER;


      const dateB =
        b.openDate
          ? new Date(
              b.openDate
            ).getTime()
          : Number.MAX_SAFE_INTEGER;


      return (
        dateA -
        dateB
      );
    }
  );
}


/**
 * ================================================================
 * BUILD SUMMARY
 * ================================================================
 */

function buildSummary(
  ipos: IPORecord[]
) {

  return {

    total:
      ipos.length,

    open:
      ipos.filter(
        (ipo) =>
          ipo.status ===
          "Open"
      ).length,

    upcoming:
      ipos.filter(
        (ipo) =>
          ipo.status ===
          "Upcoming"
      ).length,

    closed:
      ipos.filter(
        (ipo) =>
          ipo.status ===
          "Closed"
      ).length,

    allotment:
      ipos.filter(
        (ipo) =>
          ipo.status ===
          "Allotment"
      ).length,

    listed:
      ipos.filter(
        (ipo) =>
          ipo.status ===
          "Listed"
      ).length,

    mainboard:
      ipos.filter(
        (ipo) =>
          ipo.type ===
          "Mainboard"
      ).length,

    sme:
      ipos.filter(
        (ipo) =>
          ipo.type ===
          "SME"
      ).length,
  };
}


/**
 * ================================================================
 * RUN IPO ENGINE
 * ================================================================
 */

export async function runIPOEngine():
Promise<IPOEngineResult> {

  try {

    /**
     * ------------------------------------------------
     * STEP 1
     *
     * Fetch NSE + GMP simultaneously.
     *
     * GMP failure must NOT break NSE.
     * ------------------------------------------------
     */

    const [
      nseResult,
      gmpResult,
    ] =
      await Promise.allSettled([

        fetchNSEIPOData(),

        fetchGMPData(),

      ]);


    /**
     * ------------------------------------------------
     * NSE result
     * ------------------------------------------------
     */

    const rawNSEData =
      nseResult.status ===
      "fulfilled"
        ? nseResult.value
        : [];


    /**
     * ------------------------------------------------
     * GMP result
     * ------------------------------------------------
     */

    const gmpRecords =
      gmpResult.status ===
      "fulfilled"
        ? gmpResult.value
        : [];


    if (
      nseResult.status ===
      "rejected"
    ) {

      console.error(
        "NSE IPO provider failed:",
        nseResult.reason
      );
    }


    if (
      gmpResult.status ===
      "rejected"
    ) {

      console.error(
        "GMP provider failed:",
        gmpResult.reason
      );
    }


    console.log(
      "===== STFL IPO ENGINE ====="
    );


    console.log(
      "Raw NSE IPO records:",
      rawNSEData.length
    );


    console.log(
      "GMP records:",
      gmpRecords.length
    );


    /**
     * ------------------------------------------------
     * STEP 2
     *
     * Normalize NSE data
     * ------------------------------------------------
     */

    const normalizedIPOs =
  normalizeNSEIPOData(
    rawNSEData
  );

console.log(
  "Normalized IPO records:",
  normalizedIPOs.length
);


/**
 * ------------------------------------------------
 * STEP 3
 *
 * Fill missing price band, lot size
 * and issue size.
 *
 * NSE values remain primary and are
 * never overwritten.
 * ------------------------------------------------
 */

const offerDetailsResult =
  await enrichIPOOfferDetails(
    normalizedIPOs
  );

console.log(
  "Offer-detail records enriched:",
  offerDetailsResult
    .enrichedCount
);


/**
 * ------------------------------------------------
 * STEP 4
 *
 * Merge optional GMP data after the
 * price band has been completed.
 *
 * This allows GMP percentage and
 * estimated listing price to use the
 * completed upper price band.
 * ------------------------------------------------
 */

const enrichedIPOs =
  offerDetailsResult.ipos.map(
    (ipo) =>
      enrichWithGMP(
        ipo,
        gmpRecords
      )
  );


    /**
     * ------------------------------------------------
     * STEP 4
     *
     * Sort
     * ------------------------------------------------
     */

    const ipos =
      sortIPOs(
        enrichedIPOs
      );


    /**
     * ------------------------------------------------
     * STEP 5
     *
     * Summary
     * ------------------------------------------------
     */

    const summary =
      buildSummary(
        ipos
      );


    console.log(
      "IPO Summary:",
      summary
    );


    console.log(
      "GMP enriched:",
      ipos.filter(
        (ipo) =>
          ipo.gmp !==
          undefined
      ).length
    );


    /**
     * ------------------------------------------------
     * STEP 6
     *
     * Return final engine
     * ------------------------------------------------
     */

    return {

      ipos,

      summary,

      providers: {
  nse:
    rawNSEData.length > 0,

  offerDetails:
    offerDetailsResult
      .providerAvailable,

  gmp:
    gmpRecords.length > 0,
},

      lastUpdated:
        new Date()
          .toISOString(),
    };

  } catch (error) {

    console.error(
      "STFL IPO Engine Error:",
      error
    );


    return {

      ipos: [],

      summary: {

        total: 0,

        open: 0,

        upcoming: 0,

        closed: 0,

        allotment: 0,

        listed: 0,

        mainboard: 0,

        sme: 0,
      },

      providers: {
  nse: false,
  offerDetails: false,
  gmp: false,
},

      lastUpdated:
        new Date()
          .toISOString(),
    };
  }
}