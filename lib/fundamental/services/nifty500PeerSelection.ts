import "server-only";

import {
  getNifty500PeerUniverse,
  type Nifty500PeerCandidate,
  type PeerSelectionScope,
  type PeerUniverse,
} from "./nifty500PeerUniverse";

const MINIMUM_PEERS = 1;
const MAXIMUM_PEERS = 5;

export type RejectedPeerSelection = {
  symbol: string;
  reason: string;
};

export type Nifty500PeerSelectionResult = {
  available: boolean;
  suitabilityReason: string;

  universe: PeerUniverse;

  selectionScope:
    PeerSelectionScope;

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

function getMethodology(
  universe: PeerUniverse,
  selectionScope:
    PeerSelectionScope
): string {
  if (
    selectionScope ===
    "DIRECT_BUSINESS"
  ) {
    return (
      "Peers belong to the same curated direct-business " +
      "group. Candidates may come from the complete " +
      "eligible NSE-listed cash-equity universe. " +
      "Nifty 500 membership is not compulsory. " +
      "The selected company and duplicate symbols are " +
      "excluded. Between one and five peers are permitted."
    );
  }

  return (
    "No curated direct-business group was available. " +
    `Candidates were discovered from the ${universe} ` +
    "universe using the same published industry. " +
    "Industry membership does not guarantee identical " +
    "business-model comparability. Between one and five " +
    "peers are permitted."
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

  const methodology =
    getMethodology(
      peerUniverse.universe,
      peerUniverse
        .selectionScope
    );

  if (
    !peerUniverse.available ||
    !peerUniverse
      .selectedCompany
  ) {
    return {
      available: false,

      suitabilityReason:
        peerUniverse
          .suitabilityReason,

      universe:
        peerUniverse.universe,

      selectionScope:
        peerUniverse
          .selectionScope,

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

      methodology,
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
    >();

  for (
    const candidate
    of peerUniverse
      .peerCandidates
  ) {
    candidateBySymbol.set(
      normalizeSymbol(
        candidate.symbol
      ),
      candidate
    );
  }

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

    const candidate =
      candidateBySymbol.get(
        requestedPeer
      );

    if (!candidate) {
      rejectedPeers.push({
        symbol:
          requestedPeer,

        reason:
          peerUniverse
            .selectionScope ===
            "DIRECT_BUSINESS"
            ? `${requestedPeer} is not a verified direct-business peer candidate for ${symbol}.`
            : `${requestedPeer} is not an eligible same-industry peer candidate for ${symbol}.`,
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
      "No peer was selected. Choose between one and five eligible comparable companies."
    );
  }

  if (
    selectedPeers.length <
    MINIMUM_PEERS
  ) {
    warnings.push(
      `At least ${MINIMUM_PEERS} valid peer is required for peer comparison.`
    );
  }

  if (
    peerUniverse
      .selectionScope ===
      "PUBLISHED_INDUSTRY"
  ) {
    warnings.push(
      "The candidates share a published industry classification, but this does not guarantee direct business-model comparability."
    );
  }

  const available =
    selectedPeers.length >=
      MINIMUM_PEERS &&
    selectedPeers.length <=
      MAXIMUM_PEERS;

  let suitabilityReason:
    string;

  if (!available) {
    suitabilityReason =
      `Select between ${MINIMUM_PEERS} and ${MAXIMUM_PEERS} eligible peers for comparison.`;
  } else if (
    peerUniverse
      .selectionScope ===
      "DIRECT_BUSINESS"
  ) {
    suitabilityReason =
      `${selectedPeers.length} direct-business NSE-listed peer${selectedPeers.length === 1 ? "" : "s"} ` +
      `were validated for ${symbol}.`;
  } else {
    suitabilityReason =
      `${selectedPeers.length} published-industry peer candidate${selectedPeers.length === 1 ? "" : "s"} ` +
      `were selected for ${symbol}. Manual comparability validation is recommended.`;
  }

  return {
    available,

    suitabilityReason,

    universe:
      peerUniverse.universe,

    selectionScope:
      peerUniverse
        .selectionScope,

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

    methodology,
  };
}