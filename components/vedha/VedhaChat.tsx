"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ENTRY_TIMEFRAMES, vedhaCompanyHref } from "@/lib/vedha/entry";
import { parseContext, type Context } from "@/lib/vedha/contracts";
import type { Conversation, Turn, Answer } from "@/lib/vedha/chat/contracts";
import s from "./VedhaChat.module.css";
import AnswerFeedback from "./AnswerFeedback";
import type { Clarification } from "@/lib/vedha/learning/questions";
function candleLabel(value: string, timeframe: string): string {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return "Candle date unavailable";
  const date = new Date(ms).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    ...(["D", "W", "M"].includes(timeframe)
      ? {}
      : { timeStyle: "short" as const }),
  });
  const label =
    timeframe === "D"
      ? "Daily candle"
      : timeframe === "W"
        ? "Week starting"
        : timeframe === "M"
          ? "Month starting"
          : "Completed candle start";
  return `${label}: ${date}${["D", "W", "M"].includes(timeframe) ? "" : " IST"}`;
}
export default function VedhaChat() {
  const { isLoaded, user } = useUser();
  return (
    <main className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>STFL RESEARCH</p>
          <h1>Ask Vedha</h1>
          <p>A conversation about the evidence behind your stock.</p>
        </div>
        <span className={s.badge}>Premium research</span>
      </header>
      {!isLoaded ? (
        <p>Checking your account…</p>
      ) : !user ? (
        <section className={s.welcome}>
          <h2>Your questions. Research you can inspect.</h2>
          <p>
            Sign in to access stock conversations with your Premium membership.
            Chart analysis remains available through company research.
          </p>
          <SignInButton
            mode="modal"
            forceRedirectUrl="/ai-research-assistant"
            signUpForceRedirectUrl="/ai-research-assistant"
          >
            <button className={s.primary}>Sign in to Ask Vedha</button>
          </SignInButton>
          <Link href="/company-research">Browse company research</Link>
        </section>
      ) : (
        <Workspace key={user.id} />
      )}
    </main>
  );
}
function Workspace() {
  const [conversations, setConversations] = useState<Conversation[]>([]),
    [conversationId, setConversationId] = useState(""),
    [context, setContext] = useState<Context | null>(null),
    [turns, setTurns] = useState<Turn[]>([]);
  const [symbol, setSymbol] = useState(""),
    [exchange, setExchange] = useState("NSE"),
    [timeframe, setTimeframe] = useState("D"),
    [question, setQuestion] = useState("");
  const [error, setError] = useState(""),
    [gate, setGate] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [role, setRole] = useState("PREMIUM");
  const [matches, setMatches] = useState<
    {
      symbol: string;
      companyName: string;
      exchange: string;
      instrumentKey: string;
    }[]
  >([]);
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const latestTurn = useRef<HTMLElement | null>(null);
  useEffect(() => {
    setSubmittedQuestion("");
  }, [conversationId]);
  const [clarification, setClarification] = useState<Clarification | null>(
    null,
  );
  useEffect(() => {
    setClarification(null);
  }, [question, conversationId]);
  const [activeMatch, setActiveMatch] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const selectedSymbol = useRef("");
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function selectMatch(m: (typeof matches)[number]) {
    selectedSymbol.current = m.symbol;
    setSymbol(m.symbol);
    setExchange(m.exchange);
    setSearchOpen(false);
    setActiveMatch(-1);
    setMatches([]);
  }
  useEffect(() => {
    if (activeMatch >= 0)
      optionRefs.current[activeMatch]?.scrollIntoView({ block: "nearest" });
  }, [activeMatch]);
  const alive = useRef(true),
    pending = useRef<{ id: string; question: string } | null>(null),
    readAbort = useRef<AbortController | null>(null),
    sendAbort = useRef<AbortController | null>(null),
    bottom = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    alive.current = true;
    void history();
    return () => {
      alive.current = false;
      readAbort.current?.abort();
      sendAbort.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!sending)
      latestTurn.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [turns, sending]);
  useEffect(() => {
    if (symbol.trim().length < 2 || symbol === selectedSymbol.current) {
      setMatches([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/upstox/instruments/search?q=${encodeURIComponent(symbol.trim())}`,
          { signal: controller.signal },
        );
        if (!r.ok) return;
        const d = await r.json();
        if (!controller.signal.aborted)
          setMatches(
            (d.results ?? []).filter(
              (m: { exchange: string }) => m.exchange === exchange,
            ),
          );
      } catch {}
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [symbol, exchange]);
  async function history(id?: string) {
    readAbort.current?.abort();
    const controller = new AbortController();
    readAbort.current = controller;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
        `/api/vedha/chat${id ? `?id=${encodeURIComponent(id)}` : ""}`,
        { cache: "no-store", signal: controller.signal },
      );
      const b = await r.json();
      if (!r.ok) {
        if (alive.current && !controller.signal.aborted) setGate(b.code ?? "");
        throw new Error(b.detail ?? "Unable to open conversations.");
      }
      if (!alive.current || controller.signal.aborted) return;
      setGate("");
      setRole(b.role);
      setConversations(b.conversations ?? []);
      if (id) {
        setConversationId(id);
        setContext(b.conversation.context);
        setTurns(b.turns ?? []);
        setQuestion("");
        pending.current = null;
      }
    } catch (e) {
      if (alive.current && !controller.signal.aborted)
        setError((e as Error).message);
    } finally {
      if (alive.current && !controller.signal.aborted) setLoading(false);
    }
  }
  function begin(e: FormEvent) {
    e.preventDefault();
    try {
      const c = parseContext({ symbol: symbol.trim(), exchange, timeframe });
      setContext(c);
      setConversationId(crypto.randomUUID());
      setTurns([]);
      setQuestion("");
      setError("");
      pending.current = null;
    } catch {
      setError("Select a valid stock, exchange and timeframe.");
    }
  }
  async function send(
    e: { preventDefault(): void },
    clarificationChoice?: string,
  ) {
    e.preventDefault();
    if (!context || !question.trim() || sending) return;
    const q = question.trim();
    setSubmittedQuestion(q);
    const request =
      pending.current?.question === q
        ? pending.current
        : { id: crypto.randomUUID(), question: q };
    pending.current = request;
    setSending(true);
    setError("");
    const controller = new AbortController();
    sendAbort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 175000);
    try {
      const r = await fetch("/api/vedha/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          requestId: request.id,
          context,
          question: q,
          clarificationChoice,
        }),
        signal: controller.signal,
      });
      const b = await r.json();
      if (!r.ok) {
        if (["retry_limit", "conflict", "turn_limit"].includes(b.code))
          pending.current = null;
        throw new Error(b.detail ?? "Unable to complete the answer.");
      }
      if (!alive.current) return;
      if (b.status === "clarification") {
        setClarification(b.clarification);
        pending.current = null;
        return;
      }
      setClarification(null);
      const answer = b.answer as Answer;
      setTurns((current) =>
        current.some((t) => t.id === request.id)
          ? current
          : [
              ...current,
              {
                id: request.id,
                question: q,
                answer,
                created_at: answer.generatedAt,
              },
            ],
      );
      setQuestion("");
      pending.current = null;
      // Updating the navigation does not discard a successfully returned answer if list refresh fails.
      try {
        const list = await fetch("/api/vedha/chat", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (list.ok) {
          const data = await list.json();
          if (alive.current) setConversations(data.conversations ?? []);
        }
      } catch {}
    } catch (e) {
      if (alive.current)
        setError(
          (e as Error).name === "AbortError"
            ? "The answer is taking longer than expected. Retry the same question to check its saved status."
            : (e as Error).message,
        );
    } finally {
      clearTimeout(timeout);
      if (alive.current) setSending(false);
    }
  }
  function searchAnotherStock() {
    if (sending || loading) return;
    setContext(null);
    setConversationId("");
    setTurns([]);
    setQuestion("");
    setSubmittedQuestion("");
    setClarification(null);
    setSymbol("");
    setMatches([]);
    setActiveMatch(-1);
    setSearchOpen(true);
    selectedSymbol.current = "";
    pending.current = null;
    setError("");
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this conversation and its saved questions?"))
      return;
    setError("");
    try {
      const r = await fetch("/api/vedha/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", conversationId: id }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.detail ?? "Unable to delete conversation.");
      if (!alive.current) return;
      if (id === conversationId) {
        setContext(null);
        setConversationId("");
        setTurns([]);
      }
      await history();
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    }
  }
  const restricted = Boolean(gate);
  return (
    <>
      <p className={s.coverage}>
        Current coverage: completed-candle technical research and indicator
        education. Fundamentals, news, portfolio conversations and model-tested
        trade calls are not connected in this release.
      </p>
      {error && (
        <div className={s.error} role="alert">
          {error}
          {gate === "premium_required" ? (
            <Link href="/premium-research">Explore Premium</Link>
          ) : (
            <button
              disabled={sending || loading}
              onClick={() => void history(context ? conversationId : undefined)}
            >
              Reload conversations
            </button>
          )}
        </div>
      )}
      <div className={s.workspace}>
        <aside className={s.sidebar}>
          <h2>
            {role === "ADMIN" ? "Admin research access" : "Your conversations"}
          </h2>
          <button disabled={sending || loading} onClick={searchAnotherStock}>
            ＋ Search another stock
          </button>
          {loading && <p>Loading…</p>}
          <nav aria-label="Saved conversations">
            {conversations.map((c) => (
              <div className={s.saved} key={c.id}>
                <button
                  disabled={sending || loading}
                  aria-current={c.id === conversationId ? "page" : undefined}
                  onClick={() => void history(c.id)}
                >
                  <strong>
                    {c.context.exchange}:{c.context.symbol} ·{" "}
                    {c.context.timeframe}
                  </strong>
                  <span>{c.title}</span>
                </button>
                <button
                  title="Delete conversation"
                  aria-label={`Delete conversation about ${c.context.symbol}`}
                  disabled={sending || loading}
                  onClick={() => void remove(c.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </nav>
          {role === "ADMIN" && (
            <Link href="/vedha-admin">Open quality review workspace →</Link>
          )}
          <small>
            Saved privately to your account. Chat usage is separate from chart
            reports. Deleting a conversation does not restore its chat
            allowance.
          </small>
        </aside>
        <section className={s.main}>
          {!context ? (
            <div className={s.start}>
              <p className={s.eyebrow}>BEGIN WITH A STOCK</p>
              <h2>What would you like to understand?</h2>
              <p>
                Choose a company and a chart timeframe. Then ask a question or
                use a suggested prompt.
              </p>
              <form onSubmit={begin}>
                <fieldset disabled={sending || loading || restricted}>
                  <label>
                    Exchange
                    <select
                      value={exchange}
                      onChange={(e) => {
                        setExchange(e.target.value);
                        selectedSymbol.current = "";
                        setActiveMatch(-1);
                      }}
                    >
                      <option>NSE</option>
                      <option>BSE</option>
                    </select>
                  </label>
                  <label>
                    Stock symbol
                    <input
                      value={symbol}
                      onChange={(e) => {
                        selectedSymbol.current = "";
                        setSymbol(e.target.value.toUpperCase());
                        setMatches([]);
                        setActiveMatch(-1);
                        setSearchOpen(true);
                      }}
                      autoFocus
                      role="combobox"
                      aria-label="Stock symbol"
                      aria-autocomplete="list"
                      aria-expanded={searchOpen && matches.length > 0}
                      aria-controls="vedha-stock-options"
                      aria-activedescendant={
                        searchOpen && activeMatch >= 0 && matches[activeMatch]
                          ? `vedha-stock-option-${activeMatch}`
                          : undefined
                      }
                      onFocus={() => setSearchOpen(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.closest("[data-stock-options]"))
                          setSearchOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                          setActiveMatch(-1);
                          return;
                        }
                        if (!matches.length) return;
                        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                          e.preventDefault();
                          setSearchOpen(true);
                          setActiveMatch((i) =>
                            e.key === "ArrowDown"
                              ? (i + 1) % matches.length
                              : i <= 0
                                ? matches.length - 1
                                : i - 1,
                          );
                        } else if (
                          e.key === "Enter" &&
                          searchOpen &&
                          activeMatch >= 0
                        ) {
                          e.preventDefault();
                          selectMatch(matches[activeMatch]);
                        }
                      }}
                      required
                      maxLength={32}
                      placeholder="e.g. RELIANCE"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Timeframe
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                    >
                      {ENTRY_TIMEFRAMES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className={s.primary}>Start conversation</button>
                </fieldset>
              </form>
              {searchOpen && matches.length > 0 && (
                <ul
                  className={s.matches}
                  id="vedha-stock-options"
                  role="listbox"
                  aria-label="Company matches"
                  data-stock-options
                >
                  {matches.map((m, index) => (
                    <li key={m.instrumentKey} role="presentation">
                      <button
                        disabled={restricted}
                        id={`vedha-stock-option-${index}`}
                        role="option"
                        aria-selected={activeMatch === index}
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        className={
                          activeMatch === index ? s.activeOption : undefined
                        }
                        onMouseEnter={() => setActiveMatch(index)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectMatch(m)}
                      >
                        {m.companyName} · {m.exchange}:{m.symbol}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/company-research">
                Open company research and chart analysis →
              </Link>
            </div>
          ) : (
            <>
              <div className={s.context}>
                <div>
                  <h2>
                    {context.exchange}:{context.symbol}
                  </h2>
                  <small>
                    {context.timeframe} timeframe ·{" "}
                    {role === "ADMIN" ? "Admin" : "Premium"} conversation
                  </small>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={s.primary}
                    disabled={sending || loading}
                    onClick={searchAnotherStock}
                  >
                    ⌕ Search another stock
                  </button>
                  <Link
                    href={vedhaCompanyHref(
                      context.symbol,
                      context.exchange,
                      context.timeframe,
                    )}
                  >
                    Open chart analysis ↗
                  </Link>
                </div>
              </div>
              {(submittedQuestion || turns.at(-1)?.question) && (
                <section
                  className={s.currentQuestion}
                  aria-label="Latest submitted question"
                >
                  <strong>Your latest question</strong>
                  <p>{submittedQuestion || turns.at(-1)?.question}</p>
                </section>
              )}
              <div className={s.messages} aria-label="Conversation">
                {!turns.length && (
                  <div className={s.suggestions}>
                    <h3>Start with the evidence</h3>
                    {[
                      "Explain the current trend and its strongest counterpoint.",
                      "Does volume support the recent price movement?",
                      "How do momentum and trend indicators differ here?",
                      "Compare the available hourly, daily, weekly and monthly evidence.",
                    ].map((q) => (
                      <button
                        disabled={sending || restricted}
                        key={q}
                        onClick={() => {
                          setQuestion(q);
                          pending.current = null;
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {turns.map((t, index) => (
                  <article
                    className={s.turn}
                    key={t.id}
                    ref={index === turns.length - 1 ? latestTurn : undefined}
                  >
                    <div className={s.question}>
                      <small>You</small>
                      <p>{t.question}</p>
                    </div>
                    <div className={s.answer}>
                      <small>VEDHA · TECHNICAL RESEARCH</small>
                      <div className={s.answerBody}>
                        {t.answer.text
                          .split(/\n\s*\n/)
                          .filter(Boolean)
                          .map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                      </div>
                      {t.answer.summary && (
                        <section
                          className={s.summaryCard}
                          aria-label="Answer summary"
                        >
                          <h3>Summary</h3>
                          <p>{t.answer.summary}</p>
                        </section>
                      )}
                      <footer>
                        {candleLabel(t.answer.candleAsOf, context.timeframe)} ·
                        Answer generated{" "}
                        {new Date(t.answer.generatedAt).toLocaleString(
                          "en-IN",
                          { timeZone: "Asia/Kolkata" },
                        )}{" "}
                        IST
                      </footer>
                      {t.answer.evidence.length > 0 && (
                        <details>
                          <summary>
                            View supporting evidence ({t.answer.evidence.length}
                            )
                          </summary>
                          <div className={s.evidenceList}>
                            {t.answer.evidence.map((f) => (
                              <div key={f.id}>
                                <strong>{f.label}</strong>
                                <p>{f.value}</p>
                                <small>Source: {f.source}</small>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                      <AnswerFeedback turnId={t.id} />
                    </div>
                  </article>
                ))}
                {clarification && (
                  <section
                    className={s.summaryCard}
                    aria-label="Clarify your question"
                  >
                    <h3>One clarification</h3>
                    <p>{clarification.prompt}</p>
                    <div className={s.clarificationChoices}>
                      {clarification.options.map((choice) => (
                        <button
                          type="button"
                          key={choice}
                          disabled={sending}
                          onClick={(event) => void send(event, choice)}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                    <p className={s.clarificationNote}>
                      No answer allowance is used until an analysis is
                      successfully saved.
                    </p>
                  </section>
                )}
                {sending && (
                  <p role="status">
                    Checking fresh evidence and preparing an answer…
                  </p>
                )}
                <div ref={bottom} />
              </div>
              <form onSubmit={send} className={s.composer}>
                <label htmlFor="vedha-question">Ask a follow-up question</label>
                <textarea
                  id="vedha-question"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (pending.current?.question !== e.target.value.trim())
                      pending.current = null;
                  }}
                  maxLength={1500}
                  required
                  rows={3}
                  disabled={sending || loading || restricted}
                  placeholder="What does the evidence suggest, and what remains uncertain?"
                />
                <div>
                  <small>
                    {question.length}/1500 · Historical research, not a live
                    trade instruction.
                  </small>
                  <button
                    className={s.primary}
                    disabled={
                      sending || loading || restricted || !question.trim()
                    }
                  >
                    {sending ? "Preparing answer…" : "Ask Vedha →"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
