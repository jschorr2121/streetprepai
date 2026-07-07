"use server";

import { fieldErrorsFromIssues, type ActionResult } from "@/lib/auth/action-result";
import { logger } from "@/lib/logging/logger";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";

// Sets a new password. Requires the recovery session created when the user
// clicks the reset link (Supabase establishes it from the URL fragment on the
// client, which is why this runs after the page has loaded that session).
export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = resetPasswordSchema.safeParse(input);
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Your reset link has expired. Request a new one." },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.warn({ userId: user.id, action: "password_reset_failed" }, "password_reset_failed");
    return { ok: false, error: { code: "INTERNAL", message: error.message } };
  }

  logger.info({ userId: user.id, action: "password_reset" }, "password_reset");
  return { ok: true, data: { updated: true } };
}
