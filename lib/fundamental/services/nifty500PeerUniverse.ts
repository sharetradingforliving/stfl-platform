import "server-only";

import {
  getNifty500Constituents,
  type Nifty500Constituent,
} from "@/lib/market/nifty500";

export type Nifty500PeerCandidate = {
  companyName: string;
  industry: string;
  symbol: string;
  series: string;
  isin: string;
};

export type Nifty500PeerUniverseResult = {
  available: boolean;

  suitabilityReason: string;

  universe: "NIFTY_500";

  selectedCompany:
    Nifty500PeerCandidate | null;

  selectedIndustry:
    string | null;

  peerCandidates:
    Nifty500PeerCandidate[];

  candidateCount: number;

  availableIndustries:
    string[];

  source: {
    name: string;
    methodology: string;
  };
};

function normalizeSymbol(
  value: string
): string {
  return value
    .trim()
    .toUpperCase();
}

function normalizeIndustry(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function isEligibleEquity(
  constituent:
    Nifty500Constituent
): boolean {
  const series =
    constituent.series
      .trim()
      .toUpperCase();

  /*
   * Some versions of the Nifty 500
   * constituent file may not provide
   * a series value. A blank series is
   * therefore accepted.
   */
  return (
    series === "" ||
    series === "EQ"
  );
}

function toPeerCandidate(
  constituent:
    Nifty500Constituent
): Nifty500PeerCandidate {
  return {
    companyName:
      constituent.companyName,

    industry:
      constituent.industry,

    symbol:
      constituent.symbol,

    series:
      constituent.series,

    isin:
      constituent.isin,
  };
}

function getAvailableIndustries(
  constituents:
    Nifty500Constituent[]
): string[] {
  const industries =
    constituents
      .filter(isEligibleEquity)
      .map(
        (constituent) =>
          constituent.industry
            .trim()
      )
      .filter(
        (industry) =>
          industry.length > 0
      );

  return Array.from(
    new Set(industries)
  ).sort(
    (first, second) =>
      first.localeCompare(second)
  );
}

export async function getNifty500PeerUniverse(
  requestedSymbol: string
): Promise<
  Nifty500PeerUniverseResult
> {
  const symbol =
    normalizeSymbol(
      requestedSymbol
    );

  if (!symbol) {
    throw new Error(
      "A valid NSE symbol is required to prepare the peer universe."
    );
  }

  const constituents =
    await getNifty500Constituents();

  const eligibleConstituents =
    constituents.filter(
      isEligibleEquity
    );

  const availableIndustries =
    getAvailableIndustries(
      eligibleConstituents
    );

  const selectedConstituent =
    eligibleConstituents.find(
      (constituent) =>
        normalizeSymbol(
          constituent.symbol
        ) === symbol
    ) ?? null;

  if (!selectedConstituent) {
    return {
      available: false,

      suitabilityReason:
        `${symbol} is not available in the current Nifty 500 constituent universe.`,

      universe:
        "NIFTY_500",

      selectedCompany:
        null,

      selectedIndustry:
        null,

      peerCandidates: [],

      candidateCount: 0,

      availableIndustries,

      source: {
        name:
          "Nifty Indices",

        methodology:
          "Automatic peer selection is limited to companies classified within the Nifty 500 universe.",
      },
    };
  }

  const selectedIndustry =
    selectedConstituent
      .industry
      .trim();

  if (!selectedIndustry) {
    return {
      available: false,

      suitabilityReason:
        `No industry classification was available for ${symbol} in the Nifty 500 constituent file.`,

      universe:
        "NIFTY_500",

      selectedCompany:
        toPeerCandidate(
          selectedConstituent
        ),

      selectedIndustry:
        null,

      peerCandidates: [],

      candidateCount: 0,

      availableIndustries,

      source: {
        name:
          "Nifty Indices",

        methodology:
          "Automatic peer selection requires a valid Nifty 500 industry classification.",
      },
    };
  }

  const normalizedSelectedIndustry =
    normalizeIndustry(
      selectedIndustry
    );

  const peerCandidates =
    eligibleConstituents
      .filter(
        (constituent) =>
          normalizeSymbol(
            constituent.symbol
          ) !== symbol &&
          normalizeIndustry(
            constituent.industry
          ) ===
            normalizedSelectedIndustry
      )
      .map(toPeerCandidate)
      .sort(
        (first, second) =>
          first.companyName
            .localeCompare(
              second.companyName
            )
      );

  return {
    available:
      peerCandidates.length > 0,

    suitabilityReason:
      peerCandidates.length > 0
        ? `${peerCandidates.length} Nifty 500 peer candidates were found in the ${selectedIndustry} industry.`
        : `No other Nifty 500 companies were found in the ${selectedIndustry} industry.`,

    universe:
      "NIFTY_500",

    selectedCompany:
      toPeerCandidate(
        selectedConstituent
      ),

    selectedIndustry,

    peerCandidates,

    candidateCount:
      peerCandidates.length,

    availableIndustries,

    source: {
      name:
        "Nifty Indices",

      methodology:
        "Peer candidates are Nifty 500 equity constituents with the same published industry classification. The selected company is excluded.",
    },
  };
}