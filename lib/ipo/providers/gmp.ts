/**
 * GMP collection is disabled.
 * Legacy exports remain temporarily for compatibility.
 */

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

export async function fetchGMPData(): Promise<GMPRecord[]> {
  return [];
}