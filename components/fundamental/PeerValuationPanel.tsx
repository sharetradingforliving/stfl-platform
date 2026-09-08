"use client";

import PeerComparisonResult, {
  type PeerComparisonRanking,
} from "./PeerComparisonResult";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type PeerCandidate = {
  companyName: string;
  industry: string;
  symbol: string;
  series: string;
  isin: string;
};

type PeerCompany = {
  symbol: string;
  companyName: string;

  revenueGrowth: number | null;
  patGrowth: number | null;
  ebitdaMargin: number | null;
  returnOnEquity: number | null;
  returnOnCapitalEmployed:
    number | null;
  debtToEquity: number | null;
  priceToEarnings: number | null;
  priceToBook: number | null;

  enterpriseValueToEbitda:
    number | null;
};

type PeerValuation = {
  applicable: boolean;
  suitabilityReason: string;

  peers: PeerCompany[];

  peerCount?: number;

  multipleCoverage?: {
    priceToEarnings?: number;
    priceToBook?: number;

    enterpriseValueToEbitda?:
      number;
  };

  peerMedianPe: number | null;
  peerMedianPb: number | null;

  peerMedianEvEbitda:
    number | null;

  impliedFairValue: number | null;

  premiumDiscountToPeers:
    number | null;

  valuationLabel?: string | null;

  confidence?: string | null;

  outlierWarnings?: string[];
};

type PeerUniverse = {
  available: boolean;
  suitabilityReason: string;

  universe: string;

  selectedCompany?: PeerCandidate;

  selectedIndustry?: string;

  peerCandidates?: PeerCandidate[];
};

type PeerSelection = {
  available: boolean;
  suitabilityReason: string;

  universe?: string;

  selectedCompany?: PeerCandidate;

  selectedIndustry?: string;

  selectedPeers?: PeerCandidate[];

  selectedPeerCount?: number;
  candidateCount?: number;

  warnings?: string[];
};

type PeerApiResponse = {
  status:
    | "success"
    | "partial"
    | "selection_required"
    | "unavailable"
    | "error";

  symbol: string;

  requestedPeers?: string[];

  peerUniverse?: PeerUniverse;

  peerSelection?: PeerSelection;

  peerComparisonRanking?:
  PeerComparisonRanking | null;

  peerCompanies?: PeerCompany[];

  peerValuation?: PeerValuation | null;

  analyticsWarnings?: string[];

  error?: string;
  details?: string;

  generatedAt?: string;
};

type PeerValuationPanelProps = {
  symbol: string;
};

const MINIMUM_PEERS = 1;
const MAXIMUM_PEERS = 5;

function formatNumber(
  value: number | null | undefined,
  maximumFractionDigits = 2
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits,
    }
  );
}

function formatCurrency(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatPercent(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2
  )}%`;
}

function formatMultiple(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return `${value.toFixed(2)}x`;
}

function formatLabel(
  value: string | null | undefined
): string {
  if (!value) {
    return "Insufficient data";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getValuationColour(
  label: string | null | undefined
): string {
  if (!label) {
    return "text-slate-300";
  }

  if (
    label.includes("UNDERVALUED")
  ) {
    return "text-emerald-400";
  }

  if (
    label.includes("OVERVALUED")
  ) {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getPremiumDescription(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Comparison unavailable";
  }

  if (value > 0) {
    return "Premium to peer-implied value";
  }

  if (value < 0) {
    return "Discount to peer-implied value";
  }

  return "In line with peer-implied value";
}

export default function PeerValuationPanel({
  symbol,
}: PeerValuationPanelProps) {
  const [peerUniverse, setPeerUniverse] =
    useState<PeerUniverse | null>(
      null
    );

  const [
    selectedPeerSymbols,
    setSelectedPeerSymbols,
  ] = useState<string[]>([]);

  const [peerResult, setPeerResult] =
    useState<PeerApiResponse | null>(
      null
    );

  const [
    isLoadingUniverse,
    setIsLoadingUniverse,
  ] = useState(true);

  const [
    isCalculating,
    setIsCalculating,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const loadPeerUniverse =
    useCallback(async () => {
      try {
        setIsLoadingUniverse(true);
        setError("");

        const response = await fetch(
          `/api/fundamental/peers/${encodeURIComponent(
            symbol
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            PeerApiResponse;

        if (!response.ok) {
          throw new Error(
            data.details ??
              data.error ??
              "Unable to load the peer universe."
          );
        }

        setPeerUniverse(
          data.peerUniverse ?? null
        );
      } catch (requestError) {
        console.error(
          "Peer universe error:",
          requestError
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the peer universe."
        );
      } finally {
        setIsLoadingUniverse(false);
      }
    }, [symbol]);

  useEffect(() => {
    setSelectedPeerSymbols([]);
    setPeerResult(null);

    loadPeerUniverse();
  }, [loadPeerUniverse]);

  function togglePeer(
    peerSymbol: string
  ) {
    const normalizedSymbol =
      peerSymbol.toUpperCase();

    setPeerResult(null);

    setSelectedPeerSymbols(
      (currentSymbols) => {
        if (
          currentSymbols.includes(
            normalizedSymbol
          )
        ) {
          return currentSymbols.filter(
            (symbolItem) =>
              symbolItem !==
              normalizedSymbol
          );
        }

        if (
          currentSymbols.length >=
          MAXIMUM_PEERS
        ) {
          return currentSymbols;
        }

        return [
          ...currentSymbols,
          normalizedSymbol,
        ];
      }
    );
  }

  function clearSelection() {
    setSelectedPeerSymbols([]);
    setPeerResult(null);
    setError("");
  }

  async function calculatePeerValuation() {
    if (
      selectedPeerSymbols.length <
      MINIMUM_PEERS
    ) {
      setError(
        `Select at least ${MINIMUM_PEERS} comparable companies.`
      );

      return;
    }

    try {
      setIsCalculating(true);
      setError("");
      setPeerResult(null);

      const searchParams =
        new URLSearchParams();

      searchParams.set(
        "peers",
        selectedPeerSymbols.join(",")
      );

      const response = await fetch(
        `/api/fundamental/peers/${encodeURIComponent(
          symbol
        )}?${searchParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as
          PeerApiResponse;

      if (!response.ok) {
        throw new Error(
          data.details ??
            data.error ??
            "Unable to calculate peer valuation."
        );
      }

      setPeerResult(data);
    } catch (requestError) {
      console.error(
        "Peer valuation error:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to calculate peer valuation."
      );
    } finally {
      setIsCalculating(false);
    }
  }

  if (isLoadingUniverse) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <p className="font-semibold text-white">
          Loading Nifty 500 peer
          universe…
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Identifying companies from the
          same published industry.
        </p>
      </div>
    );
  }

  if (
    error &&
    !peerUniverse
  ) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="font-semibold text-red-300">
          Peer universe unavailable
        </p>

        <p className="mt-2 text-sm text-red-200">
          {error}
        </p>

        <button
          type="button"
          onClick={loadPeerUniverse}
          className="mt-5 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
        >
          Try again
        </button>
      </div>
    );
  }

  if (
    !peerUniverse?.available
  ) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="font-semibold text-amber-300">
          Peer valuation unavailable
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          {peerUniverse
            ?.suitabilityReason ??
            "No suitable peer universe was found."}
        </p>
      </div>
    );
  }

  const candidates =
    peerUniverse.peerCandidates ?? [];

    return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-white">
                Select comparable
                companies
              </h3>

              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                NIFTY 500
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Select between{" "}
              {MINIMUM_PEERS} and{" "}
              {MAXIMUM_PEERS} companies
              from the same published
              industry. The selected
              company is automatically
              excluded.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500">
              Selected industry
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {peerUniverse
                .selectedIndustry ??
                "Not available"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Selected{" "}
            <span className="font-bold text-white">
              {
                selectedPeerSymbols.length
              }
            </span>{" "}
            of {MAXIMUM_PEERS}
          </p>

          {selectedPeerSymbols.length >
            0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map(
            (candidate) => {
              const isSelected =
                selectedPeerSymbols.includes(
                  candidate.symbol
                );

              const selectionDisabled =
                !isSelected &&
                selectedPeerSymbols.length >=
                  MAXIMUM_PEERS;

              return (
                <button
                  key={candidate.symbol}
                  type="button"
                  disabled={
                    selectionDisabled
                  }
                  onClick={() =>
                    togglePeer(
                      candidate.symbol
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10"
                      : selectionDisabled
                        ? "cursor-not-allowed border-slate-800 bg-slate-900 opacity-50"
                        : "border-slate-800 bg-slate-900 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`font-bold ${
                          isSelected
                            ? "text-emerald-300"
                            : "text-white"
                        }`}
                      >
                        {candidate.symbol}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-400">
                        {
                          candidate.companyName
                        }
                      </p>
                    </div>

                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-400 text-slate-950"
                          : "border-slate-600"
                      }`}
                    >
                      {isSelected
                        ? "✓"
                        : ""}
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </div>

        {candidates.length === 0 && (
          <p className="mt-5 text-sm text-slate-500">
            No same-industry Nifty 500
            peer candidates were found.
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-slate-500">
            Industry membership supports
            peer discovery but does not
            guarantee identical business
            models.
          </p>

          <button
            type="button"
            disabled={
              selectedPeerSymbols.length <
                MINIMUM_PEERS ||
              isCalculating
            }
            onClick={
              calculatePeerValuation
            }
            className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isCalculating
  ? "Comparing selected companies…"
  : "Compare selected peers"}
          </button>
        </div>
      </div>

      {isCalculating && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
          <p className="font-semibold text-white">
            Preparing peer comparison…
          </p>

          <p className="mt-2 text-sm text-slate-400">
            This can take some time
            because STFL reads and
            calculates verified financial
            information for every selected
            company.
          </p>
        </div>
      )}

      {peerResult &&
  !isCalculating && (
    <>
      {peerResult
        .peerComparisonRanking ? (
        <PeerComparisonResult
          ranking={
            peerResult
              .peerComparisonRanking
          }
        />
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <p className="font-semibold text-amber-300">
            Peer comparison incomplete
          </p>

          <p className="mt-2 text-sm text-amber-100/80">
            The selected companies could
            not produce a peer-ranking
            response.
          </p>
        </div>
      )}

      {(peerResult
        .analyticsWarnings
        ?.length ??
        0) > 0 && (
        <WarningPanel
          title="Peer data warnings"
          warnings={
            peerResult
              .analyticsWarnings ?? []
          }
        />
      )}
    </>
  )}
    </div>
  );
}

function PeerResult({
  valuation,
  peerCompanies,
  analyticsWarnings,
}: {
  valuation: PeerValuation | null;
  peerCompanies: PeerCompany[];
  analyticsWarnings: string[];
}) {
  if (!valuation) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="font-semibold text-amber-300">
          Peer valuation incomplete
        </p>

        <p className="mt-2 text-sm text-amber-100/80">
          The selected peer financial
          information could not produce a
          reliable valuation.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">
            Peer valuation result
          </h3>

          <div className="flex flex-wrap gap-2">
            {valuation.confidence && (
              <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                {formatLabel(
                  valuation.confidence
                )}{" "}
                confidence
              </span>
            )}

            <span
              className={`rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold ${getValuationColour(
                valuation
                  .valuationLabel
              )}`}
            >
              {formatLabel(
                valuation
                  .valuationLabel
              )}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ResultCard
            label="Peer Fair Value"
            value={formatCurrency(
              valuation
                .impliedFairValue
            )}
            detail="Per share"
          />

          <ResultCard
            label="Premium / Discount"
            value={formatPercent(
              valuation
                .premiumDiscountToPeers
            )}
            detail={getPremiumDescription(
              valuation
                .premiumDiscountToPeers
            )}
          />

          <ResultCard
            label="Valid Peers"
            value={formatNumber(
              valuation.peerCount ??
                peerCompanies.length,
              0
            )}
            detail="Included in comparison"
          />

          <ResultCard
            label="Confidence"
            value={formatLabel(
              valuation.confidence
            )}
            detail="Based on multiple coverage"
          />
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-400">
          {
            valuation.suitabilityReason
          }
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <h3 className="text-lg font-bold">
          Peer median multiples
        </h3>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ResultCard
            label="Median P/E"
            value={formatMultiple(
              valuation.peerMedianPe
            )}
            detail={`${valuation.multipleCoverage?.priceToEarnings ?? 0} peers with valid P/E`}
          />

          <ResultCard
            label="Median P/B"
            value={formatMultiple(
              valuation.peerMedianPb
            )}
            detail={`${valuation.multipleCoverage?.priceToBook ?? 0} peers with valid P/B`}
          />

          <ResultCard
            label="Median EV/EBITDA"
            value={formatMultiple(
              valuation
                .peerMedianEvEbitda
            )}
            detail={`${valuation.multipleCoverage?.enterpriseValueToEbitda ?? 0} peers with valid EV/EBITDA`}
          />
        </div>
      </div>

      <PeerComparisonTable
        peers={peerCompanies}
      />

      {(valuation.outlierWarnings
        ?.length ??
        0) > 0 && (
        <WarningPanel
          title="Outlier checks"
          warnings={
            valuation
              .outlierWarnings ?? []
          }
        />
      )}

      {analyticsWarnings.length >
        0 && (
        <WarningPanel
          title="Peer data warnings"
          warnings={
            analyticsWarnings
          }
        />
      )}
    </>
  );
}

function ResultCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function PeerComparisonTable({
  peers,
}: {
  peers: PeerCompany[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="p-6">
        <h3 className="text-lg font-bold">
          Peer comparison
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          Published financial metrics
          calculated by the same STFL
          methodology.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="border-y border-slate-800 bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-4">
                Company
              </th>
              <th className="px-4 py-4">
                Revenue Growth
              </th>
              <th className="px-4 py-4">
                PAT Growth
              </th>
              <th className="px-4 py-4">
                EBITDA Margin
              </th>
              <th className="px-4 py-4">
                ROE
              </th>
              <th className="px-4 py-4">
                ROCE
              </th>
              <th className="px-4 py-4">
                D/E
              </th>
              <th className="px-4 py-4">
                P/E
              </th>
              <th className="px-4 py-4">
                P/B
              </th>
              <th className="px-4 py-4">
                EV/EBITDA
              </th>
            </tr>
          </thead>

          <tbody>
            {peers.map((peer) => (
              <tr
                key={peer.symbol}
                className="border-b border-slate-800 last:border-b-0"
              >
                <td className="whitespace-nowrap px-4 py-4">
                  <p className="font-bold text-white">
                    {peer.symbol}
                  </p>

                  <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                    {peer.companyName}
                  </p>
                </td>

                <td className="px-4 py-4">
                  {formatPercent(
                    peer.revenueGrowth
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatPercent(
                    peer.patGrowth
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatPercent(
                    peer.ebitdaMargin
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatPercent(
                    peer.returnOnEquity
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatPercent(
                    peer
                      .returnOnCapitalEmployed
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatNumber(
                    peer.debtToEquity
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatMultiple(
                    peer.priceToEarnings
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatMultiple(
                    peer.priceToBook
                  )}
                </td>

                <td className="px-4 py-4">
                  {formatMultiple(
                    peer
                      .enterpriseValueToEbitda
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WarningPanel({
  title,
  warnings,
}: {
  title: string;
  warnings: string[];
}) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
      <h3 className="font-bold text-amber-300">
        {title}
      </h3>

      <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-100/80">
        {warnings.map(
          (warning, index) => (
            <li
              key={`${warning}-${index}`}
            >
              • {warning}
            </li>
          )
        )}
      </ul>
    </div>
  );
}