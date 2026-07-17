"use server";

/**
 * Server Actions for chatbot thread management (Unit 9 issue 05).
 *
 * Pattern: 7-step skeleton from code-standards.md §Next.js, mirroring
 * `app/(app)/tools/relationships/actions.ts`. Reads/writes go through
 * `withUser` (RLS) + `lib/db/queries/chat.ts`.
 */

import * as Sentry from "@sentry/nextjs";

import { actionErrorFromAppError, type ActionResult } from "@/lib/auth/action-result";
import { requireUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db/client";
import { deleteThread } from "@/lib/db/queries/chat";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { chatThreadsLimiter } from "@/lib/ratelimit/limiters";
import { DeleteThreadSchema } from "@/lib/validation/schemas/chat";

export async function deleteThreadAction(
  input: unknown,
): Promise<ActionResult<{ threadId: string }>> {
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
  const parsed = DeleteThreadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Invalid request." } };
  }
  const { threadId } = parsed.data;

  // Step 3 — Rate limit.
  const rl = await chatThreadsLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests — try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 4+5 — Ownership + work in one shot: the delete is scoped to
  // user_id = caller, so a foreign/missing thread simply deletes 0 rows.
  let found: boolean;
  try {
    found = await withUser({ sub: userId, role: "authenticated" }, (tx) =>
      deleteThread(tx, userId, threadId),
    );
  } catch (err) {
    logger.error({ userId, action: "chat_thread_delete_failed" }, "chat_thread_delete_failed");
    Sentry.captureException(err);
    return { ok: false, error: { code: "INTERNAL", message: "Something went wrong." } };
  }
  if (!found) {
    return { ok: false, error: { code: "NOT_FOUND", message: "That conversation is gone." } };
  }

  // Step 6 — Log success.
  logger.info({ userId, action: "chat_thread_deleted", threadId }, "chat_thread_deleted");

  // Step 7 — Return.
  return { ok: true, data: { threadId } };
}
