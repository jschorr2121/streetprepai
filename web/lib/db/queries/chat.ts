import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { Executor } from "@/lib/db/client";
import { chatMessages, chatThreads } from "@/lib/db/schema";

// Persisted subset of the AI SDK UIMessage parts: text parts plus SETTLED tool
// invocations (output-available / output-error). Transient states
// (input-streaming, approval-*) and step-start parts are never persisted.
// Unknown keys the SDK adds (e.g. `state: "done"` on text parts) are stripped.
const StoredTextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});
const StoredToolPartSchema = z.discriminatedUnion("state", [
  z.object({
    type: z.templateLiteral(["tool-", z.string()]),
    toolCallId: z.string(),
    state: z.literal("output-available"),
    input: z.json(),
    output: z.json(),
    // Provider-executed tools (web_search) must round-trip this flag so
    // convertToModelMessages rebuilds them as server tool calls on reload.
    providerExecuted: z.boolean().optional(),
  }),
  z.object({
    type: z.templateLiteral(["tool-", z.string()]),
    toolCallId: z.string(),
    state: z.literal("output-error"),
    // The SDK's UIMessage type requires the key to exist even when undefined.
    input: z.json().nullable().default(null),
    errorText: z.string(),
    providerExecuted: z.boolean().optional(),
  }),
]);
// Web-search citations (title + link) — persisted so sources survive reload.
const StoredSourcePartSchema = z.object({
  type: z.literal("source-url"),
  sourceId: z.string(),
  url: z.string(),
  title: z.string().optional(),
});
const StoredPartSchema = z.union([
  StoredTextPartSchema,
  StoredToolPartSchema,
  StoredSourcePartSchema,
]);
const StoredPartsSchema = z.array(StoredPartSchema);

export type StoredPart = z.infer<typeof StoredPartSchema>;

/**
 * Filter an untrusted/SDK-produced parts array down to the persistable subset.
 * Non-conforming parts (streaming states, step markers, empty text) are
 * dropped rather than failing the whole message.
 */
export function toStoredParts(parts: unknown): StoredPart[] {
  if (!Array.isArray(parts)) return [];
  const out: StoredPart[] = [];
  for (const raw of parts) {
    const parsed = StoredPartSchema.safeParse(raw);
    if (!parsed.success) continue;
    if (parsed.data.type === "text" && parsed.data.text.length === 0) continue;
    out.push(parsed.data);
  }
  return out;
}

export type ChatRole = "user" | "assistant";

/** Structurally satisfies the AI SDK `UIMessage` shape. */
export type ChatUIMessage = {
  id: string;
  role: ChatRole;
  parts: StoredPart[];
};

export type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export async function createThread(
  db: Executor,
  userId: string,
  threadId: string,
  title: string,
): Promise<void> {
  await db.insert(chatThreads).values({ id: threadId, userId, title });
}

export async function getThread(
  db: Executor,
  userId: string,
  threadId: string,
): Promise<ChatThread | null> {
  const rows = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, title: row.title, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

/**
 * Overwrite a thread's title (LLM auto-titling after the first exchange, or
 * any future manual rename). Scoped to the owning user like every other
 * write here — a foreign/missing thread id is a silent no-op.
 */
export async function updateThreadTitle(
  db: Executor,
  userId: string,
  threadId: string,
  title: string,
): Promise<void> {
  await db
    .update(chatThreads)
    .set({ title })
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)));
}

export async function listThreads(db: Executor, userId: string): Promise<ChatThread[]> {
  const rows = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .orderBy(desc(chatThreads.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getMessages(
  db: Executor,
  userId: string,
  threadId: string,
): Promise<ChatUIMessage[]> {
  const rows = await db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.threadId, threadId), eq(chatMessages.userId, userId)))
    .orderBy(asc(chatMessages.seq));

  const messages: ChatUIMessage[] = [];
  for (const row of rows) {
    const role = row.role === "user" || row.role === "assistant" ? row.role : null;
    const parts = StoredPartsSchema.safeParse(row.content);
    if (!role || !parts.success) {
      // A malformed row must not take the whole thread down — skip it.
      console.warn(`[db/chat] skipping malformed chat_messages row ${row.id}`);
      continue;
    }
    messages.push({ id: row.id, role, parts: parts.data });
  }
  return messages;
}

/**
 * Delete a thread owned by `userId`. Messages go with it via the FK's
 * ON DELETE CASCADE (migration 0010). Returns false when the thread doesn't
 * exist or belongs to someone else — callers surface that as NOT_FOUND.
 */
export async function deleteThread(
  db: Executor,
  userId: string,
  threadId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
    .returning({ id: chatThreads.id });
  return deleted.length > 0;
}

export async function appendMessages(
  db: Executor,
  userId: string,
  threadId: string,
  messages: Array<{ role: ChatRole; parts: StoredPart[] }>,
): Promise<void> {
  if (messages.length === 0) return;
  await db.insert(chatMessages).values(
    messages.map((m) => ({
      threadId,
      userId,
      role: m.role,
      content: m.parts,
    })),
  );
  await db
    .update(chatThreads)
    .set({ updatedAt: sql`now()` })
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)));
}
