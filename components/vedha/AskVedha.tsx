"use client";
import { useEffect, useState } from "react";
import VedhaChat from "./VedhaChat";
import VedhaChartEntry from "./VedhaChartEntry";
export default function AskVedha() {
  const [mode, setMode] = useState("chat");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "chart")
      setMode("chart");
  }, []);
  function select(value: string) {
    setMode(value);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", value);
    window.history.replaceState(null, "", url);
  }
  return (
    <div>
      <nav
        aria-label="Vedha research tools"
        className="mx-auto flex max-w-6xl flex-wrap gap-3 px-5 pt-6"
      >
        <button
          type="button"
          aria-pressed={mode === "chart"}
          onClick={() => select("chart")}
          className={`rounded-lg border px-5 py-3 text-sm font-semibold ${mode === "chart" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-800"}`}
        >
          Chart Analysis
        </button>
        <button
          type="button"
          aria-pressed={mode === "chat"}
          onClick={() => select("chat")}
          className={`rounded-lg border px-5 py-3 text-sm font-semibold ${mode === "chat" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-800"}`}
        >
          Ask Vedha
        </button>
      </nav>
      {mode === "chart" ? <VedhaChartEntry /> : <VedhaChat />}
    </div>
  );
}
