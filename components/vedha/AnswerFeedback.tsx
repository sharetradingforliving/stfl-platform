"use client";
import { useState } from "react";
export default function AnswerFeedback({ turnId }: { turnId: string }) {
  const [category, setCategory] = useState("helpful"),
    [note, setNote] = useState(""),
    [share, setShare] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/vedha/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnId, category, note, shareForReview: share }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.detail || "Unable to save feedback.");
      setMessage(
        "Feedback saved for review. This does not change Vedha automatically.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
      <summary className="cursor-pointer text-sm font-semibold">
        Rate or correct this answer
      </summary>
      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          Your feedback
          <select
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="helpful">Helpful</option>
            <option value="wrong_level">
              Incorrect or irrelevant price level
            </option>
            <option value="wrong_timeframe">
              Wrong timeframe or interpretation
            </option>
            <option value="outdated_data">Outdated or mismatched data</option>
            <option value="other">Other correction</option>
          </select>
        </label>
        <label className="block text-sm">
          What should be improved? (optional)
          <textarea
            className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
            maxLength={1500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the issue. Please omit account numbers and personal information."
          />
        </label>
        <label className="flex items-start gap-2 text-xs leading-5">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
          />
          Share this question, answer, supporting facts and note with STFL
          administrators for review and improvement. Approved guidance will be
          generalised; this does not train an external AI model.
        </label>
        <p className="text-xs leading-5">
          Without sharing, administrators receive only the feedback category.
          Deleting the conversation removes this feedback; already approved
          general guidance may remain.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Submit feedback"}
        </button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}
