"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type EventStage =
  | "PEAK"
  | "TROUGH"
  | "RECOVERY";

type OrbQuality =
  | "EXACT"
  | "CLOSE"
  | "WIDE";

type PlanetaryPosition = {
  name: string;
  zodiac_sign: string;
  formatted_position: string;
  longitude_degrees: number;
  motion: "Direct" | "Retrograde";
  daily_motion_degrees: number;
};

type MajorAspect = {
  first_body: string;
  second_body: string;
  aspect: string;
  target_angle: number;
  actual_separation: number;
  orb_degrees: number;
  orb_quality: OrbQuality;
};

type AlignmentSnapshot = {
  event_stage: EventStage;
  event_date: string;
  calculated_at_market_close: string;
  coordinate_system: string;
  ephemeris: string;
  retrograde_bodies: string[];
  positions: PlanetaryPosition[];
  major_aspects: MajorAspect[];
};

type AlignmentResponse = {
  status: string;
  event_dates: {
    peak_date: string;
    trough_date: string;
    recovery_date: string | null;
  };
  snapshots: AlignmentSnapshot[];
  methodology: {
    calculation_time: string;
    coordinate_system: string;
  };
  limitations: string[];
  detail?: string;
};

type Props = {
  peakDate: string;
  troughDate: string;
  recoveryDate?: string | null;
};

const PLANET_MEANINGS: Record<
  string,
  string
> = {
  Sun: "visibility and leadership",
  Moon: "public mood and short-term sentiment",
  Mercury:
    "communication and information flow",
  Venus:
    "value perception and confidence",
  Mars:
    "urgency, force and momentum",
  Jupiter:
    "expansion, liquidity and optimism",
  Saturn:
    "restriction, discipline and pressure",
  Uranus:
    "disruption and unexpected change",
  Neptune:
    "uncertainty and changing narratives",
  Pluto:
    "structural transformation",
};

const ASPECT_MEANINGS: Record<
  string,
  string
> = {
  Conjunction:
    "a concentration of the two planetary themes",
  Opposition:
    "tension between two competing themes",
  Square:
    "friction or pressure between the themes",
  Trine:
    "an easier interaction between the themes",
  Sextile:
    "a potentially cooperative interaction",
};

const STAGE_TEXT: Record<
  EventStage,
  string
> = {
  PEAK:
    "Configuration recorded at the market peak before the decline.",
  TROUGH:
    "Configuration recorded at the lowest closing point of the decline.",
  RECOVERY:
    "Configuration recorded when the market regained its previous peak.",
};

const STRUCTURAL_BODIES = new Set([
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
]);

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${value}T00:00:00`)
  );
}

function cleanPosition(
  value: string
) {
  return value.replaceAll("Â", "");
}

function aspectPriority(
  aspect: MajorAspect
) {
  const structuralCount = [
    aspect.first_body,
    aspect.second_body,
  ].filter((body) =>
    STRUCTURAL_BODIES.has(body)
  ).length;

  const qualityScore =
    aspect.orb_quality === "EXACT"
      ? 0
      : aspect.orb_quality === "CLOSE"
        ? 10
        : 20;

  return (
    qualityScore -
    structuralCount * 3 +
    aspect.orb_degrees
  );
}

function importantAspects(
  snapshot: AlignmentSnapshot
) {
  return snapshot.major_aspects
    .filter(
      (aspect) =>
        aspect.orb_quality ===
          "EXACT" ||
        aspect.orb_quality ===
          "CLOSE"
    )
    .sort(
      (first, second) =>
        aspectPriority(first) -
        aspectPriority(second)
    );
}

function shortObservation(
  snapshot: AlignmentSnapshot
) {
  const aspects =
    importantAspects(snapshot);

  if (aspects.length === 0) {
    return "No exact or close major aspects were detected.";
  }

  return aspects
    .slice(0, 3)
    .map(
      (aspect) =>
        `${aspect.first_body}–${aspect.second_body} ${aspect.aspect.toLowerCase()} (${aspect.orb_quality.toLowerCase()}, ${aspect.orb_degrees.toFixed(2)}° orb)`
    )
    .join("; ");
}

function qualityClasses(
  quality: OrbQuality
) {
  if (quality === "EXACT") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (quality === "CLOSE") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-600 bg-slate-800/60 text-slate-400";
}

export default function HistoricalEventAlignmentPanel({
  peakDate,
  troughDate,
  recoveryDate,
}: Props) {
  const [
    data,
    setData,
  ] = useState<AlignmentResponse | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    selectedStage,
    setSelectedStage,
  ] = useState<EventStage>("TROUGH");

  const [
    showWideAspects,
    setShowWideAspects,
  ] = useState(false);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadAlignment() {
      setLoading(true);
      setError(null);

      try {
        const parameters =
          new URLSearchParams({
            peak_date: peakDate,
            trough_date: troughDate,
          });

        if (recoveryDate) {
          parameters.set(
            "recovery_date",
            recoveryDate
          );
        }

        const response = await fetch(
          `/api/astro/historical-event-alignment?${parameters.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const payload =
          (await response.json()) as
            AlignmentResponse;

        if (
          !response.ok ||
          payload.status !== "success"
        ) {
          throw new Error(
            payload.detail ??
              "Unable to load planetary alignment."
          );
        }

        setData(payload);
        setSelectedStage("TROUGH");
      } catch (caughtError) {
        if (
          caughtError instanceof
            DOMException &&
          caughtError.name ===
            "AbortError"
        ) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load planetary alignment."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    void loadAlignment();

    return () => {
      controller.abort();
    };
  }, [
    peakDate,
    troughDate,
    recoveryDate,
  ]);

  const selectedSnapshot =
    useMemo(
      () =>
        data?.snapshots.find(
          (snapshot) =>
            snapshot.event_stage ===
            selectedStage
        ) ?? null,
      [data, selectedStage]
    );

  const selectedImportantAspects =
    useMemo(
      () =>
        selectedSnapshot
          ? importantAspects(
              selectedSnapshot
            )
          : [],
      [selectedSnapshot]
    );

  const displayedAspects =
    useMemo(() => {
      if (!selectedSnapshot) {
        return [];
      }

      return showWideAspects
        ? selectedSnapshot.major_aspects
        : selectedImportantAspects;
    }, [
      selectedSnapshot,
      selectedImportantAspects,
      showWideAspects,
    ]);

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 text-sm text-violet-200">
        Preparing the planetary
        observation summary…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <p className="font-semibold text-red-300">
          Planetary comparison
          unavailable
        </p>

        <p className="mt-2 text-sm text-slate-400">
          {error}
        </p>
      </div>
    );
  }

  if (!selectedSnapshot) {
    return null;
  }

  const retrogradeText =
    selectedSnapshot.retrograde_bodies
      .length > 0
      ? selectedSnapshot
          .retrograde_bodies
          .join(", ")
      : "None";

  return (
    <div className="mt-8 border-t border-slate-800 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
        Planetary observation
      </p>

      <h4 className="mt-2 text-xl font-bold text-white">
        What Was Observed?
      </h4>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
        The summary highlights the most
        important astronomical
        configuration. Detailed
        positions and calculations are
        available below for verification.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {data.snapshots.map(
          (snapshot) => (
            <button
              key={
                snapshot.event_stage
              }
              type="button"
              onClick={() =>
                setSelectedStage(
                  snapshot.event_stage
                )
              }
              className={[
                "rounded-xl border px-4 py-3 text-left transition",
                snapshot.event_stage ===
                selectedStage
                  ? "border-violet-400/50 bg-violet-500/10 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white",
              ].join(" ")}
            >
              <span className="block text-xs font-semibold uppercase tracking-wider">
                {
                  snapshot.event_stage
                }
              </span>

              <span className="mt-1 block text-xs">
                {formatDate(
                  snapshot.event_date
                )}
              </span>
            </button>
          )
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
              {
                selectedSnapshot.event_stage
              }{" "}
              summary
            </p>

            <h5 className="mt-2 text-lg font-bold text-white">
              {formatDate(
                selectedSnapshot.event_date
              )}
            </h5>
          </div>

          <span className="self-start rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {
              selectedImportantAspects.length
            }{" "}
            important aspects
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          {
            STAGE_TEXT[
              selectedSnapshot
                .event_stage
            ]
          }
        </p>

        <p className="mt-3 text-sm leading-7 text-white">
          <strong>
            Main observation:
          </strong>{" "}
          {shortObservation(
            selectedSnapshot
          )}
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          <strong className="text-slate-300">
            Retrograde bodies:
          </strong>{" "}
          {retrogradeText}
        </p>
      </div>

      {selectedImportantAspects.length >
        0 && (
        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Plain-language explanation
          </p>

          <div className="mt-3 space-y-4">
            {selectedImportantAspects
              .slice(0, 3)
              .map((aspect) => (
                <PlainExplanation
                  key={`${aspect.first_body}-${aspect.second_body}-${aspect.aspect}`}
                  aspect={aspect}
                />
              ))}
          </div>

          <p className="mt-4 border-t border-cyan-500/20 pt-4 text-xs leading-5 text-cyan-100/70">
            These are traditional
            astrological meanings shown
            for research context. They
            do not explain or predict
            the market movement.
          </p>
        </div>
      )}

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Stage comparison
        </p>

        <h5 className="mt-2 text-lg font-bold text-white">
          What Changed During the
          Event?
        </h5>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          {data.snapshots.map(
            (snapshot) => (
              <button
                key={
                  snapshot.event_stage
                }
                type="button"
                onClick={() =>
                  setSelectedStage(
                    snapshot.event_stage
                  )
                }
                className="grid w-full gap-2 border-b border-slate-800 px-4 py-4 text-left last:border-b-0 hover:bg-slate-900/50 sm:grid-cols-[110px_140px_minmax(0,1fr)]"
              >
                <span className="font-semibold text-white">
                  {
                    snapshot.event_stage
                  }
                </span>

                <span className="text-sm text-slate-400">
                  {formatDate(
                    snapshot.event_date
                  )}
                </span>

                <span className="text-sm leading-6 text-slate-300">
                  {shortObservation(
                    snapshot
                  )}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Evidence status
          </p>

          <p className="mt-2 font-bold text-white">
            Not yet graded
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            The configuration must be
            compared with all similar
            historical occurrences
            before an evidence grade can
            be assigned.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Interpretation boundary
          </p>

          <p className="mt-2 font-bold text-white">
            Observation only
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            The market event is factual.
            The planetary positions are
            factual calculations. A
            causal relationship has not
            been established.
          </p>
        </div>
      </div>

      <details className="group mt-7 rounded-2xl border border-slate-800 bg-slate-950/40">
        <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-white">
          <div className="flex items-center justify-between gap-4">
            <span>
              View planetary
              calculations
            </span>

            <span className="text-sm text-slate-500 transition group-open:rotate-180">
              ▼
            </span>
          </div>
        </summary>

        <div className="border-t border-slate-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <h5 className="font-bold text-white">
              Major Aspects
            </h5>

            <button
              type="button"
              onClick={() =>
                setShowWideAspects(
                  (current) =>
                    !current
                )
              }
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              {showWideAspects
                ? "Hide wide aspects"
                : "Show wide aspects"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {displayedAspects.map(
              (aspect, index) => (
                <AspectDetail
                  key={`${aspect.first_body}-${aspect.second_body}-${index}`}
                  aspect={aspect}
                />
              )
            )}
          </div>

          <h5 className="mt-8 font-bold text-white">
            Planetary Positions
          </h5>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedSnapshot.positions.map(
              (position) => (
                <PositionDetail
                  key={position.name}
                  position={position}
                />
              )
            )}
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-600">
            Calculated using{" "}
            {
              selectedSnapshot.ephemeris
            }
            .{" "}
            {
              selectedSnapshot
                .coordinate_system
            }
            .
          </p>
        </div>
      </details>
    </div>
  );
}

function PlainExplanation({
  aspect,
}: {
  aspect: MajorAspect;
}) {
  return (
    <div>
      <p className="font-semibold text-white">
        {aspect.first_body}
        {" – "}
        {aspect.second_body}
        {" "}
        {aspect.aspect}
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        {aspect.first_body} traditionally
        represents{" "}
        {PLANET_MEANINGS[
          aspect.first_body
        ] ?? "an astrological theme"}
        , while {aspect.second_body} is
        associated with{" "}
        {PLANET_MEANINGS[
          aspect.second_body
        ] ?? "another theme"}
        . A {aspect.aspect.toLowerCase()}{" "}
        is traditionally interpreted as{" "}
        {ASPECT_MEANINGS[
          aspect.aspect
        ] ??
          "an angular relationship"}
        .
      </p>
    </div>
  );
}

function AspectDetail({
  aspect,
}: {
  aspect: MajorAspect;
}) {
  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-white">
          {aspect.first_body}
          {" – "}
          {aspect.second_body}
          {" "}
          <span className="text-violet-300">
            {aspect.aspect}
          </span>
        </p>

        <span
          className={[
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            qualityClasses(
              aspect.orb_quality
            ),
          ].join(" ")}
        >
          {aspect.orb_quality}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>
          Separation:{" "}
          {aspect.actual_separation.toFixed(
            2
          )}
          °
        </span>

        <span>
          Target:{" "}
          {aspect.target_angle.toFixed(
            0
          )}
          °
        </span>

        <span>
          Orb:{" "}
          {aspect.orb_degrees.toFixed(
            2
          )}
          °
        </span>
      </div>
    </div>
  );
}

function PositionDetail({
  position,
}: {
  position: PlanetaryPosition;
}) {
  const retrograde =
    position.motion === "Retrograde";

  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">
            {position.name}
          </p>

          <p className="mt-1 text-sm text-sky-300">
            {cleanPosition(
              position.formatted_position
            )}
          </p>
        </div>

        <span
          className={[
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
            retrograde
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
          ].join(" ")}
        >
          {position.motion}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Traditionally associated with{" "}
        {PLANET_MEANINGS[
          position.name
        ] ?? "an astrological theme"}
        .
      </p>
    </div>
  );
}