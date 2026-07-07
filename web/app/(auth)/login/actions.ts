"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { fieldErrorsFromIssues, type ActionResult } from "@/lib/auth/action-result";
import { logger } from "@/lib/logging/logger";
import { authActionLimiter } from "@/lib/ratelimit/limiters";
import { signInSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";

// Returns the leftmost IP from x-forwarded-for or falls back to x-real-ip.
// If neither is present (e.g. local dev proxy), uses a constant key — still
// better than no throttling at all.
async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return hdrs.get("x-real-ip") ?? "unknown";
}

// Email + password sign-in. On success the session cookie is set by the Supabase
// SSR client; the caller redirects to /dashboard (middleware re-routes to
// /onboarding if the profile isn't onboarded yet).
export async function signInAction(input: unknown): Promise<ActionResult<{ userId: string }>> {
  // Rate limit by IP before any Supabase call.
  const ip = await getClientIp();
  const rl = await authActionLimiter(ip);
  if (!rl.allowed) {
    return {
      ok: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in a minute." },
    };
  }

  const parsed = signInSchema.safeParse(input);
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    logger.warn({ userId: "anon", action: "sign_in_failed" }, "sign_in_failed");
    return {
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Invalid email or password." },
    };
  }

  logger.info({ userId: data.user.id, action: "sign_in" }, "sign_in");
  return { ok: true, data: { userId: data.user.id } };
}

// Google OAuth. Returns a Supabase-hosted authorize URL; the client navigates to
// it. Supabase redirects back to /callback, which exchanges the code.
export async function signInWithGoogleAction(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/callback`,
    },
  });

  if (error || !data.url) {
    logger.warn({ userId: "anon", action: "google_oauth_init_failed" }, "google_oauth_init_failed");
    return {
      ok: false,
      error: { code: "INTERNAL", message: "Could not start Google sign-in. Try again." },
    };
  }

  redirect(data.url);
}
