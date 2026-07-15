import type { User } from "@supabase/supabase-js";
import { getUser } from "@/lib/supabase/get-user";
import { assertUnderQuota } from "@/lib/ai/usage";
import { checkRateLimit, tooManyRequests, type RateTier } from "./rate-limit";

export type RequireUserResult = { ok: true; user: User } | { ok: false; response: Response };

// Monthly per-user AI spend cap in USD (backstop against runaway cost, on top
// of per-minute rate limits). Tunable via env; <= 0 disables the check.
const DEFAULT_MONTHLY_CAP_USD = 20;

function monthlyCapUsd(): number {
  const raw = process.env.AI_USER_MONTHLY_CAP_USD;
  if (!raw) return DEFAULT_MONTHLY_CAP_USD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_MONTHLY_CAP_USD;
}

/**
 * Gate an API route on auth + rate-limit + (for AI tiers) the monthly spend cap.
 *
 * `spendCap` defaults on for the expensive/whisper tiers; pass it explicitly
 * for AI-calling routes on the cheap tier (e.g. profile/extract-resume).
 *
 * Usage:
 *   const gate = await requireUser(req, { tier: "expensive", route: "interview/score" });
 *   if (!gate.ok) return gate.response;
 *   const user = gate.user;
 */
export async function requireUser(
  req: Request,
  opts: { tier: RateTier; route: string; spendCap?: boolean },
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

  const capApplies = opts.spendCap ?? (opts.tier === "expensive" || opts.tier === "whisper");
  const cap = monthlyCapUsd();
  if (capApplies && cap > 0) {
    const quota = await assertUnderQuota(user.id, cap);
    if (!quota.ok) {
      return {
        ok: false,
        response: Response.json(
          { error: "Monthly AI usage limit reached. It resets on the 1st." },
          { status: 429 },
        ),
      };
    }
  }

  return { ok: true, user };
}
