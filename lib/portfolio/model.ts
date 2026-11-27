export type Holding = { symbol: string; exchange: 'NSE'|'BSE'; instrumentKey: string; isin: string|null; companyName: string; industry: string|null; quantity: number; averagePrice: number };
export type Portfolio = { id: string; name: string; revision: number; holdings: Holding[] };
export type Quote = { price: number|null; previousClose: number|null; timestamp: string|null };
export type Snapshot = { portfolios: {id:string;name:string}[]; portfolio: Portfolio|null; quotes: Record<string,Quote>; fetchedAt: string; quoteWarning?: string };
export const keyOf = (h: Pick<Holding,'symbol'|'exchange'>) => `${h.exchange}:${h.symbol}`;
export function positionInput(value: unknown): Pick<Holding,'symbol'|'exchange'|'quantity'|'averagePrice'> {
 const x = value as Record<string,unknown>;
 if (!x || typeof x !== 'object') throw new Error('Invalid holding.');
 const symbol = typeof x.symbol === 'string' ? x.symbol.trim().toUpperCase() : '';
 const exchange = x.exchange;
 const quantity = x.quantity; const averagePrice = x.averagePrice;
 if (!/^[A-Z0-9&._-]{1,30}$/.test(symbol) || (exchange !== 'NSE' && exchange !== 'BSE')) throw new Error('Select a valid NSE or BSE stock.');
 if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000000) throw new Error('Quantity must be a whole number from 1 to 100,000,000.');
 if (typeof averagePrice !== 'number' || !Number.isFinite(averagePrice) || averagePrice <= 0 || averagePrice > 10000000 || Math.abs(averagePrice*10000-Math.round(averagePrice*10000))>0.0001) throw new Error('Average buy price must be positive, up to ₹10,000,000, with at most four decimal places.');
 return {symbol,exchange,quantity,averagePrice};
}
export function totals(holdings: Holding[], quotes: Record<string,Quote>) {
 let invested=0, coveredCost=0, value=0, previous=0, dayValue=0, priced=0, dayCovered=0;
 for(const h of holdings){const cost=h.quantity*h.averagePrice; invested+=cost;const q=quotes[keyOf(h)];
 if(q && q.price!==null && Number.isFinite(q.price) && q.price>0){priced++; coveredCost+=cost;value+=h.quantity*q.price;
 if(q.previousClose!==null && Number.isFinite(q.previousClose) && q.previousClose>0){dayCovered++;previous+=h.quantity*q.previousClose;dayValue+=h.quantity*q.price;}}}
 const complete=priced===holdings.length; const pnl=value-coveredCost;
 return {invested,value,pnl,pnlPercent:coveredCost>0?pnl/coveredCost*100:0,complete,priced,dayComplete:complete && dayCovered===holdings.length,day:dayValue-previous,dayPercent:previous>0?(dayValue-previous)/previous*100:0};
}
// CSV snapshot imports use exact columns, quoted fields, CRLF and UTF-8 BOM.
export function parseCSV(text:string) {
 if(text.length>200000) throw new Error('CSV must be smaller than 200 KB.');
 const rows:string[][]=[]; let row:string[]=[], field='',quoted=false,closed=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;}
 else if(c===',' || c==='\n' || c==='\r'){row.push(field.trim());field='';closed=false;if(c!==','){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}
 else if(c==='"' && !field && !closed)quoted=true; else {if(closed && c.trim())throw new Error('Malformed CSV quoting.');field+=c;}}
 if(quoted)throw new Error('Unclosed CSV quote.');row.push(field.trim());if(row.some(Boolean))rows.push(row);
 const header=rows.shift()?.map(x=>x.toLowerCase());
 if(header?.join(',')!=='symbol,exchange,quantity,averageprice')throw new Error('CSV header must be symbol,exchange,quantity,averagePrice.');
 if(!rows.length || rows.length>200)throw new Error('Import between 1 and 200 holdings.');
 const seen=new Set<string>();return rows.map((r,i)=>{if(r.length!==4)throw new Error(`CSV row ${i+2}: expected four fields.`);try{const h=positionInput({symbol:r[0],exchange:r[1].toUpperCase(),quantity:Number(r[2]),averagePrice:Number(r[3])});const k=keyOf(h);if(seen.has(k))throw new Error('Duplicate stock and exchange.');seen.add(k);return h;}catch(e){throw new Error(`CSV row ${i+2}: ${(e as Error).message}`);}});
}
