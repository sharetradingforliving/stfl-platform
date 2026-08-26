import "server-only";

import {
  getNifty500PeerUniverse,
  type Nifty500PeerCandidate,
} from "./nifty500PeerUniverse";

const MINIMUM_PEERS = 3;
const MAXIMUM_PEERS = 8;

export type RejectedPeerSelection = {
  symbol: string;
  reason: string;
};

export type Nifty500PeerSelectionResult = {
  available: boolean;

  suitabilityReason: string;

  universe: "NIFTY_500";

  selectedCompany:
    Nifty500PeerCandidate | null;

  selectedIndustry:
    string | null;

  selectedPeers:
    Nifty500PeerCandidate[];

  selectedPeerCount: number;

  candidateCount: number;

  rejectedPeers:
    RejectedPeerSelection[];

  warnings: string[];

  methodology: string;
};

function normalizeSymbol(
  value: string
): string {
  return value
    .trim()
    .toUpperCase();
}

function uniqueSymbols(
  symbols: string[]
): string[] {
  return Array.from(
    new Set(
      symbols
        .map(normalizeSymbol)
        .filter(
          (symbol) =>
            symbol.length > 0
        )
    )
  );
}

export async function selectNifty500Peers(
  requestedSymbol: string,

  requestedPeerSymbols:
    string[]
): Promise<
  Nifty500PeerSelectionResult
> {
  const symbol =
    normalizeSymbol(
      requestedSymbol
    );

  if (!symbol) {
    throw new Error(
      "A valid NSE symbol is required to select peers."
    );
  }

  const peerUniverse =
    await getNifty500PeerUniverse(
      symbol
    );

  if (
    !peerUniverse.available ||
    !peerUniverse
      .selectedCompany ||
    !peerUniverse
      .selectedIndustry
  ) {
    return {
      available: false,

      suitabilityReason:
        peerUniverse
          .suitabilityReason,

      universe:
        "NIFTY_500",

      selectedCompany:
        peerUniverse
          .selectedCompany,

      selectedIndustry:
        peerUniverse
          .selectedIndustry,

      selectedPeers: [],

      selectedPeerCount: 0,

      candidateCount:
        peerUniverse
          .candidateCount,

      rejectedPeers: [],

      warnings: [],

      methodology:
        "Peer selection is limited to Nifty 500 companies with the same published industry classification.",
    };
  }

  const normalizedRequests =
    uniqueSymbols(
      requestedPeerSymbols
    );

  const candidateBySymbol =
    new Map<
      string,
      Nifty500PeerCandidate
    >(
      peerUniverse
        .peerCandidates
        .map(
          (candidate) => [
            normalizeSymbol(
              candidate.symbol
            ),
            candidate,
          ]
        )
    );

  const selectedPeers:
    Nifty500PeerCandidate[] = [];

  const rejectedPeers:
    RejectedPeerSelection[] = [];

  for (
    const requestedPeer
    of normalizedRequests
  ) {
    if (
      requestedPeer === symbol
    ) {
      rejectedPeers.push({
        symbol:
          requestedPeer,

        reason:
          "The selected company cannot be included in its own peer group.",
      });

      continue;
    }

    const candidate =
      candidateBySymbol.get(
        requestedPeer
      );

    if (!candidate) {
      rejectedPeers.push({
        symbol:
          requestedPeer,

        reason:
          `${requestedPeer} is not a same-industry Nifty 500 peer candidate for ${symbol}.`,
      });

      continue;
    }

    if (
      selectedPeers.length >=
      MAXIMUM_PEERS
    ) {
      rejectedPeers.push({
        symbol:
          requestedPeer,

        reason:
          `A maximum of ${MAXIMUM_PEERS} peers can be selected.`,
      });

      continue;
    }

    selectedPeers.push(
      candidate
    );
  }

  const warnings: string[] = [];

  if (
    normalizedRequests.length === 0
  ) {
    warnings.push(
      "No peer symbols were selected. Choose between two and eight same-industry Nifty 500 companies."
    );
  }

  if (
    selectedPeers.length <
    MINIMUM_PEERS
  ) {
    warnings.push(
      `At least ${MINIMUM_PEERS} valid peers are required for peer valuation.`
    );
  }

  const available =
    selectedPeers.length >=
      MINIMUM_PEERS &&
    selectedPeers.length <=
      MAXIMUM_PEERS;

  return {
    available,

    suitabilityReason:
      available
        ? `${selectedPeers.length} same-industry Nifty 500 peers were validated for ${symbol}.`
        : `Peer valuation requires between ${MINIMUM_PEERS} and ${MAXIMUM_PEERS} valid same-industry Nifty 500 peers.`,

    universe:
      "NIFTY_500",

    selectedCompany:
      peerUniverse
        .selectedCompany,

    selectedIndustry:
      peerUniverse
        .selectedIndustry,

    selectedPeers,

    selectedPeerCount:
      selectedPeers.length,

    candidateCount:
      peerUniverse
        .candidateCount,

    rejectedPeers,

    warnings,

    methodology:
      "Selected peers must be Nifty 500 equity constituents from the same published industry as the selected company. Duplicate symbols are removed, the selected company is excluded, and two to eight peers are permitted.",
  };
}