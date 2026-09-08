import { NextResponse } from "next/server";

import {
  getUpstoxReadOnlyAccessToken,
} from "@/lib/upstox/accessToken";

import {
  getUpstoxInstruments,
} from "@/lib/upstox/instrumentMaster";

type RouteContext = {
  params: Promise<{
    sector: string;
  }>;
};

type SectorConfiguration = {
  displayName: string;
  constituentUrl: string;
};

type UpstoxQuote = {
  last_price?: number;
  net_change?: number;

  ohlc?: {
    close?: number;
  };
};

type UpstoxQuoteResponse = {
  data?: Record<
    string,
    UpstoxQuote
  >;
};

type StockMovement = {
  symbol: string;
  companyName: string;
  instrumentKey: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
};

const CONSTITUENT_BASE_URL =
  "https://www.niftyindices.com/IndexConstituent";

const SECTOR_CONFIGURATIONS:
  Record<
    string,
    SectorConfiguration
  > = {
    NIFTYAUTO: {
      displayName:
        "NIFTY AUTO",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyautolist.csv`,
    },

    NIFTYIT: {
      displayName:
        "NIFTY IT",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyitlist.csv`,
    },

    NIFTYFIN: {
      displayName:
        "NIFTY FINANCIAL SERVICES",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyfinancialserviceslist.csv`,
    },

    NIFTYFMCG: {
      displayName:
        "NIFTY FMCG",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyfmcglist.csv`,
    },

    NIFTYPHARMA: {
      displayName:
        "NIFTY PHARMA",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftypharmalist.csv`,
    },

    NIFTYMETAL: {
      displayName:
        "NIFTY METAL",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftymetallist.csv`,
    },

    NIFTYREALTY: {
      displayName:
        "NIFTY REALTY",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyrealtylist.csv`,
    },

    NIFTYPSUBANK: {
      displayName:
        "NIFTY PSU BANK",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftypsubanklist.csv`,
    },

    NIFTYPVTBANK: {
      displayName:
        "NIFTY PRIVATE BANK",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyprivatebanklist.csv`,
    },

    NIFTYOILGAS: {
      displayName:
        "NIFTY OIL & GAS",

      constituentUrl:
        `${CONSTITUENT_BASE_URL}/ind_niftyoilgaslist.csv`,
    },
  };

function parseCsvLine(
  line: string
): string[] {
  const values: string[] = [];

  let currentValue = "";
  let isInsideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (character === '"') {
      const nextCharacter =
        line[index + 1];

      if (
        isInsideQuotes &&
        nextCharacter === '"'
      ) {
        currentValue += '"';
        index += 1;
      } else {
        isInsideQuotes =
          !isInsideQuotes;
      }

      continue;
    }

    if (
      character === "," &&
      !isInsideQuotes
    ) {
      values.push(
        currentValue.trim()
      );

      currentValue = "";

      continue;
    }

    currentValue +=
      character;
  }

  values.push(
    currentValue.trim()
  );

  return values;
}

function extractSymbols(
  csvText: string
): string[] {
  const lines =
    csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter(
        (line) =>
          line.trim().length > 0
      );

  if (lines.length < 2) {
    return [];
  }

  const headings =
    parseCsvLine(
      lines[0]
    ).map(
      (heading) =>
        heading
          .trim()
          .toLowerCase()
    );

  const symbolIndex =
    headings.findIndex(
      (heading) =>
        heading === "symbol"
    );

  if (symbolIndex < 0) {
    return [];
  }

  const symbols =
    lines
      .slice(1)
      .map(
        (line) =>
          parseCsvLine(
            line
          )[symbolIndex]
            ?.trim()
            .toUpperCase()
      )
      .filter(
        (
          symbol
        ): symbol is string =>
          Boolean(symbol)
      );

  return Array.from(
    new Set(symbols)
  );
}

async function fetchSectorSymbols(
  configuration:
    SectorConfiguration
): Promise<string[]> {
  const response =
    await fetch(
      configuration
        .constituentUrl,
      {
        method: "GET",

        headers: {
          Accept:
            "text/csv,text/plain,*/*",

          "User-Agent":
            "Mozilla/5.0 STFL Market Intelligence",
        },

        /*
         * Refresh official constituent
         * lists once every six hours.
         */
        next: {
          revalidate:
            21_600,
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to download constituent list: ${response.status}`
    );
  }

  const csvText =
    await response.text();

  const symbols =
    extractSymbols(
      csvText
    );

  if (symbols.length === 0) {
    throw new Error(
      "The constituent list did not contain stock symbols"
    );
  }

  return symbols;
}

async function fetchStockMovement(
  instrument: {
    trading_symbol?: string;
    name?: string;
    short_name?: string;
    instrument_key?: string;
  },

  accessToken: string
): Promise<StockMovement> {
  const symbol =
    instrument
      .trading_symbol
      ?.trim()
      .toUpperCase() ??
    "";

  const instrumentKey =
    instrument
      .instrument_key
      ?.trim() ??
    "";

  if (
    !symbol ||
    !instrumentKey
  ) {
    throw new Error(
      "Invalid NSE equity instrument"
    );
  }

  const quoteUrl =
    "https://api.upstox.com/v2/market-quote/quotes" +
    `?instrument_key=${encodeURIComponent(
      instrumentKey
    )}`;

  const response =
    await fetch(
      quoteUrl,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        cache: "no-store",
      }
    );

  const responseData =
    (await response.json()) as
      UpstoxQuoteResponse;

  if (!response.ok) {
    throw new Error(
      `${symbol} quote failed with status ${response.status}`
    );
  }

  const quote =
    Object.values(
      responseData.data ?? {}
    )[0];

  if (!quote) {
    throw new Error(
      `${symbol} quote was unavailable`
    );
  }

  const currentPrice =
    typeof quote.last_price ===
      "number" &&
    Number.isFinite(
      quote.last_price
    )
      ? quote.last_price
      : null;

  const change =
    typeof quote.net_change ===
      "number" &&
    Number.isFinite(
      quote.net_change
    )
      ? quote.net_change
      : null;

  const quotedPreviousClose =
    typeof quote.ohlc?.close ===
      "number" &&
    Number.isFinite(
      quote.ohlc.close
    )
      ? quote.ohlc.close
      : null;

  const previousClose =
    currentPrice !== null &&
    change !== null
      ? currentPrice - change
      : quotedPreviousClose;

  const changePercent =
    change !== null &&
    previousClose !== null &&
    previousClose !== 0
      ? (
          change /
          previousClose
        ) *
        100
      : null;

  return {
    symbol,

    companyName:
      instrument.name ??
      instrument.short_name ??
      symbol,

    instrumentKey,

    currentPrice,
    previousClose,
    change,
    changePercent,
  };
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { sector } =
      await params;

    const sectorKey =
      decodeURIComponent(
        sector
      )
        .trim()
        .toUpperCase();

    const configuration =
      SECTOR_CONFIGURATIONS[
        sectorKey
      ];

    if (!configuration) {
      return NextResponse.json(
        {
          status:
            "error",

          error:
            "Unsupported sector",

          sector:
            sectorKey,

          supportedSectors:
            Object.keys(
              SECTOR_CONFIGURATIONS
            ),
        },
        {
          status: 400,
        }
      );
    }

    const tokenResult =
      await getUpstoxReadOnlyAccessToken();

    if (!tokenResult) {
      return NextResponse.json(
        {
          status:
            "unavailable",

          error:
            "Upstox read-only access token is missing",
        },
        {
          status: 401,
        }
      );
    }

    const constituentSymbols =
      await fetchSectorSymbols(
        configuration
      );

    const symbolSet =
      new Set(
        constituentSymbols
      );

    const instruments =
      await getUpstoxInstruments();

    const matchedInstruments =
      instruments.filter(
        (instrument) => {
          const symbol =
            instrument
              .trading_symbol
              ?.trim()
              .toUpperCase();

          const segment =
            instrument
              .segment
              ?.trim()
              .toUpperCase();

          const instrumentType =
            instrument
              .instrument_type
              ?.trim()
              .toUpperCase();

          return (
            Boolean(symbol) &&
            symbolSet.has(
              symbol ?? ""
            ) &&
            segment === "NSE_EQ" &&
            instrumentType === "EQ" &&
            Boolean(
              instrument
                .instrument_key
            )
          );
        }
      );

    const quoteResults =
      await Promise.allSettled(
        matchedInstruments.map(
          (instrument) =>
            fetchStockMovement(
              instrument,
              tokenResult.accessToken
            )
        )
      );

    const movements =
      quoteResults.flatMap(
        (result) =>
          result.status ===
          "fulfilled"
            ? [result.value]
            : []
      );

    const errors =
      quoteResults.flatMap(
        (result) =>
          result.status ===
          "rejected"
            ? [
                result.reason instanceof
                Error
                  ? result.reason
                      .message
                  : "Unknown quote error",
              ]
            : []
      );

    const rankedMovements =
      movements
        .filter(
          (movement) =>
            typeof movement
              .changePercent ===
              "number" &&
            Number.isFinite(
              movement
                .changePercent
            )
        )
        .sort(
          (first, second) =>
            (
              second
                .changePercent ??
              0
            ) -
            (
              first
                .changePercent ??
              0
            )
        );

    const movers =
      rankedMovements
        .filter(
          (movement) =>
            (
              movement
                .changePercent ??
              0
            ) > 0
        )
        .slice(0, 5);

    const draggers =
      rankedMovements
        .filter(
          (movement) =>
            (
              movement
                .changePercent ??
              0
            ) < 0
        )
        .sort(
          (first, second) =>
            (
              first
                .changePercent ??
              0
            ) -
            (
              second
                .changePercent ??
              0
            )
        )
        .slice(0, 5);

    return NextResponse.json({
      status:
        movements.length ===
        matchedInstruments.length
          ? "success"
          : movements.length > 0
            ? "partial"
            : "unavailable",

      sector:
        sectorKey,

      indexName:
        configuration
          .displayName,

      movers,
      draggers,

      constituentCount:
        constituentSymbols.length,

      matchedInstrumentCount:
        matchedInstruments.length,

      availableQuoteCount:
        movements.length,

      errors,

      lastUpdated:
        new Date().toISOString(),

      constituentSource:
        "NSE Indices",

      marketDataSource:
        "Upstox",
    });
  } catch (error) {
    console.error(
      "Sector movers route error:",
      error
    );

    return NextResponse.json(
      {
        status:
          "unavailable",

        error:
          "Unable to load sector movers",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",

        movers: [],
        draggers: [],
      },
      {
        status: 500,
      }
    );
  }
}