import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const appliedJobs = pgTable("applied_jobs", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  firm: text("firm").notNull(),
  role: text("role").notNull(),
  groupName: text("group_name"),
  deadline: date("deadline"),
  url: text("url"),
  stage: text("stage").notNull(),
  notes: text("notes"),
  addedAt: timestamp("added_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
