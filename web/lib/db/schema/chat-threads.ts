import { bigint, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Standalone assistant chat (Unit 9) — distinct from `chats` (networking call logs).
export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  // Identity column — total order within a thread (created_at ties in batches).
  seq: bigint("seq", { mode: "number" }).generatedAlwaysAsIdentity(),
  threadId: uuid("thread_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull(),
  // The AI SDK UIMessage `parts` array (text parts today; tool parts in issue 02).
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
