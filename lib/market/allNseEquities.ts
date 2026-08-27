import "server-only";

import { getUpstoxInstruments } from "@/lib/upstox/instrumentMaster";

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
      instrument.instrument_key?.trim() ??
      "";

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

    const isNseCashInstrument =
      segment === "NSE_EQ";

    if (
      !isNseCashInstrument ||
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

  const equities = Array.from(
    uniqueInstruments.values()
  ).sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  const instrumentsByType =
    equities.reduce<
      Record<string, number>
    >((counts, instrument) => {
      const type =
        instrument.instrumentType ||
        "UNKNOWN";

      counts[type] =
        (counts[type] ?? 0) + 1;

      return counts;
    }, {});

  cachedUniverse = {
    total:
      equities.length,

    instrumentsByType,

    equities,
  };

  return cachedUniverse;
}