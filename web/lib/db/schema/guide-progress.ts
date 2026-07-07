import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const guideProgress = pgTable("guide_progress", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  guideSlug: text("guide_slug").notNull(),
  readAt: timestamp("read_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  completed: boolean("completed").notNull().default(false),
});
