"use server";

import { headers } from "next/headers";

import { fieldErrorsFromIssues, type ActionResult } from "@/lib/auth/action-result";
import { logger } from "@/lib/logging/logger";
import { authActionLimiter } from "@/lib/ratelimit/limiters";
import { signUpSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return hdrs.get("x-real-ip") ?? "unknown";
}

// Email + password signup.
//
// Email confirmation is OFF in dev: signup returns a usable session immediately,
// so the happy path lands the user straight in onboarding. If confirmation is
// later enabled in the Supabase dashboard, no session comes back on signup — we
// detect that (`needsEmailConfirmation`) and the page shows a "check your email"
// state instead of redirecting.
export async function signUpAction(
  input: unknown,
): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  // Rate limit by IP before any Supabase call.
  const ip = await getClientIp();
  const rl = await authActionLimiter(ip);
  if (!rl.allowed) {
    return {
      ok: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in a minute." },
    };
  }

  const parsed = signUpSchema.safeParse(input);
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
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Supabase returns a 422 for an already-registered email. Surface it on the
    // email field rather than as a generic error.
    const taken = /registered|already/i.test(error.message);
    logger.warn({ userId: "anon", action: "sign_up_failed" }, "sign_up_failed");
    return {
      ok: false,
      error: taken
        ? {
            code: "VALIDATION_FAILED",
            message: "That email is already in use.",
            fieldErrors: { email: "That email is already in use." },
          }
        : { code: "INTERNAL", message: error.message },
    };
  }

  // No session returned → email confirmation is enabled and required.
  const needsEmailConfirmation = !data.session;
  logger.info(
    { userId: data.user?.id ?? "anon", action: "sign_up", needsEmailConfirmation },
    "sign_up",
  );
  return { ok: true, data: { needsEmailConfirmation } };
}
