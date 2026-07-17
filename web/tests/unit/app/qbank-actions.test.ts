/**
 * Unit coverage for the Question Bank Server Actions (Unit 8 test debt).
 *
 * Tests: auth gate, validation, rate-limit gate (grading only), and one happy
 * path per action with the AI grading module and query modules mocked.
 * Mock pattern mirrors tests/unit/app/chatbot-thread-action.test.ts.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

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
  requireUserMock,
  limiterMock,
  pickQuestionMock,
  getQuestionByIdMock,
  getFollowupByIdMock,
  getFollowupsMock,
  getSpacedStateMock,
  recordAttemptMock,
  upsertSpacedStateMock,
  getProfileMock,
  getTopicMasteryMock,
  upsertTopicMasteryMock,
  gradeAnswerMock,
} = vi.hoisted(() => ({
  withUserMock: vi.fn(),
  requireUserMock: vi.fn(),
  limiterMock: vi.fn(async () => ({ allowed: true as const })),
  pickQuestionMock: vi.fn(),
  getQuestionByIdMock: vi.fn(),
  getFollowupByIdMock: vi.fn(),
  getFollowupsMock: vi.fn(),
  getSpacedStateMock: vi.fn(),
  recordAttemptMock: vi.fn(),
  upsertSpacedStateMock: vi.fn(),
  getProfileMock: vi.fn(),
  getTopicMasteryMock: vi.fn(),
  upsertTopicMasteryMock: vi.fn(),
  gradeAnswerMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  withUser: withUserMock,
}));

vi.mock("@/lib/db/queries/qbank", () => ({
  pickQuestion: pickQuestionMock,
  getQuestionById: getQuestionByIdMock,
  getFollowupById: getFollowupByIdMock,
  getFollowups: getFollowupsMock,
  getSpacedState: getSpacedStateMock,
  recordAttempt: recordAttemptMock,
  upsertSpacedState: upsertSpacedStateMock,
}));

vi.mock("@/lib/db/queries/profile", () => ({
  getProfile: getProfileMock,
}));

vi.mock("@/lib/db/queries/curriculum", () => ({
  getTopicMastery: getTopicMasteryMock,
  upsertTopicMastery: upsertTopicMasteryMock,
}));

vi.mock("@/lib/ai/grading", () => ({
  gradeAnswer: gradeAnswerMock,
}));

vi.mock("@/lib/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/server")>();
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

vi.mock("@/lib/ratelimit/limiters", () => ({
  qbankGradingLimiter: (...args: unknown[]) => limiterMock(...args),
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { gradeAnswerAction, serveQuestionAction } from "@/app/(app)/tools/question-bank/actions";
import { UnauthorizedError } from "@/lib/auth/server";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const QUESTION = {
  id: "q-1",
  topic: "valuation",
  difficulty: "medium" as const,
  questionType: "conceptual" as const,
  prompt: "What is WACC?",
  keyPoints: [{ point: "cost of capital", weight: 3 }],
  misconceptions: [],
  modelAnswer: "Weighted average cost of capital.",
  advanced: false,
};

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ id: USER_ID });
  limiterMock.mockClear();
  limiterMock.mockResolvedValue({ allowed: true as const });
  withUserMock.mockReset();
  withUserMock.mockImplementation(async (_token: unknown, fn: (tx: null) => Promise<unknown>) =>
    fn(null),
  );
  pickQuestionMock.mockReset();
  getQuestionByIdMock.mockReset();
  getFollowupByIdMock.mockReset();
  getFollowupsMock.mockReset();
  getSpacedStateMock.mockReset();
  recordAttemptMock.mockReset();
  upsertSpacedStateMock.mockReset();
  getProfileMock.mockReset();
  getTopicMasteryMock.mockReset();
  upsertTopicMasteryMock.mockReset();
  gradeAnswerMock.mockReset();

  getProfileMock.mockResolvedValue({ userId: USER_ID, advancedTrack: false });
  getFollowupsMock.mockResolvedValue([]);
  getSpacedStateMock.mockResolvedValue(null);
  getTopicMasteryMock.mockResolvedValue(null);
  recordAttemptMock.mockResolvedValue(undefined);
  upsertSpacedStateMock.mockResolvedValue(undefined);
  upsertTopicMasteryMock.mockResolvedValue(undefined);
});

// ─── serveQuestionAction ─────────────────────────────────────────────────────

describe("serveQuestionAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await serveQuestionAction({ topic: "valuation" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED on bad input (unknown field, strict schema)", async () => {
    const result = await serveQuestionAction({ topic: "valuation", bogus: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns VALIDATION_FAILED on an invalid difficulty value", async () => {
    const result = await serveQuestionAction({ difficulty: "impossible" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("happy path: serves a question mapped to the client shape", async () => {
    pickQuestionMock.mockResolvedValue(QUESTION);

    const result = await serveQuestionAction({ topic: "valuation", difficulty: "medium" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        id: "q-1",
        prompt: "What is WACC?",
        topic: "valuation",
        difficulty: "medium",
        questionType: "conceptual",
      });
    }
    expect(pickQuestionMock).toHaveBeenCalledWith(null, {
      userId: USER_ID,
      topic: "valuation",
      difficulty: "medium",
      includeAdvanced: false,
    });
  });

  it("happy path: returns null data when no question matches", async () => {
    pickQuestionMock.mockResolvedValue(null);
    const result = await serveQuestionAction({});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBeNull();
  });

  it("passes includeAdvanced from the caller's profile", async () => {
    getProfileMock.mockResolvedValue({ userId: USER_ID, advancedTrack: true });
    pickQuestionMock.mockResolvedValue(QUESTION);

    await serveQuestionAction({});

    expect(pickQuestionMock).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ includeAdvanced: true }),
    );
  });
});

// ─── gradeAnswerAction ───────────────────────────────────────────────────────

const VALID_GRADE_INPUT = {
  questionId: "q-1",
  answer: "It is the weighted average cost of capital.",
  context: "qbank" as const,
};

const GRADE_RESULT = {
  score: 88,
  correct: true,
  keyPointResults: [{ point: "cost of capital", hit: true, comment: "Good." }],
  misconceptionsTriggered: [],
  depthComment: "Right depth.",
  overallFeedback: "Nicely done.",
  modelAnswer: "Weighted average cost of capital.",
};

describe("gradeAnswerAction", () => {
  it("returns UNAUTHORIZED without a session", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const result = await gradeAnswerAction(VALID_GRADE_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORIZED");
    expect(limiterMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED on an empty answer", async () => {
    const result = await gradeAnswerAction({ ...VALID_GRADE_INPUT, answer: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns VALIDATION_FAILED on an invalid context enum value", async () => {
    const result = await gradeAnswerAction({ ...VALID_GRADE_INPUT, context: "not-a-context" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns RATE_LIMITED when qbankGradingLimiter denies", async () => {
    limiterMock.mockResolvedValue({ allowed: false as const, retryAfterSeconds: 45 });

    const result = await gradeAnswerAction(VALID_GRADE_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("RATE_LIMITED");
    expect(gradeAnswerMock).not.toHaveBeenCalled();
    expect(withUserMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the question does not exist", async () => {
    getQuestionByIdMock.mockResolvedValue(null);

    const result = await gradeAnswerAction(VALID_GRADE_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(gradeAnswerMock).not.toHaveBeenCalled();
  });

  it("happy path: grades the answer, records the attempt, and returns the grade", async () => {
    getQuestionByIdMock.mockResolvedValue(QUESTION);
    gradeAnswerMock.mockResolvedValue(GRADE_RESULT);

    const result = await gradeAnswerAction(VALID_GRADE_INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.grade).toEqual(GRADE_RESULT);
      // No follow-ups seeded — nextFollowup stays null.
      expect(result.data.nextFollowup).toBeNull();
    }
    expect(gradeAnswerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        endpoint: "qbank/grade",
        questionPrompt: QUESTION.prompt,
        answer: VALID_GRADE_INPUT.answer,
      }),
    );
    expect(recordAttemptMock).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        userId: USER_ID,
        questionId: "q-1",
        correct: true,
        score: 88,
        context: "qbank",
      }),
    );
    expect(upsertSpacedStateMock).toHaveBeenCalled();
    expect(upsertTopicMasteryMock).toHaveBeenCalled();
  });

  it("happy path: surfaces the first follow-up when the main answer is correct", async () => {
    getQuestionByIdMock.mockResolvedValue(QUESTION);
    gradeAnswerMock.mockResolvedValue(GRADE_RESULT);
    getFollowupsMock.mockResolvedValue([
      { id: "f-1", questionId: "q-1", ordinal: 1, prompt: "Follow-up 1", modelAnswer: "..." },
      { id: "f-2", questionId: "q-1", ordinal: 2, prompt: "Follow-up 2", modelAnswer: "..." },
    ]);

    const result = await gradeAnswerAction(VALID_GRADE_INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.nextFollowup).toEqual({ id: "f-1", prompt: "Follow-up 1" });
    }
    // Spaced state applies to main-question attempts only.
    expect(upsertSpacedStateMock).toHaveBeenCalled();
  });

  it("does not update spaced state when grading a follow-up", async () => {
    getQuestionByIdMock.mockResolvedValue(QUESTION);
    getFollowupByIdMock.mockResolvedValue({
      id: "f-1",
      questionId: "q-1",
      ordinal: 1,
      prompt: "Follow-up 1",
      modelAnswer: "...",
    });
    gradeAnswerMock.mockResolvedValue(GRADE_RESULT);

    const result = await gradeAnswerAction({
      ...VALID_GRADE_INPUT,
      followupId: "f-1",
    });

    expect(result.ok).toBe(true);
    expect(upsertSpacedStateMock).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_FAILED when the follow-up does not belong to the question", async () => {
    getQuestionByIdMock.mockResolvedValue(QUESTION);
    getFollowupByIdMock.mockResolvedValue({
      id: "f-1",
      questionId: "some-other-question",
      ordinal: 1,
      prompt: "Follow-up 1",
      modelAnswer: "...",
    });

    const result = await gradeAnswerAction({ ...VALID_GRADE_INPUT, followupId: "f-1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(gradeAnswerMock).not.toHaveBeenCalled();
  });

  it("returns the grade even when persisting the attempt fails", async () => {
    getQuestionByIdMock.mockResolvedValue(QUESTION);
    gradeAnswerMock.mockResolvedValue(GRADE_RESULT);

    // First withUser call loads the question (must succeed); the second call
    // persists the attempt — make that one fail to prove the action still
    // returns the already-computed grade rather than an error.
    let call = 0;
    withUserMock.mockImplementation(async (_token: unknown, fn: (tx: null) => Promise<unknown>) => {
      call += 1;
      if (call === 2) throw new Error("db unavailable");
      return fn(null);
    });

    const result = await gradeAnswerAction(VALID_GRADE_INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.grade).toEqual(GRADE_RESULT);
      expect(result.data.nextFollowup).toBeNull();
    }
  });
});
