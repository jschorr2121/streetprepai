import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: text("id").notNull().primaryKey(),
  firmSlug: text("firm_slug"),
  firm: text("firm").notNull(),
  role: text("role").notNull(),
  groupName: text("group_name"),
  location: text("location"),
  yearTarget: text("year_target"),
  deadline: date("deadline"),
  url: text("url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
