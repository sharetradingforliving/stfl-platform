import { NextRequest, NextResponse } from "next/server";

const timeframeMap: Record<string,{unit:string;interval:string;days:number}> = {
  "1m":{unit:"minutes",interval:"1",days:28},
  "5m":{unit:"minutes",interval:"5",days:28},
  "15m":{unit:"minutes",interval:"15",days:28},
  "30m":{unit:"minutes",interval:"30",days:84},
  "1H":{unit:"hours",interval:"1",days:84},
  "4H":{unit:"hours",interval:"4",days:84},
  D:{unit:"days",interval:"1",days:1500},
  W:{unit:"weeks",interval:"1",days:1095},
  M:{unit:"months",interval:"1",days:1825},
};
type Candle = [string,number,number,number,number,number,number?];
function isCandle(row: unknown): row is Candle {
  if(!Array.isArray(row)||row.length<6||typeof row[0]!=="string"||!Number.isFinite(Date.parse(row[0])))return false;
  const [,open,high,low,close,volume]=row;
  return [open,high,low,close,volume].every(v=>typeof v==="number"&&Number.isFinite(v))&&volume>=0&&high>=Math.max(open,low,close)&&low<=Math.min(open,high,close);
}
export async function GET(request:NextRequest){
  const asOf=new Date().toISOString();
  try{
    const instrumentKey=request.nextUrl.searchParams.get("instrumentKey")?.trim();
    const timeframe=request.nextUrl.searchParams.get("timeframe")??"D";
    if(!instrumentKey||instrumentKey.length>200)return NextResponse.json({error:"A valid instrument key is required."},{status:400});
    if(!Object.prototype.hasOwnProperty.call(timeframeMap,timeframe))return NextResponse.json({error:"Unsupported chart timeframe."},{status:400});
    const config=timeframeMap[timeframe];
    const indiaDate=new Date(Date.now()+330*60_000).toISOString().slice(0,10);
    const from=new Date(`${indiaDate}T00:00:00Z`);from.setUTCDate(from.getUTCDate()-config.days);
    const url=`https://api.upstox.com/v3/historical-candle/${encodeURIComponent(instrumentKey)}/${config.unit}/${config.interval}/${indiaDate}/${from.toISOString().slice(0,10)}`;
    const response=await fetch(url,{method:"GET",headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(15_000)});
    if(!response.headers.get("content-type")?.includes("application/json"))return NextResponse.json({error:`Market data provider returned a non-JSON response (HTTP ${response.status}).`},{status:502});
    const data=await response.json();
    if(!response.ok)return NextResponse.json({error:data?.errors?.[0]?.message??"Unable to fetch historical candles."},{status:response.status>=400&&response.status<=599?response.status:502});
    if(!Array.isArray(data?.data?.candles))return NextResponse.json({error:"Market data provider returned an invalid candle response."},{status:502});
    const unique=new Map<number,Candle>();let rejected=0;
    for(const row of data.data.candles){if(isCandle(row)){const time=Date.parse(row[0]);if(!unique.has(time))unique.set(time,row);}else rejected++;}
    const candles=[...unique.entries()].sort((a,b)=>a[0]-b[0]).map(([,c])=>c);
    return NextResponse.json({timeframe,instrumentKey,candles,source:"Upstox",asOf,
      warnings:rejected?[`${rejected} invalid candle records were excluded.`]:[],
      historyMode:"historical",timezone:"Asia/Kolkata"},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    const timeout=error instanceof Error&&(error.name==="TimeoutError"||error.name==="AbortError");
    console.error("STFL candle API:",error instanceof Error?error.name:"UnknownError");
    return NextResponse.json({error:timeout?"Market data provider timed out. Please retry.":"Unable to fetch historical candle data."},{status:timeout?504:502});
  }
}
