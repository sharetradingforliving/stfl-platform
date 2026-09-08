import "server-only";

import {
  getNifty500Constituents,
  type Nifty500Constituent,
} from "@/lib/market/nifty500";

import {
  getAllNseEquities,
  type NseCashEquity,
} from "@/lib/market/allNseEquities";

import {
  findDirectBusinessPeerGroup,
} from "@/lib/fundamental/data/directBusinessPeerGroups";

export type PeerUniverse =
  | "NSE_LISTED"
  | "NIFTY_500";

export type PeerSelectionScope =
  | "DIRECT_BUSINESS"
  | "PUBLISHED_INDUSTRY";

export type Nifty500PeerCandidate = {
  companyName: string;
  industry: string;
  symbol: string;
  series: string;
  isin: string;

  instrumentKey?: string;

  nifty500Member?: boolean;
};

export type Nifty500PeerUniverseResult = {
  available: boolean;

  suitabilityReason: string;

  universe: PeerUniverse;

  selectionScope:
    PeerSelectionScope;

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

function isEligibleNiftyEquity(
  constituent:
    Nifty500Constituent
): boolean {
  const series =
    constituent.series
      .trim()
      .toUpperCase();

  return (
    series === "" ||
    series === "EQ"
  );
}

function isEligibleNseEquity(
  equity: NseCashEquity
): boolean {
  const segment =
    equity.segment
      .trim()
      .toUpperCase();

  const instrumentType =
    equity.instrumentType
      .trim()
      .toUpperCase();

  return (
    segment === "NSE_EQ" &&
    instrumentType === "EQ" &&
    equity.symbol
      .trim()
      .length > 0
  );
}

function niftyToPeerCandidate(
  constituent:
    Nifty500Constituent
): Nifty500PeerCandidate {
  return {
    companyName:
      constituent.companyName,

    industry:
      constituent.industry,

    symbol:
      normalizeSymbol(
        constituent.symbol
      ),

    series:
      constituent.series ||
      "EQ",

    isin:
      constituent.isin,

    nifty500Member: true,
  };
}

function nseToPeerCandidate(
  equity: NseCashEquity,

  peerGroup: string,

  nifty500Symbols:
    Set<string>
): Nifty500PeerCandidate {
  const symbol =
    normalizeSymbol(
      equity.symbol
    );

  return {
    companyName:
      equity.companyName,

    industry:
      peerGroup,

    symbol,

    series: "EQ",

    isin:
      equity.isin,

    instrumentKey:
      equity.instrumentKey,

    nifty500Member:
      nifty500Symbols.has(
        symbol
      ),
  };
}

function getAvailableIndustries(
  constituents:
    Nifty500Constituent[]
): string[] {
  const industries =
    constituents
      .filter(
        isEligibleNiftyEquity
      )
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
      first.localeCompare(
        second
      )
  );
}

function uniquePeerCandidates(
  candidates:
    Nifty500PeerCandidate[]
): Nifty500PeerCandidate[] {
  const candidatesBySymbol =
    new Map<
      string,
      Nifty500PeerCandidate
    >();

  for (
    const candidate
    of candidates
  ) {
    const symbol =
      normalizeSymbol(
        candidate.symbol
      );

    if (!symbol) {
      continue;
    }

    candidatesBySymbol.set(
      symbol,
      candidate
    );
  }

  return Array.from(
    candidatesBySymbol.values()
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

  const [
    nifty500Constituents,
    nseUniverse,
  ] = await Promise.all([
    getNifty500Constituents(),
    getAllNseEquities(),
  ]);

  const eligibleNiftyConstituents =
    nifty500Constituents.filter(
      isEligibleNiftyEquity
    );

  const eligibleNseEquities =
    nseUniverse.equities.filter(
      isEligibleNseEquity
    );

  const availableIndustries =
    getAvailableIndustries(
      eligibleNiftyConstituents
    );

  const nifty500Symbols =
    new Set(
      eligibleNiftyConstituents.map(
        (constituent) =>
          normalizeSymbol(
            constituent.symbol
          )
      )
    );

  const nseEquityBySymbol =
    new Map<
      string,
      NseCashEquity
    >();

  for (
    const equity
    of eligibleNseEquities
  ) {
    const equitySymbol =
      normalizeSymbol(
        equity.symbol
      );

    if (!equitySymbol) {
      continue;
    }

    nseEquityBySymbol.set(
      equitySymbol,
      equity
    );
  }

  /*
   * Highest-confidence classification:
   * use a centrally maintained,
   * direct-business peer group.
   */
  const directBusinessGroup =
    findDirectBusinessPeerGroup(
      symbol
    );

  if (directBusinessGroup) {
    const selectedEquity =
      nseEquityBySymbol.get(
        symbol
      ) ?? null;

    const selectedNiftyConstituent =
      eligibleNiftyConstituents.find(
        (constituent) =>
          normalizeSymbol(
            constituent.symbol
          ) === symbol
      ) ?? null;

    const selectedCompany =
      selectedEquity
        ? nseToPeerCandidate(
            selectedEquity,
            directBusinessGroup
              .peerGroup,
            nifty500Symbols
          )
        : selectedNiftyConstituent
          ? {
              ...niftyToPeerCandidate(
                selectedNiftyConstituent
              ),

              industry:
                directBusinessGroup
                  .peerGroup,
            }
          : null;

    if (!selectedCompany) {
      return {
        available: false,

        suitabilityReason:
          `${symbol} belongs to the ${directBusinessGroup.peerGroup} peer group, but its NSE equity instrument could not be resolved.`,

        universe:
          "NSE_LISTED",

        selectionScope:
          "DIRECT_BUSINESS",

        selectedCompany:
          null,

        selectedIndustry:
          directBusinessGroup
            .peerGroup,

        peerCandidates: [],

        candidateCount: 0,

        availableIndustries,

        source: {
          name:
            "STFL Direct Business Classification and Upstox NSE Instrument Master",

          methodology:
            "The company was classified through the central STFL direct-business registry, but its NSE cash-equity instrument was unavailable.",
        },
      };
    }

    const directCandidates =
      directBusinessGroup
        .symbols
        .map(normalizeSymbol)
        .filter(
          (candidateSymbol) =>
            candidateSymbol !==
            symbol
        )
        .map(
          (candidateSymbol) => {
            const candidateEquity =
              nseEquityBySymbol.get(
                candidateSymbol
              );

            if (!candidateEquity) {
              return null;
            }

            return nseToPeerCandidate(
              candidateEquity,
              directBusinessGroup
                .peerGroup,
              nifty500Symbols
            );
          }
        )
        .filter(
          (
            candidate
          ): candidate is
            Nifty500PeerCandidate =>
              candidate !== null
        );

    const peerCandidates =
      uniquePeerCandidates(
        directCandidates
      ).sort(
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
          ? `${peerCandidates.length} direct-business NSE-listed peer candidates were found in the ${directBusinessGroup.peerGroup} group.`
          : `No other eligible NSE-listed companies from the ${directBusinessGroup.peerGroup} group could be resolved.`,

      universe:
        "NSE_LISTED",

      selectionScope:
        "DIRECT_BUSINESS",

      selectedCompany,

      selectedIndustry:
        directBusinessGroup
          .peerGroup,

      peerCandidates,

      candidateCount:
        peerCandidates.length,

      availableIndustries,

      source: {
        name:
          "STFL Direct Business Classification and Upstox NSE Instrument Master",

        methodology:
          "Peer candidates belong to the same centrally curated direct-business group. Nifty 500 membership is informational and is not required.",
      },
    };
  }

  /*
   * Fallback classification:
   * use the published Nifty 500
   * industry only for peer discovery.
   */
  const selectedNiftyConstituent =
    eligibleNiftyConstituents.find(
      (constituent) =>
        normalizeSymbol(
          constituent.symbol
        ) === symbol
    ) ?? null;

  if (!selectedNiftyConstituent) {
    const selectedNseEquity =
      nseEquityBySymbol.get(
        symbol
      ) ?? null;

    return {
      available: false,

      suitabilityReason:
        selectedNseEquity
          ? `${symbol} is NSE-listed, but no verified direct-business peer group is currently available.`
          : `${symbol} could not be resolved in the eligible NSE cash-equity universe.`,

      universe:
        "NSE_LISTED",

      selectionScope:
        "DIRECT_BUSINESS",

      selectedCompany:
        selectedNseEquity
          ? nseToPeerCandidate(
              selectedNseEquity,
              "Unclassified",
              nifty500Symbols
            )
          : null,

      selectedIndustry:
        null,

      peerCandidates: [],

      candidateCount: 0,

      availableIndustries,

      source: {
        name:
          "STFL Direct Business Classification and Upstox NSE Instrument Master",

        methodology:
          "The engine does not invent direct peers when no verified business classification is available.",
      },
    };
  }

  const selectedIndustry =
    selectedNiftyConstituent
      .industry
      .trim();

  if (!selectedIndustry) {
    return {
      available: false,

      suitabilityReason:
        `No published industry classification was available for ${symbol}.`,

      universe:
        "NIFTY_500",

      selectionScope:
        "PUBLISHED_INDUSTRY",

      selectedCompany:
        niftyToPeerCandidate(
          selectedNiftyConstituent
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
          "Broad-industry fallback requires a valid published Nifty 500 industry classification.",
      },
    };
  }

  const normalizedSelectedIndustry =
    normalizeIndustry(
      selectedIndustry
    );

  const peerCandidates =
    uniquePeerCandidates(
      eligibleNiftyConstituents
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
        .map(
          niftyToPeerCandidate
        )
    ).sort(
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
        ? `No curated direct-business group was available. ${peerCandidates.length} broad-industry Nifty 500 candidates were found in ${selectedIndustry}.`
        : `No other Nifty 500 companies were found in the published ${selectedIndustry} industry.`,

    universe:
      "NIFTY_500",

    selectionScope:
      "PUBLISHED_INDUSTRY",

    selectedCompany:
      niftyToPeerCandidate(
        selectedNiftyConstituent
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
        "No curated direct-business group was available. Candidates therefore share the selected company's published Nifty 500 industry classification. These candidates require manual business-model validation.",
    },
  };
}