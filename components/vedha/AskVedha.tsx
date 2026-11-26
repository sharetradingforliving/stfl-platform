"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {ENTRY_TIMEFRAMES,vedhaCompanyHref} from "@/lib/vedha/entry";
export default function AskVedha(){
 const [symbol,setSymbol]=useState("");
 const [exchange,setExchange]=useState("NSE");
 const [timeframe,setTimeframe]=useState("D");
 const [error,setError]=useState("");
 function openAnalysis(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  try{window.location.assign(vedhaCompanyHref(symbol,exchange,timeframe));}
  catch(value){setError(value instanceof Error?value.message:"Check your symbol and try again.");}
 }
 return <main className="min-h-[70vh] bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
  <div className="mx-auto max-w-5xl space-y-8">
   <header className="max-w-3xl space-y-4">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">STFL Research</p>
    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ask Vedha</h1>
    <p className="text-lg leading-8 text-slate-600">Understand the evidence behind a stock’s chart.</p>
    <p className="text-sm leading-6 text-slate-600">Choose a stock and timeframe to open Vedha alongside its chart. Review market structure, candle patterns, participation, indicators, price zones and a conditional outlook.</p>
   </header>
   <section aria-labelledby="open-vedha" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <h2 id="open-vedha" className="text-xl font-bold">Open a stock analysis</h2>
    <form onSubmit={openAnalysis} className="mt-5 space-y-5">
     <div className="grid gap-4 sm:grid-cols-[1fr_2fr_1fr]">
      <div><label htmlFor="vedha-exchange" className="mb-2 block text-sm font-semibold">Exchange</label><select id="vedha-exchange" value={exchange} onChange={event=>{setExchange(event.target.value);setError("");}} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"><option value="NSE">NSE</option><option value="BSE">BSE</option></select></div>
      <div><label htmlFor="vedha-symbol" className="mb-2 block text-sm font-semibold">Stock symbol</label><input id="vedha-symbol" name="symbol" value={symbol} onChange={event=>{setSymbol(event.target.value);setError("");}} placeholder={exchange==="NSE"?"e.g. RELIANCE or BAJFINANCE":"Enter the BSE symbol used on STFL"} maxLength={32} required autoComplete="off" spellCheck={false} aria-describedby="vedha-symbol-help" aria-invalid={Boolean(error)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 uppercase placeholder:normal-case"/><p id="vedha-symbol-help" className="mt-2 text-xs leading-5 text-slate-500">Use the exchange symbol shown on the company’s STFL dashboard.</p></div>
      <div><label htmlFor="vedha-timeframe" className="mb-2 block text-sm font-semibold">Chart timeframe</label><select id="vedha-timeframe" value={timeframe} onChange={event=>setTimeframe(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3">{ENTRY_TIMEFRAMES.map(frame=><option key={frame.value} value={frame.value}>{frame.label}</option>)}</select></div>
     </div>
     {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
     <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Open analysis →</button>
     <p className="text-xs leading-5 text-slate-500">Sign in on the company page to use Vedha. Your existing membership and analysis allowance apply. Saved reports remain available subject to your account access.</p>
    </form>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5"><span className="mr-1 text-xs text-slate-500">Try an NSE stock:</span>{["RELIANCE","BAJFINANCE","TCS"].map(example=><Link key={example} href={vedhaCompanyHref(example,"NSE",timeframe)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">{example}</Link>)}</div>
   </section>
   <section aria-labelledby="vedha-coverage" className="grid gap-5 sm:grid-cols-2">
    <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 id="vedha-coverage" className="font-bold">One chart, wider context</h2><p className="mt-2 text-sm leading-6 text-slate-600">The selected timeframe anchors the report. Available hourly, daily, weekly and monthly evidence helps distinguish short-term momentum from broader structure. Missing history is identified in the report.</p></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Research you can inspect</h2><p className="mt-2 text-sm leading-6 text-slate-600">Expand any layer to read its explanation and supporting evidence. Check the completed-candle date before interpreting the analysis. Reports use historical candles and are not live quotes.</p></div>
   </section>
   <p className="text-xs leading-5 text-slate-500">Vedha currently provides chart-based technical research. Conversational follow-up questions, news analysis and fundamental analysis are not available on this page. Research is educational, not personalized investment advice.</p>
   <Link href="/company-research" className="inline-block text-sm font-semibold text-emerald-700">Browse company research →</Link>
  </div>
 </main>;
}
