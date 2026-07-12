import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Shared content — read-only to users, seeded via service role.
export const qbankQuestions = pgTable("qbank_questions", {
  id: text("id").notNull().primaryKey(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  questionType: text("question_type").notNull(),
  prompt: text("prompt").notNull(),
  keyPoints: jsonb("key_points").notNull().default([]),
  misconceptions: jsonb("misconceptions").notNull().default([]),
  modelAnswer: text("model_answer").notNull(),
  chapterSlug: text("chapter_slug"),
  sectionSlug: text("section_slug"),
  advanced: boolean("advanced").notNull().default(false),
  source: text("source").notNull().default("curated"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const qbankFollowups = pgTable("qbank_followups", {
  id: text("id").notNull().primaryKey(),
  questionId: text("question_id").notNull(),
  ordinal: integer("ordinal").notNull(),
  prompt: text("prompt").notNull(),
  modelAnswer: text("model_answer").notNull(),
});

// User state — RLS owner-scoped.
export const qbankAttempts = pgTable("qbank_attempts", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questionId: text("question_id").notNull(),
  followupId: text("followup_id"),
  answer: text("answer").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  correct: boolean("correct").notNull(),
  rubricBreakdown: jsonb("rubric_breakdown").notNull().default({}),
  context: text("context").notNull().default("qbank"),
  answeredAt: timestamp("answered_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const qbankSpacedState = pgTable(
  "qbank_spaced_state",
  {
    userId: uuid("user_id").notNull(),
    questionId: text("question_id").notNull(),
    nextDueAt: timestamp("next_due_at", { withTimezone: true, mode: "string" }).notNull(),
    intervalDays: integer("interval_days").notNull().default(2),
    consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.questionId] })],
);
