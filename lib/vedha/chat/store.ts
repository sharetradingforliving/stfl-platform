import "server-only";
import { database } from "../server/store";
import type { Context } from "../contracts";
import type { Answer, Conversation, Turn } from "./contracts";
export async function list(owner: string) {
  return (await database()`SELECT id,context,title,updated_at FROM vedha_chat_conversations WHERE owner_id=${owner} ORDER BY updated_at DESC LIMIT 100`) as Conversation[];
}
export async function read(owner: string, id: string) {
  const conversations =
    await database()`SELECT id,context,title,updated_at FROM vedha_chat_conversations WHERE owner_id=${owner} AND id=${id}::uuid`;
  if (!conversations[0]) return null;
  const turns =
    await database()`SELECT id,question,answer,created_at FROM vedha_chat_turns WHERE owner_id=${owner} AND conversation_id=${id}::uuid AND status='completed' ORDER BY created_at,id LIMIT 100`;
  return {
    conversation: conversations[0] as Conversation,
    turns: turns as Turn[],
  };
}
export async function reserve(
  owner: string,
  conversation: string,
  id: string,
  context: Context,
  question: string,
  limit: number,
) {
  const rows =
    await database()`SELECT vedha_chat_reserve(${owner},${conversation}::uuid,${id}::uuid,${JSON.stringify(context)}::jsonb,${question},${limit}) AS result`;
  return rows[0].result as { code: string; answer?: Answer };
}
export async function complete(
  owner: string,
  id: string,
  answer: Answer,
  usage: unknown,
) {
  const rows =
    await database()`SELECT vedha_chat_complete(${owner},${id}::uuid,${JSON.stringify(answer)}::jsonb,${JSON.stringify(usage)}::jsonb) AS saved`;
  if (rows[0]?.saved !== true) throw new Error("Chat lease expired.");
}
export async function fail(owner: string, id: string) {
  await database()`SELECT vedha_chat_fail(${owner},${id}::uuid)`;
}
export async function remove(owner: string, id: string) {
  await database()`DELETE FROM vedha_chat_conversations c WHERE c.owner_id=${owner} AND c.id=${id}::uuid AND NOT EXISTS(SELECT 1 FROM vedha_chat_turns t WHERE t.conversation_id=c.id AND t.status='running' AND t.lease_until>now())`;
}
