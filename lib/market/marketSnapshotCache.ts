"use client";

const STORAGE_KEY =
  "stfl:last-valid-all-stocks-snapshot";

type SnapshotUniverse = {
  stocksTraded?: number;
  marketSessionDate?: string | null;
};

type SnapshotBreadth = {
  advances?: number;
  declines?: number;
  unchanged?: number;
};

type MarketSnapshot = {
  universe?: SnapshotUniverse;
  breadth?: SnapshotBreadth;
  topGainers?: unknown[];
  topLosers?: unknown[];
  mostActiveVolume?: unknown[];
  mostActiveValue?: unknown[];
  marketDataStatus?: string;
  cacheStatus?: string;
  warning?: string;
};

function isValidSnapshot(
  snapshot: MarketSnapshot | null
): boolean {
  if (!snapshot?.universe) {
    return false;
  }

  const stocksTraded =
    snapshot.universe.stocksTraded ?? 0;

  const breadthTotal =
    (snapshot.breadth?.advances ?? 0) +
    (snapshot.breadth?.declines ?? 0) +
    (snapshot.breadth?.unchanged ?? 0);

  const movementCount =
    (snapshot.topGainers?.length ?? 0) +
    (snapshot.topLosers?.length ?? 0) +
    (snapshot.mostActiveVolume?.length ?? 0) +
    (snapshot.mostActiveValue?.length ?? 0);

  return (
    stocksTraded > 0 &&
    Boolean(
      snapshot.universe.marketSessionDate
    ) &&
    (breadthTotal > 0 ||
      movementCount > 0)
  );
}

function readSavedSnapshot<T>(): T | null {
  try {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return null;
    }

    const parsed =
      JSON.parse(saved) as MarketSnapshot;

    return isValidSnapshot(parsed)
      ? (parsed as T)
      : null;
  } catch {
    return null;
  }
}

function saveSnapshot(
  snapshot: MarketSnapshot
): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(snapshot)
    );
  } catch (error) {
    console.warn(
      "Unable to save market snapshot:",
      error
    );
  }
}

export async function fetchMarketSnapshot<
  T extends MarketSnapshot,
>(): Promise<T> {
  try {
    const response = await fetch(
      "/api/market/all-stocks",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const result =
      (await response.json()) as T & {
        error?: string;
        details?: string;
      };

    if (
      response.ok &&
      isValidSnapshot(result)
    ) {
      saveSnapshot(result);
      return result;
    }

    const savedSnapshot =
      readSavedSnapshot<T>();

    if (savedSnapshot) {
      return {
        ...savedSnapshot,
        marketDataStatus:
          "previous_session",
        cacheStatus:
          "browser-persistent",
        warning:
          "The market is closed or current-session trading data is unavailable. Showing the latest saved trading session.",
      };
    }

    if (!response.ok) {
      throw new Error(
        result.error ??
          result.details ??
          "Market data is unavailable"
      );
    }

    return result;
  } catch (error) {
    const savedSnapshot =
      readSavedSnapshot<T>();

    if (savedSnapshot) {
      return {
        ...savedSnapshot,
        marketDataStatus:
          "previous_session",
        cacheStatus:
          "browser-persistent",
        warning:
          "The latest refresh failed. Showing the latest saved trading session.",
      };
    }

    throw error;
  }
}