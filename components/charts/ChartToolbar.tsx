"use client";

type ChartToolbarProps = {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
};

const timeframes = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1H",
  "4H",
  "D",
  "W",
  "M",
];

export default function ChartToolbar({
  timeframe,
  onTimeframeChange,
}: ChartToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">

      <div className="flex flex-wrap gap-2">

        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              timeframe === tf
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tf}
          </button>
        ))}

      </div>

      <div className="flex flex-wrap gap-2">

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          📊 Indicators
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          ✏ Drawing
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          🔍 Compare
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          ⭐ Watchlist
        </button>

        <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          ⛶ Fullscreen
        </button>

      </div>

    </div>
  );
}