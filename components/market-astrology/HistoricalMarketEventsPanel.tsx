"use client";

import HistoricalEventAlignmentPanel from "./HistoricalEventAlignmentPanel";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type MarketPoint = {
  date: string;
  close: number;
};

type ForwardReturns = {
  "1_session"?: number | null;
  "5_session"?: number | null;
  "10_session"?: number | null;
  "20_session"?: number | null;
  "60_session"?: number | null;
};

type MarketEvent = {
  event_id: string;
  index_code: string;
  index_name: string;
  event_type:
    | "MARKET_CRASH"
    | "MAJOR_CORRECTION"
    | "SMALL_CORRECTION";
  event_label: string;
  status: "ONGOING" | "RECOVERED";
  peak: MarketPoint;
  threshold_crossed:
    | MarketPoint
    | null;
  trough: MarketPoint;
  recovery: MarketPoint | null;
  maximum_drawdown_percent: number;
  decline_magnitude_percent: number;
  peak_to_trough_sessions: number;
  recovery_sessions: number | null;
  total_event_sessions: number;
  forward_returns_from_trough:
    ForwardReturns;
};

type HistoricalEventsResponse = {
  status: string;
  index_code: string;
  instrument_key: string;
  index_name: string;
  start_date: string;
  end_date: string;
  trading_days: number;
  minimum_drawdown_percent: number;
  classification: {
    small_correction: string;
    major_correction: string;
    market_crash: string;
  };
  total_events: number;
  event_counts: {
    MARKET_CRASH: number;
    MAJOR_CORRECTION: number;
    SMALL_CORRECTION: number;
  };
  events: MarketEvent[];
  detail?: string;
};

type EventFilter =
  | "ALL"
  | "MARKET_CRASH"
  | "MAJOR_CORRECTION"
  | "SMALL_CORRECTION";

const FILTERS: {
  value: EventFilter;
  label: string;
}[] = [
  {
    value: "ALL",
    label: "All Events",
  },
  {
    value: "MARKET_CRASH",
    label: "Market Crashes",
  },
  {
    value: "MAJOR_CORRECTION",
    label: "Major Corrections",
  },
  {
    value: "SMALL_CORRECTION",
    label: "Small Corrections",
  },
];

const RETURN_PERIODS: {
  key: keyof ForwardReturns;
  label: string;
}[] = [
  {
    key: "1_session",
    label: "1 Day",
  },
  {
    key: "5_session",
    label: "5 Days",
  },
  {
    key: "10_session",
    label: "10 Days",
  },
  {
    key: "20_session",
    label: "20 Days",
  },
  {
    key: "60_session",
    label: "60 Days",
  },
];

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(
    `${value}T00:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(parsedDate);
}

function formatNumber(
  value: number | null | undefined,
  maximumFractionDigits = 2
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits,
    }
  ).format(value);
}

function formatPercent(
  value: number | null | undefined,
  showPositiveSign = false
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  const sign =
    showPositiveSign && value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(2)}%`;
}

function getEventColours(
  eventType: MarketEvent["event_type"]
) {
  if (eventType === "MARKET_CRASH") {
    return {
      badge:
        "border-red-500/40 bg-red-500/10 text-red-300",
      accent: "text-red-300",
      border: "border-red-500/30",
    };
  }

  if (
    eventType === "MAJOR_CORRECTION"
  ) {
    return {
      badge:
        "border-amber-500/40 bg-amber-500/10 text-amber-300",
      accent: "text-amber-300",
      border: "border-amber-500/30",
    };
  }

  return {
    badge:
      "border-sky-500/40 bg-sky-500/10 text-sky-300",
    accent: "text-sky-300",
    border: "border-sky-500/30",
  };
}

export default function HistoricalMarketEventsPanel() {
  const [
    data,
    setData,
  ] = useState<
    HistoricalEventsResponse | null
  >(null);

  const [
    selectedEventId,
    setSelectedEventId,
  ] = useState<string | null>(null);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<EventFilter>("ALL");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadEvents = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const currentDate =
          new Date()
            .toISOString()
            .slice(0, 10);

        const searchParams =
          new URLSearchParams({
            index_code: "NIFTY_50",
            start_date: "2000-01-01",
            end_date: currentDate,
          });

        const response = await fetch(
          `/api/astro/historical-market-events?${searchParams.toString()}`,
          {
            cache: "no-store",
          }
        );

        const payload =
          (await response.json()) as
            HistoricalEventsResponse;

        if (
          !response.ok ||
          payload.status !== "success"
        ) {
          throw new Error(
            payload.detail ??
              "Unable to load historical market events."
          );
        }

        setData(payload);

        setSelectedEventId(
          (currentSelection) =>
            currentSelection ??
            payload.events[0]?.event_id ??
            null
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load historical market events."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents =
    useMemo(() => {
      if (!data) {
        return [];
      }

      if (activeFilter === "ALL") {
        return data.events;
      }

      return data.events.filter(
        (event) =>
          event.event_type ===
          activeFilter
      );
    }, [activeFilter, data]);

  useEffect(() => {
    if (
      filteredEvents.length === 0
    ) {
      return;
    }

    const selectionIsVisible =
      filteredEvents.some(
        (event) =>
          event.event_id ===
          selectedEventId
      );

    if (!selectionIsVisible) {
      setSelectedEventId(
        filteredEvents[0].event_id
      );
    }
  }, [
    filteredEvents,
    selectedEventId,
  ]);

  const selectedEvent =
    useMemo(() => {
      if (!data) {
        return null;
      }

      return (
        data.events.find(
          (event) =>
            event.event_id ===
            selectedEventId
        ) ?? null
      );
    }, [data, selectedEventId]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
          Historical market evidence
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white">
          Loading Market Events
        </h2>

        <p className="mt-3 text-sm text-slate-400">
          Analysing documented Nifty 50
          drawdowns…
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
          Historical market evidence
        </p>

        <h2 className="mt-3 text-2xl font-bold text-white">
          Data Temporarily Unavailable
        </h2>

        <p className="mt-3 text-sm text-slate-300">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            void loadEvents();
          }}
          className="mt-5 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/50">
      <div className="border-b border-slate-800 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
          Historical market evidence
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Nifty 50 Correction &
              Crash History
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Explore objectively detected
              market declines before
              examining the planetary
              configuration present at each
              peak, trough and recovery.
              These records describe history;
              they do not predict future
              market movements.
            </p>
          </div>

          <div className="text-sm text-slate-400">
            <span className="font-semibold text-white">
              {formatNumber(
                data.trading_days,
                0
              )}
            </span>{" "}
            trading sessions analysed
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Events"
            value={data.total_events}
            colour="text-white"
          />

          <SummaryCard
            label="Market Crashes"
            value={
              data.event_counts
                .MARKET_CRASH
            }
            colour="text-red-300"
          />

          <SummaryCard
            label="Major Corrections"
            value={
              data.event_counts
                .MAJOR_CORRECTION
            }
            colour="text-amber-300"
          />

          <SummaryCard
            label="Small Corrections"
            value={
              data.event_counts
                .SMALL_CORRECTION
            }
            colour="text-sky-300"
          />
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive =
              activeFilter ===
              filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setActiveFilter(
                    filter.value
                  )
                }
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {filteredEvents.map(
              (event) => {
                const colours =
                  getEventColours(
                    event.event_type
                  );

                const isSelected =
                  event.event_id ===
                  selectedEventId;

                return (
                  <button
                    key={event.event_id}
                    type="button"
                    onClick={() =>
                      setSelectedEventId(
                        event.event_id
                      )
                    }
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      isSelected
                        ? `${colours.border} bg-slate-900`
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-600",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={[
                            "text-lg font-bold",
                            colours.accent,
                          ].join(" ")}
                        >
                          {formatPercent(
                            -event
                              .decline_magnitude_percent
                          )}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-white">
                          {
                            event.event_label
                          }
                        </p>
                      </div>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                          event.status ===
                          "ONGOING"
                            ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                        ].join(" ")}
                      >
                        {event.status}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Peak{" "}
                      {formatDate(
                        event.peak.date
                      )}
                      {" → "}
                      Trough{" "}
                      {formatDate(
                        event.trough.date
                      )}
                    </p>
                  </button>
                );
              }
            )}
          </div>

          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-2xl font-bold",
          colour,
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function EventDetails({
  event,
}: {
  event: MarketEvent;
}) {
  const colours =
    getEventColours(
      event.event_type
    );

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                colours.badge,
              ].join(" ")}
            >
              {event.event_label}
            </span>

            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
              {event.status}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-bold text-white">
            {formatDate(
              event.peak.date
            )}
            {" to "}
            {formatDate(
              event.trough.date
            )}
          </h3>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Maximum decline
          </p>

          <p
            className={[
              "mt-1 text-3xl font-bold",
              colours.accent,
            ].join(" ")}
          >
            {formatPercent(
              -event
                .decline_magnitude_percent
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StageCard
          stage="Peak"
          point={event.peak}
          description="The closing high from which the measured decline began."
        />

        <StageCard
          stage="Trough"
          point={event.trough}
          description="The lowest close reached during this detected event."
        />

        <StageCard
          stage="Recovery"
          point={event.recovery}
          description={
            event.recovery
              ? "The market regained its previous peak closing level."
              : "The previous peak has not yet been regained in the available data."
          }
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric
          label="Peak to Trough"
          value={`${event.peak_to_trough_sessions} sessions`}
        />

        <Metric
          label="Recovery Period"
          value={
            event.recovery_sessions !==
            null
              ? `${event.recovery_sessions} sessions`
              : "Not recovered"
          }
        />

        <Metric
          label="Total Event Period"
          value={`${event.total_event_sessions} sessions`}
        />
      </div>

      <div className="mt-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Market behaviour
          </p>

          <h4 className="mt-2 text-lg font-bold text-white">
            Returns From the Trough
          </h4>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            These figures show what
            happened after the detected
            low. They are historical
            measurements, not expected
            future returns.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {RETURN_PERIODS.map(
            (period) => {
              const value =
                event
                  .forward_returns_from_trough[
                  period.key
                ];

              const valueColour =
                value === null ||
                value === undefined
                  ? "text-slate-500"
                  : value >= 0
                    ? "text-emerald-300"
                    : "text-red-300";

              return (
                <div
                  key={period.key}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                >
                  <p className="text-xs text-slate-500">
                    {period.label}
                  </p>

                  <p
                    className={[
                      "mt-2 font-bold",
                      valueColour,
                    ].join(" ")}
                  >
                    {formatPercent(
                      value,
                      true
                    )}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>

      <HistoricalEventAlignmentPanel
  peakDate={event.peak.date}
  troughDate={event.trough.date}
  recoveryDate={
    event.recovery?.date ?? null
  }
/>
    </article>
  );
}

function StageCard({
  stage,
  point,
  description,
}: {
  stage: string;
  point: MarketPoint | null;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {stage}
      </p>

      <p className="mt-2 font-bold text-white">
        {point
          ? formatDate(point.date)
          : "Not available"}
      </p>

      <p className="mt-1 text-sm font-semibold text-sky-300">
        {point
          ? formatNumber(
              point.close,
              2
            )
          : "—"}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}