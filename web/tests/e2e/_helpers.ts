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
 */
export const SAMPLE_GUIDE_SLUG = "dcf-fundamentals";

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
