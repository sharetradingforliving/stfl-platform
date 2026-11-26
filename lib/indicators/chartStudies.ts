import type { Time } from "lightweight-charts";
import type { IndicatorCandle } from "./sma";
import { calculateATR } from "./atr";

export type StudyCandle = IndicatorCandle & { time: Time };
export type TrendPoint = { time: Time; value: number; direction: "up" | "down" };
export type PivotPeriod = "daily" | "weekly" | "monthly";
export type PivotLevels = { P: number; R1: number; R2: number; R3: number; S1: number; S2: number; S3: number };
export const PATTERNS = [
  "Doji", "Hammer", "Shooting Star", "Bullish Engulfing", "Bearish Engulfing", "Morning Star", "Evening Star",
  "Bullish Marubozu", "Bearish Marubozu", "Near Bullish Marubozu", "Near Bearish Marubozu", "Spinning Top",
  "Inverted Hammer", "Hanging Man", "Bullish Harami", "Bearish Harami", "Tweezer Bottom", "Tweezer Top",
] as const;
export type PatternName = typeof PATTERNS[number];
export type Pattern = { time: Time; name: PatternName; bias: "bullish" | "bearish" | "neutral" };
export const PATTERN_RULES: Record<PatternName,string> = {
  "Doji":"Body at most 10% of the candle range; zero-range bars excluded.",
  "Hammer":"After three falling closes: body 10–35% of range, lower shadow at least twice the body, upper shadow at most half the body.",
  "Shooting Star":"After three rising closes: body 10–35% of range, upper shadow at least twice the body, lower shadow at most half the body.",
  "Bullish Engulfing":"After three falling closes: bullish body completely covers the prior bearish body and is larger.",
  "Bearish Engulfing":"After three rising closes: bearish body completely covers the prior bullish body and is larger.",
  "Morning Star":"After falling closes: a large bearish body, a small body gapped below it, then a bullish close above the first body midpoint.",
  "Evening Star":"After rising closes: a large bullish body, a small body gapped above it, then a bearish close below the first body midpoint.",
  "Bullish Marubozu":"Bullish full-body candle: open equals low and close equals high, allowing only floating-point rounding tolerance.",
  "Bearish Marubozu":"Bearish full-body candle: open equals high and close equals low, allowing only floating-point rounding tolerance.",
  "Near Bullish Marubozu":"Bullish body at least 90% of range; each shadow at most 5%. This is explicitly a near-Marubozu, not a strict full-body candle.",
  "Near Bearish Marubozu":"Bearish body at least 90% of range; each shadow at most 5%. This is explicitly a near-Marubozu, not a strict full-body candle.",
  "Spinning Top":"Body greater than 10% and at most 30% of range; both shadows at least as long as the body. Neutral.",
  "Inverted Hammer":"Shooting-Star geometry after three falling closes; a bullish reversal candidate, not a confirmed reversal.",
  "Hanging Man":"Hammer geometry after three rising closes; a bearish reversal candidate, not a confirmed reversal.",
  "Bullish Harami":"After three falling closes: small bullish body strictly inside the prior bearish body and at most half its size.",
  "Bearish Harami":"After three rising closes: small bearish body strictly inside the prior bullish body and at most half its size.",
  "Tweezer Bottom":"After three falling closes: bearish then bullish candles with lows within 1% of their larger candle range.",
  "Tweezer Top":"After three rising closes: bullish then bearish candles with highs within 1% of their larger candle range.",
};
const IST = 330 * 60_000;
export function timestamp(time: Time): number {
  if (typeof time === "number") return time * 1000;
  if (typeof time === "string") return Date.parse(`${time}T00:00:00+05:30`);
  return Date.UTC(time.year, time.month - 1, time.day) - IST;
}
export function validCandle(c: StudyCandle): boolean {
  return Number.isFinite(timestamp(c.time)) && [c.open,c.high,c.low,c.close].every(Number.isFinite) && c.high >= Math.max(c.open,c.close,c.low) && c.low <= Math.min(c.open,c.close,c.high);
}
function istDate(ms: number): Date { return new Date(ms + IST); }
export function periodKey(time: Time, period: PivotPeriod): string {
  const d = istDate(timestamp(time));
  if (period === "monthly") return d.toISOString().slice(0,7);
  if (period === "weekly") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay()+6)%7));
  return d.toISOString().slice(0,10);
}
/** Conservative NSE/BSE cash-equity closure rule; special sessions need a calendar. */
export function isClosedEquityCandle(time: Time, timeframe: string, now: number): boolean {
  const start=timestamp(time); if (!Number.isFinite(start) || start>now) return false;
  const d=istDate(start);
  let end: number;
  if (timeframe === "D") end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),15,30)-IST;
  else if(timeframe === "W") {
    const day=(d.getUTCDay()+6)%7;
    end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-day+4,15,30)-IST;
  } else if(timeframe === "M") {
    // Wait until the calendar month ends; this intentionally avoids premature signals on holidays.
    end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)-IST;
  } else {
    const minutes:Record<string,number>={"1m":1,"5m":5,"15m":15,"30m":30,"1H":60,"4H":240};
    if(!minutes[timeframe])return false;
    const close=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),15,30)-IST;
    end=Math.min(start+minutes[timeframe]*60_000,close);
  }
  // One-minute safety margin for provider publication/finalisation.
  return now >= end+60_000;
}
export function calculateSupertrend(candles: StudyCandle[], period=10, multiplier=3): TrendPoint[] {
  if(!Number.isInteger(period)||period<2||period>100||!Number.isFinite(multiplier)||multiplier<.1||multiplier>10) return [];
  if(candles.some(c=>!validCandle(c)))return [];
  const atr = calculateATR(candles,period);
  const atrByTime=new Map(atr.map(p=>[timestamp(p.time),p.value]));
  let upper=0,lower=0,previousClose=0,direction:"up"|"down"="down",seeded=false;
  const result:TrendPoint[]=[];
  for(const candle of candles){
    const value=atrByTime.get(timestamp(candle.time));
    if(value===undefined||!Number.isFinite(value)){previousClose=candle.close;continue;}
    const mid=(candle.high+candle.low)/2;
    const basicUpper=mid+multiplier*value,basicLower=mid-multiplier*value;
    if(!seeded){upper=basicUpper;lower=basicLower;direction="down";seeded=true;}
    else {
      const previousUpper=upper,previousLower=lower;
      upper=basicUpper<previousUpper||previousClose>previousUpper?basicUpper:previousUpper;
      lower=basicLower>previousLower||previousClose<previousLower?basicLower:previousLower;
      direction=direction==="down"?(candle.close>upper?"up":"down"):(candle.close<lower?"down":"up");
    }
    result.push({time:candle.time,value:direction==="up"?lower:upper,direction});
    previousClose=candle.close;
  }
  return result;
}
export function traditionalPivots(high:number,low:number,close:number):PivotLevels|null {
  if(![high,low,close].every(Number.isFinite)||low>high||close>high||close<low)return null;
  const P=(high+low+close)/3,range=high-low;
  return {P,R1:2*P-low,S1:2*P-high,R2:P+range,S2:P-range,R3:2*P+high-2*low,S3:2*P-2*high+low};
}
export type PivotPoint = {time:Time;levels:PivotLevels;referencePeriod:string;targetPeriod:string};
/** Use only prior completed daily buckets. Never fill a missing prior reference with current data. */
export function calculatePivotSeries(chartCandles:StudyCandle[],daily:StudyCandle[],period:PivotPeriod,now:number):PivotPoint[]{
  const sorted=daily.filter(c=>validCandle(c)&&isClosedEquityCandle(c.time,"D",now)).slice().sort((a,b)=>timestamp(a.time)-timestamp(b.time));
  const groups=new Map<string,{high:number;low:number;close:number}>();
  for(const c of sorted){const key=periodKey(c.time,period);const group=groups.get(key);if(group){group.high=Math.max(group.high,c.high);group.low=Math.min(group.low,c.low);group.close=c.close;}else groups.set(key,{high:c.high,low:c.low,close:c.close});}
  const keys=[...groups.keys()].sort();
  // The oldest weekly/monthly bucket may begin before the downloaded window; omit it.
  const usable=period==="daily"?keys:keys.slice(1);
  const out:PivotPoint[]=[];
  for(const c of chartCandles){const target=periodKey(c.time,period);const previous=usable.filter(k=>k<target).at(-1);if(!previous)continue;const group=groups.get(previous)!;const levels=traditionalPivots(group.high,group.low,group.close);if(levels)out.push({time:c.time,levels,referencePeriod:previous,targetPeriod:target});}
  return out;
}
/** STFL documented geometric rules, evaluated on completed candles only. */
export function detectCandlePatterns(candles:StudyCandle[]):Pattern[]{
  const result:Pattern[]=[];
  const body=(c:StudyCandle)=>Math.abs(c.close-c.open);
  const rising=(i:number)=>i>=3&&candles[i-3].close<candles[i-2].close&&candles[i-2].close<candles[i-1].close;
  const falling=(i:number)=>i>=3&&candles[i-3].close>candles[i-2].close&&candles[i-2].close>candles[i-1].close;
  for(let i=0;i<candles.length;i++){
    const c=candles[i];if(!validCandle(c))continue;
    const range=c.high-c.low,b=body(c),upper=c.high-Math.max(c.open,c.close),lower=Math.min(c.open,c.close)-c.low;
    if(range<=0)continue;
    const add=(name:PatternName,bias:Pattern["bias"])=>result.push({time:c.time,name,bias});
    if(b<=range*.1)add("Doji","neutral");
    const tolerance=Math.max(1e-8,range*1e-8);
    const full=upper<=tolerance&&lower<=tolerance;
    if(full&&c.close>c.open)add("Bullish Marubozu","bullish");
    if(full&&c.close<c.open)add("Bearish Marubozu","bearish");
    if(!full&&b>=range*.9&&upper<=range*.05&&lower<=range*.05){
      if(c.close>c.open)add("Near Bullish Marubozu","bullish");
      if(c.close<c.open)add("Near Bearish Marubozu","bearish");
    }
    if(b>range*.1&&b<=range*.3&&upper>=b&&lower>=b)add("Spinning Top","neutral");
    if(b>range*.1&&b<=range*.35&&upper>=2*b&&lower<=b*.5&&falling(i))add("Inverted Hammer","bullish");
    if(b>range*.1&&b<=range*.35&&lower>=2*b&&upper<=b*.5&&rising(i))add("Hanging Man","bearish");
    if(b>range*.1&&b<=range*.35&&lower>=2*b&&upper<=b*.5&&falling(i))add("Hammer","bullish");
    if(b>range*.1&&b<=range*.35&&upper>=2*b&&lower<=b*.5&&rising(i))add("Shooting Star","bearish");
    const p=candles[i-1];
    if(p&&validCandle(p)){
      const inside=Math.min(c.open,c.close)>Math.min(p.open,p.close)&&Math.max(c.open,c.close)<Math.max(p.open,p.close);
      if(inside&&b>0&&b<=body(p)*.5){
        if(p.close<p.open&&c.close>c.open&&falling(i))add("Bullish Harami","bullish");
        if(p.close>p.open&&c.close<c.open&&rising(i))add("Bearish Harami","bearish");
      }
      const pairTolerance=Math.max(c.high-c.low,p.high-p.low)*.01;
      if(Math.abs(c.low-p.low)<=pairTolerance&&p.close<p.open&&c.close>c.open&&falling(i))add("Tweezer Bottom","bullish");
      if(Math.abs(c.high-p.high)<=pairTolerance&&p.close>p.open&&c.close<c.open&&rising(i))add("Tweezer Top","bearish");
      if(p.close<p.open&&c.close>c.open&&c.open<=p.close&&c.close>=p.open&&b>body(p)&&falling(i))add("Bullish Engulfing","bullish");
      if(p.close>p.open&&c.close<c.open&&c.open>=p.close&&c.close<=p.open&&b>body(p)&&rising(i))add("Bearish Engulfing","bearish");
    }
    const a=candles[i-2];
    if(a&&p&&validCandle(a)&&validCandle(p)&&body(a)>0&&(a.high-a.low)>0&&body(a)>=(a.high-a.low)*.5&&body(p)<=body(a)*.3){
      if(a.close<a.open&&Math.max(p.open,p.close)<a.close&&c.close>c.open&&c.open>Math.max(p.open,p.close)&&c.close>(a.open+a.close)/2&&falling(i-2))add("Morning Star","bullish");
      if(a.close>a.open&&Math.min(p.open,p.close)>a.close&&c.close<c.open&&c.open<Math.min(p.open,p.close)&&c.close<(a.open+a.close)/2&&rising(i-2))add("Evening Star","bearish");
    }
  }
  return result;
}
