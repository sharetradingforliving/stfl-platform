import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { parseContext, type Report } from "@/lib/vedha/contracts";
import { access, configured, VedhaError } from "@/lib/vedha/server/access";
import * as store from "@/lib/vedha/server/store";
import { getEvidence } from "@/lib/vedha/server/data";
import { generate, GenerationFailure } from "@/lib/vedha/server/providers";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=180;
const headers={"Cache-Control":"private, no-store, max-age=0",Vary:"Cookie, Authorization","X-Content-Type-Options":"nosniff"};
function json(body:unknown,status=200){return NextResponse.json(body,{status,headers});}
function errorResponse(error:unknown,phase="request"){
 if(error instanceof VedhaError){
  console.error("Vedha diagnostic",{phase,code:error.code,errorType:"VedhaError"});
  const detail=error.status===401?"Please sign in to use Vedha.":"Vedha is temporarily unavailable. Please try again shortly.";
  return json({detail,code:error.status===401?"unauthenticated":"unavailable",authenticated:error.status!==401},error.status);
 }
 const value=error as {code?:unknown;cause?:{code?:unknown};message?:unknown;name?:unknown};
 const sqlCode=String(value?.code??value?.cause?.code??"");
 const message=typeof value?.message==="string"?value.message:"";
 let code="unavailable";
 if(phase.startsWith("database")){
  code="database_connection";
  if(!process.env.VEDHA_DATABASE_URL||/not configured/i.test(message))code="database_configuration";
  else if(sqlCode==="42P01"||sqlCode==="42883")code="database_schema";
  else if(sqlCode==="28P01"||sqlCode==="28000")code="database_credentials";
  else if(sqlCode==="42501")code="database_permissions";
 }else if(phase==="ai_generation")code=error instanceof GenerationFailure?"ai_"+error.reason:"ai_generation";
 else if(phase==="market_data")code="market_data_processing";
 // Never print connection strings, raw provider responses, query parameters or credentials.
 console.error("Vedha diagnostic",{phase,code,errorType:typeof value?.name==="string"?value.name:"UnknownError",sqlCode:/^[A-Z0-9]{5}$/.test(sqlCode)?sqlCode:undefined});
 const capacity=error instanceof GenerationFailure&&error.reason==="capacity";
 const publicDetail=capacity
  ?"Vedha is experiencing high demand. Please try again in a few minutes."
  :"Vedha could not complete your analysis right now. Please try again shortly.";
 return json({detail:publicDetail+" Your free preview is used only after an analysis is successfully saved.",code:capacity?"temporarily_busy":"unavailable",authenticated:true},503);
}
export async function GET(request:NextRequest){let phase="membership";try{
 const a=await access();const context=parseContext(Object.fromEntries(request.nextUrl.searchParams));
 const id=request.nextUrl.searchParams.get("id")??undefined;if(id&&!/^[0-9a-f-]{36}$/i.test(id))return json({detail:"Invalid report identifier."},400);
 phase="database_read";
 return json({authenticated:true,tier:a.tier,...await store.view(a.owner,a.tier,context,id)});
 }catch(e){return errorResponse(e,phase);}}
export async function POST(request:NextRequest){let reservation:{owner:string;id:string}|undefined;let phase="configuration";try{
 configured();
 const origin=request.headers.get("origin");if(origin&&origin!==request.nextUrl.origin)return json({detail:"Cross-origin requests are not permitted."},403);
 if(request.headers.get("sec-fetch-site")==="cross-site")return json({detail:"Cross-site requests are not permitted."},403);
 if(!request.headers.get("content-type")?.includes("application/json"))return json({detail:"JSON is required."},415);
 phase="membership";const a=await access();const bodyText=await request.text();if(bodyText.length>1024)return json({detail:"Request is too large."},413);
 let context;try{context=parseContext(JSON.parse(bodyText));}catch{return json({detail:"Invalid company, exchange or timeframe."},400);}
 const limit=a.tier==="FREE"?1:Number(process.env.VEDHA_PREMIUM_MONTHLY_LIMIT);
 if(!Number.isInteger(limit)||limit<1||limit>10000)throw new VedhaError(503,"configuration","Premium usage allowance is not configured.");
 const id=randomUUID();const bucket=a.tier==="FREE"?"preview":Math.floor(Date.now()/900000).toString();
 const key=createHash("sha256").update(JSON.stringify({context,tier:a.tier,bucket,version:"vedha-2.0"})).digest("hex");
 phase="database_reservation";
 const r=await store.reserve(a.owner,id,key,a.tier,context,limit);
 if(r.code==="cached")return json({authenticated:true,tier:a.tier,status:"completed",report:r.report,cached:true});
 if(r.code==="upgrade")return json({authenticated:true,tier:a.tier,code:"upgrade",detail:"Your free Vedha preview is complete. Reopen that report at no charge, or upgrade for further analyses."},402);
 if(r.code==="busy")return json({authenticated:true,tier:a.tier,code:"busy",detail:"Your analysis is already running. Please wait.",retryAfter:3},409);
 if(r.code!=="reserved")return json({authenticated:true,tier:a.tier,code:r.code,detail:"Your current analysis allowance has been reached. Existing reports remain available."},429);
 reservation={owner:a.owner,id};phase="market_data";const evidence=await getEvidence(context,()=>store.stage(a.owner,id,"Calculating indicators, swings, Fibonacci and pivots"),request.headers.get("cookie")??undefined);
 phase="database_stage";await store.stage(a.owner,id,"Generating the six-layer explanation");
 phase="ai_generation";const output=await generate(evidence,a.tier,attempts=>store.usage(a.owner,id,attempts));
 phase="database_completion";await store.stage(a.owner,id,"Validating evidence references and saving report");
 const report:Report={id,tier:a.tier,evidence,narrative:output.narrative,provider:output.provider,model:output.model,generatedAt:new Date().toISOString()};
 await store.complete(a.owner,id,report,output.attempts);
 return json({authenticated:true,tier:a.tier,status:"completed",previewUsed:a.tier==="FREE",report});
 }catch(e){if(reservation)try{await store.fail(reservation.owner,reservation.id);}catch{}return errorResponse(e,phase);}}
