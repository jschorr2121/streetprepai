import { getAdminClient } from "@/lib/supabase/admin";
import { RateLimitedError } from "@/lib/errors";
import { calculateCost, type TokenUsage } from "./pricing";

export type UsagePayload = {
  model: string;
  usage: TokenUsage;
  endpoint: string;
  userId?: string;
  /** Flat per-call costs (e.g. web-search surcharge) added on top of token cost. */
  surchargeUsd?: number;
};

export function logUsage(payload: UsagePayload): void {
  const admin = getAdminClient();
  if (!admin) {
    console.warn(
      "[ai/usage] logUsage: admin client unavailable (SUPABASE_SERVICE_ROLE_KEY not set)",
    );
    return;
  }

  // ai_usage.user_id is NOT NULL (migration 0011) — a usage row with no owner
  // is invisible to per-user spend caps (assertUnderQuota filters user_id), so
  // it is worse than useless. Every real write path supplies a userId; if one
  // is ever missing, skip the insert and surface it loudly rather than write an
  // unattributable row (which the DB would reject anyway, swallowed below).
  if (!payload.userId) {
    console.warn(
      `[ai/usage] logUsage: missing userId for endpoint "${payload.endpoint}" — usage not recorded`,
    );
    return;
  }

  const costUsd = calculateCost(payload.model, payload.usage) + (payload.surchargeUsd ?? 0);

  // Supabase query builders are lazy thenables — the request only fires once
  // `.then()` is attached. A bare `void builder` never executes the insert.
  void admin
    .from("ai_usage")
    .insert({
      user_id: payload.userId,
      endpoint: payload.endpoint,
      model: payload.model,
      input_tokens: payload.usage.input_tokens,
      output_tokens: payload.usage.output_tokens,
      cache_read_tokens: payload.usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: payload.usage.cache_creation_input_tokens ?? 0,
      cost_usd: costUsd,
    })
    .then(({ error }) => {
      if (error) {
        console.error("[ai/usage] logUsage insert failed:", error);
      }
    });
}

/**
 * Structural subset of the AI SDK's `LanguageModelUsage` (v7). Declared here so
 * usage tracking stays decoupled from the `ai` package's types.
 */
export type SdkUsage = {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  inputTokenDetails?: {
    noCacheTokens?: number | undefined;
    cacheReadTokens?: number | undefined;
    cacheWriteTokens?: number | undefined;
  };
};

/**
 * Map AI SDK usage to the Anthropic-shaped `TokenUsage` that pricing expects:
 * `input_tokens` is NON-cached input there, while the SDK's `inputTokens` is the
 * total. Prefer the SDK's explicit `noCacheTokens`, else back out the cached
 * portions from the total.
 */
export function sdkUsageToTokenUsage(usage: SdkUsage): TokenUsage {
  const cacheRead = usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const cacheWrite = usage.inputTokenDetails?.cacheWriteTokens ?? 0;
  const input =
    usage.inputTokenDetails?.noCacheTokens ??
    Math.max((usage.inputTokens ?? 0) - cacheRead - cacheWrite, 0);
  return {
    input_tokens: input,
    output_tokens: usage.outputTokens ?? 0,
    cache_read_input_tokens: cacheRead,
    cache_creation_input_tokens: cacheWrite,
  };
}

type TrackStreamOpts = { userId?: string };

export function trackStream(
  stream: { finalMessage: () => Promise<{ model?: string; usage?: TokenUsage }> },
  endpoint: string,
  opts: TrackStreamOpts = {},
): void {
  void stream
    .finalMessage()
    .then((msg) => {
      if (!msg.model || !msg.usage) return;
      logUsage({ model: msg.model, usage: msg.usage, endpoint, userId: opts.userId });
    })
    .catch(() => {
      // swallow — caller handles stream errors via their own error handling
    });
}

export type UsageMonthResult = { totalUsd: number; rowCount: number };

export async function getUserUsageThisMonth(userId: string): Promise<UsageMonthResult> {
  const admin = getAdminClient();
  if (!admin) return { totalUsd: 0, rowCount: 0 };

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const { data, error } = await admin
    .from("ai_usage")
    .select("cost_usd")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  if (error || !data) {
    console.error("[ai/usage] getUserUsageThisMonth error:", error);
    return { totalUsd: 0, rowCount: 0 };
  }

  const rows: { cost_usd: number | string }[] = Array.isArray(data) ? data : [];
  const totalUsd = rows.reduce((sum, r) => sum + Number(r.cost_usd), 0);
  return { totalUsd, rowCount: rows.length };
}

export type QuotaResult = { ok: boolean; usedUsd: number };

export async function assertUnderQuota(userId: string, capUsd: number): Promise<QuotaResult> {
  const { totalUsd } = await getUserUsageThisMonth(userId);
  return { ok: totalUsd < capUsd, usedUsd: totalUsd };
}

// Monthly per-user AI spend cap in USD — the same backstop that
// lib/security/require-user.ts enforces for AI API routes. Tunable via env;
// <= 0 disables the check. Kept here so AI-calling Server Actions (which never
// pass through requireUser) can enforce the identical cap.
const DEFAULT_MONTHLY_CAP_USD = 20;

function monthlyCapUsd(): number {
  const raw = process.env.AI_USER_MONTHLY_CAP_USD;
  if (!raw) return DEFAULT_MONTHLY_CAP_USD;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_MONTHLY_CAP_USD;
}

/**
 * Enforce the monthly AI spend cap for an AI-calling Server Action. Place it
 * after auth + the per-minute rate limit, immediately before the paid AI call.
 *
 * Throws `RateLimitedError` (→ the `RATE_LIMITED` Server-Action failure shape,
 * via `actionErrorFromAppError`) ONLY on a definitive over-cap answer. It
 * mirrors `assertUnderQuota`'s store-failure stance: when the admin client is
 * unavailable or the usage query errors, usage reads as $0, so the call is
 * allowed (fail-open) rather than blocking every user on a transient DB fault —
 * the recorded spend in `ai_usage` is the source of truth, not this gate.
 */
export async function assertAiActionAllowed(userId: string): Promise<void> {
  const cap = monthlyCapUsd();
  if (cap <= 0) return;
  const { ok } = await assertUnderQuota(userId, cap);
  if (!ok) {
    throw new RateLimitedError("Monthly AI usage limit reached. It resets on the 1st.");
  }
}
