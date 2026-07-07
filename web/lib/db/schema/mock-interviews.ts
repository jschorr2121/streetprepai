import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const mockInterviews = pgTable("mock_interviews", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questionText: text("question_text").notNull(),
  mode: text("mode").notNull(),
  transcript: text("transcript"),
  scorecard: jsonb("scorecard"),
  audioMetrics: jsonb("audio_metrics"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
