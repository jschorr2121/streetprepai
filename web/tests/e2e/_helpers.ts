import path from "node:path";

/**
 * Shared helpers for golden-path E2E specs.
 *
 * Auth-skip strategy:
 * Most app pages sit behind a Supabase auth wall via proxy.ts. To keep CI
 * green by default, authed specs are skipped unless STREETPREP_E2E_AUTH=1 is
 * set. To actually run them locally, you must also provide a logged-in
 * Supabase session via storageState (or run with a dev-mode auth bypass).
 *
 * Public-facing specs (landing, /library, /guide/<slug>) do NOT use this skip.
 */
export const AUTH_SKIP_REASON =
  "Set STREETPREP_E2E_AUTH=1 to run authed E2E (and ensure a logged-in session cookie is provided to playwright via storageState). See tests/e2e/_helpers.ts.";

export const AUTH_SKIP_FLAG = !process.env.STREETPREP_E2E_AUTH;

/**
 * Where `tests/e2e/global-setup.ts` writes the logged-in Supabase session
 * (cookies + localStorage) when STREETPREP_E2E_AUTH=1 and
 * STREETPREP_E2E_EMAIL/STREETPREP_E2E_PASSWORD are set. Authed specs opt in
 * with `test.use({ storageState: AUTH_STORAGE_STATE_PATH })` inside their
 * gated `test.describe` block (never at file scope — that would also affect
 * any ungated/public tests in the same file). Gitignored; never committed.
 *
 * When global setup no-ops (vars absent), this path never gets written, but
 * that's harmless: every spec that references it is also behind
 * `test.skip(AUTH_SKIP_FLAG, ...)`, and Playwright doesn't resolve the
 * `storageState`-dependent context fixture for a skipped test.
 */
export const AUTH_STORAGE_STATE_PATH = path.join(__dirname, ".auth", "user.json");

/**
 * Live-AI guard. Specs that hit real Anthropic / OpenAI / Groq endpoints
 * (and therefore COST MONEY per run) must check this flag. Skipped by
 * default; opt in with `STREETPREP_E2E_LIVE_AI=1 pnpm test:e2e:live`.
 *
 * Rough per-run cost (Sonnet for streams + Haiku for short drafts): ~$0.05–0.15.
 * Add up across CI re-runs and matrix browsers, so opt-in only.
 */
export const LIVE_AI_SKIP_REASON =
  "Set STREETPREP_E2E_LIVE_AI=1 to run live-AI E2E. These tests hit real Anthropic/OpenAI endpoints and incur cost (~$0.05–0.15 per run). Use `pnpm test:e2e:live`.";

export const LIVE_AI_SKIP_FLAG = !process.env.STREETPREP_E2E_LIVE_AI;

/**
 * A guide slug guaranteed to exist in content/guides/. Used by the chat spec.
 * (Was "dcf-fundamentals", which never matched a real file — the live-AI chat
 * spec would have 404'd if ever run.)
 */
export const SAMPLE_GUIDE_SLUG = "walk-me-through-a-dcf";

/**
 * HTTP response headers `result.toUIMessageStreamResponse()` sets (see
 * `UI_MESSAGE_STREAM_HEADERS` in node_modules/ai/dist/index.js, v7.0.31).
 * Mocked routes should mirror these so client-side stream detection matches.
 */
export const UI_MESSAGE_STREAM_HEADERS: Record<string, string> = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  connection: "keep-alive",
  "x-vercel-ai-ui-message-stream": "v1",
  "x-accel-buffering": "no",
};

/**
 * Builds a canned AI SDK v7 UI-message-stream response body for mocking
 * `/api/chat/assistant` (or any `toUIMessageStreamResponse()` route) via
 * Playwright's `page.route`.
 *
 * Wire format verified directly against the installed `ai@7.0.31` package
 * (node_modules/ai/dist/index.js — `JsonToSseTransformStream` /
 * `UIMessageChunk`), NOT training data: each `UIMessageChunk` is JSON-encoded
 * as an SSE line (`data: <json>\n\n`), and the stream ends with a literal
 * `data: [DONE]\n\n` sentinel. A minimal happy-path text turn is:
 *   {"type":"start","messageId":...} → {"type":"start-step"} →
 *   {"type":"text-start","id":...} → {"type":"text-delta","id":...,"delta":...} →
 *   {"type":"text-end","id":...} → {"type":"finish-step"} → {"type":"finish"}
 * `@ai-sdk/react`'s `useChat` (via `processUIMessageStream`) requires
 * `text-start` before any `text-delta` for the same `id`, so the order here
 * is load-bearing.
 */
export function buildUiMessageStream(text: string, opts?: { messageId?: string }): string {
  const messageId = opts?.messageId ?? "mock-assistant-message";
  const textId = "mock-text-part";
  const chunks: unknown[] = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "text-start", id: textId },
    { type: "text-delta", id: textId, delta: text },
    { type: "text-end", id: textId },
    { type: "finish-step" },
    { type: "finish" },
  ];
  return chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
}

/**
 * Sample resume text used by the resume-coach spec.
 */
export const SAMPLE_RESUME_TEXT = `Jake Schorr
University of Michigan, Ross School of Business, Class of 2027
GPA: 3.85 / 4.0

EXPERIENCE
Acme Capital Partners — Private Equity Intern (Jun 2025 - Aug 2025)
- Built three-statement model for a $250M LBO in healthcare services
- Drafted IC memo and presented investment thesis to senior partners
- Sourced and screened 40+ targets, advancing 5 to first-round diligence

Startup Co — CFO Intern (Jan 2025 - May 2025)
- Owned monthly close, AR/AP, and 13-week cash forecast for seed-stage SaaS
- Modeled Series A scenarios across three valuation frameworks

EDUCATION
University of Michigan, Ross School of Business — BBA, 2027
Relevant coursework: Corporate Finance, Financial Accounting, Valuation
`;
