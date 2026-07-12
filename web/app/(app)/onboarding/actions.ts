"use server";

import * as Sentry from "@sentry/nextjs";

import { fieldErrorsFromIssues, type ActionResult } from "@/lib/auth/action-result";
import { requireUser, UnauthorizedError } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { setOnboarded } from "@/lib/db/queries/profile";
import { logger } from "@/lib/logging/logger";
import { onboardingSchema } from "@/lib/schemas/auth";

// Completes onboarding: writes the four required profile fields and stamps
// `onboarded_at`. First user-write through Drizzle (via `withUser`, RLS-scoped).
// Follows the code-standards 7-step Server Action skeleton.
export async function completeOnboardingAction(
  input: unknown,
): Promise<ActionResult<{ onboarded: true }>> {
  // 1. Auth.
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: { code: "UNAUTHORIZED", message: err.message } };
    }
    throw err;
  }

  // 2. Validate.
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
      },
    };
  }

  // 3. Rate limiting — N/A: this is a one-time, non-AI, idempotent write.
  // 4. Ownership — the write targets the caller's own profile (userId); RLS is the
  //    safety net via `withUser`.

  // 5. Work.
  try {
    await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      setOnboarded(tx, userId, {
        school: parsed.data.school,
        graduationYear: parsed.data.graduationYear,
        currentSemester: parsed.data.currentSemester,
        targetFirms: parsed.data.targetFirms,
        advancedTrack: parsed.data.advancedTrack,
      }),
    );
  } catch (err) {
    logger.error({ userId, action: "onboarding_failed" }, "onboarding_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  // 6. Log success.
  logger.info({ userId, action: "onboarding_completed" }, "onboarding_completed");

  // 7. Return.
  return { ok: true, data: { onboarded: true } };
}
