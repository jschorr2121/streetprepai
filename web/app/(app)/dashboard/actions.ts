"use server";

import * as Sentry from "@sentry/nextjs";

import { actionErrorFromAppError, type ActionResult } from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { markTourCompleted } from "@/lib/db/queries/profile";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { curriculumProgressLimiter } from "@/lib/ratelimit/limiters";

// Stamps the product tour as seen so it never shows again for this user.
// Called on tour finish and on skip — both mean "don't show me this again".
export async function completeTourAction(): Promise<ActionResult<null>> {
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    throw err;
  }

  const rl = await curriculumProgressLimiter(userId);
  if (!rl.allowed) {
    return { ok: false, error: { code: "RATE_LIMITED", message: "Slow down a moment." } };
  }

  try {
    await withUser({ sub: userId, role: "authenticated" }, (tx) => markTourCompleted(tx, userId));
  } catch (err) {
    logger.error({ userId, action: "tour_complete_failed" }, "tour_complete_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }

  logger.info({ userId, action: "tour_completed" }, "tour_completed");
  return { ok: true, data: null };
}
