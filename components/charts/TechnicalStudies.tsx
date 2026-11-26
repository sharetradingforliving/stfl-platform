"use client";
import { useEffect, useState } from "react";
import { LineSeries, LineType, createSeriesMarkers, type IChartApi, type ISeriesApi, type Time, type SeriesMarker } from "lightweight-charts";
import { calculateSupertrend, calculatePivotSeries, detectCandlePatterns, isClosedEquityCandle, PATTERNS, PATTERN_RULES, validCandle, type StudyCandle, type PivotPeriod, type PatternName } from "@/lib/indicators/chartStudies";

type Settings={supertrend:boolean;period:number;multiplier:number;up:string;down:string;pivots:boolean;pivotPeriod:PivotPeriod;patterns:boolean;selectedPatterns:PatternName[];width:1|2|3;pivotDisplay:"latest"|"history";patternBars:number;patternLabels:"names"|"short"|"markers";patternListVersion:2};
const defaults:Settings={supertrend:false,period:10,multiplier:3,up:"#059669",down:"#dc2626",pivots:false,pivotPeriod:"weekly",patterns:false,selectedPatterns:[...PATTERNS],width:2,pivotDisplay:"latest",patternBars:300,patternLabels:"names",patternListVersion:2};
type Props={chart:IChartApi;series:ISeriesApi<"Candlestick">;candles:StudyCandle[];instrumentKey:string;symbol:string;exchange:string;timeframe:string;asOf:number;chartStyle:string;isChartAlive:()=>boolean};
const colour=(value:unknown,fallback:string)=>typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
function readSettings(value:unknown):Settings {
  if(!value||typeof value!=="object")return {...defaults};
  const s=value as Partial<Settings>;
  return {...defaults,supertrend:s.supertrend===true,pivots:s.pivots===true,patterns:s.patterns===true,
    period:typeof s.period==="number"&&Number.isInteger(s.period)&&s.period>=2&&s.period<=100?s.period:10,
    multiplier:typeof s.multiplier==="number"&&Number.isFinite(s.multiplier)&&s.multiplier>=.1&&s.multiplier<=10?s.multiplier:3,
    pivotPeriod:s.pivotPeriod==="daily"||s.pivotPeriod==="monthly"?s.pivotPeriod:"weekly",
    selectedPatterns:Array.isArray(s.selectedPatterns)
      ? (s.patternListVersion!==2&&PATTERNS.slice(0,7).every(p=>s.selectedPatterns!.includes(p))?[...PATTERNS]:PATTERNS.filter(p=>s.selectedPatterns!.includes(p)))
      : [...PATTERNS],
    pivotDisplay:s.pivotDisplay==="history"?"history":"latest",
    patternBars:[0,150,300,600].includes(s.patternBars??-1)?s.patternBars!:300,
    patternLabels:s.patternLabels==="short"||s.patternLabels==="markers"?s.patternLabels:"names",
    patternListVersion:2,
    up:colour(s.up,defaults.up),down:colour(s.down,defaults.down),width:s.width===1||s.width===3?s.width:2};
}
export default function TechnicalStudies(props:Props){
  const [settings,setSettings]=useState<Settings>({...defaults});const [ready,setReady]=useState("");const [open,setOpen]=useState(false);
  const [daily,setDaily]=useState<{key:string;candles:StudyCandle[];asOf:number}|null>(null);const [pivotError,setPivotError]=useState("");const [storageError,setStorageError]=useState("");
  const key=`stfl:technical-studies:v1:${props.exchange}:${props.symbol}`;
  const dailyKey=props.instrumentKey;
  useEffect(()=>{let saved:unknown=null;try{saved=JSON.parse(localStorage.getItem(key)||"null");}catch{setStorageError("Study settings could not be restored.");}setSettings(readSettings(saved));setReady(key);},[key]);
  useEffect(()=>{if(ready!==key)return;try{localStorage.setItem(key,JSON.stringify(settings));}catch{setStorageError("Study settings are session-only: browser storage is unavailable.");}},[settings,ready,key]);
  const cashSession = /^(NSE_EQ|BSE_EQ|NSE_INDEX|BSE_INDEX)\|/.test(props.instrumentKey);
  const intraday=["1m","5m","15m","30m","1H","4H"].includes(props.timeframe);
  const pivotCompatible=cashSession&&(intraday||props.timeframe==="D");
  useEffect(()=>{
    if(ready!==key||!settings.pivots||!pivotCompatible||daily?.key===dailyKey)return;
    const controller=new AbortController();let active=true;setPivotError("");
    void(async()=>{try{
      const response=await fetch(`/api/upstox/candles?instrumentKey=${encodeURIComponent(props.instrumentKey)}&timeframe=D`,{signal:controller.signal,cache:"no-store"});
      if(!response.headers.get("content-type")?.includes("application/json"))throw Error("Daily pivot reference returned a non-JSON response.");
      const data=await response.json();if(!response.ok||!Array.isArray(data.candles))throw Error(data.error??"Daily pivot reference is unavailable.");
      const map=new Map<number,StudyCandle>();
      for(const row of data.candles){if(!Array.isArray(row)||row.length<5)continue;const time=Date.parse(row[0])/1000;const c={time:time as Time,open:row[1],high:row[2],low:row[3],close:row[4]};if(validCandle(c))map.set(time,c);}
      const candles=[...map.values()].sort((a,b)=>Number(a.time)-Number(b.time));if(!candles.length)throw Error("No valid daily reference candles were returned.");
      if(active)setDaily({key:dailyKey,candles,asOf:Number.isFinite(Date.parse(data.asOf))?Math.min(Date.parse(data.asOf),Date.now()):Date.now()});
    }catch(e){if(active&&!controller.signal.aborted)setPivotError(e instanceof Error?e.message:"Unable to load pivot reference.");}})();
    return()=>{active=false;controller.abort();};
  },[settings.pivots,pivotCompatible,dailyKey,daily?.key,ready,key,props.instrumentKey]);
  const [messages,setMessages]=useState<string[]>([]);
  const [patternCounts,setPatternCounts]=useState<Record<string,number>>({});
  useEffect(()=>{
    if(ready!==key)return;
    const {chart,series,candles}=props;const created:Array<Parameters<IChartApi["removeSeries"]>[0]>=[];let markers:ReturnType<typeof createSeriesMarkers<Time>>|undefined;const notes:string[]=[];const counts:Record<string,number>={};
    if(settings.supertrend){
      const points=calculateSupertrend(candles,settings.period,settings.multiplier);
      if(!points.length)notes.push(`Supertrend needs at least ${settings.period+1} valid candles.`);
      else {
        // Separate series per contiguous trend run. Whitespace in one series
        // can still connect two same-colour runs with an incorrect diagonal.
        const segments: (typeof points)[] = [];
        for (const point of points) {
          const previous = segments[segments.length - 1];
          if (!previous || previous[previous.length - 1].direction !== point.direction) segments.push([point]);
          else previous.push(point);
        }
        segments.forEach((segment, index) => {
          const direction = segment[0].direction;
          const line = chart.addSeries(LineSeries, {
            title: `ST ${settings.period},${settings.multiplier} ${direction}`,
            color: direction === "up" ? settings.up : settings.down,
            lineWidth: settings.width,
            priceLineVisible: false,
            lastValueVisible: index === segments.length - 1,
            crosshairMarkerVisible: false,
            pointMarkersVisible: segment.length === 1,
            pointMarkersRadius: 2,
          });
          created.push(line);
          line.setData(segment.map(p => ({time: p.time, value: p.value})));
        });
        if(candles.length<settings.period*5)notes.push("Supertrend has limited warm-up history; values may differ from charts with a longer history.");
        if(cashSession&&candles.length&&!isClosedEquityCandle(candles[candles.length-1].time,props.timeframe,props.asOf))notes.push("The latest Supertrend value is provisional because its candle was open when fetched.");
      }
    }
    if(settings.pivots){
      if(!cashSession)notes.push("Pivot session rules are currently configured for NSE/BSE cash equities and indices only.");
      else if(!pivotCompatible)notes.push("Pivots: use an intraday or daily chart.");
      else if(daily?.key===dailyKey){
        const points=calculatePivotSeries(candles,daily.candles,settings.pivotPeriod,Math.min(props.asOf,daily.asOf));
        if(!points.length)notes.push("No complete prior pivot reference period is available.");
        else {
          const last=points[points.length-1];
          for(const level of ["P","R1","R2","R3","S1","S2","S3"] as const){
            const latest=settings.pivotDisplay==="latest";
            const line=chart.addSeries(LineSeries,{
              title:`${latest?"Latest ":""}${settings.pivotPeriod} ${level}`,
              color:level==="P"?"#7c3aed":level.startsWith("R")?"#be123c":"#047857",
              lineWidth:level==="P"?2:1,lineType:LineType.WithSteps,
              lineVisible:!latest,priceLineVisible:latest,priceLineStyle:2,
              lastValueVisible:true,crosshairMarkerVisible:false,
            });
            created.push(line);
            line.setData(latest?[{time:last.time,value:last.levels[level]}]:points.map(p=>({time:p.time,value:p.levels[level]})));
          }
          notes.push(`Traditional ${settings.pivotPeriod} pivots · last plotted period ${last.targetPeriod} uses prior period ${last.referencePeriod} · daily OHLC source.`);
          if(settings.pivotDisplay==="latest")notes.push("Latest-period lines are static reference guides across the screen; they are not historical pivot values for earlier candles.");
        }
      }else notes.push(pivotError||"Loading daily OHLC for pivots…");
    }
    if(settings.patterns){
      if(!cashSession)notes.push("Closed-candle pattern rules are configured for NSE/BSE cash equities and indices only.");
      else if(props.chartStyle!=="candles")notes.push("Pattern markers are displayed in Candles style only.");
      else {
        const completed=candles.filter(c=>isClosedEquityCandle(c.time,props.timeframe,props.asOf));
        const patterns=detectCandlePatterns(completed).filter(p=>settings.selectedPatterns.includes(p.name));
        const recent=new Set((settings.patternBars===0?candles:candles.slice(-settings.patternBars)).map(c=>String(c.time)));
        const groups=new Map<string,{time:Time;bias:"bullish"|"bearish"|"neutral";names:string[]}>();
        for(const p of patterns){if(!recent.has(String(p.time)))continue;counts[p.name]=(counts[p.name]??0)+1;const id=`${p.time}:${p.bias}`;const group=groups.get(id);if(group)group.names.push(p.name);else groups.set(id,{time:p.time,bias:p.bias,names:[p.name]});}
        const abbreviations:Partial<Record<PatternName,string>>={"Bullish Marubozu":"Bull Maru","Bearish Marubozu":"Bear Maru","Near Bullish Marubozu":"Near Bull Maru","Near Bearish Marubozu":"Near Bear Maru","Bullish Engulfing":"Bull Eng","Bearish Engulfing":"Bear Eng","Bullish Harami":"Bull Harami","Bearish Harami":"Bear Harami","Spinning Top":"Spin Top","Shooting Star":"Shoot Star","Inverted Hammer":"Inv Hammer"};
        const grouped=[...groups.values()];
        const values:SeriesMarker<Time>[]=grouped.slice(-500).map(p=>({time:p.time,position:p.bias==="bullish"?"belowBar":"aboveBar",shape:p.bias==="neutral"?"circle":p.bias==="bullish"?"arrowUp":"arrowDown",color:p.bias==="bullish"?"#047857":p.bias==="bearish"?"#be123c":"#a16207",text:settings.patternLabels==="markers"?"":p.names.map(n=>settings.patternLabels==="short"?(abbreviations[n as PatternName]??n):n).join(" / ")}));
        markers=createSeriesMarkers(series,values);
        notes.push(`Patterns: completed candles only, ${settings.patternBars===0?"all downloaded bars":`last ${settings.patternBars} bars`}. No match means no label; pattern candidates are not trade signals.`);
        if(grouped.length>500)notes.push("Only the latest 500 marker groups are drawn; counts include all matches in the chosen window.");
      }
    }
    setMessages(notes);setPatternCounts(counts);
    return()=>{if(!props.isChartAlive())return;markers?.detach();for(const s of created)chart.removeSeries(s);};
  },[settings,ready,key,props.chart,props.series,props.candles,props.timeframe,props.asOf,props.chartStyle,daily,dailyKey,pivotCompatible,pivotError,cashSession]);
  const change=<K extends keyof Settings>(name:K,value:Settings[K])=>setSettings(s=>({...s,[name]:value}));
  return <div className="relative border-b border-slate-200 bg-white text-xs text-slate-700">
    <div className="flex flex-wrap items-center gap-3 px-3 py-2">
      <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="rounded border border-slate-300 px-2 py-1 font-semibold">Study settings ▾</button>
      <label className="flex items-center gap-1.5"><input type="checkbox" checked={settings.supertrend} onChange={e=>change("supertrend",e.target.checked)}/>Supertrend {settings.period},{settings.multiplier}</label>
      <label className="flex items-center gap-1.5"><input type="checkbox" checked={settings.pivots} onChange={e=>change("pivots",e.target.checked)}/>Pivots</label>
      <label className="flex items-center gap-1.5"><input type="checkbox" checked={settings.patterns} onChange={e=>change("patterns",e.target.checked)}/>Candle patterns</label>
    </div>
    {settings.pivots&&settings.pivotDisplay==="latest"&&<p className="px-3 pb-1 text-[11px] text-slate-600">Latest {settings.pivotPeriod} pivot guides · based on the prior completed period, not historical levels</p>}
    {open&&<div className="absolute left-0 top-full z-20 max-h-[65vh] w-[340px] max-w-full space-y-3 overflow-auto rounded border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between"><strong>Technical studies</strong><button type="button" onClick={()=>setOpen(false)} aria-label="Close study settings">×</button></div>
      <fieldset className="space-y-2 border-b border-slate-200 pb-3"><legend className="mb-2 font-semibold">Supertrend</legend>
        <div className="flex gap-2">{[[10,2],[10,3],[27,2]].map(([period,multiplier])=><button key={`${period},${multiplier}`} type="button" onClick={()=>setSettings(s=>({...s,period,multiplier,supertrend:true}))} className="rounded border border-slate-200 px-2 py-1">{period},{multiplier}</button>)}</div>
        <label className="flex justify-between">ATR period<input type="number" min={2} max={100} step={1} value={settings.period} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=2&&n<=100)change("period",n);}} className="w-20 rounded border px-2 py-1"/></label>
        <label className="flex justify-between">Multiplier<input type="number" min={.1} max={10} step={.1} value={settings.multiplier} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=.1&&n<=10)change("multiplier",n);}} className="w-20 rounded border px-2 py-1"/></label>
        <div className="flex justify-between"><label>Up colour <input aria-label="Supertrend up colour" type="color" value={settings.up} onChange={e=>change("up",e.target.value)}/></label><label>Down colour <input aria-label="Supertrend down colour" type="color" value={settings.down} onChange={e=>change("down",e.target.value)}/></label></div>
        <label className="flex justify-between">Line width<select value={settings.width} onChange={e=>change("width",Number(e.target.value) as 1|2|3)}>{[1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>
      </fieldset>
      <label className="flex justify-between">Traditional pivots<select value={settings.pivotPeriod} onChange={e=>change("pivotPeriod",e.target.value as PivotPeriod)} className="rounded border px-2 py-1"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
      <label className="flex justify-between">Pivot display<select value={settings.pivotDisplay} onChange={e=>change("pivotDisplay",e.target.value as "latest"|"history")} className="rounded border px-2 py-1"><option value="latest">Latest period only</option><option value="history">Historical steps</option></select></label>
      <label className="flex justify-between">Pattern window<select value={settings.patternBars} onChange={e=>change("patternBars",Number(e.target.value))} className="rounded border px-2 py-1"><option value={150}>150 bars</option><option value={300}>300 bars</option><option value={600}>600 bars</option><option value={0}>All downloaded bars</option></select></label>
      <label className="flex justify-between">Pattern labels<select value={settings.patternLabels} onChange={e=>change("patternLabels",e.target.value as Settings["patternLabels"])} className="rounded border px-2 py-1"><option value="names">Full names</option><option value="short">Short names</option><option value="markers">Markers only</option></select></label>
      <div className="flex gap-3"><button type="button" onClick={()=>change("selectedPatterns",[...PATTERNS])} className="rounded border px-2 py-1">Select all patterns</button><button type="button" onClick={()=>change("selectedPatterns",[])} className="rounded border px-2 py-1">Clear selection</button></div>
      <fieldset><legend className="mb-2 font-semibold">Candlestick patterns</legend><div className="grid grid-cols-1 gap-2">{PATTERNS.map(p=><label key={p} title={PATTERN_RULES[p]} className="flex items-center gap-2"><input type="checkbox" checked={settings.selectedPatterns.includes(p)} onChange={()=>change("selectedPatterns",settings.selectedPatterns.includes(p)?settings.selectedPatterns.filter(v=>v!==p):[...settings.selectedPatterns,p])}/>{p}</label>)}</div></fieldset>
      <details><summary>Pattern definitions</summary><ul className="mt-2 space-y-2">{PATTERNS.map(p=><li key={p}><strong>{p}:</strong> {PATTERN_RULES[p]}</li>)}</ul></details>
      <p className="text-slate-500">Settings save in this browser. Pattern definitions use STFL’s documented thresholds and trend context.</p>
    </div>}
    {settings.patterns&&Object.keys(patternCounts).length>0&&<details className="px-3 pb-2"><summary>Detected patterns in selected window</summary><ul className="mt-1 grid grid-cols-2 gap-1">{Object.entries(patternCounts).map(([name,count])=><li key={name}>{name}: {count}</li>)}</ul></details>}
    {(storageError||messages.length>0)&&<details className="px-3 pb-2 text-slate-600"><summary>Study notes ({messages.length+(storageError?1:0)})</summary><ul className="mt-2 list-disc space-y-1 pl-4">{storageError&&<li>{storageError}</li>}{messages.map(m=><li key={m}>{m}</li>)}</ul></details>}
  </div>;
}
