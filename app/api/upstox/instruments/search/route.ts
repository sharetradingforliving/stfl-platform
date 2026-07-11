import { NextResponse } from "next/server";
import { gunzipSync } from "node:zlib";
type UpstoxInstrument = {
  segment?: string;
  name?: string;
  exchange?: string;
  isin?: string;
  instrument_type?: string;
  instrument_key?: string;
  trading_symbol?: string;
  short_name?: string;
};

let cachedInstruments: UpstoxInstrument[] | null = null;

async function getInstruments() {
  if (cachedInstruments) {
    return cachedInstruments;
  }

  const response = await fetch(
    "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to download the Upstox instrument master: ${response.status}`
    );
  }

  const compressedData = await response.arrayBuffer();

  const decompressedData = gunzipSync(
    Buffer.from(compressedData)
  );

  const instruments = JSON.parse(
    decompressedData.toString("utf-8")
  ) as UpstoxInstrument[];

  cachedInstruments = instruments;

  return instruments;
}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query =
      searchParams.get("q")?.trim().toUpperCase() ?? "";

    if (query.length < 2) {
      return NextResponse.json(
        {
          error:
            "Enter at least two characters to search for a stock.",
        },
        {
          status: 400,
        }
      );
    }

    const instruments = await getInstruments();

    const results = instruments
      .filter((instrument) => {
        const exchange =
          instrument.exchange?.toUpperCase();

        const instrumentType =
          instrument.instrument_type?.toUpperCase();

        const isSupportedExchange =
          exchange === "NSE" || exchange === "BSE";

        const isEquity =
          instrumentType === "EQ";

        if (!isSupportedExchange || !isEquity) {
          return false;
        }

        const symbol =
          instrument.trading_symbol?.toUpperCase() ?? "";

        const companyName =
          instrument.name?.toUpperCase() ?? "";

        const shortName =
          instrument.short_name?.toUpperCase() ?? "";

        return (
          symbol.includes(query) ||
          companyName.includes(query) ||
          shortName.includes(query)
        );
      })
      .slice(0, 20)
      .map((instrument) => ({
        symbol: instrument.trading_symbol,
        companyName:
          instrument.name ?? instrument.short_name,
        exchange: instrument.exchange,
        instrumentKey: instrument.instrument_key,
        isin: instrument.isin,
      }));

    return NextResponse.json({
      query,
      count: results.length,
      results,
      source: "Upstox Instrument Master",
    });
  } catch (error) {
    console.error(
      "Upstox instrument search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to search the Upstox instrument master",
      },
      {
        status: 500,
      }
    );
  }
}