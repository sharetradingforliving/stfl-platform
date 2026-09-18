"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";


type SubscriptionStatus = {
  status: string;
  authenticated: boolean;
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


const premiumFeatures = [
  "Exact future planetary-event dates and details",
  "Historical market-event research comparisons",
  "Premium market alerts and research updates",
  "Long-term investment research ideas",
  "Stocks-on-the-move research",
  "Structured trading research",
  "Model portfolios and allocation research",
  "Past recommendations and performance records",
  "Advanced STFL intelligence tools as released",
];


const comparisonRows = [
  {
    feature: "Personal member dashboard",
    free: true,
    premium: true,
  },
  {
    feature: "Public planetary positions",
    free: true,
    premium: true,
  },
  {
    feature: "Historical market summaries",
    free: true,
    premium: true,
  },
  {
    feature: "Future-event headings and previews",
    free: true,
    premium: true,
  },
  {
    feature: "Exact future-event dates",
    free: false,
    premium: true,
  },
  {
    feature: "Detailed event research",
    free: false,
    premium: true,
  },
  {
    feature: "Historical research comparisons",
    free: false,
    premium: true,
  },
  {
    feature: "Premium alerts",
    free: false,
    premium: true,
  },
  {
    feature: "Model portfolios",
    free: false,
    premium: true,
  },
  {
    feature: "Performance records",
    free: false,
    premium: true,
  },
];


function formatDate(
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


export default function PremiumResearchPage() {
  const {
    isLoaded,
    isSignedIn,
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
  ] = useState(false);


  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn
    ) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSubscription() {
      setSubscriptionLoading(true);

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

        if (
          !cancelled &&
          response.ok
        ) {
          setSubscription(result);
        }
      } catch (error) {
        console.error(
          "Premium subscription status error:",
          error,
        );
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      }
    }

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
  ]);


  const isPremium =
    subscription?.is_premium === true;

  const currentPeriodEnd =
    formatDate(
      subscription
        ?.current_period_end ??
        null,
    );


  return (
    <main className="min-h-screen bg-[#020817] px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-2xl md:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                STFL Premium
              </p>

              <div
                className={
                  isPremium
                    ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300"
                    : "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300"
                }
              >
                {subscriptionLoading
                  ? "Checking membership"
                  : isPremium
                    ? "Premium Active"
                    : "Free Access"}
              </div>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  Premium research for
                  <span className="block text-emerald-400">
                    deeper market decisions.
                  </span>
                </h1>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                  Access structured research,
                  future-event intelligence,
                  historical comparisons, model
                  portfolios, transparent
                  performance records and Premium
                  STFL alerts.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Evidence-first research
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  STFL will not label planetary
                  events bullish or bearish until
                  sufficient historical evidence
                  supports that conclusion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {isPremium && (
          <section className="mt-8 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Your subscription
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold">
                  Premium access is active
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Plan:{" "}
                  {subscription?.plan_code}
                  {currentPeriodEnd
                    ? ` • Valid until ${currentPeriodEnd}`
                    : ""}
                </p>
              </div>

              <Link
                href="/dashboard"
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Open Dashboard
              </Link>
            </div>
          </section>
        )}

        <section
          id="plans"
          className="mt-12"
        >
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Membership Plans
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Choose how you want to access STFL
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Create a Free account or unlock
              Premium research with monthly or
              annual access.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
            <article className="flex flex-col rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Free
              </p>

              <div className="mt-5">
                <span className="text-5xl font-bold">
                  ₹0
                </span>

                <span className="ml-2 text-slate-500">
                  forever
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Explore public STFL research and
                use your personal member
                dashboard.
              </p>

              <ul className="mt-7 flex-1 space-y-4 text-sm text-slate-300">
                <li>✓ Secure member account</li>
                <li>✓ Personal dashboard</li>
                <li>✓ Public research modules</li>
                <li>✓ Historical summaries</li>
              </ul>

              {!isSignedIn ? (
                <Link
                  href="/sign-up"
                  className="mt-8 rounded-xl border border-cyan-500/40 px-5 py-3 text-center text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/10"
                >
                  Create Free Account
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="mt-8 rounded-xl border border-cyan-500/40 px-5 py-3 text-center text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/10"
                >
                  Open Free Dashboard
                </Link>
              )}
            </article>

            <article className="flex flex-col rounded-3xl border border-slate-700 bg-slate-950/70 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Monthly Premium
              </p>

              <div className="mt-5">
                <span className="text-5xl font-bold">
                  ₹299
                </span>

                <span className="ml-2 text-slate-500">
                  /month
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Flexible monthly access to
                Premium research and alerts.
                Applicable taxes may be added at
                checkout.
              </p>

              <ul className="mt-7 flex-1 space-y-4 text-sm text-slate-300">
                <li>✓ All Free features</li>
                <li>✓ Exact future-event details</li>
                <li>✓ Premium research comparisons</li>
                <li>✓ Premium alerts</li>
              </ul>

              {!isSignedIn ? (
                <Link
                  href="/login"
                  className="mt-8 rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Sign In to Subscribe
                </Link>
              ) : isPremium ? (
                <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center text-sm font-bold text-emerald-300">
                  Premium Active
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Razorpay checkout will be connected in the next development step."
                  className="mt-8 cursor-not-allowed rounded-xl bg-emerald-500/50 px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Select Monthly
                </button>
              )}
            </article>

            <article className="relative flex flex-col rounded-3xl border border-emerald-500/50 bg-emerald-500/10 p-7 shadow-xl shadow-emerald-950/20">
              <span className="absolute right-5 top-5 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                Best Value
              </span>

              <p className="pr-24 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Annual Premium
              </p>

              <div className="mt-5">
                <span className="text-5xl font-bold">
                  ₹2,999
                </span>

                <span className="ml-2 text-slate-400">
                  /year
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Save ₹589 compared with twelve
                monthly payments. Applicable
                taxes may be added at checkout.
              </p>

              <ul className="mt-7 flex-1 space-y-4 text-sm text-slate-200">
                <li>✓ All Free features</li>
                <li>✓ Complete Premium research</li>
                <li>✓ Premium comparisons and alerts</li>
                <li>✓ Best annual value</li>
              </ul>

              {!isSignedIn ? (
                <Link
                  href="/login"
                  className="mt-8 rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Sign In to Subscribe
                </Link>
              ) : isPremium ? (
                <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center text-sm font-bold text-emerald-300">
                  Premium Active
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Razorpay checkout will be connected in the next development step."
                  className="mt-8 cursor-not-allowed rounded-xl bg-emerald-500/50 px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Select Annual
                </button>
              )}
            </article>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-950/60 p-7 md:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Compare Memberships
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Free versus Premium
            </h2>
          </div>

          <div className="mt-9 overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-4 text-sm text-slate-400">
                    Feature
                  </th>

                  <th className="px-4 py-4 text-center text-sm text-cyan-300">
                    Free
                  </th>

                  <th className="px-4 py-4 text-center text-sm text-emerald-300">
                    Premium
                  </th>
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map(
                  (row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-slate-800"
                    >
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {row.feature}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={
                            row.free
                              ? "text-cyan-300"
                              : "text-slate-600"
                          }
                        >
                          {row.free
                            ? "✓"
                            : "—"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center text-emerald-300">
                        {row.premium
                          ? "✓"
                          : "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
            <p className="text-sm font-semibold text-white">
              Subscription control
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Paid access will begin only after
              you select a plan and successfully
              complete Razorpay checkout.
              Creating an account never starts
              automatic billing.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
            <p className="text-sm font-semibold text-white">
              Research disclaimer
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              STFL information is provided for
              educational and research purposes.
              It is not investment advice or a
              guarantee of market performance.
            </p>
          </article>
        </section>

        <section className="mt-14 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center md:p-12">
          <h2 className="text-3xl font-bold">
            Build your STFL research advantage
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Begin with Free access and upgrade
            only when Premium research fits your
            requirements.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-4">
            {!isSignedIn ? (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Create Free Account
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-white transition hover:border-emerald-500"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-xl border border-emerald-500/40 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
              >
                Return to Dashboard
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}