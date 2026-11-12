import "server-only";

import { cache } from "react";

import {
  getNifty500Constituents,
} from "@/lib/market/nifty500";

import {
  getAllNseEquities,
} from "@/lib/market/allNseEquities";

export const getCompanyIdentity = cache(
  async (symbol: string) => {
    const normalizedSymbol =
      symbol.trim().toUpperCase();

    let sourceUnavailable = false;

    try {
      const companies =
        await getNifty500Constituents();

      const company = companies.find(
        (item) =>
          item.symbol === normalizedSymbol &&
          Boolean(item.companyName.trim()) &&
          (item.series === "EQ" || item.series === "")
      );

      if (company) {
        return {
          symbol: normalizedSymbol,
          companyName: company.companyName.trim(),
          industry: company.industry || null,
          isin: company.isin,
          status: "verified" as const,
        };
      }
    } catch {
      sourceUnavailable = true;
    }

    try {
      const universe =
        await getAllNseEquities();

      const matches = universe.equities.filter(
        (item) => item.symbol === normalizedSymbol
      );

      const identities = new Set(
        matches.map((item) => item.isin)
      );

      const company = matches[0];

      if (
        company &&
        identities.size === 1 &&
        company.companyName.trim() &&
        company.companyName.trim().toUpperCase() !==
          normalizedSymbol
      ) {
        return {
          symbol: normalizedSymbol,
          companyName: company.companyName.trim(),
          industry: null,
          isin: company.isin,
          status: "verified" as const,
        };
      }
    } catch {
      sourceUnavailable = true;
    }

    return {
      symbol: normalizedSymbol,
      companyName: normalizedSymbol,
      industry: null,
      isin: null,
      status: sourceUnavailable
        ? ("source_unavailable" as const)
        : ("outside_pilot" as const),
    };
  }
);