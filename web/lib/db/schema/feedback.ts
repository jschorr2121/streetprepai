import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// In-app feedback widget submissions. One row per submission — no editing,
// no admin UI yet (rows are triaged directly via Supabase).
export const feedback = pgTable("feedback", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  route: text("route").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
