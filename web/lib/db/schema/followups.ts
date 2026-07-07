import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const followups = pgTable("followups", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  contactId: text("contact_id"),
  dueAt: date("due_at").notNull(),
  kind: text("kind").notNull(),
  note: text("note").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
});
