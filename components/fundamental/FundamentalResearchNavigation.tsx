"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ResearchDestination = {
  label: string;
  description: string;
  href: string;
  matches: (
    pathname: string
  ) => boolean;
};

const destinations:
  ResearchDestination[] = [
  {
    label:
      "Company Research & Valuation",

    description:
      "Search and analyse one listed company.",

    href:
      "/fundamental-research",

    matches: (pathname) =>
      pathname.startsWith(
        "/fundamental-research"
      ) &&
      !pathname.startsWith(
        "/fundamental-research/discovery"
      ),
  },

  {
    label:
      "Stock Discovery",

    description:
      "Find and rank companies using published financial data.",

    href:
      "/fundamental-research/discovery",

    matches: (pathname) =>
      pathname.startsWith(
        "/fundamental-research/discovery"
      ),
  },
];

export default function FundamentalResearchNavigation() {
  const pathname =
    usePathname();

  return (
    <nav
      aria-label="Fundamental research products"
      className="grid gap-3 md:grid-cols-2"
    >
      {destinations.map(
        (destination) => {
          const isActive =
            destination.matches(
              pathname
            );

          return (
            <Link
              key={destination.href}
              href={destination.href}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              className={`rounded-xl border p-4 transition ${
                isActive
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700"
              }`}
            >
              <p
                className={`font-semibold ${
                  isActive
                    ? "text-emerald-300"
                    : "text-white"
                }`}
              >
                {
                  destination.label
                }
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-400">
                {
                  destination.description
                }
              </p>
            </Link>
          );
        }
      )}
    </nav>
  );
}