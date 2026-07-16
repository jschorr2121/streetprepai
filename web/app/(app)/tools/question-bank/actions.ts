"use server";

// AI answer grading — the shared grading path for the Question Bank, section
// drills, chapter gates, and the daily drill. Follows the 7-step Server Action
// skeleton from app/(app)/profile/actions.ts. The LLM call happens OUTSIDE the
// DB transaction (no external HTTP inside a tx, per code-standards).

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import {
  actionErrorFromAppError,
  fieldErrorsFromIssues,
  type ActionResult,
} from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { gradeAnswer } from "@/lib/ai/grading";
import { withUser } from "@/lib/db/client";
import {
  getFollowupById,
  getFollowups,
  getQuestionById,
  getSpacedState,
  pickQuestion,
  recordAttempt,
  upsertSpacedState,
} from "@/lib/db/queries/qbank";
import { getProfile } from "@/lib/db/queries/profile";
import { getTopicMastery, upsertTopicMastery } from "@/lib/db/queries/curriculum";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { nextReview, updateMastery, type AttemptKind } from "@/lib/mastery/mastery";
import { qbankGradingLimiter } from "@/lib/ratelimit/limiters";
import type { GradedAnswer } from "@/lib/types";

// ─── Serve a question by topic + difficulty ───────────────────────────────────

const serveQuestionSchema = z
  .object({
    topic: z.string().max(40).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  })
  .strict();

export type ServedQuestion = {
  id: string;
  prompt: string;
  topic: string;
  difficulty: string;
  questionType: string;
};

export async function serveQuestionAction(
  input: unknown,
): Promise<ActionResult<ServedQuestion | null>> {
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    throw err;
  }
  const parsed = serveQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Bad filters." } };
  }
  try {
    const q = await withUser({ sub: userId, role: "authenticated" }, async (tx) => {
      const profile = await getProfile(tx, userId);
      return pickQuestion(tx, {
        userId,
        ...(parsed.data.topic ? { topic: parsed.data.topic } : {}),
        ...(parsed.data.difficulty ? { difficulty: parsed.data.difficulty } : {}),
        includeAdvanced: profile?.advancedTrack ?? false,
      });
    });
    if (!q) return { ok: true, data: null };
    return {
      ok: true,
      data: {
        id: q.id,
        prompt: q.prompt,
        topic: q.topic,
        difficulty: q.difficulty,
        questionType: q.questionType,
      },
    };
  } catch (err) {
    logger.error({ userId, action: "qbank_serve_failed" }, "qbank_serve_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
}

export const gradeAnswerSchema = z
  .object({
    questionId: z.string().min(1).max(120),
    followupId: z.string().min(1).max(140).optional(),
    answer: z.string().trim().min(1, "Write an answer first.").max(8_000),
    context: z.enum(["qbank", "section-drill", "chapter-gate", "daily-drill"]),
  })
  .strict();

export type GradeAnswerActionInput = z.infer<typeof gradeAnswerSchema>;

export type GradeAnswerActionData = {
  grade: GradedAnswer;
  /** Fired when the answer was correct and a deeper probe exists. */
  nextFollowup: { id: string; prompt: string } | null;
};

export async function gradeAnswerAction(
  input: unknown,
): Promise<ActionResult<GradeAnswerActionData>> {
  // Step 1 — Auth.
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    throw err;
  }

  // Step 2 — Validate.
  const parsed = gradeAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Check your answer and try again.",
        fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
      },
    };
  }
  const { questionId, followupId, answer, context } = parsed.data;

  // Step 3 — Rate limit (AI-calling action: tight tier).
  const rl = await qbankGradingLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Grading limit reached — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4 — Ownership: attempts are always written for the caller (userId from
  // requireUser); questions are shared read-only content. Satisfied structurally.

  // Step 5a — Load the question (+ follow-up) inside an RLS-scoped read.
  let question, followup;
  try {
    ({ question, followup } = await withUser({ sub: userId, role: "authenticated" }, async (tx) => {
      const q = await getQuestionById(tx, questionId);
      const f = followupId ? await getFollowupById(tx, followupId) : null;
      return { question: q, followup: f };
    }));
  } catch (err) {
    logger.error(
      { userId, action: "qbank_question_load_failed", questionId },
      "qbank_question_load_failed",
    );
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!question || (followupId && !followup)) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Question not found." } };
  }
  if (followup && followup.questionId !== question.id) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Follow-up mismatch." } };
  }

  // Step 5b — Grade with Claude (outside any transaction).
  let grade: GradedAnswer;
  try {
    grade = await gradeAnswer({
      userId,
      endpoint: "qbank/grade",
      questionPrompt: question.prompt,
      questionType: question.questionType,
      keyPoints: question.keyPoints,
      misconceptions: question.misconceptions,
      modelAnswer: followup ? followup.modelAnswer : question.modelAnswer,
      answer,
      ...(followup ? { followupPrompt: followup.prompt } : {}),
    });
  } catch (err) {
    logger.error({ userId, action: "qbank_grading_failed", questionId }, "qbank_grading_failed");
    Sentry.captureException(err);
    return {
      ok: false,
      error: { code: "INTERNAL", message: "Grading failed — please try again." },
    };
  }

  // Step 5c — Persist attempt + spaced state + mastery, then pick the next probe.
  let nextFollowup: { id: string; prompt: string } | null = null;
  try {
    nextFollowup = await withUser({ sub: userId, role: "authenticated" }, async (tx) => {
      await recordAttempt(tx, {
        userId,
        questionId: question.id,
        ...(followup ? { followupId: followup.id } : {}),
        answer,
        score: grade.score,
        correct: grade.correct,
        rubricBreakdown: {
          keyPointResults: grade.keyPointResults,
          misconceptionsTriggered: grade.misconceptionsTriggered,
          depthComment: grade.depthComment,
        },
        context,
      });

      // Spaced re-surfacing applies to main-question attempts only.
      if (!followup) {
        const prev = await getSpacedState(tx, userId, question.id);
        const next = nextReview(
          prev
            ? { intervalDays: prev.intervalDays, consecutiveCorrect: prev.consecutiveCorrect }
            : null,
          grade.correct,
          new Date(),
        );
        await upsertSpacedState(tx, userId, {
          questionId: question.id,
          nextDueAt: next.nextDueAt.toISOString(),
          intervalDays: next.intervalDays,
          consecutiveCorrect: next.consecutiveCorrect,
        });
      }

      const kind: AttemptKind = followup
        ? "followup"
        : context === "chapter-gate"
          ? "gate"
          : "first";
      const prevMastery = await getTopicMastery(tx, userId, question.topic);
      await upsertTopicMastery(
        tx,
        userId,
        updateMastery(prevMastery, question.topic, grade.score, kind),
      );

      // Follow-up tree: correct main answer fires probe #1; a correct probe
      // fires the next ordinal.
      if (!grade.correct) return null;
      const followups = await getFollowups(tx, question.id);
      if (followups.length === 0) return null;
      if (!followup) {
        const first = followups[0];
        return first ? { id: first.id, prompt: first.prompt } : null;
      }
      const next = followups.find((f) => f.ordinal > followup.ordinal);
      return next ? { id: next.id, prompt: next.prompt } : null;
    });
  } catch (err) {
    logger.error(
      { userId, action: "qbank_attempt_persist_failed", questionId },
      "qbank_attempt_persist_failed",
    );
    Sentry.captureException(err);
    // The grade itself succeeded — return it rather than failing the user.
  }

  // Step 6 — Log success.
  logger.info(
    { userId, action: "qbank_answer_graded", questionId, score: grade.score, context },
    "qbank_answer_graded",
  );

  // Step 7 — Return.
  return { ok: true, data: { grade, nextFollowup } };
}
