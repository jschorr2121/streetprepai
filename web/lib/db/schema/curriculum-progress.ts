import { integer, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const topicMastery = pgTable(
  "topic_mastery",
  {
    userId: uuid("user_id").notNull(),
    topic: text("topic").notNull(),
    score: numeric("score", { precision: 4, scale: 3 }).notNull().default("0"),
    attempts: integer("attempts").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topic] })],
);

export const sectionProgress = pgTable(
  "section_progress",
  {
    userId: uuid("user_id").notNull(),
    chapterSlug: text("chapter_slug").notNull(),
    sectionSlug: text("section_slug").notNull(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    drillScore: numeric("drill_score", { precision: 5, scale: 2 }),
    drillCompletedAt: timestamp("drill_completed_at", { withTimezone: true, mode: "string" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.chapterSlug, t.sectionSlug] })],
);

export const chapterProgress = pgTable(
  "chapter_progress",
  {
    userId: uuid("user_id").notNull(),
    chapterSlug: text("chapter_slug").notNull(),
    gateScore: numeric("gate_score", { precision: 5, scale: 2 }),
    gatePassedAt: timestamp("gate_passed_at", { withTimezone: true, mode: "string" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.chapterSlug] })],
);
