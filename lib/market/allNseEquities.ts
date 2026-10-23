import "server-only";

import {
  getUpstoxInstruments,
} from "@/lib/upstox/instrumentMaster";

export type NseCashEquity = {
  companyName: string;
  symbol: string;
  isin: string;
  instrumentKey: string;
  instrumentType: string;
  segment: string;
  exchange: string;
};

export type NseCashEquityUniverse = {
  total: number;
  instrumentsByType: Record<
    string,
    number
  >;
  equities: NseCashEquity[];
};

let cachedUniverse:
  | NseCashEquityUniverse
  | null = null;

export async function getAllNseEquities(): Promise<
  NseCashEquityUniverse
> {
  if (cachedUniverse) {
    return cachedUniverse;
  }

  const instruments =
    await getUpstoxInstruments();

  const uniqueInstruments =
    new Map<string, NseCashEquity>();

  instruments.forEach((instrument) => {
    const segment =
      instrument.segment
        ?.trim()
        .toUpperCase() ?? "";

    const exchange =
      instrument.exchange
        ?.trim()
        .toUpperCase() ?? "";

    const instrumentType =
      instrument.instrument_type
        ?.trim()
        .toUpperCase() ??
      "UNKNOWN";

    const instrumentKey =
      instrument.instrument_key
        ?.trim() ?? "";

    const symbol =
      instrument.trading_symbol
        ?.trim()
        .toUpperCase() ?? "";

    const isin =
      instrument.isin
        ?.trim()
        .toUpperCase() ?? "";

    const companyName = (
      instrument.name ??
      instrument.short_name ??
      symbol
    ).trim();

    /*
     * Accept only ordinary NSE equity shares.
     *
     * This excludes NCDs, bonds, ETFs,
     * rights entitlements and other
     * non-equity securities.
     */
    const hasOrdinaryEquityIsin =
  isin.length === 12 &&
  isin.startsWith("INE") &&
  isin.slice(7, 9) === "01";

const looksLikeDebtSecurity =
  /\b(NCD|BOND|DEBENTURE|SECURED|UNSECURED)\b|%/i.test(
    `${symbol} ${companyName}`
  );

const isOrdinaryNseEquity =
  segment === "NSE_EQ" &&
  instrumentType === "EQ" &&
  (
    exchange === "NSE" ||
    exchange === ""
  ) &&
  hasOrdinaryEquityIsin &&
  !looksLikeDebtSecurity;

    if (
      !isOrdinaryNseEquity ||
      !instrumentKey ||
      !symbol
    ) {
      return;
    }

    uniqueInstruments.set(
      instrumentKey,
      {
        companyName,
        symbol,
        isin,
        instrumentKey,
        instrumentType,
        segment,
        exchange:
          exchange || "NSE",
      }
    );
  });

  const equities =
    Array.from(
      uniqueInstruments.values()
    ).sort((a, b) =>
      a.symbol.localeCompare(
        b.symbol
      )
    );

  cachedUniverse = {
    total:
      equities.length,

    instrumentsByType: {
      EQ:
        equities.length,
    },

    equities,
  };

  return cachedUniverse;
}