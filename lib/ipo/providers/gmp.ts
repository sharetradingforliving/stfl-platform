/**
 * ================================================================
 * STFL IPO Research Engine
 * File: providers/gmp.ts
 *
 * Purpose:
 * Fetch Grey Market Premium data from IPO Guru.
 * ================================================================
 */

const IPO_GURU_API_KEY =
  process.env.IPO_GURU_API_KEY;

const IPO_GURU_BASE_URL =
  "https://www.ipoguru.in/api/v1";


export interface GMPRecord {
  companyName: string;

  type?: string;

  status?: string;

  openDate?: string;

  closeDate?: string;

  listingDate?: string;

  issuePrice?: number;

  lotSize?: number;

  issueSize?: string;

  gmp?: number;

  gmpPercent?: number;

  gmpUpdatedAt?: string;
}


/**
 * ------------------------------------------------
 * Safe number parser
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
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();

  if (!cleaned) {
    return undefined;
  }

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : undefined;
}


/**
 * ------------------------------------------------
 * Provider response shapes
 * ------------------------------------------------
 */

interface IPOGuruIPO {
  name?: string;

  type?: string;

  status?: string;

  open_date?: string;

  close_date?: string;

  listing_date?: string;

  issue_price?:
    | string
    | number;

  lot_size?:
    | string
    | number;

  issue_size?: string;

  gmp?: {
    price?:
      | string
      | number;

    percentage?:
      | string
      | number;

    updated_at?: string;
  };
}


interface IPOGuruResponse {
  success?: boolean;

  count?: number;

  data?: IPOGuruIPO[];
}


/**
 * ================================================================
 * FETCH GMP DATA
 * ================================================================
 */

export async function fetchGMPData():
Promise<GMPRecord[]> {

  if (!IPO_GURU_API_KEY) {

    console.warn(
      "IPO_GURU_API_KEY missing."
    );

    return [];
  }


  try {

    const response =
      await fetch(
        `${IPO_GURU_BASE_URL}/ipos`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "X-API-KEY":
              IPO_GURU_API_KEY,
          },

          cache:
            "no-store",
        }
      );


    if (!response.ok) {

      console.error(
        "IPO Guru API failed:",
        response.status,
        response.statusText
      );

      return [];
    }


    const result:
      IPOGuruResponse =
      await response.json();


    if (
      !result ||
      !Array.isArray(
        result.data
      )
    ) {
      return [];
    }


    return result.data
      .map(
        (
          ipo
        ): GMPRecord | null => {

          const companyName =
            ipo.name?.trim();

          if (!companyName) {
            return null;
          }


          return {

            companyName,

            type:
              ipo.type,

            status:
              ipo.status,

            openDate:
              ipo.open_date,

            closeDate:
              ipo.close_date,

            listingDate:
              ipo.listing_date,

            issuePrice:
              parseNumber(
                ipo.issue_price
              ),

            lotSize:
              parseNumber(
                ipo.lot_size
              ),

            issueSize:
              ipo.issue_size,

            gmp:
              parseNumber(
                ipo.gmp?.price
              ),

            gmpPercent:
              parseNumber(
                ipo.gmp
                  ?.percentage
              ),

            gmpUpdatedAt:
              ipo.gmp
                ?.updated_at,
          };
        }
      )
      .filter(
        (
          record
        ): record is GMPRecord =>
          record !== null
      );

  } catch (error) {

    console.error(
      "Unable to fetch GMP data:",
      error
    );

    return [];
  }
}