/** Pure calculations with nulls during warm-up; no substituted zero indicators. */
export function sma(values: number[], period: number): (number | null)[] {
  let sum=0; return values.map((v,i)=>{sum+=v;if(i>=period)sum-=values[i-period];return i>=period-1?sum/period:null;});
}
export function ema(values:number[],period:number): (number|null)[]{
  let prev:number|null=null;return values.map((v,i)=>{if(i<period-1)return null;if(prev===null)prev=values.slice(0,period).reduce((a,b)=>a+b,0)/period;else prev+=(v-prev)*2/(period+1);return prev;});
}
export function rsi(values:number[],period=14):(number|null)[]{
  let gain=0,loss=0;const out:(number|null)[]=values.map(()=>null);
  for(let i=1;i<values.length;i++){const d=values[i]-values[i-1];if(i<=period){gain+=Math.max(d,0);loss+=Math.max(-d,0);if(i<period)continue;gain/=period;loss/=period;}else{gain=(gain*(period-1)+Math.max(d,0))/period;loss=(loss*(period-1)+Math.max(-d,0))/period;}out[i]=loss===0?(gain===0?50:100):100-100/(1+gain/loss);}return out;
}
export function macd(values:number[]){
 const fast=ema(values,12),slow=ema(values,26);const start=slow.findIndex(v=>v!==null);const line=values.map((_,i)=>fast[i]!==null&&slow[i]!==null?fast[i]!-slow[i]!:null);
 const signal:(number|null)[]=values.map(()=>null);if(start>=0)ema(line.slice(start) as number[],9).forEach((v,i)=>signal[start+i]=v);
 return {line,signal,histogram:line.map((v,i)=>v!==null&&signal[i]!==null?v-signal[i]!:null)};
}
export function slope(values:(number|null)[],bars=5){const last=values.at(-1),before=values.at(-1-bars);return last!=null&&before!=null&&before!==0?(last/before-1)*100:null;}
