"use client";

export default function MarketSnapshotCard() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg">

      {/* Header */}

      <div className="border-b border-slate-700 px-4 py-2">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Market Intelligence
            </h2>

                      </div>

          <div className="text-right">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Confidence
            </p>

            <p className="text-lg font-bold text-green-400">
              88%
            </p>

          </div>

        </div>

      </div>

      {/* Body */}

      <div className="grid grid-cols-6 gap-4 p-4">

        <Metric
          title="Trend"
          value="Bullish"
          color="text-green-400"
        />

        <Metric
          title="Support"
          value="₹1,250"
        />

        <Metric
          title="Resistance"
          value="₹1,413"
        />

        <Metric
          title="Risk : Reward"
          value="1 : 2.8"
        />

        <Metric
          title="Entry"
          value="Good"
          color="text-green-400"
        />

        <Metric
  title="Momentum"
  value="Strong"
  color="text-green-400"
/>

      </div>

    </div>
  );
}

function Metric({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <div>

      <p className="text-xs uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className={`mt-2 text-lg font-semibold ${color}`}>
        {value}
      </p>

    </div>
  );
}