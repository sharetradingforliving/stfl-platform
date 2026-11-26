export const ENTRY_TIMEFRAMES = [
 {value:"30m",label:"Thirty minutes"},
 {value:"1H",label:"Hourly"},
 {value:"D",label:"Daily"},
 {value:"W",label:"Weekly"},
 {value:"M",label:"Monthly"},
] as const;
/** Navigation only. Analysis authorization and allowance checks stay on the server. */
export function vedhaCompanyHref(symbol:string,exchange:string,timeframe:string):string{
 const cleaned=symbol.trim().toUpperCase();
 if(!/^[A-Z0-9&_.-]{1,32}$/.test(cleaned))throw new Error("Enter a valid exchange symbol, such as RELIANCE or BAJFINANCE.");
 if(exchange!=="NSE"&&exchange!=="BSE")throw new Error("Choose NSE or BSE.");
 if(!ENTRY_TIMEFRAMES.some(frame=>frame.value===timeframe))throw new Error("Choose a supported chart timeframe.");
 return `/company/${encodeURIComponent(cleaned.toLowerCase())}?${new URLSearchParams({exchange,vedha:"1",vedhaTimeframe:timeframe})}`;
}
