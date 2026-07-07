import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").notNull().primaryKey(),
  fullName: text("full_name"),
  school: text("school"),
  graduationYear: integer("graduation_year"),
  targetRoles: text("target_roles").array(),
  targetFirms: text("target_firms").array(),
  bioSummary: text("bio_summary"),
  resumeRawText: text("resume_raw_text"),
  experiences: jsonb("experiences"),
  education: jsonb("education"),
  skills: text("skills").array(),
  currentSemester: text("current_semester"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true, mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
