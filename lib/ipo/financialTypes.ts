export interface IPOFinancialYear {
  period: string;

  revenue?: number;
  ebitda?: number;
  pat?: number;

  totalAssets?: number;
  totalEquity?: number;
  totalDebt?: number;

  operatingCashFlow?: number;

  eps?: number;

  ebitdaMargin?: number;
  patMargin?: number;

  roe?: number;
  roce?: number;

  debtEquity?: number;
}

export interface IPOFinancialData {
  symbol?: string;

  companyName: string;

  currency: "INR";

  unit: "Cr";

  years: IPOFinancialYear[];

  revenueCagr?: number;
  patCagr?: number;

  source?: string;
  sourceUrl?: string;

  lastUpdated?: string;
}