# Brainstorm: observability & error triage for a solo-founder launch

Scope: everything that turns a production incident into something Jake actually sees, in time to
act, without drowning him in noise. Read this session: `web/lib/logging/{logger,request-context}.ts`,
`web/instrumentation{,-client}.ts`, `web/sentry.{server,edge}.config.ts`, `web/next.config.ts`'s
`withSentryConfig` block, `web/app/api/health/route.ts`, `web/lib/ai/usage.ts`,
`web/lib/security/client-error.ts`, `web/app/{error,global-error}.tsx`, `web/lib/feedback/actions.ts`,
and every `Sentry.*` / `clientSafeError` / `console.error` call site across `web/app/api/**` and
`web/lib/**`. Verified live against Sentry's and Vercel's current docs this session (2026-07-21) —
cited inline. Anything not cited is inferred from reading the code, not independently verified.

## What's actually invisible right now (confirmed by reading the code, not assumed)

- **Route Handler errors that are caught never reach Sentry.** `lib/security/client-error.ts`'s
  `clientSafeError()` — the shared "turn a raw error into a safe client message" helper used by 10
  of the 17 `app/api/**/route.ts` files (`grep` count: 22 call sites) — does `console.error(...)`
  and nothing else. `instrumentation.ts`'s `onRequestError = Sentry.captureRequestError` only fires
  on an _uncaught_ throw out of a Route Handler; every one of these 22 sites catches the error
  itself and returns a 4xx/5xx `Response`, so Sentry never sees it. That includes `interview/score`,
  `resume/critique`, both transcribe routes, `relationships/{structure-chat,draft-outreach,draft-followup}`
  — the paid, user-facing AI call sites are exactly the ones invisible on failure.
- **`chat/assistant`'s stream-error path is `console.error` only** (`app/api/chat/assistant/route.ts`
  line ~126, the `consumeStream({ onError })` fire-and-forget branch). This is the highest-volume AI
  route in the product (every chat turn) and a mid-stream Anthropic failure here is currently a
  silent, unlogged-to-Sentry event.
- **`lib/ai/usage.ts` cost-tracking failures are `console.warn`/`console.error` only** — missing
  admin client, missing `userId`, or a failed `ai_usage` insert. None of these reach Sentry or the
  pino logger. A quiet Supabase outage here means the monthly spend cap (`assertUnderQuota`) silently
  stops enforcing (fails open by design) with zero alert that it's happening.
- **No latency is recorded anywhere on an AI call.** `architecture.md`'s invariant 4 states every LLM
  call writes a row with "latency ms" — the actual `ai_usage` Drizzle schema
  (`lib/db/schema/ai-usage.ts`) has no latency column, and `logUsage()`/`trackStream()` never measure
  one. This is a doc/code drift worth flagging to Jake (not fixed here — out of this brainstorm's
  file scope) as well as a genuine blind spot: a P95 latency regression on `chat/assistant` or
  `interview/score` is currently undetectable by anything in the codebase.
- **No Sentry `setContext`/tags on AI routes.** When an error _does_ reach Sentry (client-side
  `error.tsx`/`global-error.tsx`, or an uncaught Route Handler throw), the event carries no
  `model`/`endpoint`/`userId`/token-usage context — `beforeSend` in all three Sentry configs strips
  `event.request` down to `{url, method}` and `event.user` down to `{id}` (correct, PII-safe), but
  nothing replaces that with AI-specific breadcrumbs. Debugging "why did resume/critique fail for
  this user" from Sentry alone is currently guesswork.
- **The client error boundaries (`app/error.tsx`, `app/global-error.tsx`) manually re-import
  `@sentry/nextjs` and call `captureException` in a `useEffect`** as a documented fallback for
  "boundaries [the SDK] can't reach automatically" — this works but duplicates what the SDK's error
  boundary helper does natively; low priority, not broken, just worth knowing it's hand-rolled.
- **The `feedback` widget already does the right thing** (`lib/feedback/actions.ts` calls
  `Sentry.captureException(err)` on its own failure path) — it's the one place in the app that
  correctly wires an unexpected error to Sentry from a Server Action. Worth treating as the pattern
  to replicate elsewhere, not a gap.
- **No uptime/synthetic monitoring is live** — `GET /api/health` exists (DB `select 1`, 200/503,
  no-auth) but nothing polls it yet; pointing an external monitor at it is already filed in
  `jakes-tasks.md` (🟡 before-launch section) — not re-filed here, just noted as the other half of
  this same gap.

## Ranked ideas

1. **Turn on `Sentry.pinoIntegration()` with `captureErrors: ["error"]` in `sentry.server.config.ts`.**
   [S, unblocked, first: add `integrations: [Sentry.pinoIntegration({ captureErrors: ["error"] })]`
   - `enableLogs: true` to the existing `Sentry.init(...)` call] This is the single highest-leverage
     fix here: the app already has a structured pino logger (`lib/logging/logger.ts`) and
     `code-standards.md` already documents the convention "`error` — captured to Sentry" as a
     _manual_ discipline every call site is supposed to follow — but nothing enforces it, which is
     exactly why the 22 `clientSafeError`/`console.error` sites above went uncaptured. The pino
     integration makes "captured to Sentry" true by construction for every `logger.error(...)` call
     in the codebase, present and future, with no per-site wiring. Requires `@sentry/nextjs >= 10.18.0`
     for the integration (installed: `^10.51.0` — satisfied) and `>= 10.61.0` only for the newer
     `setAttribute` sibling feature (not needed for this). [Pino integration
     docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/pino/) ·
     [Sentry Logs setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs/). Node-runtime
     only (matches where pino already runs — `lib/logging/logger.ts` has no edge/browser variant), so
     no edge-config change needed.
2. **Route the 22 `clientSafeError` call sites (and `lib/ai/usage.ts`'s console.warn/error) through
   the shared `logger`, not raw `console.*`.** [S–M, unblocked once #1 lands, first: change
   `clientSafeError` in `lib/security/client-error.ts` from `console.error` to
   `logger.error({ route, err }, "route_error")`] Once the pino integration (#1) is live, this one
   edit makes every AI-route failure — interview scoring, resume critique, both transcribe routes,
   all three relationships AI actions — a real Sentry event with zero per-route changes. Same fix
   for `lib/ai/usage.ts`'s three `console.warn`/`console.error` call sites (missing admin client,
   missing userId, failed insert) turns "the spend cap silently stopped enforcing" from invisible
   into a Sentry alert. This is the natural pairing with #1 — #1 without this still misses every
   site that logs via raw `console.*` instead of the pino `logger`.
3. **Fix `chat/assistant`'s stream `onError` to log through `logger.error`, not `console.error`.**
   [S, unblocked, first: change line ~126's `onError: (err) => console.error(...)` to
   `onError: (err) => logger.error({ err, routeKey: "chat/assistant" }, "stream_consume_error")`]
   Same mechanism as #2, called out separately because it's the highest-volume route and the one
   most likely to have a genuine mid-stream Anthropic failure worth knowing about (rate limits,
   context-length errors, provider outages).
4. **Attach AI-call context to Sentry events via `Sentry.setContext` in `lib/ai/usage.ts`'s
   `logUsage()`.** [S–M, unblocked, first: call `Sentry.setContext("ai_call", { model, endpoint,
   userId, costUsd })` right before/after the insert, or thread it through a shared wrapper each AI
   route's catch block calls] Right now an error captured from an AI route (once #1–#3 land) is a
   bare stack trace with no idea which model, which route, or what the token spend looked like
   right before the failure. Sentry's own guidance for LLM-app monitoring is to make sure alerts
   "include sufficient context to support fast diagnosis, such as affected features [and] model
   versions" — this is the cheap way to get there without adopting a dedicated LLM-observability
   vendor. [LLM monitoring best practices, 2026](https://futureagi.com/blog/llm-monitoring-best-practices/)
5. **Add one Sentry alert rule: error-count threshold, not "notify on every event."** [S, unblocked,
   Jake-gated dashboard config, first: Sentry → Alerts → new Issue Alert → "when an issue is seen
   more than N times in M minutes" instead of the default "a new issue is created"] Once #1–#3 make
   dozens of previously-silent error paths start emitting to Sentry, the immediate risk is alert
   fatigue drowning a solo founder in notifications for one-off events (a single user's transient
   network blip) — Sentry's own alerting docs recommend frequency thresholds over per-event
   notification specifically to avoid this. [Sentry alerting
   guide](https://drdroid.io/engineering-tools/guide-for-sentry-alerting) · [Alert
   types](https://docs.sentry.io/product/alerts/alert-types/) This is a **dashboard config item for
   Jake**, not a code change — logged below and in the Jake-decision list.
6. **Point Sentry Cron Monitors (`Sentry.withMonitor`) at the Inngest background jobs** (weekly firm
   refresh, mock-media 30-day cleanup, spaced re-surfacing) once they exist. [M, **blocked** — no
   Inngest functions are wired yet per `progress-tracker.md` (Inngest account setup and jobs are
   still open Jake/agent items), first (when unblocked): wrap each Inngest function body in
   `Sentry.withMonitor("<job-slug>", () => { ... }, { schedule: {...} })`] Vercel's own automatic
   Sentry cron instrumentation **only covers Pages Router route handlers today, not App Router** —
   confirmed live against Sentry's docs — so this app's cron-adjacent work needs the manual
   `withMonitor` two-step check-in regardless of framework version. [Sentry Next.js crons
   setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/crons/) Flagging now so whoever
   builds the first Inngest job wires monitoring in the same PR instead of as a follow-up.
7. **Add a per-user/per-route latency measurement to `ai_usage`.** [M, unblocked, first: add a
   `latencyMs integer` column via a new Drizzle migration, capture `Date.now()` deltas around each
   Anthropic/OpenAI call in `logUsage`'s callers] Closes the doc/code drift noted above
   (`architecture.md` invariant 4 promises this, the schema doesn't have it) and gives Jake the one
   number ("chat/assistant P95 latency this week") that a solo founder actually needs to know if the
   product is getting slower before users complain. This is a schema change + new-feature-logic
   combo per `ai-workflow-rules.md`'s splitting rule — should land as its own unit, not bundled with
   #1–#4's logging fixes.
8. **`Vercel Log Drains` → a free-tier external sink (only if Sentry's own log retention proves too
   short).** [L, **blocked on a product decision**, no first step until Jake decides] Vercel's Log
   Drains now export structured JSON logs, OTel traces, and metrics to an external endpoint or
   marketplace integration (Datadog/Splunk/etc.), and correlate `traceId`/`spanId` automatically.
   [Vercel Drains overview](https://vercel.com/blog/introducing-vercel-drains) · [Structured logs
   guide](https://vercel.com/kb/guide/add-structured-application-logs-to-vercel-functions) This is
   real infrastructure for a small team scaling past "read the Sentry dashboard," but it's also a
   second observability surface for one person to check — deliberately ranked low and marked
   blocked-on-decision; see Jake-decision questions below.
9. **`experimental_telemetry` on the AI SDK v7 `streamText` call in `chat/assistant`.** [M, unblocked,
   first: add `experimental_telemetry: { isEnabled: true }` to the `streamText(...)` call] The AI
   SDK's OpenTelemetry integration emits spans with token counts, streaming latency, and tool-call
   detail for every `generateText`/`streamText` call — but it needs an OTel exporter configured
   (Vercel recommends `@vercel/otel`) to go anywhere, and this app has no OTel pipeline today.
   [AI SDK observability](https://signoz.io/docs/vercel-ai-sdk-observability/) Genuinely useful for
   latency (subsumes some of #7's value for this one route specifically) but adds a new
   dependency + exporter setup — rank below the logging-integration items because those are strictly
   cheaper and cover every route, not just one.

## Checked and rejected

- **Full LLM-observability vendor (Langfuse, Braintrust, Helicone, etc.).** These give per-call
  traces, eval scoring, and drift detection — genuinely the 2026 state of the art for LLM
  monitoring — but they're a second dashboard, a second vendor relationship, and (per their own
  positioning) aimed at teams running evals and quality regression tracking, not a solo founder who
  needs "did anything break" visibility. [LLM monitoring tools
  comparison](https://www.confident-ai.com/knowledge-base/compare/top-5-llm-monitoring-tools-for-ai)
  Sentry's own Insights/AI-agent monitoring (idea below) gets most of the cost/latency value inside
  the dashboard Jake already has open. Revisit only if eval-quality regression becomes a real
  problem, not for basic error/cost visibility.
- **Sentry's dedicated "AI Agents Insights" product (`invoke_agent` root spans).** This exists and is
  genuinely built for exactly this (Claude token counts, per-session cost, tool-call visibility) —
  [Sentry AI monitoring](https://sentry.io/cookbook/monitor-claude-code-with-sentry/) — but it's
  built around agentic _sessions_ (e.g. Claude Code runs), not a web app's discrete per-request AI
  calls; the fit for `chat/assistant`'s per-message calls is unclear without a deeper spike, and it
  would duplicate `ai_usage`'s existing per-user cost cap rather than replace it. Idea #4 (context
  on existing Sentry events) gets most of the debugging value for a fraction of the setup.
- **Sentry `Feature Flags` context integration.** Sentry ships flag-evaluation tracking tied to
  errors ("this error happened for users where flag X = variant Y") — irrelevant today since there
  is no feature-flag system in the app (no PostHog, no LaunchDarkly; PostHog itself is an
  unresolved product decision per the task brief). Revisit only if/when a flagging system is
  actually adopted.
- **Sentry AI-powered issue grouping / ML Priority Alerts.** Sentry's newer embeddings-based
  grouping and ML-driven priority scoring cut noise 35-40% in Sentry's own benchmarks
  [Sentry noise-reduction blog](https://blog.sentry.io/how-sentry-decreased-issue-noise-with-ai/) —
  but both are early-adopter/Business-plan features; no evidence they're available on whatever plan
  this project is on, and a frequency-threshold alert rule (#5) gets 80% of the noise reduction for
  zero plan-tier risk. Worth a look if Jake's Sentry plan already includes it — a Jake-decision
  question below, not a build item.
- **Automatic Vercel Cron → Sentry monitor wiring via `automaticVercelMonitors` in `next.config.ts`.**
  Rejected specifically because it only instruments the Pages Router — this app is 100% App Router,
  so the automatic path is a dead end regardless of whether Vercel Cron gets adopted; manual
  `withMonitor` (idea #6) is the only path that actually works here.
- **Rewriting `app/error.tsx`/`global-error.tsx`'s manual `Sentry.captureException` `useEffect` to use
  the SDK's built-in error-boundary helper.** The current hand-rolled version works and is explicitly
  commented as an intentional fallback; swapping it is a pure refactor with no user-visible behavior
  change and no bug being fixed — skip per `code-standards.md`'s "match the scope of the task" rule
  unless it's ever found to actually double-report or miss errors.

## AFK-safe vs Jake-gated

**AFK-safe — an agent can build these next session with no dashboard/account access needed:**

- #1 `Sentry.pinoIntegration()` + `enableLogs: true` (code: `sentry.server.config.ts`)
- #2 route `clientSafeError` + `lib/ai/usage.ts`'s console calls through the shared `logger`
- #3 `chat/assistant`'s stream `onError` through the shared `logger`
- #4 `Sentry.setContext("ai_call", ...)` in `lib/ai/usage.ts`
- #7 `ai_usage.latencyMs` migration + capture (own unit — schema change, split from #1–#4)
- #9 `experimental_telemetry` on `streamText` (code-only; the "where do spans go" question is
  separate and currently has no configured exporter, so this would ship inert until #8/OTel exists —
  flag that tradeoff to Jake before building, don't build it silently inert)

**Jake-gated — needs a decision or dashboard access an agent doesn't have:**

- #5 Sentry alert-rule threshold tuning (Sentry dashboard config)
- #6 Sentry Cron Monitors for Inngest jobs (blocked on Inngest itself being set up — separate
  existing Jake item)
- #8 Vercel Log Drains to an external sink (needs a Pro-plan check + picking a destination vendor)
- Confirming Sentry plan tier for AI-grouping/ML-priority-alert eligibility (checked-and-rejected
  item above)

## Open questions for Jake

1. **Alert channel and threshold**: once #1–#4 land, Sentry will start surfacing errors that were
   previously silent (every `clientSafeError` site, the chat stream path, spend-cap failures). What
   threshold do you want before a notification fires — every new issue type once, or only after N
   occurrences in M minutes (idea #5)? And where should it land (email vs Slack vs both) — the
   existing Sentry config has no notification integration configured that this session could find.
2. **Sentry plan tier**: are you on a plan where the AI-powered issue grouping / ML Priority Alerts
   features (checked-and-rejected above) are actually available? If so they might be worth turning
   on before hand-rolling more alert-rule tuning.
3. **`ai_usage.latencyMs` (#7) — worth a dedicated unit now, or wait for a concrete "is this slow"
   complaint?** It's a real invariant/code drift (architecture.md promises it, the schema doesn't
   have it) but it's also a schema migration + new capture logic, which `ai-workflow-rules.md` says
   should be its own unit rather than riding along with the logging fixes.
4. **External log sink (#8)**: is Sentry's own log retention (via `enableLogs`, idea #1) sufficient
   for your needs, or do you want a second destination (Datadog/Splunk/S3 via Vercel Drains) for
   longer retention or cross-referencing with Vercel's own runtime logs? This is a Pro-plan-gated
   Vercel feature — confirm the current Vercel plan before treating it as available.
5. **PostHog decision** (already an open product decision per the task brief, not new here): once
   PostHog is wired, its session-replay + funnel data would be a third signal source alongside
   Sentry errors and `ai_usage` cost rows — worth deciding now whether PostHog also becomes an
   error/alerting surface (it has its own error tracking beta) or stays purely product analytics, so
   the eventual PostHog unit doesn't quietly duplicate what Sentry already owns.
