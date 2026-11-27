"use client";
import { useEffect, useState } from "react";
type Item = {
  id: string;
  category: string;
  status: string;
  revision: number;
  share_for_review: boolean;
  note: string | null;
  snapshot: {
    question: string;
    context: { symbol: string; exchange: string; timeframe: string };
    answer: {
      text: string;
      summary?: string;
      evidence: { id: string; label: string; value: string }[];
      candleAsOf: string;
    };
  } | null;
  created_at: string;
};
type Guide = {
  id: string;
  scope: string;
  guidance: string;
  evaluation_notes: string;
  active: boolean;
};
export default function ReviewWorkspace() {
  const [items, setItems] = useState<Item[]>([]),
    [guides, setGuides] = useState<Guide[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Item | null>(null),
    [scope, setScope] = useState("levels"),
    [rule, setRule] = useState(""),
    [notes, setNotes] = useState(""),
    [evaluated, setEvaluated] = useState(false),
    [tab, setTab] = useState("pending");
  async function load(mode = tab) {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/vedha/admin/reviews?status=" + mode, {
        cache: "no-store",
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.detail);
      setItems(b.feedback);
      setGuides(b.guidance);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function act(body: unknown) {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/vedha/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.detail);
      setSelected(null);
      setRule("");
      setNotes("");
      setEvaluated(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const input =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3";
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            STFL · Admin only
          </p>
          <h1 className="mt-2 text-3xl font-bold">Vedha quality review</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Review evidence, write a general interpretation rule, and record
            evaluation before publishing. This changes retrieved guidance for
            future answers; it does not retrain model weights or validate
            trading performance.
          </p>
        </header>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4"
          >
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            disabled={busy}
            className="rounded-lg border bg-white px-4 py-2"
            onClick={() => void load()}
          >
            Reload
          </button>
          <select
            value={tab}
            className="rounded-lg border bg-white px-3"
            onChange={(e) => {
              setTab(e.target.value);
              setSelected(null);
              void load(e.target.value);
            }}
          >
            <option value="pending">Pending feedback</option>
            <option value="reviewed">Reviewed feedback</option>
          </select>
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3">
            {!items.length && (
              <p className="rounded-xl border bg-white p-5">
                {busy ? "Loading…" : "No feedback in this view."}
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                disabled={busy}
                onClick={() => {
                  setSelected(item);
                  setRule("");
                  setNotes("");
                  setEvaluated(false);
                }}
                className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left"
              >
                <strong>{item.category.replaceAll("_", " ")}</strong>
                <p className="mt-1 text-xs">
                  {item.snapshot?.context.symbol ??
                    "Category only · not shared"}{" "}
                  · {item.status}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </p>
              </button>
            ))}
          </aside>
          <section className="rounded-2xl border bg-white p-6">
            {!selected ? (
              <p>Select a feedback item to review.</p>
            ) : (
              <div className="space-y-5">
                <h2 className="text-xl font-bold">Review answer</h2>
                {selected.snapshot ? (
                  <>
                    <p className="font-semibold">
                      {selected.snapshot.context.exchange}:
                      {selected.snapshot.context.symbol} ·{" "}
                      {selected.snapshot.context.timeframe}
                    </p>
                    <p>
                      <strong>Question:</strong> {selected.snapshot.question}
                    </p>
                    <p className="whitespace-pre-wrap">
                      {selected.snapshot.answer.text}
                    </p>
                    {selected.snapshot.answer.summary && (
                      <p>
                        <strong>Summary:</strong>{" "}
                        {selected.snapshot.answer.summary}
                      </p>
                    )}
                    <p className="text-xs">
                      Completed candle: {selected.snapshot.answer.candleAsOf}
                    </p>
                    <details>
                      <summary>Submitted evidence</summary>
                      {selected.snapshot.answer.evidence?.map((f) => (
                        <p key={f.id} className="mt-2 text-sm">
                          <strong>{f.label}:</strong> {f.value}
                        </p>
                      ))}
                    </details>
                    <p>
                      <strong>User feedback:</strong>{" "}
                      {selected.note || "No note"}
                    </p>
                  </>
                ) : (
                  <p>
                    The user has not shared this question, answer or note. Only
                    its category is available. You may dismiss it; it cannot
                    publish guidance.
                  </p>
                )}
                {selected.status === "pending" && (
                  <>
                    <label className="block text-sm">
                      Guidance topic
                      <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className={input}
                      >
                        <option value="levels">Price levels and swings</option>
                        <option value="trend">Trend and timeframes</option>
                        <option value="volume">Volume</option>
                        <option value="general">General interpretation</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      Generalised interpretation rule
                      <textarea
                        value={rule}
                        onChange={(e) => setRule(e.target.value)}
                        minLength={30}
                        maxLength={1200}
                        rows={4}
                        className={input}
                        placeholder="Describe the interpretation rule. Exclude user details, company-specific levels, prices, dates, links and trade instructions."
                      />
                    </label>
                    <label className="block text-sm">
                      Evaluation notes
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        minLength={40}
                        maxLength={2500}
                        rows={4}
                        className={input}
                        placeholder="Record test cases across multiple stocks, expected and actual behaviour, failures and the baseline comparison. An example alone is not sufficient."
                      />
                    </label>
                    <label className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={evaluated}
                        onChange={(e) => setEvaluated(e.target.checked)}
                      />
                      I checked this rule against several stocks, contrary cases
                      and the existing baseline, and removed private
                      information.
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        disabled={
                          busy ||
                          !selected.share_for_review ||
                          !evaluated ||
                          rule.trim().length < 30 ||
                          notes.trim().length < 40
                        }
                        className="rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-40"
                        onClick={() =>
                          void act({
                            action: "approve",
                            feedbackId: selected.id,
                            revision: selected.revision,
                            scope,
                            guidance: rule,
                            evaluationNotes: notes,
                            evaluated,
                          })
                        }
                      >
                        Approve and publish guidance
                      </button>
                      <button
                        disabled={busy}
                        className="rounded-lg border px-4 py-3"
                        onClick={() =>
                          void act({
                            action: "reject",
                            feedbackId: selected.id,
                            revision: selected.revision,
                          })
                        }
                      >
                        Dismiss feedback
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Published guidance and rollback</h2>
          <p className="mt-2 text-sm text-slate-600">
            Active guidance is retrieved by topic. Retiring it stops its use in
            new requests; saved answers and in-flight requests are unchanged.
          </p>
          {guides.map((g) => (
            <article key={g.id} className="mt-5 border-t pt-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">
                {g.scope} · {g.active ? "Active" : "Retired"}
              </p>
              <p className="mt-2">{g.guidance}</p>
              <details className="mt-2 text-sm">
                <summary>Evaluation notes</summary>
                <p className="whitespace-pre-wrap">{g.evaluation_notes}</p>
              </details>
              {g.active && (
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm("Retire this guidance for future answers?")
                    )
                      void act({ action: "retire", guidanceId: g.id });
                  }}
                  className="mt-3 rounded-lg border px-3 py-2 text-sm"
                >
                  Retire guidance
                </button>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
