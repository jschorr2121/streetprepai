import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/auth/middleware";

// Next.js 16 proxy (formerly `middleware.ts`). Refreshes the Supabase session
// cookie on every matched request and enforces auth + onboarding gating. The
// `proxy` runtime is nodejs, which is what the Supabase session read needs.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Matcher: run on the signed-in app shell and the auth routes; skip Next static
// assets, image optimizer, favicon, and API routes (those gate themselves).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
