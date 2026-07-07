import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const firms = pgTable("firms", {
  slug: text("slug").notNull().primaryKey(),
  name: text("name").notNull(),
  tier: text("tier").notNull(),
  hq: text("hq"),
  description: text("description"),
  latestEarningsRaw: text("latest_earnings_raw"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
