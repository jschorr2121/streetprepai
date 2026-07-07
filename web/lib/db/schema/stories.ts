import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const stories = pgTable("stories", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  rawExperience: text("raw_experience").notNull(),
  framings: jsonb("framings").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
