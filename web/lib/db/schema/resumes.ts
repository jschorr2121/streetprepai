import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const resumes = pgTable("resumes", {
  id: text("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  rawText: text("raw_text"),
  critique: jsonb("critique"),
  versionLabel: text("version_label"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
