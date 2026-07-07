import { date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
  id: text("id").notNull().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  firm: text("firm"),
  groupName: text("group_name"),
  title: text("title"),
  school: text("school"),
  gradYear: integer("grad_year"),
  howMet: text("how_met"),
  stage: text("stage"),
  tags: text("tags").array(),
  linkedinUrl: text("linkedin_url"),
  linkedinBio: text("linkedin_bio"),
  lastInteractionAt: date("last_interaction_at"),
  lastContactAt: date("last_contact_at"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
