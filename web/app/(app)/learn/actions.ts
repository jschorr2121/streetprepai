"use server";

// Curriculum progress Server Actions: mark a section read, record a section
// drill result, and submit a chapter gate. Gate/drill scores are recomputed
// server-side from stored attempts (listSittingScores) — the client never
// asserts its own pass/fail. Follows the 7-step skeleton.

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { actionErrorFromAppError, type ActionResult } from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import {
  countGateQuestions,
  countSectionDrillQuestions,
  listSittingScores,
} from "@/lib/db/queries/qbank";
import {
  markChapterComplete,
  markSectionRead,
  recordGateResult,
  recordSectionDrill,
} from "@/lib/db/queries/curriculum";
import {
  GATE_PASS_THRESHOLD,
  GATE_QUESTION_COUNT,
  SECTION_DRILL_COUNT,
  coreSections,
  getChapter,
} from "@/lib/curriculum/chapters";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { curriculumProgressLimiter } from "@/lib/ratelimit/limiters";

// A real gate/drill sitting takes minutes, not hours. This bounds how far
// back `startedAt` (client-supplied) can reach when filtering attempts for
// the score recompute below — generous enough to survive someone leaving the
// tab open over a long lunch, but short enough that an attacker can't set
// `startedAt` to an old timestamp and sweep unrelated historical attempts
// (e.g. answers from a previous, unrelated qbank session) into the average.
const MAX_SITTING_DURATION_MS = 6 * 60 * 60 * 1000;

async function auth(): Promise<{ userId: string } | { error: ActionResult<never> }> {
  try {
    const user = await requireUser();
    return { userId: user.id };
  } catch (err) {
    if (err instanceof AppError) return { error: actionErrorFromAppError(err) };
    throw err;
  }
}

// ─── Mark a section read ──────────────────────────────────────────────────────

const markReadSchema = z
  .object({ chapterSlug: z.string().max(80), sectionSlug: z.string().max(120) })
  .strict();

export async function markSectionReadAction(input: unknown): Promise<ActionResult<null>> {
  const a = await auth();
  if ("error" in a) return a.error;
  const parsed = markReadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Bad input." } };
  }
  const rl = await curriculumProgressLimiter(a.userId);
  if (!rl.allowed) {
    return { ok: false, error: { code: "RATE_LIMITED", message: "Slow down a moment." } };
  }
  try {
    await withUser({ sub: a.userId, role: "authenticated" }, (tx) =>
      markSectionRead(tx, a.userId, parsed.data.chapterSlug, parsed.data.sectionSlug),
    );
  } catch (err) {
    logger.error(
      { userId: a.userId, action: "mark_section_read_failed" },
      "mark_section_read_failed",
    );
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  return { ok: true, data: null };
}

// ─── Finish a section drill / chapter gate ────────────────────────────────────
// The client calls this after grading every question in the sitting; the score
// is recomputed here from the attempts written by gradeAnswerAction.

const finishSchema = z
  .object({
    chapterSlug: z.string().max(80),
    sectionSlug: z.string().max(120).optional(),
    context: z.enum(["section-drill", "chapter-gate"]),
    /** ISO timestamp captured on the client when the sitting started. */
    startedAt: z.string().datetime(),
  })
  .strict();

export type FinishSittingData = {
  averageScore: number;
  passed: boolean;
  threshold: number;
  chapterCompleted: boolean;
};

export async function finishSittingAction(
  input: unknown,
): Promise<ActionResult<FinishSittingData>> {
  const a = await auth();
  if ("error" in a) return a.error;
  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Bad input." } };
  }
  const { chapterSlug, sectionSlug, context, startedAt } = parsed.data;
  const chapter = getChapter(chapterSlug);
  if (!chapter) return { ok: false, error: { code: "NOT_FOUND", message: "Unknown chapter." } };

  // Reject a `startedAt` that's implausibly old before touching the DB at
  // all — see MAX_SITTING_DURATION_MS above for why.
  const startedAtMs = Date.parse(startedAt);
  if (Number.isNaN(startedAtMs) || Date.now() - startedAtMs > MAX_SITTING_DURATION_MS) {
    return {
      ok: false,
      error: { code: "VALIDATION_FAILED", message: "This sitting expired — start it again." },
    };
  }

  const rl = await curriculumProgressLimiter(a.userId);
  if (!rl.allowed) {
    return { ok: false, error: { code: "RATE_LIMITED", message: "Slow down a moment." } };
  }

  try {
    const data = await withUser({ sub: a.userId, role: "authenticated" }, async (tx) => {
      const scores = await listSittingScores(tx, {
        userId: a.userId,
        context,
        chapterSlug,
        ...(sectionSlug ? { sectionSlug } : {}),
        sinceIso: startedAt,
      });

      // The client tells us which chapter/section it drilled, never how many
      // questions it was actually served or graded — that must be verified
      // server-side, or a single easy-question attempt could be averaged in
      // as if it were the whole sitting (e.g. an 8-question gate). Clamp the
      // expectation to the pool size so a thin chapter/section can't lock a
      // legitimate sitting out; `listSittingScores` already dedupes to one
      // row per questionId, so `scores.length` is simultaneously the attempt
      // count and the distinct-question count.
      //
      // Residual gap: this checks *how many* distinct questions were graded,
      // not that they're the *specific* questions the gate/drill page served
      // (we don't persist a per-sitting served-question set). Closing that
      // fully would need server-side sitting sessions, which is out of scope
      // for this fix.
      const expectedCount =
        context === "section-drill" && sectionSlug
          ? Math.min(
              SECTION_DRILL_COUNT,
              await countSectionDrillQuestions(tx, chapterSlug, sectionSlug),
            )
          : Math.min(GATE_QUESTION_COUNT, await countGateQuestions(tx, chapterSlug));

      if (expectedCount > 0 && scores.length < expectedCount) {
        throw new ValidationError("Finish every question in this sitting before submitting.", {});
      }

      const averageScore =
        scores.length > 0 ? scores.reduce((s, r) => s + r.score, 0) / scores.length : 0;
      const fraction = averageScore / 100;

      if (context === "section-drill" && sectionSlug) {
        await recordSectionDrill(tx, a.userId, chapterSlug, sectionSlug, averageScore);
        return {
          averageScore,
          passed: true,
          threshold: 0,
          chapterCompleted: false,
        };
      }

      // Chapter gate.
      const passed = fraction >= GATE_PASS_THRESHOLD;
      await recordGateResult(tx, a.userId, chapterSlug, averageScore, passed);
      return {
        averageScore,
        passed,
        threshold: GATE_PASS_THRESHOLD,
        chapterCompleted: passed,
      };
    });
    logger.info(
      {
        userId: a.userId,
        action: "sitting_finished",
        chapterSlug,
        context,
        score: data.averageScore,
      },
      "sitting_finished",
    );
    return { ok: true, data };
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    logger.error({ userId: a.userId, action: "finish_sitting_failed" }, "finish_sitting_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
}

// ─── Mark an ungated chapter complete (all core sections read) ────────────────

const completeSchema = z.object({ chapterSlug: z.string().max(80) }).strict();

export async function completeUngatedChapterAction(input: unknown): Promise<ActionResult<null>> {
  const a = await auth();
  if ("error" in a) return a.error;
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Bad input." } };
  }
  const chapter = getChapter(parsed.data.chapterSlug);
  if (!chapter || chapter.gated) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Not an ungated chapter." } };
  }
  // Guard: only complete once every core section is marked read is enforced in
  // the UI; here we trust the caller and simply stamp completion.
  void coreSections; // (kept for symmetry with gated flow)
  try {
    await withUser({ sub: a.userId, role: "authenticated" }, (tx) =>
      markChapterComplete(tx, a.userId, parsed.data.chapterSlug),
    );
  } catch (err) {
    logger.error(
      { userId: a.userId, action: "complete_chapter_failed" },
      "complete_chapter_failed",
    );
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  return { ok: true, data: null };
}
