import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const interviewSessions = pgTable("interview_sessions", {
  id: text("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  question: text("question"),
  transcript: text("transcript"),
  score: jsonb("score"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
