"use client";

import {
  useCallback,
  useState,
} from "react";

import {
  useUser,
} from "@clerk/nextjs";

import Link from "next/link";

type PlanetaryEvent = {
  event_id: string;
  event_type: "MAJOR_ASPECT";
  first_body: string;
  second_body: string;
  aspect: string;
  target_angle: number;
  exact_at_utc: string;
  exact_at_ist: string;
  event_date_ist: string;
  orb_degrees: number;
  astronomical_summary: string;
  traditional_context: string;
  market_prediction: null;
  research_status: "UNTESTED";
};

type CalendarResponse = {
  status: string;
  start_date: string;
  end_date: string;
  timezone: string;
  coordinate_system: string;
  ephemeris: string;
  included_bodies: string[];
  included_aspects: string[];
  total_events: number;
  events: PlanetaryEvent[];
  limitations: string[];
  detail?: string;
};

type PreviewSection = {
  heading: string;
  description: string;
};

type PreviewResponse = {
  status: string;
  access_level?: string;
  title?: string;
  summary?: string;
  included_bodies?: string[];
  included_aspects?: string[];
  preview_sections?: PreviewSection[];
  premium_includes?: string[];
  evidence_policy?: string;
  upgrade?: {
    monthly_price_inr?: number;
    annual_price_inr?: number;
    href?: string;
  };
  detail?: string;
};

type SubscriptionResponse = {
  status: string;
  authenticated: boolean;
  entitlement: "FREE" | "PREMIUM";
  is_premium: boolean;
  plan_code: string;
  subscription_status: string;
  current_period_end: string | null;
  detail?: string;
};

type AccessMode =
  | "PUBLIC_PREVIEW"
  | "FREE_PREVIEW"
  | "PREMIUM";

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }
  ).format(new Date(value));
}

function localDateText(
  value: Date
) {
  const year = value.getFullYear();

  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function aspectClasses(
  aspect: string
) {
  if (
    aspect === "Square" ||
    aspect === "Opposition"
  ) {
    return (
      "border-amber-500/30 " +
      "bg-amber-500/10 " +
      "text-amber-200"
    );
  }

  if (
    aspect === "Trine" ||
    aspect === "Sextile"
  ) {
    return (
      "border-cyan-500/30 " +
      "bg-cyan-500/10 " +
      "text-cyan-200"
    );
  }

  return (
    "border-violet-500/30 " +
    "bg-violet-500/10 " +
    "text-violet-200"
  );
}

async function readJsonResponse<T>(
  response: Response
): Promise<T> {
  const responseText =
    await response.text();

  try {
    return JSON.parse(
      responseText
    ) as T;
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }
}

export default function PlanetaryEventCalendar() {
  const {
    isLoaded,
    isSignedIn,
  } = useUser();

  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const [
    calendar,
    setCalendar,
  ] = useState<CalendarResponse | null>(
    null
  );

  const [
    preview,
    setPreview,
  ] = useState<PreviewResponse | null>(
    null
  );

  const [
    accessMode,
    setAccessMode,
  ] = useState<AccessMode>(
    "PUBLIC_PREVIEW"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadPreview =
    useCallback(async (
      mode: AccessMode
    ) => {
      const response = await fetch(
        "/api/astro/planetary-event-calendar/preview",
        {
          cache: "no-store",
        }
      );

      const payload =
        await readJsonResponse<PreviewResponse>(
          response
        );

      if (
        !response.ok ||
        payload.status !== "success"
      ) {
        throw new Error(
          payload.detail ??
            "Unable to load the planetary event preview."
        );
      }

      setPreview(payload);
      setCalendar(null);
      setAccessMode(mode);
    }, []);

  const loadPremiumCalendar =
    useCallback(async () => {
      const startDate = new Date();

      const endDate = new Date(
        startDate
      );

      endDate.setFullYear(
        endDate.getFullYear() + 1
      );

      const parameters =
        new URLSearchParams({
          start_date:
            localDateText(
              startDate
            ),
          end_date:
            localDateText(
              endDate
            ),
        });

      const response = await fetch(
        `/api/astro/planetary-event-calendar?${parameters.toString()}`,
        {
          cache: "no-store",
        }
      );

      const payload =
        await readJsonResponse<CalendarResponse>(
          response
        );

      if (!response.ok) {
        throw new Error(
          payload.detail ??
            "Unable to load the Premium planetary event calendar."
        );
      }

      if (
        payload.status !== "success"
      ) {
        throw new Error(
          payload.detail ??
            "Unable to load the Premium planetary event calendar."
        );
      }

      setCalendar(payload);
      setPreview(null);
      setAccessMode("PREMIUM");
    }, []);

  const loadCalendar =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        if (
          !isLoaded ||
          !isSignedIn
        ) {
          await loadPreview(
            "PUBLIC_PREVIEW"
          );

          return;
        }

        const subscriptionResponse =
          await fetch(
            "/api/subscription/status",
            {
              cache: "no-store",
            }
          );

        if (
          !subscriptionResponse.ok
        ) {
          await loadPreview(
            "FREE_PREVIEW"
          );

          return;
        }

        const subscription =
          await readJsonResponse<SubscriptionResponse>(
            subscriptionResponse
          );

        if (
          subscription.is_premium &&
          subscription.entitlement ===
            "PREMIUM"
        ) {
          await loadPremiumCalendar();

          return;
        }

        await loadPreview(
          "FREE_PREVIEW"
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load the planetary event calendar."
        );
      } finally {
        setLoading(false);
      }
    }, [
      isLoaded,
      isSignedIn,
      loadPremiumCalendar,
      loadPreview,
    ]);

  function toggleCalendar() {
    const nextExpanded =
      !expanded;

    setExpanded(nextExpanded);

    if (
      nextExpanded &&
      !calendar &&
      !preview &&
      !loading
    ) {
      void loadCalendar();
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={toggleCalendar}
        className={[
          "flex w-full flex-col gap-5 px-6 py-6 text-left transition hover:bg-slate-900/30 lg:flex-row lg:items-center lg:justify-between",
          expanded
            ? "border-b border-slate-800"
            : "",
        ].join(" ")}
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Future astronomical events
            </p>

            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              Premium details
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Planetary Event Calendar
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Explore the research framework
            publicly. Exact future dates,
            event details and research
            comparisons are available only
            with an active Premium
            entitlement.
          </p>
        </div>

        <span className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {expanded
            ? "Hide calendar"
            : "View calendar"}

          <span
            className={[
              "ml-2 inline-block transition-transform",
              expanded
                ? "rotate-180"
                : "",
            ].join(" ")}
          >
            ▼
          </span>
        </span>
      </button>

      {expanded && (
        <div className="p-6">
          {loading && (
            <LoadingState />
          )}

          {!loading && error && (
            <ErrorState
              error={error}
              retry={() => {
                setCalendar(null);
                setPreview(null);

                void loadCalendar();
              }}
            />
          )}

          {!loading &&
            !error &&
            accessMode ===
              "PREMIUM" &&
            calendar && (
              <PremiumCalendar
                data={calendar}
              />
            )}

          {!loading &&
            !error &&
            accessMode !==
              "PREMIUM" &&
            preview && (
              <PreviewCalendar
                data={preview}
                signedIn={
                  Boolean(
                    isSignedIn
                  )
                }
              />
            )}
        </div>
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-10 text-center">
      <p className="text-sm text-violet-200">
        Checking calendar access and
        loading the available research…
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Premium access is verified securely
        through your STFL account.
      </p>
    </div>
  );
}

function ErrorState({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
      <p className="font-semibold text-rose-300">
        Calendar unavailable
      </p>

      <p className="mt-2 text-sm text-rose-200/80">
        {error}
      </p>

      <button
        type="button"
        onClick={retry}
        className="mt-4 rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10"
      >
        Try again
      </button>
    </div>
  );
}

function PreviewCalendar({
  data,
  signedIn,
}: {
  data: PreviewResponse;
  signedIn: boolean;
}) {
  const bodies =
    data.included_bodies ?? [];

  const aspects =
    data.included_aspects ?? [];

  const sections =
    data.preview_sections ?? [];

  const premiumIncludes =
    data.premium_includes ?? [
      "Exact future event dates and times",
      "Detailed astronomical event information",
      "Historical research comparisons",
      "Premium alerts and research updates",
    ];

  return (
    <>
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Free research preview
            </p>

            <h3 className="mt-2 text-xl font-bold text-white">
              {data.title ??
                "Planetary Event Calendar"}
            </h3>
          </div>

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            No exact dates shown
          </span>
        </div>

        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
          {data.summary ??
            "STFL monitors major structural planetary aspects as an experimental market-research framework."}
        </p>
      </div>

      {sections.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sections.map(
            (section) => (
              <article
                key={
                  section.heading
                }
                className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5"
              >
                <h4 className="font-semibold text-white">
                  {section.heading}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {
                    section.description
                  }
                </p>
              </article>
            )
          )}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PreviewList
          title="Bodies included"
          items={bodies}
        />

        <PreviewList
          title="Aspects researched"
          items={aspects}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          STFL Premium
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          Unlock the complete future-event
          calendar
        </h3>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Exact future dates are withheld
          from the public response and are
          released only after the backend
          verifies an active Premium
          subscription.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {premiumIncludes.map(
            (item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-300">
                  ✓
                </span>

                <span className="text-sm leading-6 text-slate-300">
                  {item}
                </span>
              </div>
            )
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/premium-research"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            View Premium Membership
          </Link>

          {!signedIn && (
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
            >
              Sign in
            </Link>
          )}

          <p className="text-xs text-slate-500">
            ₹299 monthly or ₹2,999
            annually. Payment activation is
            launching soon.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          Evidence-first policy
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {data.evidence_policy ??
            "STFL does not label planetary events bullish or bearish unless historical market evidence supports that conclusion."}
        </p>
      </div>
    </>
  );
}

function PreviewList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      {items.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map(
            (item) => (
              <span
                key={item}
                className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200"
              >
                {item}
              </span>
            )
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Research coverage information
          will be available shortly.
        </p>
      )}
    </div>
  );
}

function PremiumCalendar({
  data,
}: {
  data: CalendarResponse;
}) {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Premium access verified
          </p>

          <p className="mt-2 text-sm text-slate-300">
            Complete astronomical event
            details are available for your
            account.
          </p>
        </div>

        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Premium Member
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Calendar period"
          value={`${data.start_date} to ${data.end_date}`}
        />

        <SummaryCard
          label="Structural events"
          value={String(
            data.total_events
          )}
        />

        <SummaryCard
          label="Research status"
          value="Astronomical dates only"
        />
      </div>

      {data.events.length > 0 ? (
        <div className="mt-6 space-y-4">
          {data.events.map(
            (event) => (
              <EventCard
                key={event.event_id}
                event={event}
              />
            )
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-800 p-6 text-center">
          <p className="font-semibold text-white">
            No exact structural aspects
            detected
          </p>

          <p className="mt-2 text-sm text-slate-400">
            No exact major aspects between
            the included bodies were found
            during this calendar period.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          How to read this
        </p>

        <p className="mt-2 text-sm leading-6 text-cyan-100">
          Dates and aspects are astronomical
          calculations. Traditional context
          does not constitute a prediction.
          STFL does not infer a market rise,
          decline or reversal without
          supporting historical and current
          market evidence.
        </p>
      </div>

      <details className="mt-4 rounded-2xl border border-slate-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-300">
          View calculation methodology
        </summary>

        <div className="border-t border-slate-800 px-4 py-4 text-xs leading-6 text-slate-500">
          <p>
            Bodies:{" "}
            {data.included_bodies.join(
              ", "
            )}
          </p>

          <p>
            Aspects:{" "}
            {data.included_aspects.join(
              ", "
            )}
          </p>

          <p>
            Coordinate system:{" "}
            {data.coordinate_system}
          </p>

          <p>
            Ephemeris:{" "}
            {data.ephemeris}
          </p>
        </div>
      </details>
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function EventCard({
  event,
}: {
  event: PlanetaryEvent;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                aspectClasses(
                  event.aspect
                ),
              ].join(" ")}
            >
              {event.aspect}
            </span>

            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-400">
              No market prediction
            </span>
          </div>

          <h3 className="mt-3 text-xl font-bold text-white">
            {event.first_body}
            {" – "}
            {event.second_body}
          </h3>

          <p className="mt-2 text-sm font-semibold text-sky-300">
            {formatDateTime(
              event.exact_at_ist
            )}{" "}
            IST
          </p>
        </div>

        <div className="text-sm text-slate-500 sm:text-right">
          <p>Exact aspect</p>

          <p className="mt-1 font-mono text-slate-300">
            Orb{" "}
            {event.orb_degrees.toFixed(
              4
            )}
            °
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Astronomical fact
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {
              event.astronomical_summary
            }
          </p>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            Traditional context
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {
              event.traditional_context
            }
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Research evidence: Not tested
      </p>
    </article>
  );
}