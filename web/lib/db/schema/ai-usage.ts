import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  endpoint: text("endpoint").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cacheReadTokens: integer("cache_read_tokens").notNull(),
  cacheWriteTokens: integer("cache_write_tokens").notNull(),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
