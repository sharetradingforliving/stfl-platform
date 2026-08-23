import type {
  IPOFinancialData,
} from "../financialTypes";

export async function fetchIPOFinancials(
  companyName: string,
  symbol?: string
): Promise<IPOFinancialData | null> {

  /**
   * Financial provider layer.
   *
   * We will connect the actual IPO financial source
   * in the next step.
   */

  console.log(
    "IPO financial request:",
    {
      companyName,
      symbol,
    }
  );

  return null;
}