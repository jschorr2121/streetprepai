import type { User } from "@supabase/supabase-js";
import { getUser } from "@/lib/supabase/get-user";
import { checkRateLimit, tooManyRequests, type RateTier } from "./rate-limit";

export type RequireUserResult = { ok: true; user: User } | { ok: false; response: Response };

/**
 * Gate an API route on auth + rate-limit.
 *
 * Usage:
 *   const gate = await requireUser(req, { tier: "expensive", route: "interview/score" });
 *   if (!gate.ok) return gate.response;
 *   const user = gate.user;
 */
export async function requireUser(
  req: Request,
  opts: { tier: RateTier; route: string },
): Promise<RequireUserResult> {
  let user: User;
  try {
    user = await getUser();
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const rl = await checkRateLimit(req, user.id, opts.tier, opts.route);
  if (!rl.ok) return { ok: false, response: tooManyRequests(rl) };

  return { ok: true, user };
}
