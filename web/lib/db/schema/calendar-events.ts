import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const calendarEvents = pgTable("calendar_events", {
  id: text("id").notNull().primaryKey(),
  userId: uuid("user_id").notNull(),
  contactId: text("contact_id"),
  chatLogId: text("chat_log_id"),
  title: text("title").notNull(),
  kind: text("kind"),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
  durationMinutes: integer("duration_minutes"),
  location: text("location"),
  status: text("status"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
