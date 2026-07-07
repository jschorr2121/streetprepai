"use server";

import { headers } from "next/headers";

import { fieldErrorsFromIssues, type ActionResult } from "@/lib/auth/action-result";
import { logger } from "@/lib/logging/logger";
import { authActionLimiter } from "@/lib/ratelimit/limiters";
import { requestPasswordResetSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return hdrs.get("x-real-ip") ?? "unknown";
}

// Sends a password-reset email via Supabase's default sender (custom Resend
// templates are deferred to Unit 19). The reset link returns the user to
// /reset-password with a recovery session, where they set a new password.
//
// Always returns ok on a valid email shape — we never reveal whether an account
// exists for that address (avoids account enumeration).
export async function requestPasswordResetAction(
  input: unknown,
): Promise<ActionResult<{ sent: true }>> {
  // Rate limit by IP — critical to prevent email-send abuse.
  const ip = await getClientIp();
  const rl = await authActionLimiter(ip);
  if (!rl.allowed) {
    return {
      ok: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in a minute." },
    };
  }

  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Enter a valid email.",
        fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
      },
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  // Route the recovery link through /callback so the PKCE `code` is exchanged
  // for a recovery session, then on to /reset-password to set the new password.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/callback?next=/reset-password`,
  });

  if (error) {
    logger.warn(
      { userId: "anon", action: "password_reset_request_failed" },
      "password_reset_request_failed",
    );
    // Still report success to the user to avoid leaking which emails exist.
  }

  logger.info({ userId: "anon", action: "password_reset_requested" }, "password_reset_requested");
  return { ok: true, data: { sent: true } };
}
