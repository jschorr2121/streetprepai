"use server";

/**
 * Server Action for the in-app feedback widget.
 *
 * Pattern: 7-step skeleton from code-standards.md §Next.js, mirroring
 * `app/(app)/tools/chatbot/actions.ts`. Lives in `lib/feedback/` (not
 * colocated with a single route) because the widget mounts in the shared
 * `(app)/layout.tsx` and isn't owned by any one page — same rationale as
 * `lib/auth/actions.ts`'s `signOutAction`.
 */

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { actionErrorFromAppError, type ActionResult } from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { createFeedback } from "@/lib/db/queries/feedback";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { feedbackLimiter } from "@/lib/ratelimit/limiters";

// ─── Colocated Zod schema ──────────────────────────────────────────────────

export const submitFeedbackSchema = z.object({
  route: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1, "Feedback can't be empty.").max(2000),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export async function submitFeedbackAction(input: unknown): Promise<ActionResult<null>> {
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
  const parsed = submitFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_FAILED", message: "Check your feedback message." },
    };
  }
  const { route, message } = parsed.data;

  // Step 3 — Rate limit.
  const rl = await feedbackLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4+5 — Ownership is implicit (the row is always created for the
  // caller) + the actual work.
  try {
    await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      createFeedback(tx, userId, route, message),
    );
  } catch (err) {
    logger.error({ userId, action: "feedback_submit_failed" }, "feedback_submit_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // Step 6 — Log success.
  logger.info({ userId, action: "feedback_submitted", route }, "feedback_submitted");

  // Step 7 — Return.
  return { ok: true, data: null };
}
