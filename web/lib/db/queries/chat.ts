import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { Executor } from "@/lib/db/client";
import { chatMessages, chatThreads } from "@/lib/db/schema";

// Persisted subset of the AI SDK UIMessage: text parts only for now (issue 02
// extends this union with tool parts — jsonb column needs no change).
const StoredPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});
const StoredPartsSchema = z.array(StoredPartSchema);

export type StoredPart = z.infer<typeof StoredPartSchema>;

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
