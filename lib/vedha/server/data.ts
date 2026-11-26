import "server-only";
import { buildEvidence, parseCandles } from "../evidence";
import { addMultiTimeframeEvidence, TREND_FRAMES } from "../multiTimeframe";
import type { Context } from "../contracts";
import { VedhaError } from "./access";
/** Fixed configured loopback origin prevents user-controlled Host/URL SSRF. */
async function localJSON(path:string,cookie?:string){
 const base=new URL(process.env.VEDHA_INTERNAL_ORIGIN!);
 if(!["127.0.0.1","localhost","[::1]"].includes(base.hostname)||base.protocol!=="http:"||base.username||base.password)throw new VedhaError(503,"configuration","Vedha internal origin must be an HTTP loopback server.");
 const r=await fetch(new URL(path,base),{headers:{Accept:"application/json",...(cookie?{Cookie:cookie}:{})},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new VedhaError(502,"market_data","Market data could not be retrieved. Your preview has not been consumed.");
 const text=await r.text();if(text.length>5_000_000)throw new Error("Market response too large");try{return JSON.parse(text);}catch{throw new VedhaError(502,"market_data","Market data returned an invalid response.");}
}
export async function getEvidence(context:Context,onCalculating?:()=>Promise<void>,cookie?:string){
 const fetchedAt=Date.now();
 const quote=await localJSON(`/api/upstox/quote/${encodeURIComponent(context.symbol)}?exchange=${context.exchange}`,cookie);
 const instrument=quote.instrumentKey;
 if(typeof instrument!=="string"||!new RegExp(`^${context.exchange}_EQ\\|[A-Z0-9]+$`).test(instrument))throw new VedhaError(422,"instrument","This release supports NSE/BSE cash-equity instruments only.");
 if(typeof quote.symbol!=="string"||quote.symbol.toUpperCase()!==context.symbol)throw new VedhaError(502,"market_data","The market instrument does not match the requested company.");
 const path=(timeframe:string)=>`/api/upstox/candles?instrumentKey=${encodeURIComponent(instrument)}&timeframe=${encodeURIComponent(timeframe)}`;
 const frames=[...new Set([context.timeframe,"D",...TREND_FRAMES.map(frame=>frame.timeframe)])];
 const responses=await Promise.allSettled(frames.map(frame=>localJSON(path(frame),cookie)));
 const series=new Map<string,ReturnType<typeof parseCandles>>();
 const now=Math.min(fetchedAt,Date.now());
 for(let index=0;index<frames.length;index++){
  const frame=frames[index],result=responses[index];
  try{
   if(result.status!=="fulfilled")throw new Error("Timeframe unavailable");
   const raw=result.value;
   if(raw.timeframe!==frame||raw.instrumentKey!==instrument)throw new Error("Candle context mismatch");
   series.set(frame,parseCandles(raw.candles,now));
  }catch{
   if(frame===context.timeframe||frame==="D")throw new VedhaError(502,"market_data","Required candle data is unavailable or does not match this request.");
   // Optional confirmation frames remain explicitly unavailable, never substituted.
  }
 }
 await onCalculating?.();
 const evidence=buildEvidence(context,series.get(context.timeframe)!,series.get("D")!,now);
 const combined=addMultiTimeframeEvidence(evidence,series,now);
 combined.fetchedAt=new Date().toISOString();return combined;
}
