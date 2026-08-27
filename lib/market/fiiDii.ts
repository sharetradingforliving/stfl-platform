import "server-only";

export type InstitutionalFlowValues = {
  gross_buy: number;
  gross_sell: number;
  net: number;
};

export type LatestInstitutionalFlow = {
  date: string;
  fii_fpi: InstitutionalFlowValues;
  dii: InstitutionalFlowValues;
  is_provisional: boolean;
};

export type MonthToDateFlow = {
  month: string;
  through_date: string;
  trading_days: number;
  fii_fpi_net: number;
  dii_net: number;
};

export type FiiDiiSummary = {
  latest_day: LatestInstitutionalFlow;
  month_to_date: MonthToDateFlow;
  source: string;
  updated_at: string | null;
};

const BACKEND_URL =
  process.env.STFL_BACKEND_URL ??
  "http://127.0.0.1:8000";

export async function getFiiDiiSummary(): Promise<
  FiiDiiSummary
> {
  const response = await fetch(
    `${BACKEND_URL}/api/market/fii-dii`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let errorDetails =
      "Unable to fetch FII/DII data";

    try {
      const errorResponse =
        await response.json();

      errorDetails =
        errorResponse.detail ??
        errorResponse.error ??
        errorDetails;
    } catch {
      // Keep the default error message.
    }

    throw new Error(errorDetails);
  }

  return response.json() as Promise<
    FiiDiiSummary
  >;
}