/**
 * ================================================================
 * STFL IPO Research Engine
 * File: ipoEngine.ts
 *
 * Purpose:
 * Combine NSE IPO information with offer-detail enrichment.
 * GMP collection and GMP-derived estimates are disabled.
 * ================================================================
 */

import {
  fetchNSEIPOData,
} from "./providers/nse";

import {
  enrichIPOOfferDetails,
} from "./providers/ipoOfferDetails";

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


/** Remove legacy premium fields even if an upstream normalizer retains them. */
function removeLegacyPremiumFields(ipo: IPORecord): IPORecord {
  const cleaned = { ...ipo };
  for (const key of Object.keys(cleaned)) {
    const name = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (name.includes("gmp") || name.includes("greymarket") ||
        name.includes("graymarket") || name.includes("prelistingpremium") ||
        name.includes("kostak") || name.includes("subjecttosauda") ||
        ["estimatedlistingprice", "expectedlistingprice", "indicativelistingprice",
         "estimatedlistinggain", "expectedlistinggain", "estimatedlistinggainpercent",
         "expectedlistinggainpercent", "estimatedlistinggainpct", "expectedlistinggainpct"].includes(name)) {
      delete (cleaned as unknown as Record<string, unknown>)[key];
    }
  }
  return cleaned;
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

export async function runIPOEngine(): Promise<IPOEngineResult> {
  try {
    const [nseResult] = await Promise.allSettled([fetchNSEIPOData()]);
    const rawNSEData = nseResult.status === "fulfilled" ? nseResult.value : [];
    if (nseResult.status === "rejected") console.error("NSE IPO provider failed.");
    const normalizedIPOs = normalizeNSEIPOData(rawNSEData).map(removeLegacyPremiumFields);
    const offerDetailsResult = await enrichIPOOfferDetails(normalizedIPOs);
    const ipos = sortIPOs(offerDetailsResult.ipos.map(removeLegacyPremiumFields));
    return {
      ipos,
      summary: buildSummary(ipos),
      providers: {
        nse: rawNSEData.length > 0,
        offerDetails: offerDetailsResult.providerAvailable,
        // Compatibility flag only; no GMP fetch, matching or calculations run.
        gmp: false,
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    console.error("STFL IPO engine failed.");
    return {
      ipos: [],
      summary: buildSummary([]),
      providers: { nse: false, offerDetails: false, gmp: false },
      lastUpdated: new Date().toISOString(),
    };
  }
}
