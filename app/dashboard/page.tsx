"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";


type DashboardCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  status: string;
};


type SubscriptionStatus = {
  status: string;
  authenticated: boolean;
  clerk_user_id?: string;
  entitlement: "FREE" | "PREMIUM";
  is_premium: boolean;
  plan_code: string;
  subscription_status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  reason: string;
  detail?: string;
};


const dashboardCards: DashboardCard[] = [
  {
    title: "My Watchlist",
    description:
      "Track selected stocks, price movement, important alerts and research updates.",
    href: "/watchlist",
    icon: "★",
    status: "Integration Planned",
  },
];


function formatSubscriptionDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(parsedDate);
}


export default function DashboardPage() {
  const {
    isLoaded,
    user,
  } = useUser();

  const [
    subscription,
    setSubscription,
  ] = useState<
    SubscriptionStatus | null
  >(null);

  const [
    subscriptionLoading,
    setSubscriptionLoading,
  ] = useState(true);

  const [
    subscriptionError,
    setSubscriptionError,
  ] = useState<string | null>(
    null,
  );


  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }

    let requestCancelled = false;

    async function loadSubscription() {
      setSubscriptionLoading(true);
      setSubscriptionError(null);

      try {
        const response = await fetch(
          "/api/subscription/status",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        const result =
          await response.json() as
            SubscriptionStatus;

        if (!response.ok) {
          throw new Error(
            result.detail ??
              "Unable to load subscription status.",
          );
        }

        if (!requestCancelled) {
          setSubscription(result);
        }
      } catch (error) {
        console.error(
          "Dashboard subscription error:",
          error,
        );

        if (!requestCancelled) {
          setSubscription(null);
          setSubscriptionError(
            error instanceof Error
              ? error.message
              : "Unable to load subscription status.",
          );
        }
      } finally {
        if (!requestCancelled) {
          setSubscriptionLoading(false);
        }
      }
    }

    void loadSubscription();

    return () => {
      requestCancelled = true;
    };
  }, [
    isLoaded,
    user,
  ]);


  const email =
    user?.primaryEmailAddress
      ?.emailAddress ??
    "Email unavailable";

  const memberName =
    user?.fullName ??
    user?.firstName ??
    email.split("@")[0] ??
    "STFL Member";

  const isPremium =
    subscription?.is_premium === true;

  const membershipLabel =
    subscriptionLoading
      ? "Checking membership..."
      : isPremium
        ? "Premium Member"
        : "Free Member";

  const planCode =
    subscription?.plan_code ??
    "FREE";

  const subscriptionEndDate =
    formatSubscriptionDate(
      subscription
        ?.current_period_end ??
        null,
    );


  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#020817] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#020817] px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl md:p-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                STFL Member Workspace
              </p>

              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                Welcome, {memberName}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Your personalized workspace for
                watchlists, portfolio intelligence,
                saved research, alerts and Premium
                market insights.
              </p>
            </div>

            <div
              className={
                isPremium
                  ? "rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4"
                  : "rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4"
              }
            >
              <p
                className={
                  isPremium
                    ? "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400"
                    : "text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400"
                }
              >
                Account Status
              </p>

              <p className="mt-2 font-semibold text-white">
                {membershipLabel}
              </p>

              {!subscriptionLoading && (
                <p className="mt-1 text-xs text-slate-400">
                  Plan: {planCode}
                </p>
              )}

              {isPremium &&
                subscriptionEndDate && (
                  <p className="mt-1 text-xs text-slate-400">
                    Valid until:{" "}
                    {subscriptionEndDate}
                  </p>
                )}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="font-semibold text-emerald-300">
              Account connected
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-400">
              Signed in as{" "}
              <span className="text-slate-200">
                {email}
              </span>
              .
            </p>

            {subscriptionLoading && (
              <p className="mt-2 text-sm text-slate-400">
                Checking your STFL membership
                securely...
              </p>
            )}

            {!subscriptionLoading &&
              !subscriptionError &&
              isPremium && (
                <p className="mt-2 text-sm leading-7 text-emerald-300">
                  Your Premium entitlement is
                  active and has been verified
                  through the STFL backend.
                </p>
              )}

            {!subscriptionLoading &&
              !subscriptionError &&
              !isPremium && (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <p className="text-sm leading-7 text-slate-400">
                    You currently have Free access.
                    Upgrade to unlock Premium market
                    research, future-event details,
                    research comparisons and alerts.
                  </p>

                  <Link
                    href="/premium-research"
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Explore Premium
                  </Link>
                </div>
              )}

            {subscriptionError && (
              <p className="mt-3 text-sm text-amber-300">
                Your account is connected, but
                membership status could not be
                refreshed. Free access remains
                available.
              </p>
            )}

            {isPremium &&
              subscription
                ?.cancel_at_period_end && (
                  <p className="mt-3 text-sm text-amber-300">
                    Your subscription is scheduled
                    to end after the current paid
                    period.
                  </p>
                )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Watchlist Stocks",
              value: "—",
              note:
                "Watchlist integration pending",
            },
            {
              label: "Portfolio Value",
              value: "—",
              note:
                "Portfolio integration pending",
            },
            {
              label: "Saved Research",
              value: "—",
              note:
                "Saved research integration pending",
            },
            {
              label: "Active Alerts",
              value: "—",
              note:
                "Alert engine integration pending",
            },
          ].map((summary) => (
            <article
              key={summary.label}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
            >
              <p className="text-sm text-slate-500">
                {summary.label}
              </p>

              <p className="mt-3 text-4xl font-bold text-white">
                {summary.value}
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-600">
                {summary.note}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Member Tools
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Manage your STFL workspace
            </h2>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {dashboardCards.map(
              (card) => (
                <article
                  key={card.title}
                  className="group flex min-h-[300px] flex-col rounded-3xl border border-slate-800 bg-slate-950/60 p-7 transition hover:-translate-y-1 hover:border-emerald-500/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl">
                      {card.icon}
                    </div>

                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      {card.status}
                    </span>
                  </div>

                  <h3 className="mt-7 text-2xl font-bold transition group-hover:text-emerald-400">
                    {card.title}
                  </h3>

                  <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">
                    {card.description}
                  </p>

                  <Link
                    href={card.href}
                    className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-400 transition hover:gap-3"
                  >
                    Open Module
                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Quick Access
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Continue exploring STFL
          </h2>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/market-intelligence"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Market Intelligence
            </Link>

            <Link
              href="/conviction-engine"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Conviction Engine
            </Link>

            <Link
              href="/ai-research-assistant"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              AI Research Assistant
            </Link>

            <Link
              href="/options-assistant"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Options Assistant
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}