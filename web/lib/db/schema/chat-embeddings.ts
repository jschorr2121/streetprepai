import { pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const chatEmbeddings = pgTable("chat_embeddings", {
  chatId: text("chat_id").notNull().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: text("contact_id").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  summaryText: text("summary_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
