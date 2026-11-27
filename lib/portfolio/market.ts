import 'server-only';
import { getUpstoxInstruments } from '@/lib/upstox/instrumentMaster';
import { getUpstoxReadOnlyAccessToken } from '@/lib/upstox/accessToken';
import { getCompanyIdentity } from '@/lib/seo/companyIdentity';
import { keyOf, positionInput, type Holding, type Quote } from './model';
export async function resolveHoldings(inputs:unknown[]):Promise<Holding[]> {
 const master=await getUpstoxInstruments();const output:Holding[]=[];
 for(const input of inputs){const h=positionInput(input);
 const matches=master.filter(i=>i.trading_symbol?.toUpperCase()===h.symbol && i.segment?.toUpperCase()===`${h.exchange}_EQ` && !!i.instrument_key && /^IN[A-Z0-9]{10}$/.test(i.isin??''));
 if(matches.length!==1)throw new Error(`${h.exchange}:${h.symbol} could not be uniquely verified as an equity. Select another symbol.`);
 const instrument=matches[0];let industry:string|null=null;
 if(h.exchange==='NSE'){const identity=await getCompanyIdentity(h.symbol);if(identity.status==='verified' && identity.isin?.trim().toUpperCase()===instrument.isin?.trim().toUpperCase())industry=identity.industry;}
 output.push({...h, instrumentKey:instrument.instrument_key!,isin:instrument.isin??null,companyName:instrument.name??instrument.short_name??h.symbol,industry});}
 return output;
}
function timestamp(value:unknown):string|null {const n=typeof value==='string' && /^\d+$/.test(value)?Number(value):value;const t=typeof n==='string'||typeof n==='number'?new Date(n).getTime():NaN;return Number.isFinite(t)&&t>0&&t<=Date.now()+60000?new Date(t).toISOString():null;}
export async function prices(holdings:Holding[]) {
 const quotes:Record<string,Quote>={};if(!holdings.length)return {quotes};
 try{const token=await getUpstoxReadOnlyAccessToken();if(!token)throw new Error('token');
 const url=new URL('https://api.upstox.com/v2/market-quote/quotes');url.searchParams.set('instrument_key',[...new Set(holdings.map(h=>h.instrumentKey))].join(','));
 const response=await fetch(url,{headers:{Accept:'application/json',Authorization:`Bearer ${token.accessToken}`},cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('quotes');
 const body=await response.json() as {data?:Record<string,{instrument_token?:string;last_price?:number;net_change?:number;timestamp?:string}>};
 const byKey=new Map(Object.values(body.data??{}).map(q=>[q.instrument_token,q]));
 for(const h of holdings){const q=byKey.get(h.instrumentKey);const p=q?.last_price;const price=typeof p==='number'&&Number.isFinite(p)&&p>0?p:null;
 const previous=price!==null && typeof q?.net_change==='number' && Number.isFinite(q.net_change)?price-q.net_change:null;
 quotes[keyOf(h)]={price,previousClose:previous!==null&&previous>0?previous:null,timestamp:timestamp(q?.timestamp)};}
 return {quotes};
 }catch{return {quotes,quoteWarning:'Market prices are unavailable. Holdings remain saved; valuation is incomplete. Try refreshing later.'};}
}
