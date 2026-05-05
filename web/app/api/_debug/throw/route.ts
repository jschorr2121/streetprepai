// Dev-only Sentry smoke-test endpoint.
//
// Hitting GET /api/_debug/throw intentionally throws an unhandled error
// so we can verify that:
//   1. The error reaches Sentry via `onRequestError` in `instrumentation.ts`
//   2. Source maps are uploaded and the stack frame resolves to TS source
//   3. PII filtering in `beforeSend` is doing its job
//
// Access control:
//   - Auth + rate-limit gate via `requireUser` (cheap tier).
//   - In production, hidden behind DEBUG_ADMIN_EMAIL — anyone else gets a
//     404 (not 403) so the route's existence is not advertised.
//   - In non-production environments, any authenticated user can hit it.

import { requireUser } from "@/lib/security/require-user";

export const runtime = "nodejs";

function notFound() {
  return new Response("Not Found", { status: 404 });
}

export async function GET(req: Request) {
  const gate = await requireUser(req, {
    tier: "cheap",
    route: "_debug/throw",
  });
  if (!gate.ok) return gate.response;

  const isProd = process.env.NODE_ENV === "production";
  const adminEmail = process.env.DEBUG_ADMIN_EMAIL;
  const userEmail = gate.user.email;

  if (isProd) {
    if (!adminEmail || !userEmail || userEmail !== adminEmail) {
      return notFound();
    }
  }

  throw new Error(`[sentry-smoke-test] intentional throw at ${new Date().toISOString()}`);
}
