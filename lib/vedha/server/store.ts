import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Context, Report, Tier } from "../contracts";
export function database() {
 const url=process.env.VEDHA_DATABASE_URL;
 if(!url)throw new Error("Vedha database is not configured.");
 return neon(url,{fetchOptions:{signal:AbortSignal.timeout(8000)}});
}
export async function reserve(owner:string,id:string,key:string,tier:Tier,context:Context,limit:number){
 const sql=database();const rows=await sql`SELECT vedha_reserve(${owner},${id}::uuid,${key},${tier},${JSON.stringify(context)}::jsonb,${limit}) AS result`;
 return rows[0].result as {code:string;id?:string;report?:Report};
}
export async function complete(owner:string,id:string,report:Report,usage:unknown){
 const rows=await database()`SELECT vedha_complete(${owner},${id}::uuid,${JSON.stringify(report)}::jsonb,${JSON.stringify(usage)}::jsonb) AS saved`;
 if(rows[0]?.saved!==true)throw new Error("The report reservation expired before completion.");
}
export async function stage(owner:string,id:string,message:string){await database()`UPDATE vedha_reports SET stage=${message} WHERE owner_id=${owner} AND id=${id}::uuid AND status='running' AND lease_until>now()`;}
export async function fail(owner:string,id:string){await database()`UPDATE vedha_reports SET status='failed',stage='Analysis could not be completed. Please retry.' WHERE owner_id=${owner} AND id=${id}::uuid AND status='running'`;}
export async function view(owner:string,tier:Tier,context:Context,id?:string){
 const sql=database();const accounts=await sql`SELECT preview_used FROM vedha_accounts WHERE owner_id=${owner}`;
 const rows=id?await sql`SELECT id,status,stage,report,lease_until FROM vedha_reports WHERE owner_id=${owner} AND id=${id}::uuid AND (${tier}='PREMIUM' OR tier='FREE') LIMIT 1`:
 await sql`SELECT id,status,stage,report,lease_until FROM vedha_reports WHERE owner_id=${owner} AND context=${JSON.stringify(context)}::jsonb AND (${tier}='PREMIUM' OR tier='FREE') ORDER BY created_at DESC LIMIT 1`;
 const row=rows[0];const expired=row?.status==='running'&&Date.parse(row.lease_until)<=Date.now();
 return {previewUsed:accounts[0]?.preview_used===true,status:expired?'failed':row?.status??'idle',stage:expired?'Previous analysis expired. You can retry.':row?.stage,report:row?.status==='completed'?row.report as Report:undefined};
}
export async function usage(owner:string,id:string,attempts:unknown){await database()`UPDATE vedha_reports SET provider_usage=${JSON.stringify(attempts)}::jsonb WHERE owner_id=${owner} AND id=${id}::uuid AND status='running'`;}
