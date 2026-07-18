/**
 * Unit coverage for the Question Bank Server Actions
 * (`app/(app)/tools/question-bank/actions.ts`).
 *
 * NOTE ON SCOPE: the original assignment for this coverage pass targeted
 * `app/(app)/tools/relationships/actions.ts` (CRUD server actions for
 * contacts/chat logs/follow-ups). That file does not exist on this branch —
 * this worktree is cut from `master` at the "Unit 11" progress-tracker state,
 * where the relationships tool is still a seed-data stub (see
 * `app/(app)/tools/relationships/new/page.tsx`'s "coming soon" copy and
 * `lib/data/contacts.ts`, which only exports read queries). The described
 * actions file only exists on the separate `fable/prod-readiness` branch
 * (99 commits ahead of this worktree's base), which already has its own test
 * commit covering it ("test: cover auth middleware, ai-usage queries, contact
 * mutations"). lib/data/contacts.ts and lib/data/followups.ts — the only
 * relationships-adjacent mutation code that exists here — already have full
 * test coverage (tests/unit/lib/data/contacts.test.ts,
 * tests/unit/lib/data/followups.test.ts).
 *
 * Substituted target: `app/(app)/tools/question-bank/actions.ts` — the only
 * other Server Action file in the repo with the same risk profile (auth +
 * rate-limit + validation + ownership gates, zero existing tests) and it
 * exercises `lib/ai/grading.ts` (this pass's other target) end-to-end.
 *
 * Pattern mirrors tests/unit/app/applications-action.test.ts (Unit 7 canonical).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QbankFollowup, QbankQuestion } from "@/lib/types";

// Sentry must be neutralised before any import that transitively loads it.
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  init: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
}));

const {
  withUserMock,
  getProfileMock,
  pickQuestionMock,
  getQuestionByIdMock,
  getFollowupByIdMock,
  getFollowupsMock,
  recordAttemptMock,
  getSpacedStateMock,
  upsertSpacedStateMock,
  getTopicMasteryMock,
  upsertTopicMasteryMock,
  gradeAnswerMock,
} = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  getProfileMock: vi.fn(),
  pickQuestionMock: vi.fn(),
  getQuestionByIdMock: vi.fn(),
  getFollowupByIdMock: vi.fn(),
  getFollowupsMock: vi.fn(),
  recordAttemptMock: vi.fn(),
  getSpacedStateMock: vi.fn(),
  upsertSpacedStateMock: vi.fn(),
  getTopicMasteryMock: vi.fn(),
  upsertTopicMasteryMock: vi.fn(),
  gradeAnswerMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({ withUser: withUserMock }));

vi.mock("@/lib/db/queries/qbank", () => ({
  getFollowupById: getFollowupByIdMock,
  getFollowups: getFollowupsMock,
  getQuestionById: getQuestionByIdMock,
  getSpacedState: getSpacedStateMock,
  pickQuestion: pickQuestionMock,
  recordAttempt: recordAttemptMock,
  upsertSpacedState: upsertSpacedStateMock,
}));

vi.mock("@/lib/db/queries/profile", () => ({ getProfile: getProfileMock }));

vi.mock("@/lib/db/queries/curriculum", () => ({
  getTopicMastery: getTopicMasteryMock,
  upsertTopicMastery: upsertTopicMasteryMock,
}));

vi.mock("@/lib/ai/grading", () => ({ gradeAnswer: gradeAnswerMock }));

// Auth mock — default: throws UnauthorizedError (mirrors applications-action.test.ts).
vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: vi.fn(async () => {
      throw new actual.UnauthorizedError();
    }),
  };
});

// Rate-limit mock — default: allow all.
const rateLimitAllowed = vi.fn(async () => ({ allowed: true as const }));
vi.mock("@/lib/ratelimit/limiters", () => ({
  qbankGradingLimiter: (...args: unknown[]) => rateLimitAllowed(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  gradeAnswerAction,
  gradeAnswerSchema,
  serveQuestionAction,
} from "@/app/(app)/tools/question-bank/actions";
import { UnauthorizedError, requireUser } from "@/lib/auth/server";

const TEST_USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function authenticate() {
  vi.mocked(requireUser).mockResolvedValueOnce({
    id: TEST_USER_ID,
  } as Awaited<ReturnType<typeof requireUser>>);
}

function fakeQuestion(overrides: Partial<QbankQuestion> = {}): QbankQuestion {
  return {
    id: "q1",
    topic: "dcf",
    difficulty: "medium",
    questionType: "conceptual",
    prompt: "Walk me through a DCF.",
    keyPoints: [{ point: "Projects unlevered FCF", weight: 3 }],
    misconceptions: [],
    modelAnswer: "A DCF projects unlevered FCF and discounts at WACC.",
    advanced: false,
    ...overrides,
  };
}

function fakeFollowup(overrides: Partial<QbankFollowup> = {}): QbankFollowup {
  return {
    id: "f1",
    questionId: "q1",
    ordinal: 1,
    prompt: "How does terminal value factor in?",
    modelAnswer: "Via a perpetuity growth or exit multiple.",
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(requireUser).mockReset();
  withUserMock.mockReset();
  getProfileMock.mockReset();
  pickQuestionMock.mockReset();
  getQuestionByIdMock.mockReset();
  getFollowupByIdMock.mockReset();
  getFollowupsMock.mockReset();
  recordAttemptMock.mockReset();
  getSpacedStateMock.mockReset();
  upsertSpacedStateMock.mockReset();
  getTopicMasteryMock.mockReset();
  upsertTopicMasteryMock.mockReset();
  gradeAnswerMock.mockReset();
  rateLimitAllowed.mockReset();
  rateLimitAllowed.mockResolvedValue({ allowed: true });

  // Default: requireUser throws UnauthorizedError unless a test calls authenticate().
  vi.mocked(requireUser).mockImplementation(async () => {
    throw new UnauthorizedError();
  });

  // Default: withUser just runs the callback with a stub tx, like the real
  // transaction wrapper minus the DB — matches assistant-tools.test.ts's
  // "withUser just calls fn(tx)" convention.
  withUserMock.mockImplementation(async (_token: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn(null),
  );

  getProfileMock.mockResolvedValue({ advancedTrack: false });
  getTopicMasteryMock.mockResolvedValue(null);
  getSpacedStateMock.mockResolvedValue(null);
  getFollowupsMock.mockResolvedValue([]);
});

// ─── gradeAnswerSchema ──────────────────────────────────────────────────────

describe("gradeAnswerSchema", () => {
  it("accepts a valid payload", () => {
    const result = gradeAnswerSchema.safeParse({
      questionId: "q1",
      answer: "A DCF discounts unlevered FCF at WACC.",
      context: "qbank",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload with a followupId", () => {
    const result = gradeAnswerSchema.safeParse({
      questionId: "q1",
      followupId: "f1",
      answer: "Terminal value via perpetuity growth.",
      context: "section-drill",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty answer", () => {
    const result = gradeAnswerSchema.safeParse({
      questionId: "q1",
      answer: "",
      context: "qbank",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an answer over 8000 characters", () => {
    const result = gradeAnswerSchema.safeParse({
      questionId: "q1",
      answer: "x".repeat(8001),
      context: "qbank",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid context enum value", () => {
    const result = gradeAnswerSchema.safeParse({
      questionId: "q1",
      answer: "some answer",
      context: "not-a-real-context",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing questionId", () => {
    const result = gradeAnswerSchema.safeParse({
      answer: "some answer",
      context: "qbank",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra fields (schema is .strict())", () => {
    const result = gradeAnswerSchema.safeParse({
      questionId: "q1",
      answer: "some answer",
      context: "qbank",
      extra: "not allowed",
    });
    expect(result.success).toBe(false);
  });
});

// ─── serveQuestionAction ────────────────────────────────────────────────────

describe("serveQuestionAction", () => {
  it("returns UNAUTHORIZED when called without a session", async () => {
    const result = await serveQuestionAction({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED for an invalid difficulty value", async () => {
    authenticate();
    const result = await serveQuestionAction({ difficulty: "impossible" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns a mapped question on the happy path, including the user's advancedTrack flag", async () => {
    authenticate();
    getProfileMock.mockResolvedValueOnce({ advancedTrack: true });
    pickQuestionMock.mockResolvedValueOnce(fakeQuestion({ id: "q9", topic: "lbo" }));

    const result = await serveQuestionAction({ topic: "lbo", difficulty: "hard" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        id: "q9",
        prompt: "Walk me through a DCF.",
        topic: "lbo",
        difficulty: "medium",
        questionType: "conceptual",
      });
    }
    expect(pickQuestionMock).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        userId: TEST_USER_ID,
        topic: "lbo",
        difficulty: "hard",
        includeAdvanced: true,
      }),
    );
  });

  it("returns ok:true with data:null when no question matches the filters", async () => {
    authenticate();
    pickQuestionMock.mockResolvedValueOnce(null);
    const result = await serveQuestionAction({});
    expect(result).toEqual({ ok: true, data: null });
  });
});

// ─── gradeAnswerAction ──────────────────────────────────────────────────────

const validGradeInput = {
  questionId: "q1",
  answer: "A DCF discounts unlevered FCF at WACC.",
  context: "qbank" as const,
};

describe("gradeAnswerAction — auth / validation / rate limit gates", () => {
  it("returns UNAUTHORIZED when called without a session", async () => {
    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(rateLimitAllowed).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED with field errors for an empty answer", async () => {
    authenticate();
    const result = await gradeAnswerAction({ ...validGradeInput, answer: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toHaveProperty("answer");
    }
    expect(rateLimitAllowed).not.toHaveBeenCalled();
  });

  it("returns RATE_LIMITED when the limiter denies", async () => {
    authenticate();
    rateLimitAllowed.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 });
    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(withUserMock).not.toHaveBeenCalled();
  });
});

describe("gradeAnswerAction — ownership / NOT_FOUND", () => {
  it("returns NOT_FOUND when the question does not exist", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(null);
    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(gradeAnswerMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when a followupId is given but no such follow-up exists", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(fakeQuestion());
    getFollowupByIdMock.mockResolvedValueOnce(null);
    const result = await gradeAnswerAction({ ...validGradeInput, followupId: "missing-fu" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("returns VALIDATION_FAILED when the follow-up belongs to a different question", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(fakeQuestion({ id: "q1" }));
    getFollowupByIdMock.mockResolvedValueOnce(fakeFollowup({ questionId: "q-other" }));
    const result = await gradeAnswerAction({ ...validGradeInput, followupId: "f1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(gradeAnswerMock).not.toHaveBeenCalled();
  });
});

describe("gradeAnswerAction — grading failure", () => {
  it("returns INTERNAL when gradeAnswer throws", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(fakeQuestion());
    gradeAnswerMock.mockRejectedValueOnce(new Error("anthropic down"));
    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");
  });
});

describe("gradeAnswerAction — happy path", () => {
  it("grades a correct first-answer, persists the attempt, and returns the first follow-up", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(fakeQuestion());
    gradeAnswerMock.mockResolvedValueOnce({
      score: 92,
      correct: true,
      keyPointResults: [{ point: "Projects unlevered FCF", hit: true, comment: "Yes." }],
      misconceptionsTriggered: [],
      depthComment: "Good depth.",
      overallFeedback: "Nice.",
      modelAnswer: "A DCF projects unlevered FCF and discounts at WACC.",
    });
    getFollowupsMock.mockResolvedValueOnce([
      fakeFollowup({ id: "f1", ordinal: 1 }),
      fakeFollowup({ id: "f2", ordinal: 2 }),
    ]);

    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.grade.score).toBe(92);
      expect(result.data.nextFollowup).toEqual({
        id: "f1",
        prompt: "How does terminal value factor in?",
      });
    }
    expect(recordAttemptMock).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        userId: TEST_USER_ID,
        questionId: "q1",
        score: 92,
        correct: true,
        context: "qbank",
      }),
    );
    // First-answer path (no followupId) should update spaced-repetition state.
    expect(upsertSpacedStateMock).toHaveBeenCalled();
    expect(upsertTopicMasteryMock).toHaveBeenCalled();
  });

  it("does not look up follow-ups (or return one) when the answer was incorrect", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(fakeQuestion());
    gradeAnswerMock.mockResolvedValueOnce({
      score: 30,
      correct: false,
      keyPointResults: [{ point: "Projects unlevered FCF", hit: false, comment: "Missed." }],
      misconceptionsTriggered: [],
      depthComment: "Too shallow.",
      overallFeedback: "Try again.",
      modelAnswer: "A DCF projects unlevered FCF and discounts at WACC.",
    });

    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.nextFollowup).toBeNull();
    expect(getFollowupsMock).not.toHaveBeenCalled();
  });

  it("still returns the successful grade when persisting the attempt throws", async () => {
    authenticate();
    getQuestionByIdMock.mockResolvedValueOnce(fakeQuestion());
    gradeAnswerMock.mockResolvedValueOnce({
      score: 80,
      correct: true,
      keyPointResults: [{ point: "Projects unlevered FCF", hit: true, comment: "Yes." }],
      misconceptionsTriggered: [],
      depthComment: "Fine.",
      overallFeedback: "Good.",
      modelAnswer: "A DCF projects unlevered FCF and discounts at WACC.",
    });

    // First withUser call (question load) passes through normally; the
    // second (persist step) throws, simulating a DB outage mid-write.
    withUserMock.mockImplementationOnce(
      async (_token: unknown, fn: (tx: unknown) => Promise<unknown>) => fn(null),
    );
    withUserMock.mockImplementationOnce(async () => {
      throw new Error("db unreachable");
    });

    const result = await gradeAnswerAction(validGradeInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.grade.score).toBe(80);
      expect(result.data.nextFollowup).toBeNull();
    }
  });
});
