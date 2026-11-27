"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  keyOf,
  parseCSV,
  totals,
  type Holding,
  type Snapshot,
} from "@/lib/portfolio/model";
import s from "./PortfolioDashboard.module.css";
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const time = (t: string | null) =>
  t
    ? new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "Unavailable";
type Match = {
  symbol: string;
  exchange: "NSE" | "BSE";
  companyName: string;
  instrumentKey: string;
};
type Input = ReturnType<typeof parseCSV>[number];
export default function PortfolioDashboard() {
  const { isLoaded, user } = useUser();
  return (
    <main className={s.page}>
      <header className={s.hero}>
        <div>
          <p className={s.eyebrow}>STFL INVESTMENT WORKSPACE</p>
          <h1>Portfolio</h1>
          <p>Your holdings, costs and performance in one place.</p>
        </div>
        <span className={s.privateBadge}>Private portfolio</span>
      </header>
      {!isLoaded ? (
        <p>Checking your account…</p>
      ) : !user ? (
        <section className={s.card}>
          <h2>Create your private portfolio</h2>
          <p>Sign in to add holdings and save them across devices.</p>
          <SignInButton
            mode="modal"
            forceRedirectUrl="/portfolio-intelligence"
            signUpForceRedirectUrl="/portfolio-intelligence"
          >
            <button className={s.primary}>
              Sign in to create your portfolio
            </button>
          </SignInButton>
        </section>
      ) : (
        <Workspace key={user.id} />
      )}
    </main>
  );
}
function Workspace() {
  const [data, setData] = useState<Snapshot | null>(null),
    [selected, setSelected] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reference, setReference] = useState("");
  const [tab, setTab] = useState<"holdings" | "allocation">("holdings"),
    [query, setQuery] = useState(""),
    [industry, setIndustry] = useState("All"),
    [sort, setSort] = useState("name"),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState(""),
    [matches, setMatches] = useState<Match[]>([]),
    [match, setMatch] = useState<Match | null>(null),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState("");
  const [quantity, setQuantity] = useState(""),
    [average, setAverage] = useState(""),
    [edit, setEdit] = useState(false),
    [newName, setNewName] = useState(""),
    [csv, setCsv] = useState<Input[] | null>(null),
    [csvError, setCsvError] = useState("");
  const alive = useRef(true),
    loadAbort = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      loadAbort.current?.abort();
    };
  }, []);
  async function load(id = "") {
    loadAbort.current?.abort();
    const controller = new AbortController();
    loadAbort.current = controller;
    setLoading(true);
    setError("");
    setReference("");
    try {
      const r = await fetch(
        `/api/portfolio${id ? `?id=${encodeURIComponent(id)}` : ""}`,
        { cache: "no-store", signal: controller.signal },
      );
      const d = await r.json();
      if (!r.ok) {
        if (alive.current && !controller.signal.aborted)
          setReference(typeof d.code === "string" ? d.code : "");
        throw new Error(d.error ?? "Unable to load portfolios.");
      }
      if (alive.current && !controller.signal.aborted) {
        setData(d);
        setSelected(d.portfolio?.id ?? "");
      }
    } catch (e) {
      if (alive.current && !controller.signal.aborted)
        setError((e as Error).message);
    } finally {
      if (alive.current && !controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const q = search.trim();
    setMatches([]);
    setSearchError("");
    if (q.length < 2 || match || edit) {
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `/api/upstox/instruments/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const d = await r.json();
        if (!r.ok) throw new Error("Stock search is unavailable.");
        if (!controller.signal.aborted)
          setMatches(
            (d.results ?? []).filter(
              (x: Match) =>
                x.instrumentKey && ["NSE", "BSE"].includes(x.exchange),
            ),
          );
      } catch {
        if (!controller.signal.aborted)
          setSearchError("Stock search is unavailable. Please retry.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, match, edit]);
  const p = data?.portfolio ?? null;
  const holdings = p?.holdings ?? [];
  const quotes = data?.quotes ?? {};
  const summary = totals(holdings, quotes);
  const industries = [
    ...new Set(holdings.map((h) => h.industry ?? "Unclassified")),
  ].sort();
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...(data?.portfolio?.holdings ?? [])]
      .filter(
        (h) =>
          (!needle ||
            `${h.symbol} ${h.companyName}`.toLowerCase().includes(needle)) &&
          (industry === "All" || (h.industry ?? "Unclassified") === industry),
      )
      .sort((a, b) => {
        if (sort === "weight")
          return b.quantity * b.averagePrice - a.quantity * a.averagePrice;
        if (sort === "pnl") {
          const gain = (h: Holding) => {
            const q = data?.quotes[keyOf(h)];
            return q?.price != null
              ? h.quantity * (q.price - h.averagePrice)
              : -Infinity;
          };
          return gain(b) - gain(a);
        }
        return a.companyName.localeCompare(b.companyName);
      });
  }, [data, query, industry, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const allocations = useMemo(() => {
    const groups = new Map<string, number>();
    for (const h of data?.portfolio?.holdings ?? []) {
      const name = h.industry ?? "Unclassified";
      groups.set(name, (groups.get(name) ?? 0) + h.quantity * h.averagePrice);
    }
    return [...groups].sort((a, b) => b[1] - a[1]);
  }, [data]);
  function resetForm() {
    setEdit(false);
    setMatch(null);
    setSearch("");
    setQuantity("");
    setAverage("");
    setMatches([]);
  }
  async function mutate(action: string, extra: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id: p?.id,
          revision: p?.revision,
          ...extra,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (alive.current)
          setReference(typeof d.code === "string" ? d.code : "");
        throw new Error(d.error ?? "Unable to save.");
      }
      if (!alive.current) return;
      setNotice("Changes saved.");
      resetForm();
      setCsv(null);
      setNewName("");
      await load(action === "delete" ? "" : d.id);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function startEdit(h: Holding) {
    setEdit(true);
    setMatch(h);
    setSearch(`${h.companyName} (${h.exchange}:${h.symbol})`);
    setQuantity(String(h.quantity));
    setAverage(String(h.averagePrice));
    setMatches([]);
    setNotice("Editing total holding quantity and average buying price.");
  }
  const blocked = busy || loading;
  if (!data)
    return (
      <section className={`${s.card} ${s.connection}`} aria-live="polite">
        {loading ? (
          <>
            <div className={s.loader} aria-hidden="true" />
            <h2>Opening your portfolio workspace</h2>
            <p>Loading your saved portfolios securely.</p>
          </>
        ) : (
          <>
            <span className={s.connectionIcon} aria-hidden="true">
              !
            </span>
            <p className={s.kicker}>CONNECTION INTERRUPTED</p>
            <h2>Your portfolio workspace couldn’t load</h2>
            <p>
              We couldn’t retrieve your saved portfolios. Please retry before
              creating or editing holdings.
            </p>
            <button className={s.primary} onClick={() => void load(selected)}>
              Try again
            </button>
            {reference && <small>Support reference: {reference}</small>}
          </>
        )}
      </section>
    );
  return (
    <>
      {error && (
        <p className={s.error} role="alert">
          {error}{" "}
          <button disabled={busy} onClick={() => void load(selected)}>
            Refresh
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className={s.note}>
          {notice}
        </p>
      )}
      {!p && (
        <section className={`${s.card} ${s.welcome}`}>
          <div>
            <p className={s.kicker}>START WITH WHAT YOU OWN</p>
            <h2>
              Your investments deserve
              <br />
              more than a watchlist.
            </h2>
            <p>
              Create your first portfolio below, then add holdings or import a
              CSV. Your buying costs and quantities turn stock prices into your
              own profit-and-loss view.
            </p>
          </div>
          <ol className={s.steps}>
            <li>
              <b>01</b>
              <div>
                <strong>Name your portfolio</strong>
                <span>Keep long-term and trading holdings organised.</span>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>Add your holdings</strong>
                <span>Choose a stock, quantity and buying price.</span>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>See the whole picture</strong>
                <span>Review gains and industry allocation.</span>
              </div>
            </li>
          </ol>
        </section>
      )}
      <section className={s.card}>
        {p && (
          <div className={s.toolbar}>
            <label>
              Portfolio
              <select
                value={selected}
                disabled={blocked || !data?.portfolios.length}
                onChange={(e) => {
                  setCsv(null);
                  resetForm();
                  setIndustry("All");
                  setPage(1);
                  void load(e.target.value);
                }}
              >
                {!data?.portfolios.length && (
                  <option value="">No portfolios yet</option>
                )}
                {data?.portfolios.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <button disabled={blocked} onClick={() => void load(selected)}>
              Refresh prices
            </button>
          </div>
        )}
        <details className={s.disclosure} open={!p}>
          <summary>
            {p ? "Create another portfolio" : "Create your first portfolio"}
          </summary>
          <form
            className={s.toolbar}
            onSubmit={(e) => {
              e.preventDefault();
              void mutate("create", { name: newName });
            }}
          >
            <label>
              New portfolio name
              <input
                required
                maxLength={60}
                value={newName}
                disabled={blocked}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Long-term investments"
              />
            </label>
            <button
              disabled={blocked || (data?.portfolios.length ?? 0) >= 5}
              type="submit"
            >
              Create portfolio
            </button>
            <small>Up to 5 portfolios; 200 stocks in each.</small>
          </form>
        </details>
        {p && (
          <div className={s.toolbar}>
            <button
              disabled={blocked}
              onClick={() => {
                const name = window.prompt("Portfolio name", p.name);
                if (name !== null && name !== p.name)
                  void mutate("rename", { name });
              }}
            >
              Rename
            </button>
            <button
              disabled={blocked}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete “${p.name}” and all its saved holdings?`,
                  )
                )
                  void mutate("delete");
              }}
            >
              Delete portfolio
            </button>
          </div>
        )}
      </section>
      {loading && (
        <p role="status">Loading portfolio and latest available prices…</p>
      )}
      {p && !loading && (
        <div className={s.workspace}>

          <div className={s.workspaceMain}>
            <section className={s.metrics} aria-label="Portfolio totals">
              {[
                ["Invested amount", money(summary.invested)],
                [
                  "Current value",
                  summary.complete ? money(summary.value) : "Incomplete",
                ],
                [
                  "Gain/loss since purchase",
                  summary.complete
                    ? `${money(summary.pnl)} (${pct(summary.pnlPercent)})`
                    : "Incomplete",
                ],
                [
                  "Since previous close",
                  summary.dayComplete
                    ? `${money(summary.day)} (${pct(summary.dayPercent)})`
                    : "Incomplete",
                ],
              ].map(([label, value]) => (
                <div className={s.card} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </section>
            <p className={s.note}>
              {data?.quoteWarning ??
                "Prices: Upstox, latest available snapshot."}{" "}
              Retrieved {time(data?.fetchedAt ?? null)} IST. {summary.priced}/
              {holdings.length} holdings priced. Prices may be delayed; inspect
              each quote timestamp.
            </p>
            {!summary.complete && (
              <p className={s.note}>
                Priced holdings only: value {money(summary.value)}, gain/loss{" "}
                {money(summary.pnl)}. Missing holdings are excluded from both
                value and cost in this subtotal.
              </p>
            )}
            <section className={s.card}>
              <div className={s.addHolding}>
                <div className={s.addHeading}><h2>{edit ? "Edit holding" : "Add a holding"}</h2><span>Manual entry</span></div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (match)
                      void mutate("upsert", {
                        mode: edit ? "set" : "add",
                        holding: {
                          symbol: match.symbol,
                          exchange: match.exchange,
                          quantity: Number(quantity),
                          averagePrice: Number(average),
                        },
                      });
                  }}
                >
                  <fieldset disabled={blocked} className={s.form}>
                    <label>
                      Search stocks to add
                      <input
                        value={search}
                        readOnly={edit}
                        autoComplete="off"
                        placeholder="Type a stock name or symbol"
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setMatch(null);
                        }}
                      />
                    </label>
                    <label>
                      Quantity
                      <input
                        required
                        type="number"
                        min="1"
                        max="100000000"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </label>
                    <label>
                      {edit
                        ? "Average buy price (₹)"
                        : "Buy price per share (₹)"}
                      <input
                        required
                        type="number"
                        min="0.0001"
                        max="10000000"
                        step="0.0001"
                        value={average}
                        onChange={(e) => setAverage(e.target.value)}
                      />
                    </label>
                    <button
                      className={s.primary}
                      disabled={!match}
                      type="submit"
                    >
                      {busy ? "Saving…" : edit ? "Save holding" : "Add holding"}
                    </button>
                    <button type="button" onClick={resetForm}>
                      Clear
                    </button>
                  </fieldset>
                  {searching && <p role="status">Searching…</p>}
                  {searchError && <p role="alert">{searchError}</p>}
                  {matches.length > 0 && (
                    <ul className={s.results} aria-label="Stock search results">
                      {matches.map((x) => (
                        <li key={x.instrumentKey}>
                          <button
                            type="button"
                            disabled={blocked}
                            onClick={() => {
                              setMatch(x);
                              setSearch(
                                `${x.companyName} (${x.exchange}:${x.symbol})`,
                              );
                              setMatches([]);
                            }}
                          >
                            {x.companyName} — {x.exchange}:{x.symbol}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {match && (
                    <p>
                      Selected: {match.exchange}:{match.symbol}
                    </p>
                  )}
                  <small>
                    Adding an existing stock combines quantities and
                    recalculates its weighted average price. Edit replaces the
                    total quantity and average. These are holdings snapshots,
                    not a transaction history.
                  </small>
                </form>
              </div>
            </section>
            <section className={s.card}>
              <details className={s.disclosure}>
                <summary>Import holdings from CSV</summary>
                <p>
                  CSV columns: symbol,exchange,quantity,averagePrice. Imports
                  add new holdings; existing stock/exchange duplicates are
                  rejected.
                </p>
                <a
                  download="portfolio-template.csv"
                  href="data:text/csv;charset=utf-8,symbol%2Cexchange%2Cquantity%2CaveragePrice%0ARELIANCE%2CNSE%2C10%2C1200%0A"
                >
                  Download CSV template
                </a>
                <label>
                  Choose CSV (maximum 200 KB)
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={blocked}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      setCsv(null);
                      setCsvError("");
                      if (!file) return;
                      try {
                        if (file.size > 200000)
                          throw new Error("CSV must be smaller than 200 KB.");
                        const rows = parseCSV(await file.text());
                        if (alive.current) setCsv(rows);
                      } catch (err) {
                        if (alive.current) setCsvError((err as Error).message);
                      }
                    }}
                  />
                </label>
                {csvError && (
                  <p className={s.error} role="alert">
                    {csvError}
                  </p>
                )}
                {csv && (
                  <>
                    <h3>Preview: {csv.length} holdings</h3>
                    <div className={s.scroll}>
                      <table>
                        <thead>
                          <tr>
                            <th>Stock</th>
                            <th>Quantity</th>
                            <th>Average buy price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csv.map((h) => (
                            <tr key={keyOf(h)}>
                              <td>{keyOf(h)}</td>
                              <td>{h.quantity}</td>
                              <td>{money(h.averagePrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p>
                      Stock identities and industries are verified on the server
                      before saving. An invalid row rejects the entire import.
                    </p>
                    <button
                      disabled={blocked}
                      onClick={() => void mutate("import", { rows: csv })}
                    >
                      Confirm import
                    </button>{" "}
                    <button disabled={blocked} onClick={() => setCsv(null)}>
                      Cancel import
                    </button>
                  </>
                )}
              </details>
            </section>
            <nav className={s.toolbar} aria-label="Portfolio views">
              <button
                aria-pressed={tab === "holdings"}
                onClick={() => setTab("holdings")}
              >
                Holdings ({holdings.length}/200)
              </button>
              <button
                aria-pressed={tab === "allocation"}
                onClick={() => setTab("allocation")}
              >
                Industry allocation
              </button>
            </nav>
            {tab === "allocation" ? (
              <section className={s.card}>
                <h2>Industry allocation by invested amount</h2>
                <p>
                  Based on purchase cost, including holdings without a market
                  price.
                </p>
                {allocations.map(([name, value]) => (
                  <div key={name} className={s.allocation}>
                    <span>{name}</span>
                    <meter
                      min="0"
                      max="100"
                      value={
                        summary.invested ? (value / summary.invested) * 100 : 0
                      }
                    />
                    <span>
                      {(summary.invested
                        ? (value / summary.invested) * 100
                        : 0
                      ).toFixed(1)}
                      % · {money(value)}
                    </span>
                  </div>
                ))}
                {!allocations.length && <p>Add holdings to view allocation.</p>}
              </section>
            ) : (
              <section className={s.card}>
                <div className={s.toolbar}>
                  <label>
                    Find holding
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <label>
                    Industry
                    <select
                      value={industry}
                      onChange={(e) => {
                        setIndustry(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option>All</option>
                      {industries.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sort by
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="name">Company name</option>
                      <option value="weight">Invested amount: highest</option>
                      <option value="pnl">Gain/loss: highest</option>
                    </select>
                  </label>
                  <label>
                    Rows
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={s.scroll}>
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Stock / industry",
                          "Quantity",
                          "Avg. buy",
                          "Latest price",
                          "Invested",
                          "Current value",
                          "P/L ₹",
                          "P/L %",
                          "Since prev. close",
                          "Actions",
                        ].map((x) => (
                          <th key={x}>{x}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((h) => {
                        const q = quotes[keyOf(h)];
                        const price = q?.price ?? null;
                        const gain =
                          price !== null
                            ? h.quantity * (price - h.averagePrice)
                            : null;
                        const day =
                          price !== null && q?.previousClose != null
                            ? h.quantity * (price - q.previousClose)
                            : null;
                        return (
                          <tr key={keyOf(h)}>
                            <td>
                              <Link
                                href={`/company/${encodeURIComponent(h.symbol)}?exchange=${h.exchange}`}
                              >
                                {h.companyName}
                              </Link>
                              <small>
                                {keyOf(h)} · {h.industry ?? "Unclassified"}
                              </small>
                            </td>
                            <td>{h.quantity.toLocaleString("en-IN")}</td>
                            <td>{money(h.averagePrice)}</td>
                            <td>
                              {price !== null ? money(price) : "Unavailable"}
                              <small>
                                Quote: {time(q?.timestamp ?? null)}
                                {q?.timestamp ? " IST" : ""}
                                {q?.timestamp &&
                                Date.now() - Date.parse(q.timestamp) >
                                  7 * 86400000
                                  ? " · Older than 7 days"
                                  : ""}
                              </small>
                            </td>
                            <td>{money(h.quantity * h.averagePrice)}</td>
                            <td>
                              {price !== null ? money(h.quantity * price) : "—"}
                            </td>
                            <td
                              className={
                                gain === null ? "" : gain >= 0 ? s.gain : s.loss
                              }
                            >
                              {gain !== null ? money(gain) : "—"}
                            </td>
                            <td>
                              {price !== null
                                ? pct(
                                    ((price - h.averagePrice) /
                                      h.averagePrice) *
                                      100,
                                  )
                                : "—"}
                            </td>
                            <td>{day !== null ? money(day) : "—"}</td>
                            <td>
                              <button
                                disabled={blocked}
                                onClick={() => startEdit(h)}
                              >
                                Edit
                              </button>{" "}
                              <button
                                disabled={blocked}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Remove ${h.symbol} from this portfolio? This does not record a sale.`,
                                    )
                                  )
                                    void mutate("remove", { key: keyOf(h) });
                                }}
                              >
                                Remove
                              </button>
                              <Link
                                href={`/company/${encodeURIComponent(h.symbol)}?exchange=${h.exchange}&vedha=1&vedhaTimeframe=D`}
                              >
                                Ask Vedha analysis
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!visible.length && (
                  <p>
                    {holdings.length
                      ? "No holdings match these filters."
                      : "Add your first holding above."}
                  </p>
                )}
                <div className={s.toolbar}>
                  <span>
                    {filtered.length
                      ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)}`
                      : "0"}{" "}
                    of {filtered.length} holdings
                  </span>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {pages}
                  </span>
                  <button
                    disabled={currentPage >= pages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </section>
            )}
            <p className={s.note}>
              Gains shown are unrealised and exclude fees, dividends and taxes.
              Changes since previous close use your current quantities. Update
              holdings for sales, splits and bonuses manually. Industry is
              populated where a verified NSE identity matches; otherwise it
              remains Unclassified. Ask Vedha links open the existing stock
              analysis.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
