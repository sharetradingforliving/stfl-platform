"use client";

import Link from "next/link";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

type AccessState =
  | "loading"
  | "signed_out"
  | "free"
  | "premium"
  | "error";

type SubscriptionResponse = {
  authenticated?: boolean;
  entitlement?: string;
  is_premium?: boolean;
  code?: string;
  detail?: string;
};

type PremiumValuationGateProps = {
  children: ReactNode;
  symbol: string;
};

export default function PremiumValuationGate({
  children,
  symbol,
}: PremiumValuationGateProps) {
  const [accessState, setAccessState] =
    useState<AccessState>("loading");

  const [error, setError] =
    useState("");

  const checkAccess =
    useCallback(async () => {
      try {
        setAccessState("loading");
        setError("");

        const response = await fetch(
          "/api/subscription/status",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            SubscriptionResponse;

        if (
          response.status === 401 ||
          data.authenticated === false ||
          data.code ===
            "AUTHENTICATION_REQUIRED"
        ) {
          setAccessState("signed_out");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.detail ??
              "Unable to verify Premium access."
          );
        }

        if (
          data.is_premium === true ||
          data.entitlement
            ?.trim()
            .toUpperCase() === "PREMIUM"
        ) {
          setAccessState("premium");
          return;
        }

        setAccessState("free");
      } catch (requestError) {
        console.error(
          "Valuation access check failed:",
          requestError
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to verify Premium access."
        );

        setAccessState("error");
      }
    }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  if (accessState === "loading") {
    return (
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="animate-pulse">
          <div className="h-7 w-52 rounded bg-slate-800" />

          <div className="mt-6 h-28 rounded-xl bg-slate-800/70" />
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Checking Premium access...
        </p>
      </section>
    );
  }

  if (accessState === "premium") {
    return <>{children}</>;
  }

  if (accessState === "error") {
    return (
      <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 md:p-8">
        <h2 className="text-xl font-bold text-red-300">
          Premium access check
          unavailable
        </h2>

        <p className="mt-3 text-sm leading-6 text-red-100/80">
          {error}
        </p>

        <button
          type="button"
          onClick={checkAccess}
          className="mt-5 rounded-xl border border-red-400/40 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/10"
        >
          Try again
        </button>
      </section>
    );
  }

  if (accessState === "signed_out") {
    return (
      <ValuationUpgradeCard
        symbol={symbol}
        signedOut
      />
    );
  }

  return (
    <ValuationUpgradeCard
      symbol={symbol}
      signedOut={false}
    />
  );
}

function ValuationUpgradeCard({
  symbol,
  signedOut,
}: {
  symbol: string;
  signedOut: boolean;
}) {
  const features = [
    "STFL Composite valuation",
    "Discounted cash-flow valuation",
    "Relative valuation",
    "Peer comparison and fair value",
    "Graham valuation",
  ];

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950">
      <div className="border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-slate-950 to-emerald-500/10 px-6 py-7 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-white">
            Unlock Complete Company
            Valuation
          </h2>

          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
            STFL PREMIUM
          </span>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Access STFL&apos;s complete
          valuation workspace for{" "}
          <span className="font-bold text-white">
            {symbol.toUpperCase()}
          </span>
          , including fair-value estimates,
          financial comparisons and
          potential upside or downside.
        </p>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5 md:p-8">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
              ✓
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-200">
              {feature}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div>
          <p className="font-bold text-white">
            ₹299 monthly or ₹2,999 annually
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Includes Premium research
            features across STFL.
          </p>
        </div>

        <Link
          href={
            signedOut
              ? "/sign-in"
              : "/premium-research"
          }
          className="inline-flex justify-center rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
        >
          {signedOut
            ? "Sign in to continue"
            : "View Premium Membership"}
        </Link>
      </div>
    </section>
  );
}