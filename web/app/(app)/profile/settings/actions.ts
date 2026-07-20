"use server";

import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { actionErrorFromAppError, type ActionResult } from "@/lib/auth/action-result";
import { ONBOARDED_COOKIE } from "@/lib/auth/middleware";
import { requireUser } from "@/lib/auth/server";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { accountDeletionLimiter } from "@/lib/ratelimit/limiters";
import { getAdminClient } from "@/lib/supabase/admin";
import { deleteUserStorageObjects } from "@/lib/supabase/delete-user-storage";
import { createClient } from "@/lib/supabase/server";

// Self-serve account deletion (architecture.md → Account deletion). Irreversible
// and immediate. Order matters: Storage objects are removed BEFORE the auth
// user, so a mid-failure leaves a recoverable state. Deleting the auth user
// then cascades every user-owned Postgres row via `on delete cascade` on the
// `user_id → auth.users(id)` FK (verified across all migrations), so no explicit
// row deletes are needed here.
//
// PostHog person deletion promised by architecture.md is deferred: analytics is
// not yet wired server-side (no PostHog client/key in use). Re-add the person
// delete here once lib/analytics is mounted. See progress-tracker.

export async function deleteAccountAction(): Promise<ActionResult<never>> {
  // Step 1 — Auth.
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof AppError) return actionErrorFromAppError(err);
    throw err;
  }

  // Step 2 — Rate limit (destructive + irreversible; keyed by userId).
  const rl = await accountDeletionLimiter(userId);
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.`,
      },
    };
  }

  // Step 3 — Service-role client. Without it we cannot delete Storage objects or
  // the auth user, so we must not proceed (a partial delete is worse than none).
  const admin = getAdminClient();
  if (!admin) {
    logger.error({ userId, action: "account_delete_unavailable" }, "account_delete_unavailable");
    return {
      ok: false,
      error: { code: "INTERNAL", message: "Account deletion is temporarily unavailable." },
    };
  }

  // Step 4 — Storage cleanup FIRST. If it fails, abort before deleting the auth
  // user so the account (and its files) remain in a recoverable state.
  try {
    await deleteUserStorageObjects(admin, userId);
  } catch (err) {
    logger.error(
      { userId, action: "account_delete_storage_failed" },
      "account_delete_storage_failed",
    );
    Sentry.captureException(err);
    return {
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Could not remove your files. Your account was not deleted.",
      },
    };
  }

  // Step 5 — Delete the auth user (cascades all Postgres rows).
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    logger.error({ userId, action: "account_delete_auth_failed" }, "account_delete_auth_failed");
    Sentry.captureException(deleteError);
    return {
      ok: false,
      error: { code: "INTERNAL", message: "Something went wrong deleting your account." },
    };
  }

  // Step 6 — Clear the browser session. Local scope only: the user is already
  // gone server-side, so a global revoke would just error on a dead session.
  const supabase = await createClient();
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) {
    logger.warn(
      { userId, action: "account_delete_signout_failed" },
      "account_delete_signout_failed",
    );
  }

  // Step 7 — Drop the onboarding memo cookie so a re-signup on this browser
  // re-runs onboarding instead of inheriting the deleted account's flag.
  (await cookies()).delete(ONBOARDED_COOKIE);

  logger.info({ userId, action: "account_deleted" }, "account_deleted");

  // Step 8 — Home to the marketing landing. redirect() throws NEXT_REDIRECT, so
  // it must live outside the try/catch above; its `never` return satisfies the
  // signature without a trailing return.
  redirect("/");
}
