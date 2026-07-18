/**
 * Unit coverage for `finishSittingAction` (app/(app)/learn/actions.ts) — the
 * chapter-gate / section-drill score recompute.
 *
 * Runs against a real PGlite database (via tests/helpers/pglite-db.ts) rather
 * than mocking lib/db/queries/qbank + lib/db/queries/curriculum: the bug this
 * covers is precisely about what the *real* listSittingScores/count queries
 * return, so a mock that hands back whatever the test wants would defeat the
 * point. Only auth, the rate limiter, and withUser's role-switch plumbing are
 * mocked — withUser is rewired to hand the callback the PGlite db directly.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

const { withUserMock, requireUserMock, limiterMock } = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  requireUserMock: vi.fn(),
  limiterMock: vi.fn(async () => ({ allowed: true as const })),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  curriculumProgressLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { finishSittingAction } from "@/app/(app)/learn/actions";
import { UnauthorizedError } from "@/lib/auth/server";
import type { Executor } from "@/lib/db/client";
import { qbankAttempts, qbankQuestions, chapterProgress } from "@/lib/db/schema";
import { createPgliteDb } from "../../helpers/pglite-db";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CHAPTER = "accounting"; // real gated chapter from lib/curriculum/chapters.ts
const GATE_QUESTION_COUNT = 8; // mirrors lib/curriculum/chapters.ts

let db: Executor;

async function seedGateQuestions(count: number) {
  const rows = Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    topic: "accounting",
    difficulty: "medium" as const,
    questionType: "conceptual" as const,
    prompt: `Question ${i}`,
    modelAnswer: "answer",
    chapterSlug: CHAPTER,
    sectionSlug: "income-statement-anatomy",
    advanced: false,
  }));
  await db.insert(qbankQuestions).values(rows);
}

async function recordGateAttempt(questionId: string, score: number, answeredAt: string) {
  await db.insert(qbankAttempts).values({
    userId: USER_ID,
    questionId,
    answer: "my answer",
    score: score.toFixed(2),
    correct: score >= 70,
    context: "chapter-gate",
    answeredAt,
  });
}

beforeEach(async () => {
  db = await createPgliteDb();
  withUserMock.mockReset();
  withUserMock.mockImplementation(async (_token: unknown, fn: (tx: Executor) => Promise<unknown>) =>
    fn(db),
  );
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: USER_ID });
  limiterMock.mockClear();
  limiterMock.mockResolvedValue({ allowed: true as const });
  await seedGateQuestions(GATE_QUESTION_COUNT);
});

describe("finishSittingAction — chapter gate", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await finishSittingAction({
      chapterSlug: CHAPTER,
      context: "chapter-gate",
      startedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a sitting with fewer attempts than the gate requires", async () => {
    const startedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    // Only 1 of the 8 required questions graded — the original exploit: grade
    // one easy question, call finishSittingAction, and its lone score would
    // otherwise be averaged in as if it were the whole 8-question gate.
    await recordGateAttempt("q-0", 100, new Date().toISOString());

    const result = await finishSittingAction({
      chapterSlug: CHAPTER,
      context: "chapter-gate",
      startedAt,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects padding via repeated attempts on the same question", async () => {
    const startedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    // 8 attempts, but all on the same question — listSittingScores dedupes to
    // the latest attempt per questionId, so this must still read as 1
    // distinct question, not 8.
    for (let i = 0; i < GATE_QUESTION_COUNT; i++) {
      await recordGateAttempt("q-0", 100, new Date(Date.now() + i).toISOString());
    }

    const result = await finishSittingAction({
      chapterSlug: CHAPTER,
      context: "chapter-gate",
      startedAt,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects a startedAt older than the sitting-duration window", async () => {
    // 8 distinct, fully-passing attempts — but startedAt claims the sitting
    // began 7 hours ago, well past the 6h bound. Must be rejected outright so
    // a crafted old startedAt can't sweep in unrelated historical attempts.
    const staleStartedAt = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
    for (let i = 0; i < GATE_QUESTION_COUNT; i++) {
      await recordGateAttempt(`q-${i}`, 95, new Date().toISOString());
    }

    const result = await finishSittingAction({
      chapterSlug: CHAPTER,
      context: "chapter-gate",
      startedAt: staleStartedAt,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("passes a legitimate full sitting and records the gate result", async () => {
    const startedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    for (let i = 0; i < GATE_QUESTION_COUNT; i++) {
      await recordGateAttempt(`q-${i}`, 90, new Date().toISOString());
    }

    const result = await finishSittingAction({
      chapterSlug: CHAPTER,
      context: "chapter-gate",
      startedAt,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.averageScore).toBeCloseTo(90, 1);
      expect(result.data.passed).toBe(true);
      expect(result.data.chapterCompleted).toBe(true);
    }

    const rows = await db.select().from(chapterProgress);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.gatePassedAt).not.toBeNull();
  });

  it("does not pass when the chapter has fewer questions than the gate target, once every available one is graded", async () => {
    // Re-seed a thin chapter (fewer than GATE_QUESTION_COUNT questions) —
    // expectedCount must clamp to the pool size rather than permanently
    // locking sittings out.
    db = await createPgliteDb();
    withUserMock.mockImplementation(
      async (_token: unknown, fn: (tx: Executor) => Promise<unknown>) => fn(db),
    );
    await db.insert(qbankQuestions).values([
      {
        id: "thin-q-0",
        topic: "accounting",
        difficulty: "easy" as const,
        questionType: "conceptual" as const,
        prompt: "Q0",
        modelAnswer: "a",
        chapterSlug: CHAPTER,
        advanced: false,
      },
      {
        id: "thin-q-1",
        topic: "accounting",
        difficulty: "easy" as const,
        questionType: "conceptual" as const,
        prompt: "Q1",
        modelAnswer: "a",
        chapterSlug: CHAPTER,
        advanced: false,
      },
    ]);
    const startedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await recordGateAttempt("thin-q-0", 95, new Date().toISOString());
    await recordGateAttempt("thin-q-1", 95, new Date().toISOString());

    const result = await finishSittingAction({
      chapterSlug: CHAPTER,
      context: "chapter-gate",
      startedAt,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.passed).toBe(true);
  });
});
