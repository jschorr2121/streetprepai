import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/auth/middleware";

// Next.js 16 proxy (formerly `middleware.ts`). Refreshes the Supabase session
// cookie on every matched request and enforces auth + onboarding gating. The
// `proxy` runtime is nodejs, which is what the Supabase session read needs.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Matcher: run on the signed-in app shell, the auth routes, AND /api/* (the
// proxy is the defense-in-depth auth backstop for API routes — they still gate
// themselves via requireUser). Skip Next static assets, image optimizer,
// favicon, and static file extensions.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
