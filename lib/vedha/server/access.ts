import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { Tier } from "../contracts";
export class VedhaError extends Error { constructor(public status:number,public code:string,message:string){super(message);} }
export async function access():Promise<{owner:string;tier:Tier}>{
 const {userId,getToken}=await auth();if(!userId)throw new VedhaError(401,"sign_in","Sign in for your free Vedha preview.");
 const base=process.env.STFL_BACKEND_URL,token=await getToken();
 if(!base||!token)throw new VedhaError(503,"subscription","Membership verification is temporarily unavailable.");
 try{
 const r=await fetch(`${base.replace(/\/$/,"")}/api/subscription/status`,{headers:{Accept:"application/json",Authorization:`Bearer ${token}`},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(6000)});
 if(!r.ok)throw new Error("Membership service unavailable");const b=await r.json();
 if(typeof b.is_premium!=="boolean")throw new Error("Invalid membership response");
 return {owner:userId,tier:b.is_premium?"PREMIUM":"FREE"};
 }catch{throw new VedhaError(503,"subscription","Unable to verify membership. No analysis has been charged.");}
}
export function configured(){
 if(process.env.VEDHA_ENABLED!=="true")throw new VedhaError(503,"disabled","Vedha AI is not enabled yet.");
 for(const key of ["OPENAI_API_KEY","VEDHA_OPENAI_MODEL","VEDHA_DATABASE_URL","VEDHA_INTERNAL_ORIGIN"]){if(!process.env[key])throw new VedhaError(503,"configuration","Vedha server configuration is incomplete.");}
}
