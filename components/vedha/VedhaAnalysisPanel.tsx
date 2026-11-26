"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import type { CompanyResearch } from "@/lib/types/research";
import { LAYERS, renderFactText, type Report, type View } from "@/lib/vedha/contracts";

type Props={research?:CompanyResearch|null;symbol:string;exchange:"NSE"|"BSE";timeframe:string};
export default function VedhaAnalysisPanel(props:Props){
 const {user,isLoaded}=useUser();
 const returnTo=`/company/${encodeURIComponent(props.symbol.toLowerCase())}?${new URLSearchParams({exchange:props.exchange,vedha:"1",vedhaTimeframe:props.timeframe}).toString()}`;
 if(!isLoaded)return <p className="p-4 text-sm text-slate-500">Checking your account…</p>;
 if(!user)return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Vedha</h2><p className="mt-2 text-sm text-slate-600">Sign in for one free six-layer chart analysis.</p><SignInButton mode="modal" forceRedirectUrl={returnTo} signUpForceRedirectUrl={returnTo}><button type="button" className="mt-3 inline-block text-sm font-semibold text-emerald-700">Sign in and analyse →</button></SignInButton></section>;
 const key=`${user.id}:${props.exchange}:${props.symbol}:${props.timeframe}`;
 return <Panel key={key} {...props}/>;
}
function Panel({symbol,exchange,timeframe}:Props){
 const [view,setView]=useState<View>({authenticated:true,status:"loading"});
 const [busy,setBusy]=useState(false);const [expandedLayers,setExpandedLayers]=useState<string[]>(["structure"]);
 const dialog=useRef<HTMLDialogElement>(null),alive=useRef(true),lock=useRef(false);
 const revision=useRef(0),readSerial=useRef(0),polling=useRef(false),attemptObserved=useRef(false);
 const context={symbol,exchange,timeframe};
 const returnTo=`/company/${encodeURIComponent(symbol.toLowerCase())}?${new URLSearchParams({exchange,vedha:"1",vedhaTimeframe:timeframe}).toString()}`;
 const query=new URLSearchParams(context).toString();
 async function responseBody(response:Response):Promise<View>{
  const body:unknown=await response.json();
  if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Invalid service response");
  const result=body as View;
  const publicMessages:Record<string,string>={
   temporarily_busy:"Vedha is experiencing high demand. Please try again in a few minutes.",
   busy:"Your analysis is already being prepared. Please wait.",
   upgrade:"Your free preview is complete. Reopen your saved report or explore Premium for more analyses.",
   attempt_limit:"You have reached the current analysis request limit. Please try again later.",
   monthly_limit:"Your monthly analysis allowance has been reached. Your saved reports remain available.",
  };
  const detail=response.status===401?"Please sign in to use Vedha.":result.code?publicMessages[result.code]??"Vedha could not complete your analysis right now. Please try again shortly.":!response.ok?"Vedha is temporarily unavailable. Please try again shortly.":undefined;
  return {...result,detail,authenticated:response.status===401?false:result.authenticated??true};
 }
 async function read(active:()=>boolean=()=>true){
  const requestRevision=revision.current,serial=++readSerial.current;
  const r=await fetch(`/api/vedha/analyse?${query}`,{cache:"no-store",signal:AbortSignal.timeout(12000)});
  const b=await responseBody(r);
  const current=alive.current&&active()&&requestRevision===revision.current&&serial===readSerial.current;
  if(current){
   // Polling an older failure must not erase progress or a POST error.
   if(!lock.current||b.status==="running"){
    if(r.ok&&b.status==="running")attemptObserved.current=true;
    const historicalFailure=r.ok&&b.status==="failed"&&!attemptObserved.current;
    setView(previous=>({...b,status:historicalFailure?"ready":b.status,
     detail:historicalFailure?undefined:b.detail??(b.status==="failed"?previous.detail??"Vedha could not complete your analysis right now. Please try again shortly.":undefined)}));
    if(r.ok&&b.status==="running")setBusy(true);
   }
  }
  return {ok:r.ok,body:b,current};
 }
 async function generate(){
  if(lock.current)return;lock.current=true;attemptObserved.current=true;revision.current++;setBusy(true);
  if(alive.current)setView(v=>({...v,detail:undefined,code:undefined,status:"running",stage:"Checking membership and preparing your analysis"}));
  try{
   const r=await fetch("/api/vedha/analyse",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(context),signal:AbortSignal.timeout(160000)});
   const b=await responseBody(r);
   if(alive.current){setView({...b,detail:b.detail??(!r.ok&&b.code!=="busy"?"Analysis could not be completed. Please try again shortly; your free preview is used only after a report is saved.":undefined)});setBusy(b.code==="busy"||b.status==="running");}
  }catch{if(alive.current){setBusy(false);setView(v=>({...v,status:"failed",detail:"The connection was interrupted. Reopen this panel to check whether your report was saved before retrying."}));}}
  finally{revision.current++;lock.current=false;}
 }
 useEffect(()=>{alive.current=true;let cancelled=false;
  void read(()=>!cancelled).then(r=>{if(cancelled||!r.current||!alive.current)return;if(r.ok&&r.body.status==="idle"&&!(r.body.tier==="FREE"&&r.body.previewUsed))void generate();}).catch(()=>{if(!cancelled&&alive.current)setView({authenticated:true,status:"failed",detail:"Unable to load your analysis. Reopen this panel to check the connection, then retry."});});
  return ()=>{cancelled=true;alive.current=false;};
 // Context changes remount Panel; generation is independent of client research objects.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{if(!busy)return;let cancelled=false;
  const timer=setInterval(()=>{
   if(polling.current)return;polling.current=true;
   void read(()=>!cancelled).then(r=>{
    if(cancelled||!r.current||!alive.current||lock.current)return;
    if(!r.ok||["completed","failed","idle"].includes(r.body.status??""))setBusy(false);
   }).catch(()=>{}).finally(()=>{polling.current=false;});
  },3000);
  return()=>{cancelled=true;clearInterval(timer);};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[busy]);
 const report=view.report;
 function content(r:Report){
 const text=(s:string)=>renderFactText(s,r.evidence);
 const coverage=r.evidence.limitations.filter(item=>typeof item==="string"&&item.trim().length>0);
 const facts=r.evidence.facts;
 const instrument=facts.find(f=>f.id==="symbol")?.value??`${r.evidence.context.exchange}:${r.evidence.context.symbol}`;
 const bars=facts.find(f=>f.id==="bars")?.value.replace(/\.00$/,"");
 return <div className="space-y-5 p-4 sm:p-5">
  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{r.tier==="FREE"?"Your free six-layer preview":"Premium technical research"}</p>
  <p className="text-xs font-semibold text-slate-600">{instrument} · {r.evidence.context.timeframe}{bars?` · ${bars} completed candles`:""}</p>
  <h3 className="text-xl font-bold text-slate-900">{text(r.narrative.headline)}</h3>
  <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{text(r.narrative.overview)}</p>
  <p className="text-xs leading-5 text-slate-500">Completed candle start: {new Date(r.evidence.candleAsOf).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST · {r.evidence.context.timeframe}. Historical analysis, not a live quote.</p>
  {facts.some(f=>f.id==="mtf_daily_status")&&<section className="space-y-2"><h4 className="text-sm font-bold">Trend across timeframes</h4><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Timeframe</th><th className="p-2">Assessment</th></tr></thead><tbody>{[["hourly","Hourly · short-term"],["daily","Daily · intermediate"],["weekly","Weekly · medium-term"],["monthly","Monthly · long-term"]].map(([key,label])=>{const get=(field:string)=>facts.find(f=>f.id===`mtf_${key}_${field}`)?.value;return <tr key={key} className="border-t border-slate-200"><th scope="row" className="p-2 align-top">{label}</th><td className="p-2"><strong>{get("status")??"Insufficient evidence"}</strong><details className="mt-1"><summary className="cursor-pointer text-emerald-700">Evidence and coverage</summary><p className="mt-2 leading-5">{get("summary")}</p><p className="mt-2 text-slate-500">{get("coverage")}</p></details></td></tr>;})}</tbody></table></div><p className="text-xs text-slate-500">Each row uses its own completed candles. Different timeframes can disagree; these classifications are not forecasts.</p></section>}
  <div className="flex gap-4 text-xs font-semibold text-emerald-700"><button type="button" onClick={()=>setExpandedLayers(r.narrative.layers.map(layer=>layer.id))}>Expand all layers</button><button type="button" onClick={()=>setExpandedLayers([])}>Collapse all</button></div>
  <div className="space-y-2">{r.narrative.layers.map((layer,index)=><section key={layer.id} className="rounded-lg border border-slate-200">
   <button type="button" aria-expanded={expandedLayers.includes(layer.id)} onClick={()=>setExpandedLayers(previous=>previous.includes(layer.id)?previous.filter(id=>id!==layer.id):[...previous,layer.id])} className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-semibold text-slate-900"><span className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">{index+1}</span><span>{LAYERS[index]}</span></span><span aria-hidden="true">{expandedLayers.includes(layer.id)?"−":"+"}</span></button>
   {expandedLayers.includes(layer.id)&&<div className="space-y-3 border-t border-slate-100 p-3"><p className="whitespace-pre-line text-sm leading-6 text-slate-700">{text(layer.explanation)}</p>
    <details><summary className="cursor-pointer text-xs font-semibold text-emerald-700">See supporting evidence</summary><dl className="mt-2 space-y-2">{layer.evidenceIds.map(id=>{const f=r.evidence.facts.find(f=>f.id===id);return f?<div key={id} className="text-xs leading-5"><dt className="text-slate-500">{f.label}</dt><dd className="break-words font-medium text-slate-800">{f.value}</dd></div>:null;})}</dl></details>
   </div>}
  </section>)}</div>
  <section><h4 className="text-sm font-bold">What to watch next</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{text(r.narrative.conclusion)}</p></section>
  <details open className="border-t border-slate-200 pt-3"><summary className="cursor-pointer text-xs font-semibold">Sources and coverage</summary><p className="mt-2 text-xs text-slate-500">Source: Upstox historical OHLCV through STFL. Calculations: {r.evidence.version}. Explanation: {r.provider} / {r.model}. Generated {new Date(r.generatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST.</p><p className="mt-2 text-xs leading-5 text-slate-600">{coverage.join(" ")||"Coverage details were not supplied for this saved report."}</p></details>
  {r.tier==="FREE"&&<div className="border-t border-slate-200 pt-3"><p className="text-sm text-slate-600">Your preview remains available here. Premium unlocks further analyses and deeper explanations of the supported evidence.</p><Link href="/premium-research" className="mt-3 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Explore Premium</Link></div>}
  <p className="text-xs leading-5 text-slate-500">Analytical research for educational purposes, not personalized investment advice. No outcome is guaranteed. Support and resistance are observations rather than trading instructions.</p>
 </div>;}
 return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900">
  <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="text-lg font-bold">Vedha</h2><p className="text-xs text-slate-500">STFL AI Research Analyst</p><p className="mt-1 text-xs font-medium text-emerald-700">{exchange}:{symbol} · {timeframe}</p></div>{report&&<button type="button" onClick={()=>dialog.current?.showModal()} className="rounded-md border border-slate-200 px-3 py-2 text-xs">Expand</button>}</header>
  {busy&&<div role="status" className="border-b border-slate-100 bg-emerald-50 p-4 text-sm text-emerald-900"><span className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-600"/>{view.stage??"Processing your analysis"}<p className="mt-2 text-xs">Reviewing historical candles and preparing your analysis.</p></div>}
  {view.status==="ready"&&!view.report&&!busy&&<p className="p-4 text-sm text-slate-600">Generate an explanation of this chart.</p>}
  {view.status==="loading"&&<p role="status" className="p-4 text-sm text-slate-500">Checking your saved analysis…</p>}
  {view.detail&&<p role="alert" className="p-4 text-sm leading-6 text-slate-600">{view.detail}</p>}
  {view.authenticated===false?<div className="p-4"><SignInButton mode="modal" forceRedirectUrl={returnTo} signUpForceRedirectUrl={returnTo}><button type="button" className="text-sm font-semibold text-emerald-700">Sign in and analyse →</button></SignInButton></div>:null}
  {report?<div className="max-h-[740px] overflow-y-auto">{content(report)}</div>:!busy&&view.status!=="loading"&&view.authenticated&&<div className="p-4">{view.code==="upgrade"||view.tier==="FREE"&&view.previewUsed?<><p className="text-sm text-slate-600">Your free preview has been used. Return to its company and timeframe to reopen it, or upgrade for more analyses.</p><Link href="/premium-research" className="mt-3 inline-block text-sm font-semibold text-emerald-700">Explore Premium →</Link></>:<button type="button" onClick={()=>void generate()} className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white">Generate analysis</button>}</div>}
  {report&&view.tier==="PREMIUM"&&!busy&&<button type="button" onClick={()=>void generate()} className="m-4 rounded-md border px-3 py-2 text-xs">Refresh analysis</button>}
  <dialog ref={dialog} aria-label="Expanded Vedha analysis" className="m-auto max-h-[94vh] w-[min(1000px,96vw)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 backdrop:bg-slate-950/50"><header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white p-4"><h2 className="font-bold">Vedha · {exchange}:{symbol} · {timeframe}</h2><button autoFocus type="button" onClick={()=>dialog.current?.close()} className="rounded-md border px-3 py-2 text-sm">Close</button></header>{report&&content(report)}</dialog>
 </section>;
}
