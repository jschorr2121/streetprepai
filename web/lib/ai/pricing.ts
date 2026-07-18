export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export type PricingEntry = {
  input: number;
  output: number;
  cache_write: number;
  cache_read: number;
};

export const PRICING: Record<string, PricingEntry> = {
  // Opus 4.5+ dropped to $5/$25 (the $15/$75 rates were Opus 4.1 and earlier):
  // https://platform.claude.com/docs/en/about-claude/pricing
  "claude-opus-4-7": {
    input: 5.0,
    output: 25.0,
    cache_write: 6.25,
    cache_read: 0.5,
  },
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.3,
  },
  "claude-haiku-4-5-20251001": {
    input: 1.0,
    output: 5.0,
    cache_write: 1.25,
    cache_read: 0.1,
  },
  "gpt-5.4-nano": {
    input: 0.2,
    output: 1.25,
    cache_write: 0,
    cache_read: 0,
  },
  "gpt-5.4-nano-2026-03-17": {
    input: 0.2,
    output: 1.25,
    cache_write: 0,
    cache_read: 0,
  },
  "text-embedding-3-small": {
    input: 0.02,
    output: 0.0,
    cache_write: 0,
    cache_read: 0,
  },
};

/**
 * Anthropic's server-side web_search tool is billed per search ($10 / 1,000)
 * on top of tokens. Token pricing above can't express per-call costs, so
 * routes pass `surchargeUsd` to `logUsage` instead.
 */
export const WEB_SEARCH_PER_CALL_USD = 0.01;

/**
 * OpenAI Whisper (`whisper-1`) is billed per minute of audio, not per token —
 * $0.006/min per OpenAI's published pricing. There's no token count to plug
 * into `calculateCost`, so transcribe routes pass a duration-derived
 * `surchargeUsd` to `logUsage` instead (usage.input_tokens/output_tokens = 0).
 */
export const WHISPER_USD_PER_MINUTE = 0.006;

export function calculateCost(model: string, usage: TokenUsage): number {
  const p = PRICING[model] ?? PRICING[model.split("-20")[0]!] ?? null;
  if (!p) return 0;

  const perM = 1_000_000;
  let cost = 0;
  cost += (usage.input_tokens / perM) * p.input;
  cost += (usage.output_tokens / perM) * p.output;
  cost += ((usage.cache_creation_input_tokens ?? 0) / perM) * p.cache_write;
  cost += ((usage.cache_read_input_tokens ?? 0) / perM) * p.cache_read;
  return cost;
}
