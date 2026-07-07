import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logging/logger";
import { createClient } from "@/lib/supabase/server";

// Code-exchange callback for both Google OAuth and the password-reset link.
// Supabase redirects here with a `code`; we exchange it for a session (cookies
// set via the SSR client), ensure a `profiles` row exists, then hand off to
// `next` (defaults to /dashboard). For password reset, `next` is /reset-password,
// where the now-active recovery session lets the user set a new password.
// Middleware re-routes /dashboard → /onboarding if the row isn't onboarded yet.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  // Only allow same-origin relative redirects (no open-redirect via `next`).
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    logger.warn({ userId: "anon", action: "oauth_callback_error" }, "oauth_callback_error");
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    logger.warn({ userId: "anon", action: "oauth_exchange_failed" }, "oauth_exchange_failed");
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // Ensure a profiles row exists for OAuth users (no auth trigger guarantee).
  // RLS-scoped upsert under the user's own session; no-op if the row is there.
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ user_id: data.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (upsertError) {
    logger.warn(
      { userId: data.user.id, action: "oauth_profile_upsert_failed" },
      "oauth_profile_upsert_failed",
    );
  }

  logger.info({ userId: data.user.id, action: "oauth_sign_in" }, "oauth_sign_in");
  return NextResponse.redirect(`${origin}${next}`);
}
