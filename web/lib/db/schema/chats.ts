import { jsonb, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: text("id").notNull().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: text("contact_id").notNull(),
  happenedAt: timestamp("happened_at", { withTimezone: true, mode: "string" }).notNull(),
  rawNotes: text("raw_notes"),
  structured: jsonb("structured"),
  followUpDraft: jsonb("follow_up_draft"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
