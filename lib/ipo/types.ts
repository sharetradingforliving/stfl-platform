/**
 * ================================================================
 * STFL IPO Research Engine
 * File: types.ts
 * Purpose: Shared IPO types for providers, engine, API and UI
 * ================================================================
 */

export type IPOType =
  | "Mainboard"
  | "SME";

export type IPOExchange =
  | "NSE"
  | "BSE"
  | "NSE/BSE";

export type IPOStatus =
  | "Upcoming"
  | "Open"
  | "Closed"
  | "Allotment"
  | "Listed";

export interface IPOSubscriptionData {
  qib?: number;
  nii?: number;
  retail?: number;
  employee?: number;
  shareholder?: number;
  total?: number;
}

export interface IPORecord {
  /**
   * Internal STFL identifier
   */
  id: string;

  /**
   * URL-safe identifier
   * Example: "tata-capital"
   */
  slug: string;

  /**
   * Company / issue information
   */
  companyName: string;

  symbol?: string;

  type: IPOType;

  exchange: IPOExchange;

  status: IPOStatus;

  /**
   * IPO timeline
   */
  openDate?: string;

  closeDate?: string;

  allotmentDate?: string;

  refundDate?: string;

  dematCreditDate?: string;

  listingDate?: string;

  /**
   * Pricing
   */
  priceBandLow?: number;

  priceBandHigh?: number;

  issuePrice?: number;

  faceValue?: number;

  /**
   * Issue structure
   */
  lotSize?: number;

  issueSizeCr?: number;

  freshIssueCr?: number;

  ofsCr?: number;

  /**
   * GMP / estimated listing
   */
  gmp?: number;

  gmpPercent?: number;

  estimatedListingPrice?: number;
  gmpProviderSlug?: string;

gmpSource?: string;

gmpKostak?: string;

gmpSubjectToSauda?: string;

gmpUpdatedAt?: string;

gmpUpdatedAtLabel?: string;

gmpFetchedAt?: string;

  /**
   * Subscription
   */
  subscription?: IPOSubscriptionData;

  /**
   * Listing performance
   */
  listingPrice?: number;

  listingGainPercent?: number;

  currentPrice?: number;

  postListingReturnPercent?: number;

  /**
   * Metadata
   */
  source?: string;

  sourceUrl?: string;

  lastUpdated: string;
}