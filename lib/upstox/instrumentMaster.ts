import { gunzipSync } from "node:zlib";

export type UpstoxInstrument = {
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

let instrumentDownloadPromise:
  | Promise<UpstoxInstrument[]>
  | null = null;

async function downloadInstrumentMaster(): Promise<
  UpstoxInstrument[]
> {
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

  return JSON.parse(
    decompressedData.toString("utf-8")
  ) as UpstoxInstrument[];
}

export async function getUpstoxInstruments(): Promise<
  UpstoxInstrument[]
> {
  if (cachedInstruments) {
    return cachedInstruments;
  }

  if (!instrumentDownloadPromise) {
    instrumentDownloadPromise =
      downloadInstrumentMaster();
  }

  try {
    cachedInstruments =
      await instrumentDownloadPromise;

    return cachedInstruments;
  } catch (error) {
    instrumentDownloadPromise = null;
    throw error;
  }
}