"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type PlanetaryPosition = {
  name: string;
  longitude_degrees: number;
  latitude_degrees: number;
  zodiac_sign: string;
  degrees_in_sign: number;
  formatted_position: string;
  daily_motion_degrees: number;
  retrograde: boolean;
  motion: "Direct" | "Retrograde";
};

type PlanetaryPositionsResponse = {
  status: string;
  calculation: {
    coordinate_system: string;
    ephemeris: string;
    ephemeris_period: {
      from_year: number;
      to_year: number;
    };
    calculated_at_utc: string;
    calculated_at_ist: string;
    timezone: string;
  };
  positions: PlanetaryPosition[];
  limitations: string[];
};

function cleanText(
  value: string
) {
  return value
    .replaceAll("Â", "")
    .replaceAll("â€”", "—");
}

export default function PlanetaryPositionsPanel() {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const [
    data,
    setData,
  ] =
    useState<PlanetaryPositionsResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadPositions =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/astro/planetary-positions",
          {
            cache: "no-store",
          }
        );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload.detail ??
              "Unable to load planetary positions."
          );
        }

        setData(payload);
      } catch (loadError) {
        console.error(
          "Planetary positions error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load planetary positions."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    if (!data) {
      void loadPositions();
    }

    const refreshTimer =
      window.setInterval(
        () => {
          void loadPositions();
        },
        30 * 60 * 1000
      );

    return () => {
      window.clearInterval(
        refreshTimer
      );
    };
  }, [
    expanded,
    data,
    loadPositions,
  ]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() =>
          setExpanded(
            (current) => !current
          )
        }
        className={[
          "flex w-full flex-col gap-5 px-6 py-6 text-left transition hover:bg-slate-900/30 lg:flex-row lg:items-center lg:justify-between",
          expanded
            ? "border-b border-slate-800"
            : "",
        ].join(" ")}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Additional astronomical
            information
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Current Planetary Positions
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            View today&apos;s verified
            geocentric tropical
            positions calculated from
            the NASA/JPL DE421
            ephemeris.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 sm:inline-flex">
            Tropical Zodiac
          </span>

          <span className="hidden rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 sm:inline-flex">
            JPL DE421
          </span>

          <span className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {expanded
              ? "Hide positions"
              : "View positions"}

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
        </div>
      </button>

      {expanded && (
        <>
          {loading && !data && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400">
                Calculating current
                planetary positions…
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="px-6 py-8">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
                <p className="font-semibold text-rose-300">
                  Planetary data
                  unavailable
                </p>

                <p className="mt-2 text-sm text-rose-200/80">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void loadPositions();
                  }}
                  className="mt-4 rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {data && !error && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left">
                  <thead className="border-b border-slate-800 bg-slate-900/40">
                    <tr className="text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">
                        Planet
                      </th>

                      <th className="px-6 py-4">
                        Zodiac sign
                      </th>

                      <th className="px-6 py-4">
                        Position
                      </th>

                      <th className="px-6 py-4">
                        Motion
                      </th>

                      <th className="px-6 py-4 text-right">
                        Daily motion
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {data.positions.map(
                      (position) => (
                        <tr
                          key={
                            position.name
                          }
                          className="transition hover:bg-slate-900/50"
                        >
                          <td className="px-6 py-4 font-semibold text-white">
                            {
                              position.name
                            }
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-300">
                            {
                              position.zodiac_sign
                            }
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-300">
                            {cleanText(
                              position.formatted_position
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={
                                position.retrograde
                                  ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300"
                                  : "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                              }
                            >
                              {
                                position.motion
                              }
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right font-mono text-sm text-slate-300">
                            {position.daily_motion_degrees >
                            0
                              ? "+"
                              : ""}

                            {position.daily_motion_degrees.toFixed(
                              4
                            )}
                            °
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-800 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Calculated:{" "}
                  {new Date(
                    data.calculation
                      .calculated_at_ist
                  ).toLocaleString(
                    "en-IN",
                    {
                      timeZone:
                        "Asia/Kolkata",
                      dateStyle:
                        "medium",
                      timeStyle:
                        "short",
                    }
                  )}{" "}
                  IST
                </p>

                <p>
                  Astronomical data only
                  — not a market signal
                </p>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}