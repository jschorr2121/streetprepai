/**
 * PGlite-backed tests for `lib/db/queries/qbank.ts`.
 *
 * Uses an in-memory Postgres instance (via `tests/helpers/pglite-db.ts`) so
 * the WHERE clauses, the `not exists (... correct = true)` mastery filter,
 * and the spaced-review due-date filtering are verified by real SQL
 * execution rather than a stub that ignores query conditions.
 */

import { describe, expect, it, beforeEach } from "vitest";

import {
  getQuestionById,
  listRecentAttempts,
  listSittingScores,
  pickQuestion,
  recordAttempt,
  getSpacedState,
  upsertSpacedState,
  listDueReviews,
  countDueReviews,
} from "@/lib/db/queries/qbank";
import { qbankAttempts, qbankQuestions } from "@/lib/db/schema";
import type { Executor } from "@/lib/db/client";
import { createPgliteDb } from "../../../../helpers/pglite-db";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let db: Executor;

beforeEach(async () => {
  db = await createPgliteDb();
});

// A minimal, valid question row — override fields per test.
async function seedQuestion(overrides: Partial<typeof qbankQuestions.$inferInsert> = {}) {
  await db.insert(qbankQuestions).values({
    id: "q-1",
    topic: "valuation",
    difficulty: "medium",
    questionType: "conceptual",
    prompt: "What is WACC?",
    modelAnswer: "Weighted average cost of capital.",
    ...overrides,
  });
}

// ─── pickQuestion ──────────────────────────────────────────────────────────────

describe("pickQuestion", () => {
  it("returns null when no question matches the filters", async () => {
    const result = await pickQuestion(db, { userId: USER_A, topic: "valuation" });
    expect(result).toBeNull();
  });

  it("filters by topic", async () => {
    await seedQuestion({ id: "q-val", topic: "valuation" });
    await seedQuestion({ id: "q-lbo", topic: "lbo" });

    const result = await pickQuestion(db, { userId: USER_A, topic: "lbo" });
    expect(result?.id).toBe("q-lbo");
  });

  it("filters by difficulty", async () => {
    await seedQuestion({ id: "q-easy", difficulty: "easy" });
    await seedQuestion({ id: "q-hard", difficulty: "hard" });

    const result = await pickQuestion(db, { userId: USER_A, difficulty: "hard" });
    expect(result?.id).toBe("q-hard");
  });

  it("excludes advanced questions unless includeAdvanced is set", async () => {
    await seedQuestion({ id: "q-core", advanced: false });
    await seedQuestion({ id: "q-adv", advanced: true });

    const result = await pickQuestion(db, { userId: USER_A });
    expect(result?.id).toBe("q-core");
  });

  it("includes advanced questions when includeAdvanced is true", async () => {
    // Mark the core question as already mastered so only the advanced one is
    // "fresh" — keeps the assertion deterministic despite `order by random()`.
    await seedQuestion({ id: "q-core", advanced: false });
    await seedQuestion({ id: "q-adv", advanced: true });
    await recordAttempt(db, {
      userId: USER_A,
      questionId: "q-core",
      answer: "x",
      score: 100,
      correct: true,
      rubricBreakdown: {},
      context: "qbank",
    });

    const result = await pickQuestion(db, { userId: USER_A, includeAdvanced: true });
    expect(result?.id).toBe("q-adv");
  });

  it("excludes questions this user has already answered correctly", async () => {
    await seedQuestion({ id: "q-mastered", topic: "valuation" });
    await seedQuestion({ id: "q-fresh", topic: "valuation" });
    await recordAttempt(db, {
      userId: USER_A,
      questionId: "q-mastered",
      answer: "correct answer",
      score: 95,
      correct: true,
      rubricBreakdown: {},
      context: "qbank",
    });

    const result = await pickQuestion(db, { userId: USER_A, topic: "valuation" });
    expect(result?.id).toBe("q-fresh");
  });

  it("falls back to any matching question once everything is mastered", async () => {
    await seedQuestion({ id: "q-only" });
    await recordAttempt(db, {
      userId: USER_A,
      questionId: "q-only",
      answer: "correct answer",
      score: 95,
      correct: true,
      rubricBreakdown: {},
      context: "qbank",
    });

    const result = await pickQuestion(db, { userId: USER_A });
    expect(result?.id).toBe("q-only");
  });

  it("a correct answer from another user does not exclude the question for this user", async () => {
    await seedQuestion({ id: "q-shared" });
    await recordAttempt(db, {
      userId: USER_B,
      questionId: "q-shared",
      answer: "correct answer",
      score: 95,
      correct: true,
      rubricBreakdown: {},
      context: "qbank",
    });

    const result = await pickQuestion(db, { userId: USER_A });
    expect(result?.id).toBe("q-shared");
  });

  it("ignores inactive questions", async () => {
    await seedQuestion({ id: "q-inactive", active: false });
    const result = await pickQuestion(db, { userId: USER_A });
    expect(result).toBeNull();
  });
});

// ─── getQuestionById ───────────────────────────────────────────────────────────

describe("getQuestionById", () => {
  it("returns the mapped question when found", async () => {
    await seedQuestion({
      id: "q-1",
      topic: "valuation",
      difficulty: "medium",
      questionType: "conceptual",
      prompt: "What is WACC?",
      modelAnswer: "Weighted average cost of capital.",
      chapterSlug: "ch-1",
      sectionSlug: "sec-1",
    });

    const q = await getQuestionById(db, "q-1");
    expect(q).not.toBeNull();
    expect(q!.id).toBe("q-1");
    expect(q!.topic).toBe("valuation");
    expect(q!.difficulty).toBe("medium");
    expect(q!.questionType).toBe("conceptual");
    expect(q!.prompt).toBe("What is WACC?");
    expect(q!.modelAnswer).toBe("Weighted average cost of capital.");
    expect(q!.chapterSlug).toBe("ch-1");
    expect(q!.sectionSlug).toBe("sec-1");
    expect(q!.advanced).toBe(false);
  });

  it("returns null when the question does not exist", async () => {
    const q = await getQuestionById(db, "missing");
    expect(q).toBeNull();
  });
});

// ─── recordAttempt + listRecentAttempts ────────────────────────────────────────

describe("recordAttempt + listRecentAttempts", () => {
  it("returns an empty array when the user has no attempts", async () => {
    const result = await listRecentAttempts(db, USER_A, 10);
    expect(result).toEqual([]);
  });

  it("records an attempt and lists it back with mapped fields", async () => {
    await seedQuestion({ id: "q-1" });
    await recordAttempt(db, {
      userId: USER_A,
      questionId: "q-1",
      answer: "my answer",
      score: 82.5,
      correct: true,
      rubricBreakdown: { keyPointResults: [] },
      context: "qbank",
    });

    const attempts = await listRecentAttempts(db, USER_A, 10);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.questionId).toBe("q-1");
    expect(attempts[0]!.score).toBe(82.5);
    expect(attempts[0]!.correct).toBe(true);
    expect(attempts[0]!.answeredAt).toBeTruthy();
  });

  it("orders attempts most-recent first", async () => {
    await seedQuestion({ id: "q-1" });
    await seedQuestion({ id: "q-2" });

    await db.insert(qbankAttempts).values([
      {
        userId: USER_A,
        questionId: "q-1",
        answer: "first",
        score: "50.00",
        correct: false,
        answeredAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)).toISOString(),
      },
      {
        userId: USER_A,
        questionId: "q-2",
        answer: "second",
        score: "90.00",
        correct: true,
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 0, 0)).toISOString(),
      },
    ]);

    const attempts = await listRecentAttempts(db, USER_A, 10);
    expect(attempts.map((a) => a.questionId)).toEqual(["q-2", "q-1"]);
  });

  it("respects the limit", async () => {
    await seedQuestion({ id: "q-1" });
    for (let i = 0; i < 5; i++) {
      await recordAttempt(db, {
        userId: USER_A,
        questionId: "q-1",
        answer: `answer-${i}`,
        score: 50,
        correct: false,
        rubricBreakdown: {},
        context: "qbank",
      });
    }

    const attempts = await listRecentAttempts(db, USER_A, 2);
    expect(attempts).toHaveLength(2);
  });

  // TWO-USER ISOLATION.
  it("does not return attempts belonging to another user", async () => {
    await seedQuestion({ id: "q-1" });
    await recordAttempt(db, {
      userId: USER_A,
      questionId: "q-1",
      answer: "a's answer",
      score: 70,
      correct: false,
      rubricBreakdown: {},
      context: "qbank",
    });
    await recordAttempt(db, {
      userId: USER_B,
      questionId: "q-1",
      answer: "b's answer",
      score: 60,
      correct: false,
      rubricBreakdown: {},
      context: "qbank",
    });

    const attemptsA = await listRecentAttempts(db, USER_A, 10);
    const attemptsB = await listRecentAttempts(db, USER_B, 10);
    expect(attemptsA).toHaveLength(1);
    expect(attemptsA[0]!.score).toBe(70);
    expect(attemptsB).toHaveLength(1);
    expect(attemptsB[0]!.score).toBe(60);
  });
});

// ─── listSittingScores ─────────────────────────────────────────────────────────

describe("listSittingScores", () => {
  const CHAPTER = "accounting";
  const SINCE = new Date(Date.UTC(2026, 0, 1, 0, 0, 0)).toISOString();

  async function seedGateQuestion(id: string) {
    await seedQuestion({ id, topic: "accounting", chapterSlug: CHAPTER, sectionSlug: null });
  }

  it("returns the latest main attempt per question, scored and deduped", async () => {
    await seedGateQuestion("q-1");
    await seedGateQuestion("q-2");
    await db.insert(qbankAttempts).values([
      {
        userId: USER_A,
        questionId: "q-1",
        answer: "first try",
        score: "40.00",
        correct: false,
        context: "chapter-gate",
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 0, 0)).toISOString(),
      },
      {
        userId: USER_A,
        questionId: "q-1",
        answer: "second try",
        score: "80.00",
        correct: true,
        context: "chapter-gate",
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 5, 0)).toISOString(),
      },
      {
        userId: USER_A,
        questionId: "q-2",
        answer: "only try",
        score: "90.00",
        correct: true,
        context: "chapter-gate",
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 6, 0)).toISOString(),
      },
    ]);

    const scores = await listSittingScores(db, {
      userId: USER_A,
      context: "chapter-gate",
      chapterSlug: CHAPTER,
      sinceIso: SINCE,
    });

    expect(scores).toHaveLength(2);
    const byQ = Object.fromEntries(scores.map((s) => [s.questionId, s.score]));
    expect(byQ["q-1"]).toBe(80); // latest main attempt wins, not the earlier 40
    expect(byQ["q-2"]).toBe(90);
  });

  // BUG A regression: a follow-up shares its parent's questionId and is graded
  // on a harder rubric. It must NOT win the latest-per-question dedup and
  // replace the main answer's score in the sitting average.
  it("excludes follow-up attempts so they cannot overwrite the main score", async () => {
    await seedGateQuestion("q-1");
    await db.insert(qbankAttempts).values([
      {
        userId: USER_A,
        questionId: "q-1",
        answer: "main answer",
        score: "90.00",
        correct: true,
        context: "chapter-gate",
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 0, 0)).toISOString(),
      },
      {
        userId: USER_A,
        questionId: "q-1",
        followupId: "f-1",
        answer: "follow-up answer",
        score: "30.00",
        correct: false,
        context: "chapter-gate",
        // Later than the main attempt — would win the dedup without the filter.
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 10, 0)).toISOString(),
      },
    ]);

    const scores = await listSittingScores(db, {
      userId: USER_A,
      context: "chapter-gate",
      chapterSlug: CHAPTER,
      sinceIso: SINCE,
    });

    expect(scores).toHaveLength(1);
    expect(scores[0]!.score).toBe(90);
  });

  // BUG A regression: a follow-up answered without a main attempt in the window
  // must not create a phantom distinct-question row that pads the sitting count.
  it("does not count a follow-up-only row toward the distinct-question count", async () => {
    await seedGateQuestion("q-1");
    await db.insert(qbankAttempts).values({
      userId: USER_A,
      questionId: "q-1",
      followupId: "f-1",
      answer: "follow-up only",
      score: "100.00",
      correct: true,
      context: "chapter-gate",
      answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 0, 0)).toISOString(),
    });

    const scores = await listSittingScores(db, {
      userId: USER_A,
      context: "chapter-gate",
      chapterSlug: CHAPTER,
      sinceIso: SINCE,
    });

    expect(scores).toEqual([]);
  });

  it("filters by context and section", async () => {
    await seedQuestion({
      id: "q-sec",
      chapterSlug: CHAPTER,
      sectionSlug: "income-statement-anatomy",
    });
    await seedQuestion({ id: "q-other-sec", chapterSlug: CHAPTER, sectionSlug: "balance-sheet" });
    await db.insert(qbankAttempts).values([
      {
        userId: USER_A,
        questionId: "q-sec",
        answer: "a",
        score: "70.00",
        correct: true,
        context: "section-drill",
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 0, 0)).toISOString(),
      },
      {
        userId: USER_A,
        questionId: "q-other-sec",
        answer: "b",
        score: "80.00",
        correct: true,
        context: "section-drill",
        answeredAt: new Date(Date.UTC(2026, 0, 2, 12, 0, 0)).toISOString(),
      },
    ]);

    const scores = await listSittingScores(db, {
      userId: USER_A,
      context: "section-drill",
      chapterSlug: CHAPTER,
      sectionSlug: "income-statement-anatomy",
      sinceIso: SINCE,
    });

    expect(scores.map((s) => s.questionId)).toEqual(["q-sec"]);
  });
});

// ─── getSpacedState + upsertSpacedState ────────────────────────────────────────

describe("getSpacedState + upsertSpacedState", () => {
  it("returns null when no spaced state exists", async () => {
    const state = await getSpacedState(db, USER_A, "q-1");
    expect(state).toBeNull();
  });

  it("round-trips a freshly inserted state", async () => {
    const nextDueAt = new Date(Date.UTC(2026, 6, 20, 0, 0, 0)).toISOString();
    await upsertSpacedState(db, USER_A, {
      questionId: "q-1",
      nextDueAt,
      intervalDays: 3,
      consecutiveCorrect: 1,
    });

    const state = await getSpacedState(db, USER_A, "q-1");
    expect(state).not.toBeNull();
    expect(state!.questionId).toBe("q-1");
    // PGlite returns timestamptz as a Postgres-formatted string, not ISO —
    // compare parsed instants rather than raw text.
    expect(new Date(state!.nextDueAt).toISOString()).toBe(nextDueAt);
    expect(state!.intervalDays).toBe(3);
    expect(state!.consecutiveCorrect).toBe(1);
  });

  it("updates an existing state on conflict rather than duplicating the row", async () => {
    await upsertSpacedState(db, USER_A, {
      questionId: "q-1",
      nextDueAt: new Date(Date.UTC(2026, 6, 20)).toISOString(),
      intervalDays: 2,
      consecutiveCorrect: 0,
    });

    const secondDueAt = new Date(Date.UTC(2026, 6, 22)).toISOString();
    await upsertSpacedState(db, USER_A, {
      questionId: "q-1",
      nextDueAt: secondDueAt,
      intervalDays: 3,
      consecutiveCorrect: 1,
    });

    const state = await getSpacedState(db, USER_A, "q-1");
    expect(new Date(state!.nextDueAt).toISOString()).toBe(secondDueAt);
    expect(state!.intervalDays).toBe(3);
    expect(state!.consecutiveCorrect).toBe(1);
  });

  it("isolates spaced state between users for the same question", async () => {
    await upsertSpacedState(db, USER_A, {
      questionId: "q-1",
      nextDueAt: new Date(Date.UTC(2026, 6, 20)).toISOString(),
      intervalDays: 2,
      consecutiveCorrect: 0,
    });

    const stateB = await getSpacedState(db, USER_B, "q-1");
    expect(stateB).toBeNull();
  });
});

// ─── listDueReviews + countDueReviews ──────────────────────────────────────────

describe("listDueReviews + countDueReviews", () => {
  const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // yesterday — due
  const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow — not due

  beforeEach(async () => {
    await seedQuestion({ id: "q-due-1", topic: "valuation" });
    await seedQuestion({ id: "q-due-2", topic: "lbo" });
    await seedQuestion({ id: "q-not-due", topic: "accounting" });
  });

  it("lists only due questions, oldest due first", async () => {
    const olderDue = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await upsertSpacedState(db, USER_A, {
      questionId: "q-due-1",
      nextDueAt: PAST,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });
    await upsertSpacedState(db, USER_A, {
      questionId: "q-due-2",
      nextDueAt: olderDue,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });
    await upsertSpacedState(db, USER_A, {
      questionId: "q-not-due",
      nextDueAt: FUTURE,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });

    const due = await listDueReviews(db, USER_A, 10);
    expect(due.map((q) => q.id)).toEqual(["q-due-2", "q-due-1"]);
  });

  it("respects the limit", async () => {
    await upsertSpacedState(db, USER_A, {
      questionId: "q-due-1",
      nextDueAt: PAST,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });
    await upsertSpacedState(db, USER_A, {
      questionId: "q-due-2",
      nextDueAt: PAST,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });

    const due = await listDueReviews(db, USER_A, 1);
    expect(due).toHaveLength(1);
  });

  it("countDueReviews counts only due rows", async () => {
    await upsertSpacedState(db, USER_A, {
      questionId: "q-due-1",
      nextDueAt: PAST,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });
    await upsertSpacedState(db, USER_A, {
      questionId: "q-not-due",
      nextDueAt: FUTURE,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });

    expect(await countDueReviews(db, USER_A)).toBe(1);
  });

  it("returns 0 / empty when the user has no spaced state", async () => {
    expect(await countDueReviews(db, USER_A)).toBe(0);
    expect(await listDueReviews(db, USER_A, 10)).toEqual([]);
  });

  // TWO-USER ISOLATION.
  it("does not surface another user's due reviews", async () => {
    await upsertSpacedState(db, USER_A, {
      questionId: "q-due-1",
      nextDueAt: PAST,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });
    await upsertSpacedState(db, USER_B, {
      questionId: "q-due-2",
      nextDueAt: PAST,
      intervalDays: 2,
      consecutiveCorrect: 0,
    });

    const dueA = await listDueReviews(db, USER_A, 10);
    expect(dueA.map((q) => q.id)).toEqual(["q-due-1"]);
    expect(await countDueReviews(db, USER_A)).toBe(1);
    expect(await countDueReviews(db, USER_B)).toBe(1);
  });
});
