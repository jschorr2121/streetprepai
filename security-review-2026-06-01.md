# Security Review — StreetPrep

> Consolidated output of a three-stage security sweep packaged via the `security-sweep` skill
> (`security-review` + `gstack-review` + `gstack-cso`).

| | |
|---|---|
| **Date run** | 2026-06-01 |
| **Target** | `~/Documents/InterviewPrep` — branch `master` |
| **Scope** | Stages 1–2: pending diff (config + docs). Stage 3: whole-repo, comprehensive depth |
| **Stage 3 method** | 7-agent parallel fan-out across 5 CSO dimensions + adversarial verification |
| **Findings** | 0 Critical · 0 confirmed High · 10 Medium · 8 Low · 15 Info/positive |

## Verdict

**🟢 No Critical, no confirmed High.** Both findings that initially scored High were knocked down on adversarial verification (one downgraded to Medium for this deployment, one refuted). The app has a genuinely strong security baseline — every route authenticated + rate-limited, RLS on every user table, no secret leaks. The actionable set is ~10 Medium items, most cheap to fix. **Nothing blocks shipping.**

## How it ran (important caveat)

`git diff` is **completely broken in this working directory** — `mmap` times out on the iCloud-backed `~/Documents` filesystem (every form fails, including `git diff HEAD~1 HEAD`, even with the sandbox disabled). The two diff-scoped skills (`security-review`, `gstack-review`) are built entirely on `git diff`, so they were run as a **security lens applied to a `git show`-reconstructed diff** rather than via the native skills. The changeset is config + docs only, so coverage is complete. The CSO stage ran on `git log`/`git grep`/`Read` (all functional). The packaged `security-sweep` skill itself invokes the real sub-skills and works normally in any non-iCloud repo.

Other coverage caveats (**UPDATED 2026-06-13**): the app **was executed** in the 2026-06-13 re-run — auth gating and RLS are now **live-verified** against a running dev server and two real DB users (see "Re-run — 2026-06-13" below); rate limiting was live-tested and **found broken** (finding R1). The iCloud `mmap` bundle-scan gap is unchanged (`git diff` still hangs; reconstructed via `git show`). Supabase production env values live in Vercel, not the repo.

---

## Re-run — 2026-06-13 (Units 4/6/7 + LIVE verification)

Second pass after **Unit 4** (auth UI + Next 16 `proxy.ts` gating + onboarding), **Unit 6** (canonical `saveProfileAction` Server Action), and **Unit 7** (Application Tracker CRUD + `get_applied_jobs` tool) landed. **This run executed the app and the database**, closing the 2026-06-01 "no app was executed" caveat. CSO depth: **daily** (high-confidence). Scope: the Unit 4/6/7 delta + live verification; the 2026-06-01 comprehensive whole-repo scan stands for the rest of the repo.

### LIVE verification — the caveat, closed

| Check | Method | Result |
|---|---|---|
| **Auth gating** | `curl` vs running dev server, unauthenticated, no-follow | ✅ `/dashboard`, `/tools/applications`, `/profile`, `/onboarding`, `/progress` all **307 → `/login`**; `/login`,`/signup`,`/forgot-password` → **200**. Proxy/middleware executes live. |
| **RLS isolation** | 2 real throwaway users; JWT claims set exactly as `withUser` does; direct SQL | ✅ **7/7** — user B cannot read / update / delete / spoof-insert (`WITH CHECK`) user A's `applied_jobs` row, cannot read A's `profiles` row; A's row intact after all of B's attempts. Test users + rows cleaned up. |
| **Rate limiting** | Upstash sliding-window `.limit()` against the configured store | ❌ **Upstash host `humble-pika-115403.upstash.io` does NOT resolve (ENOTFOUND)** with the sandbox off (Supabase resolved fine in the same run) — the durable limiter store is dead. See **R1**. |
| **Migrations 0004/0005** | applied via `DIRECT_URL`, before/after schema check | ✅ both **already applied** (profiles `current_semester`/`onboarded_at` present; `applied_jobs` canonical 6-value stage CHECK present). `0005` is **not** safely re-runnable — see **R4**. |

### New findings (this run)

| # | Severity | Finding | Location | Fix |
|---|---|---|---|---|
| R1 | 🟠 **High** | Rate-limit store unreachable (Upstash ENOTFOUND). `makeSlidingWindow` only fails-open when env is *missing*; when env is **set but the host is dead**, `.limit()` **throws**, and the limiter call in `saveProfileAction` (step 3) is **not** inside a try/catch → **every rate-limited mutation crashes** (profile save, application create/update/delete). Rate limiting isn't just absent — it takes the feature down. | live; `lib/ratelimit/limiters.ts`; `app/(app)/profile/actions.ts`; `app/(app)/tools/applications/actions.ts` | **(ops)** recreate the Upstash Redis DB + refresh `UPSTASH_REDIS_REST_URL/TOKEN` in `.env.local` **and** Vercel. **(code)** wrap `.limit()` in try/catch in `makeSlidingWindow` so a dead/unreachable store degrades gracefully (log + Sentry, then allow) instead of throwing into the action. |
| R2 | 🟡 Medium | Unauthenticated auth actions are **NOT rate-limited** — `signInAction`, `signUpAction`, `requestPasswordResetAction`. `forgot-password` triggers Supabase to email any address → email-bomb / sender-reputation / cost; `login` is a credential-stuffing surface. | `app/(auth)/{login,signup,forgot-password}/actions.ts` | Add an **IP-keyed** limiter to each (after R1's store is restored). Supabase has some built-in limits, but app-level throttle is the documented expectation for cheap-to-spam endpoints. |
| R3 | 🔵 Low | Rate-limiter **fails OPEN** (allows all) when Upstash env is unset, with no production guard/alarm — same class as legacy finding #12. | `lib/ratelimit/limiters.ts` | In production, fail-closed or emit a loud warning/alert rather than silently allowing. |
| R4 | 🔵 Low | Migration `0005` is **not idempotent** — `add constraint applied_jobs_stage_check` throws if it already exists, so re-running fails (the `DROP` step only matches the legacy `bookmarked` constraint). DB end-state is correct. | `web/supabase/migrations/0005_applied_jobs_stage_align.sql` | Guard the ADD with a `pg_constraint` existence check (or drop-by-name-if-exists first). |
| R5 | ⚪ Info | Two `UnauthorizedError` classes (`lib/auth/server.ts` vs `lib/errors.ts`); the canonical action imports the auth one and the `lib/errors.ts` `AppError` hierarchy is unused. Carried from the eng review; cleanup queued (T1). | `lib/errors.ts`, `lib/auth/server.ts` | Consolidate to one. |

### Prior findings updated by this work

- **#1 (Medium) "No middleware.ts" → ✅ RESOLVED.** Unit 4 added `web/proxy.ts` (Next 16 middleware) which refreshes the Supabase session and gates every `(app)` route. Verified live (all protected routes 307 → `/login`). The defense-in-depth backstop the finding asked for now exists.
- **#12 / #23 (Upstash fallback)** → escalated from latent to **active**: the store is actually unreachable right now (**R1**).
- **Open-redirect** via the post-auth `next` param: the new OAuth callback validates it (`next.startsWith("/")` + origin prefix) — **no open-redirect**. ✅
- **Secrets:** re-swept the new auth/action/tool code — clean, no hardcoded secrets. ✅

### Re-run verdict

🟠 **One High (R1) — a reliability-and-security issue: the rate-limit store is dead, which currently breaks (or silently disables) throttling on every mutation.** No Critical. RLS and auth gating are now **live-verified solid**. R1 needs the Upstash instance restored (ops) + a code guard so a dead store can never crash a mutation again; R2 (auth-action throttling) should land in the same pass.

---

## Stage 1 — `security-review` lens (pending diff)

Pending changeset: 6 new `db:*` npm scripts (`web/package.json`), a new `web/drizzle.config.ts`, and docs (`context/progress-tracker.md`).

| Severity | Finding | Detail |
|---|---|---|
| ⚪ Info | `db:*` scripts load the full `.env.local` into drizzle-kit | New scripts run `node --env-file=.env.local drizzle-kit …`. `db:push`/`db:migrate` mutate the DB schema directly; `db:studio` launches Drizzle Studio (local web UI, full DB read/write). Standard dev pattern, but `db:push` bypasses migration review and `db:studio` must never run on a shared/forwarded host. **Corroborated + escalated to Medium by CSO finding #8 below.** |
| ✅ Clean | `drizzle.config.ts` | No secrets committed; reads `DIRECT_URL ?? DATABASE_URL` from env; `schemaFilter: ["public"]` correctly avoids Supabase-internal schemas; fails fast if URL missing. |

## Stage 2 — `gstack-review` lens (SQL safety / LLM trust / side effects / structure)

| Severity | Finding | Detail |
|---|---|---|
| 🔵 Low | Schema ops over the pooler | If only `DATABASE_URL` (pgbouncer pooler, txn mode) is set, `db:migrate`/`db:push` can misbehave — schema ops want a session/direct connection. The config comment already flags preferring `DIRECT_URL`; ensure it is actually set. |
| ✅ Clean | No SQL injection, no LLM trust-boundary changes, no hidden conditional side effects in the diff. |

**Hygiene (from spot-checks, not security-critical):** `web/simona.py` is a tracked joke script (no secrets) → delete; `web/web/.husky/pre-commit` shows husky was initialized in a **nested wrong directory**; `web/venv/` is correctly untracked.

**Diff stages verdict: nothing blocking** — the diff is config + docs.

---

## Stage 3 — `gstack-cso` (comprehensive whole-repo audit)

Dimensions audited:
- Authentication, authorization & rate limiting on the 17 API routes
- LLM / AI trust boundaries & prompt injection
- Access control, RLS, injection (OWASP Top 10 for the data layer)
- Secrets archaeology & client exposure
- Dependency supply chain + CI/CD + app hardening config

Stats: **33** raw findings → **33** after dedupe · **2** high/critical adversarially verified (1 confirmed, 1 refuted).

### Findings index

| # | Severity | Finding | Location |
|---|---|---|---|
| 1 | 🟡 Medium | No middleware.ts — route protection is purely per-route convention with no defense-in-depth backstop | `web/ (no middleware.ts found anywhere outside node_modules)` |
| 2 | 🟡 Medium | structure-chat writes to chat_embeddings via the RLS-bypassing admin client using a client-supplied chatId/contactId, without verifying they belong to the caller | `web/app/api/relationships/structure-chat/route.ts:110-131` |
| 3 | 🟡 Medium | No per-user spend cap is enforced — assertUnderQuota() exists but is wired into zero routes; rate limit is the only cost control | `web/lib/ai/usage.ts:77-82 (assertUnderQuota / getUserUsageThisMonth) — not refer` |
| 4 | 🟡 Medium | Prompt-injection mitigation relies solely on tag-delimiting; instructions and untrusted data share the same user turn, no out-of-band isolation | `web/lib/ai/sanitize.ts:14-27` |
| 5 | 🟡 Medium | Service-role client bypasses RLS and is used inside a request handler (semantic recall + embeddings upsert); isolation depends entirely on one hand-written WHERE clause | `web/lib/supabase/admin.ts:13-22` |
| 6 | 🟡 Medium | Next.js pinned to 16.2.4 — affected by the May 2026 coordinated security release (13 advisories), and Vercel WAF does NOT mitigate | `web/package.json:52 ("next": "16.2.4") and node_modules/next/package.json (insta` |
| 7 | 🟡 Medium | react / react-dom pinned to 19.2.4 — below the 19.2.6 patch for the React Server Components DoS (CVE-2026-23870) | `web/package.json:63-64 ("react": "19.2.4", "react-dom": "19.2.4")` |
| 8 | 🟡 Medium | No security headers anywhere — no CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy | `web/next.config.ts (only async redirects()` |
| 9 | 🟡 Medium | drizzle-kit db:push / db:migrate / db:studio run directly against the real Supabase DB with no guardrail; db:studio exposes a full-DB web UI | `web/package.json:22-27 (db:pull/generate/migrate/push/check/studio) + web/drizzl` |
| 10 | 🟡 Medium | Sentry build plugin (withSentryConfig) is not wired — source maps are not managed/deleted, risking exposed production source maps and disabled server-side error capture | `web/next.config.ts (no withSentryConfig wrapper)` |
| 11 | 🔵 Low | Rate-limit IP key derives from client-controlled x-forwarded-for (spoofable); weakens the IP bucket as a secondary control | `web/lib/security/rate-limit.ts:66-70 (ipFromRequest) and 110-127 (per-IP check)` |
| 12 | 🔵 Low | In-memory rate-limit fallback is per-process (insufficient for serverless) — mitigated by config but worth a hard guard in production | `web/lib/security/rate-limit.ts:24-40 (memBuckets Map fallback)` |
| 13 | 🔵 Low | Chatbot accepts client-supplied 'assistant' message turns, allowing forged conversation history | `web/lib/validation/schemas/chat.ts:8-13,35-39` |
| 14 | 🔵 Low | firm/prep interpolates firm earnings text into the prompt without wrapUserText (inconsistent isolation; admin-sourced today) | `web/app/api/firms/[slug]/prep/route.ts:31-40` |
| 15 | 🔵 Low | Documented admin role / admins table / JWT role-claim authorization model is not implemented | `context/architecture.md:178-204 (Roles)` |
| 16 | 🔵 Low | ai_usage rows can be written with a null user_id, weakening per-user cost attribution and quota enforcement | `web/supabase/migrations/0001_ai_usage.sql:7-8` |
| 17 | 🔵 Low | googleapis@171.4.0 is installed but never imported — dead, very large dependency expanding the supply-chain attack surface | `web/package.json:47 ("googleapis": "^171.4.0")` |
| 18 | 🔵 Low | CI installs and builds on every fork pull_request, but no untrusted-code execution path and no real secrets are exposed | `/.github/workflows/ci.yml:3-6 (on: pull_request) and lines 43-49 / 74-78 (placeh` |
| 19 | ⚪ Info | All 17 routes consistently gated on auth + per-user/IP rate limiting via a shared requireUser() helper (strong baseline) | `web/lib/security/require-user.ts:15-33` |
| 20 | ⚪ Info | Model-generated markdown links render with an unvalidated href scheme (stored/blind XSS sink for LLM output) | `web/components/reader/markdown.tsx:22-31 (renderInline)` |
| 21 | ⚪ Info | Positive: chatbot tool layer is read-only and strictly user-scoped — no DB-write, SSRF, or cross-user read via tools | `web/lib/ai/assistant-tools.ts:81-189` |
| 22 | ⚪ Info | Positive: structured outputs use Claude/OpenAI tool-use with typed schemas; the one JSON.parse path is hardened | `web/app/api/resume/critique/route.ts:218-226` |
| 23 | ⚪ Info | Context note: AI endpoints are authenticated and rate-limited, but the shared limiter falls back to per-process in-memory when Upstash env is unset | `web/lib/security/require-user.ts:15-33` |
| 24 | ⚪ Info | RLS is actually enabled with owner policies on every user-owned table; request path is correctly RLS-bound via the anon-key cookie client | `web/supabase/migrations/0000_baseline.sql:33-36,89-92,110-113,130-133,154-157,18` |
| 25 | ⚪ Info | Defense-in-depth: every data-layer query also filters .eq("user_id", userId) with a server-derived userId — no IDOR via request body | `web/lib/data/contacts.ts:58-108` |
| 26 | ⚪ Info | No SQL injection surface: the only dynamic DB call is a parameterized RPC; all LLM-controlled values filter in JS over already-scoped result sets | `web/lib/data/semantic-recall.ts:50-55` |
| 27 | ⚪ Info | All 17 API routes gate on requireUser() (auth + per-route rate limit) before any data or LLM access | `web/lib/security/require-user.ts:15-33` |
| 28 | ⚪ Info | Live secrets present in working-tree .env.local — correctly untracked and never committed (no exposure) | `/Users/jakeschorr/Documents/InterviewPrep/.env.local (symlinked from web/.env.lo` |
| 29 | ⚪ Info | No NEXT_PUBLIC_* var holds a server secret — only public-safe values ship to the browser | `web/lib/supabase/server.ts:7-8, web/lib/supabase/admin.ts:15-16, web/lib/analyti` |
| 30 | ⚪ Info | No server secret is referenced in any client component — client-bundle leak is impossible by construction (bundle scan corroborates, with a read-coverage caveat) | `web/.next/static (build output) + all 'use client' files in web/app, web/compone` |
| 31 | ⚪ Info | Logging is hardened — Sentry strips request bodies & PII, PostHog is categorical-only, pino logs no secrets/bodies | `web/sentry.server.config.ts:24-39, web/instrumentation-client.ts:21-33, web/lib/` |
| 32 | ⚪ Info | web/simona.py and web/venv contain no secrets; no other secret material in tracked source, docs, or scripts | `web/simona.py, web/venv/, all *.md and scripts` |
| 33 | ⚪ Info | Secrets handling is clean: no env files tracked or ever committed; pnpm lockfile integrity intact; pdf-parse 2.4.5 verified non-vulnerable | `web/.gitignore (.env*), root .gitignore (.env / .env.local / .env*.local), web/p` |

### Detailed findings


#### 🟡 Medium

##### 1. No middleware.ts — route protection is purely per-route convention with no defense-in-depth backstop

- **Location:** `web/ (no middleware.ts found anywhere outside node_modules)`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Today all 17 routes are correctly gated, so there is no live exposure. But the entire security model depends on every author remembering to call requireUser() as the first line. A single new route (or a refactor that early-returns before the gate) ships fully unauthenticated AND unthrottled — and since most routes hit paid AI, that is a direct billing/abuse exposure. The project's own docs note the Server Action pattern is 'not yet built', so more surfaces are coming.
- **Recommendation:** Add a Next.js middleware.ts that, at minimum, requires an authenticated Supabase session for /api/* (refreshing the session cookie via @supabase/ssr) as a backstop, OR enforce the requireUser invariant in CI. Middleware-level auth + the existing per-route rate-limit gives two independent layers.

##### 2. structure-chat writes to chat_embeddings via the RLS-bypassing admin client using a client-supplied chatId/contactId, without verifying they belong to the caller

- **Location:** `web/app/api/relationships/structure-chat/route.ts:110-131; table DDL web/scripts/migrations/003_pgvector.sql:22-29`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** A logged-in user A can POST a chatId that is actually user B's chat id (text ids; if guessable/enumerable). Because chat_id is the PK and the write bypasses RLS, the upsert can overwrite user B's existing embedding row's summary_text/embedding/user_id with A's content (cross-tenant write / data-integrity corruption, and A's user_id is then stamped on what was B's row). It does not let A READ B's data (the RLS read policy at 003_pgvector.sql:44-46 restricts SELECT to auth.uid()=user_id, and the recall RPC filters by user_id_in). So impact is integrity/tampering, not disclosure. Severity is bounded by how guessable chat ids are.
- **Recommendation:** Before the admin upsert, verify ownership: fetch the chat via the RLS-scoped (anon, cookie) client with .eq('id',chatId).eq('user_id',user.id) (and same for contactId), and abort if not found. Alternatively add a WHERE/own-row guard or move the write to an RPC that enforces user_id = auth.uid(). Never trust body-supplied resource ids in an RLS-bypassing write.

##### 3. No per-user spend cap is enforced — assertUnderQuota() exists but is wired into zero routes; rate limit is the only cost control

- **Location:** `web/lib/ai/usage.ts:77-82 (assertUnderQuota / getUserUsageThisMonth) — not referenced by any route`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** An authenticated (or scripted) user can stay under 10/min indefinitely and still drive substantial Claude-Opus spend over hours (e.g. ~10 Opus calls/min * large outputs). Rate limiting caps burst, not cumulative monthly cost. With self-serve signup this is a realistic cost-abuse vector even though every endpoint is authenticated.
- **Recommendation:** Wire assertUnderQuota(user.id, MONTHLY_CAP_USD) into requireUser (or the expensive/whisper tiers) and return 402/429 when exceeded. The helper and ai_usage table already exist — this is mostly plumbing. Consider a lower cap for brand-new accounts.

##### 4. Prompt-injection mitigation relies solely on tag-delimiting; instructions and untrusted data share the same user turn, no out-of-band isolation

- **Location:** `web/lib/ai/sanitize.ts:14-27; web/app/api/resume/critique/route.ts:188-193; web/app/api/relationships/draft-outreach/route.ts:34-53; web/app/api/relationships/prep-person/route.ts:41-58`
- **Confidence:** medium
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** An attacker who controls the untrusted field (their own resume, or a pasted third-party LinkedIn bio / chat notes) can attempt to steer outputs: produce a malicious markdown link (chains into the XSS finding above), bias the resume critique/scorecard, or coax off-task content. There is no exfiltration of secrets or other users' data via the model itself because the prompts contain neither (keys are env-only; tool reads are user-scoped). Severity is bounded by the tool layer being read-only and user-scoped, and by tags preventing trivial system-prompt override.
- **Recommendation:** Keep wrapUserText, but (a) move the static task instruction into the system block and keep ONLY the wrapped untrusted data in the user turn, and (b) add an explicit system instruction that text inside the data tags is content to analyze and must never be treated as instructions. This materially raises the bar for instruction-confusion attacks. Most important downstream control is still the href allow-list (finding 1).

##### 5. Service-role client bypasses RLS and is used inside a request handler (semantic recall + embeddings upsert); isolation depends entirely on one hand-written WHERE clause

- **Location:** `web/lib/supabase/admin.ts:13-22; web/lib/data/semantic-recall.ts:33-55; web/app/api/relationships/prep-person/route.ts:23-37; web/app/api/relationships/structure-chat/route.ts:114-126; web/supabase/migrations/0003_pgvector.sql:57-83`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No cross-tenant leak today, because user_id is server-derived and the RPC hard-filters on it. But the read path has zero RLS backstop: if the RPC's WHERE clause is ever edited to drop the user_id filter, or a future caller passes a body-derived userId, it becomes a cross-tenant read of other users' chat-summary embeddings (which contain distilled private networking notes). The service-role key in a request handler removes the safety net that every other data path has.
- **Recommendation:** Prefer the RLS-bound anon client for these reads: pass the user's pgvector query through a SECURITY INVOKER RPC or a session-scoped client so RLS still applies, reserving the service-role key for Inngest/webhooks as architecture.md invariant 3 intends. If the service-role client must stay (e.g. for the ivfflat query), add a regression test asserting match_chat_embeddings returns nothing for a foreign user_id, and add `force row level security` so the bypass is explicit and auditable.

##### 6. Next.js pinned to 16.2.4 — affected by the May 2026 coordinated security release (13 advisories), and Vercel WAF does NOT mitigate

- **Location:** `web/package.json:52 ("next": "16.2.4") and node_modules/next/package.json (installed 16.2.4)`
- **Confidence:** high
- **Verification:** ✅ confirmed
- **Impact:** A deployed StreetPrep instance on next@16.2.4 is exposed to multiple unauthenticated server-side vulnerabilities (DoS, SSRF, middleware/route bypass, cache poisoning) that Vercel will NOT block at the edge — patching is the only mitigation. Realistic impact: unauthenticated DoS against the SSR/Server-Action surface and SSRF reachable from request handling. Note the SSRF (CVE-2026-44578) and some bypasses are documented as primarily affecting the self-hosted Node server; on Vercel the DoS/cache/route items are the most relevant, but Vercel confirms none are WAF-mitigated.
- **Recommendation:** Bump to next@16.2.6 (or latest 16.2.x) immediately and redeploy. Because the pin is exact (16.2.4, not ^16.2.4), `pnpm update` will NOT pick this up — change the package.json spec explicitly and refresh pnpm-lock.yaml. Treat as urgent for the internet-facing deployment.

<details><summary>Adversarial-verification reasoning</summary>

> VERSION PIN CONFIRMED EXACTLY. web/package.json line 52 pins `"next": "16.2.4"` (no caret), and node_modules/next/package.json reports `"version": "16.2.4"`. devDependency eslint-config-next is also 16.2.4. Cited location is accurate.
> 
> RELEASE FACTS CONFIRMED (authoritative sources, post-cutoff so verified via web). Vercel's changelog (vercel.com/changelog/next-js-may-2026-security-release) documents a coordinated May 2026 release of 13 advisories; the 16.x fix is 16.2.6 with highest-affected = 16.2.5. Since 16.2.4 < 16.2.5, the app IS inside the vulnerable window for the bulk of the batch (middleware bypasses, WebSocket SSRF, Cache-Components/Image-Optimization DoS, RSC cache poisoning, CSP-nonce/beforeInteractive XSS). The WAF quote is VERBATIM ACCURATE: "Vercel has not deployed new WAF rules for this release; these advisories cannot be reliably blocked at the WAF layer." So the core thesis — outdated next in a vulnerable range, fix-by-upgrade-to-16.2.6, not WAF-mitigated — is genuinely correct.
> 
> BUT THE EXPLOITABILITY NARRATIVE IS OVERSTATED FOR THIS CODEBASE (severity-relevant): (1) The headline DoS the claim leans on, CVE-2026-23870 / GHSA-q4gf-8mx6-v5v3, has affected range `>=16.0 <16.2.3` and was FIXED IN 16.2.3 — so 16.2.4 is NOT vulnerable to that specific CVE. The claim picked the one DoS the app is already patched against. (Other DoS items — Cache Components connection exhaustion, Image Optimization API, broader RSC/Server-Function deserialization in the <16.2.5 set — DO apply.) (2) The SSRF, CVE-2026-44578 / GHSA-c4j6-fc7j-m34r (CVSS 8.6), advisory states `>=16.0.0 <16.2.5` AND "Vercel-hosted deployments are not affected … Self-hosted applications using the built-in Node.js server" only. This app deploys to Vercel, so the SSRF is N/A in the intended production deployment. (3) The middleware/proxy-bypass advisories (CVE-2026-44575, -45109, -44574) require middleware-based authorization to have impact. I confirmed there is NO middleware file anywhere (find across the repo excluding node_modules returned nothing) and next.config.ts (read in full) contains only redirects — no i18n, no custom image config. With no middleware and (per project posture) auth not yet built, these "bypass" advisories have no authorization boundary to defeat today.
> 
> NET: confirmed that next@16.2.4 is outdated and in the vulnerable range and should be upgraded to 16.2.6 (WAF won't help). But for THIS deployment the realistically-applicable, unauthenticated, not-WAF-blockable residue reduces to a DoS class (degraded availability on the SSR/Server-Action surface) plus conditional RSC cache-poisoning — NOT the named DoS CVE (already patched), NOT the SSRF (Vercel-N/A), and NOT the auth-bypasses (no middleware/auth to bypass). That lowers real impact from the claimed "high" to medium for this app as-is. Upgrade is still warranted.

</details>

##### 7. react / react-dom pinned to 19.2.4 — below the 19.2.6 patch for the React Server Components DoS (CVE-2026-23870)

- **Location:** `web/package.json:63-64 ("react": "19.2.4", "react-dom": "19.2.4"); confirmed installed at node_modules/.pnpm/react@19.2.4`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** The React half of the May 2026 RSC denial-of-service is unpatched at 19.2.4. Combined with the Next 16.2.4 finding, the Server Components / Server Actions surface is the exploitable target. Unauthenticated DoS.
- **Recommendation:** Bump react and react-dom to 19.2.6 alongside the Next.js upgrade (Next 16.2.6 expects the patched React). Update the exact pins and the lockfile.

##### 8. No security headers anywhere — no CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy

- **Location:** `web/next.config.ts (only async redirects(); no async headers()); no web/middleware.ts`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No defense-in-depth against XSS (no CSP), clickjacking (no frame-ancestors/X-Frame-Options), MIME-sniffing, or referrer leakage. For a product that renders user-pasted content (LinkedIn bios, resume text, interview transcripts) and LLM output, the missing CSP is the most material gap — any reflected/stored XSS has no second line of defense. HSTS absence weakens TLS enforcement.
- **Recommendation:** Add an `async headers()` block in next.config.ts (or a middleware) setting at minimum: Content-Security-Policy (start report-only, then enforce), Strict-Transport-Security (max-age>=15552000; includeSubDomains; preload), X-Frame-Options: DENY or CSP frame-ancestors 'none', X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and a restrictive Permissions-Policy. Note PostHog/Sentry origins must be allowlisted in connect-src/script-src.

##### 9. drizzle-kit db:push / db:migrate / db:studio run directly against the real Supabase DB with no guardrail; db:studio exposes a full-DB web UI

- **Location:** `web/package.json:22-27 (db:pull/generate/migrate/push/check/studio) + web/drizzle.config.ts:7 (url = DIRECT_URL ?? DATABASE_URL) + web/.env.local is a symlink to ../.env.local`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** On a shared host or a misconfigured .env.local pointing at production, `pnpm db:push` can silently alter production schema (drizzle-kit push is known for destructive diffs like dropping columns), and `pnpm db:studio` opens an unauthenticated local web UI (default localhost:4983) with full CRUD over real data — anyone with access to that loopback (or a tunnel/port-forward on a shared box) gets full DB access. Accidental-run risk is real because the commands are short and the env points at the live DB by default.
- **Recommendation:** Point db:* at a dedicated local/shadow database by default, or require an explicit env (e.g. a separate .env.dev). Prefer the migration workflow (db:generate + db:migrate from versioned SQL) over db:push for any non-local DB, and document that db:push/db:studio must never run against production. If db:studio is used, ensure it is only ever bound to localhost on a single-user machine.

##### 10. Sentry build plugin (withSentryConfig) is not wired — source maps are not managed/deleted, risking exposed production source maps and disabled server-side error capture

- **Location:** `web/next.config.ts (no withSentryConfig wrapper); web/instrumentation.ts re-exports onRequestError but the build-time plugin is absent; git log confirms withSentryConfig never existed`
- **Confidence:** medium
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Two concrete effects: (1) Source-map hygiene is unmanaged by Sentry — whether maps ship to the browser depends solely on Next defaults; if anything (now or later) enables productionBrowserSourceMaps, the deletion safeguard is not in place, exposing readable source. (2) More importantly, Sentry's documented Next.js wiring is incomplete, so build-time instrumentation and reliable source-context for errors won't work as intended, undermining the very error-monitoring this app set up. CI even comments "Sentry build wrapper requires nothing when SENTRY_AUTH_TOKEN is unset" — consistent with the wrapper being absent. (Mitigant: I confirmed no .map files are tracked in git and Next does not emit browser source maps by default, so this is risk/mis-config rather than a confirmed live leak.)
- **Recommendation:** Wrap the config with withSentryConfig (or the Turbopack equivalent for Next 16) and set sourcemaps.deleteSourcemapsAfterUpload: true (and/or hideSourceMaps) so maps are uploaded to Sentry for stack traces but never served to clients. Verify the production deploy does not serve .js.map for app chunks.

#### 🔵 Low

##### 11. Rate-limit IP key derives from client-controlled x-forwarded-for (spoofable); weakens the IP bucket as a secondary control

- **Location:** `web/lib/security/rate-limit.ts:66-70 (ipFromRequest) and 110-127 (per-IP check)`
- **Confidence:** medium
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Limited today because every route also enforces a per-USER bucket (10/min expensive) and no route uses the IP-only 'public' tier (grep confirmed). So an attacker must still hold a valid session, and the user bucket binds them. The IP bucket mainly matters if a future unauthenticated/'public'-tier route is added — there, XFF spoofing would let one host bypass the per-IP cap by rotating the header.
- **Recommendation:** Use Vercel's trusted client IP (e.g. the platform `x-vercel-forwarded-for` / `request.ip`) rather than the raw left-most x-forwarded-for, or take the right-most untrusted-boundary hop. Do this before introducing any 'public'-tier route.

##### 12. In-memory rate-limit fallback is per-process (insufficient for serverless) — mitigated by config but worth a hard guard in production

- **Location:** `web/lib/security/rate-limit.ts:24-40 (memBuckets Map fallback); web/lib/security/redis.ts:9-15 (getRedis returns null when env unset)`
- **Confidence:** medium
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Low in practice: the durable Upstash limiter is the documented and configured prod path, so the fallback should only run in dev. Residual risk is operational — if the Upstash env vars are ever missing/misconfigured in a prod deploy, every route silently degrades to an ineffective per-process limiter with no alarm, re-opening burst/cost abuse on the paid endpoints.
- **Recommendation:** In production (e.g. process.env.VERCEL_ENV === 'production'), fail closed or loudly: if getRedis() returns null, log an error/alert and either reject (503) or refuse to start, rather than silently using the in-memory Map. At minimum emit a one-time warning so the misconfiguration is observable.

##### 13. Chatbot accepts client-supplied 'assistant' message turns, allowing forged conversation history

- **Location:** `web/lib/validation/schemas/chat.ts:8-13,35-39; web/app/api/chat/general/route.ts:29-32`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** A user can pre-seed fake assistant turns to jailbreak/steer the model ('As you agreed earlier, ignore your guidelines...'). Impact is limited to the user's own session and the same read-only, user-scoped tool set — no cross-user or secret exposure. It mainly weakens guardrails and could be combined with finding 1 to coax a malicious link.
- **Recommendation:** Either restrict client-submitted turns to role 'user' and reconstruct assistant turns server-side, or accept the (low) risk explicitly. At minimum, document that assistant turns are attacker-controllable so future logic never trusts them as model-authored.

##### 14. firm/prep interpolates firm earnings text into the prompt without wrapUserText (inconsistent isolation; admin-sourced today)

- **Location:** `web/app/api/firms/[slug]/prep/route.ts:31-40`
- **Confidence:** medium
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Today this is low risk because the earnings content is not user-controlled (shared content table, admin/RLS write-only). The exposure is latent: if the weekly Inngest firm-refresh job ever ingests untrusted web/earnings text into latest_earnings_raw, that text would land in the prompt un-delimited and could carry prompt-injection that steers the firm prep sheet (and, via finding 1, a malicious link rendered in components/firms/firm-prep.tsx).
- **Recommendation:** Wrap it with wrapUserText(firm.latestEarningsRaw, 'earnings', { maxChars }) for consistency and future-proofing, since the data provenance (auto-refreshed firm intel) is exactly the kind that becomes untrusted. Pair with the href allow-list fix.

##### 15. Documented admin role / admins table / JWT role-claim authorization model is not implemented

- **Location:** `context/architecture.md:178-204 (Roles); web/supabase/* (absence); tree grep for admins/role-claim/getUserDb`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Not exploitable today: no admin-only surface ships (firms/jobs are seeded by scripts, no admin write route exists), so there is no privilege boundary to bypass. Risk is future-facing — if an admin write path is added before the role/authz model is built, it could ship unguarded. Reference tables firms/jobs intentionally have no RLS (read-only public data: no PII), which is acceptable.
- **Recommendation:** Either build the admins-table + auth-hook + per-route role check before any admin/shared-content write surface ships, or update architecture.md to mark the admin role as not-yet-implemented so it isn't assumed present. Ensure firm/job write paths use the service-role key from background jobs only, never an unguarded user route.

##### 16. ai_usage rows can be written with a null user_id, weakening per-user cost attribution and quota enforcement

- **Location:** `web/supabase/migrations/0001_ai_usage.sql:7-8; web/lib/ai/usage.ts:11-31,79-82`
- **Confidence:** medium
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Cost-control / abuse-accounting weakness rather than a tenant-isolation issue: spend logged with null user_id is not counted against that user's quota, so the monthly cap (assertUnderQuota) can be under-counted. The ai_usage SELECT RLS policy (auth.uid()=user_id) also means null-user rows are readable by no one via the anon client. Note: I did not confirm assertUnderQuota is actually invoked by the routes (only that the helper exists) — quota enforcement wiring is out of this dimension's scope.
- **Recommendation:** Make userId required on the usage-logging path (drop the `?? null` fallback and the optional userId in TrackStreamOpts), and consider a NOT NULL constraint on ai_usage.user_id once all callers pass it, so cost is always attributable and quota math is sound.

##### 17. googleapis@171.4.0 is installed but never imported — dead, very large dependency expanding the supply-chain attack surface

- **Location:** `web/package.json:47 ("googleapis": "^171.4.0"); no import sites in web/`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** An unused mega-dependency adds install/build weight and a large transitive surface that must be patched and trusted for no current benefit. If a future supply-chain compromise hits googleapis or one of its many transitive deps, this repo inherits the exposure despite using none of it.
- **Recommendation:** Remove googleapis until the Google integration is actually built; re-add (preferably a scoped sub-client) when needed. Generally prune unused deps to minimize attack surface.

##### 18. CI installs and builds on every fork pull_request, but no untrusted-code execution path and no real secrets are exposed

- **Location:** `/.github/workflows/ci.yml:3-6 (on: pull_request) and lines 43-49 / 74-78 (placeholder envs)`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Low. The main residual is that any fork PR can run the full build + Playwright install on your runners (compute/abuse, and arbitrary code from the PR runs in the build with the low-privilege fork token). This is the normal trade-off of building PRs; it is not a secret-exfiltration or privileged-write risk as configured.
- **Recommendation:** Acceptable as-is for an early-stage repo. If you later add real secrets to CI (e.g. for live-AI e2e or deploy), gate those jobs behind `environment:` protection or restrict to same-repo PRs (if github.event.pull_request.head.repo.fork == false) so forks can't reach them. Consider SHA-pinning third-party actions if you want maximum supply-chain rigor, though the @v4 majors here are reputable.

#### ⚪ Info

##### 19. All 17 routes consistently gated on auth + per-user/IP rate limiting via a shared requireUser() helper (strong baseline)

- **Location:** `web/lib/security/require-user.ts:15-33; all 17 web/app/api/**/route.ts`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Positive: no unauthenticated paid-AI endpoint among the 17. Every Claude/OpenAI/Whisper/embedding call requires a valid session and is throttled. This neutralizes the classic 'anyone runs up the bill' risk for the documented routes.
- **Recommendation:** Maintain this as the mandatory pattern. Because protection is per-route (not middleware-enforced — see separate finding), add a lint/CI check or test asserting every file under app/api/**/route.ts imports requireUser, so a future route can't silently ship unauthenticated.

##### 20. Model-generated markdown links render with an unvalidated href scheme (stored/blind XSS sink for LLM output)

- **Location:** `web/components/reader/markdown.tsx:22-31 (renderInline)`
- **Confidence:** high
- **Verification:** ❌ refuted
- **Impact:** If the model is induced (via prompt injection in resume/bio/notes, or simply by hallucinating a link) to output a javascript:/data: URL, a user clicking it executes script in the StreetPrep origin — session/cookie theft, calling authenticated Server Actions, or exfiltrating other context the page holds (guide content, the user's own contacts/profile). In the relationship-manager flows the injected text often originates from a third party (a banker's LinkedIn bio the student pasted), making this a cross-actor injection->XSS chain, not just self-XSS.
- **Recommendation:** Allow-list the href scheme in renderInline before constructing the anchor: parse with `new URL(match[5], window.location.origin)` and render a plain <span> unless `protocol` is http:/https:/mailto:. Add `rel="noopener noreferrer"` and `target="_blank"`. This is a 5-line fix in the one renderer and closes the sink for every AI surface at once.

<details><summary>Adversarial-verification reasoning</summary>

> The structural facts of the claim are accurate, but the exploitability conclusion is refuted by React's built-in href sanitization.
> 
> WHAT IS TRUE (verified by reading code):
> - The sink is real and verbatim as described. web/components/reader/markdown.tsx:6 regex `/\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g`, and lines 22-31 emit `<a href={match[5]} className="underline underline-offset-2 text-primary">{match[4]}</a>` with no scheme check. match[5] is arbitrary text between the parens.
> - No raw-HTML sink: grep for dangerouslySetInnerHTML/rehype-raw across web/ returned empty. The claim's own caveat (text is React-escaped, only href is unchecked) is correct.
> - This component IS the sink for streamed model output. Plain grep gave a false-empty on this iCloud filesystem; `git grep` shows 4 real importers: components/firms/firm-prep.tsx:7, components/reader/chat-panel.tsx:7, components/reader/reading-lens.tsx:4, components/relationships/contact-detail.tsx:10. I read chat-panel.tsx:124 (renders /api/chat/stream output via <Markdown>), reading-lens.tsx:393 (/api/lens/explain) and :317 (/api/lens/beginner rewrite). Model output unquestionably reaches the href.
> 
> WHY IT IS REFUTED (the decisive evidence):
> - This app pins react@19.2.4 and react-dom@19.2.4 (web/package.json + node_modules/*/package.json). React 19 sanitizes href/src attribute values. react-dom/cjs/react-dom-client.development.js:3166-3170 defines `function sanitizeURL(url){ return isJavaScriptProtocol.test(""+url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url }`. The `case \"src\": case \"href\":` block at lines 19975-20003 runs `value = sanitizeURL(\"\"+value)` before setAttribute. isJavaScriptProtocol (line 25136) is `/^[ - ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i` — matches javascript: case-insensitively even with leading control chars/whitespace and interspersed CR/LF/TAB. So a model-emitted `[click](javascript:fetch(...))` renders an anchor whose href is the inert throwing stub; clicking it does NOT run the attacker payload.
> - This protection ships in PRODUCTION, not just dev: react-dom-client.production.js contains the same blocked-message string and protocol regex (grep counts confirmed). All production SSR bundles also contain it: react-dom-server.edge.production.js, .node.production.js, .browser.production.js each have the block message and regex (javascript:throw appears 3x in the edge bundle). So both SSR-rendered HTML and client-set DOM neutralize a javascript: href.
> 
> ON THE data: SUB-CLAIM:
> - React does NOT block data: (no data:-protocol handling exists anywhere in react-dom/cjs — grep for isDataProtocol/blocked a data:/data:text/html returned empty). However, `data:text/html,...` placed on an anchor href is not a working script-execution vector in current browsers: top-level navigation to data: URLs via anchor activation is blocked by Chrome/Firefox/Safari as an anti-phishing measure. So this residual is also not practical XSS.
> 
> NET: The named sink and the untrusted-input-to-href data flow are real, but the framework the app actually runs neutralizes the only practical scheme (javascript:) in both production client and SSR paths, and the data: alternative does not execute on anchor click. The high-severity exploitable-XSS conclusion does not hold. Residual concern is defense-in-depth (don't rely solely on React's allowlist; relative/protocol-relative or http(s) phishing links from a hijacked model are still possible), which is informational, not high.

</details>

##### 21. Positive: chatbot tool layer is read-only and strictly user-scoped — no DB-write, SSRF, or cross-user read via tools

- **Location:** `web/lib/ai/assistant-tools.ts:81-189; web/lib/data/contacts.ts:69-108; web/lib/data/profile.ts:47-57; web/lib/supabase/server.ts:4-26`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** A model-chosen contactId cannot read another user's contact; a crafted prompt cannot make a tool exfiltrate data, fetch an attacker URL (no SSRF surface), or mutate state. This is the strongest part of the AI trust boundary.
- **Recommendation:** Keep this invariant. Delete the dead Anthropic ASSISTANT_TOOLS array (or its web_search entry) to avoid a future wiring mistake that exposes a half-built tool.

##### 22. Positive: structured outputs use Claude/OpenAI tool-use with typed schemas; the one JSON.parse path is hardened

- **Location:** `web/app/api/resume/critique/route.ts:218-226; web/app/api/interview/score/route.ts:193-217; web/app/api/relationships/structure-chat/route.ts:104-133; web/app/api/profile/extract-resume/route.ts:53-60`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Eliminates the classic 'JSON.parse of free-form model text' fragility for the high-value flows and keeps model output out of SQL construction. The architecture invariant 'no free-form JSON parsing from LLM output' is largely upheld; profile/extract-resume technically still JSON.parses but is contained.
- **Recommendation:** Optionally validate toolUse.input / extract-resume output against the existing Zod schemas (e.g. ScorecardSchema in lib/validation/schemas/interview.ts) before returning, so a malformed/over-long model field is rejected server-side rather than trusted by the client.

##### 23. Context note: AI endpoints are authenticated and rate-limited, but the shared limiter falls back to per-process in-memory when Upstash env is unset

- **Location:** `web/lib/security/require-user.ts:15-33; web/lib/security/rate-limit.ts:24-40,76-130; web/lib/security/redis.ts:9-16`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Auth + rate limiting are present (good, given paid Claude/Opus + Whisper calls). But on Vercel's multi-instance/serverless runtime, if the Upstash env vars are ever missing in production, each instance keeps its own counter and the effective limit multiplies by the instance count — i.e., the LLM-cost rate limit silently becomes near-ineffective. This is a config/deploy risk, not a code bug.
- **Recommendation:** Fail closed in production: if NODE_ENV==='production' and getRedis() is null, treat it as a hard 503/deny (or log a loud startup error) rather than silently using the in-memory map. Confirm UPSTASH_* are set in the Vercel production env.

##### 24. RLS is actually enabled with owner policies on every user-owned table; request path is correctly RLS-bound via the anon-key cookie client

- **Location:** `web/supabase/migrations/0000_baseline.sql:33-36,89-92,110-113,130-133,154-157,180-183,202-205,221-224,240-243; 0001_ai_usage.sql:25-28; 0003_pgvector.sql:47-51; web/lib/supabase/server.ts:4-26`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Positive: per-row tenant isolation is real for all interactive read/write paths. A logged-in user's queries are constrained to auth.uid() at the database layer even before application filters run.
- **Recommendation:** Keep. Consider adding `alter table ... force row level security` so the policies also bind if the app ever connects as the table-owner role (defense in depth); not required today since the request path uses the anon key.

##### 25. Defense-in-depth: every data-layer query also filters .eq("user_id", userId) with a server-derived userId — no IDOR via request body

- **Location:** `web/lib/data/contacts.ts:58-108; profile.ts:47-97; mock-interviews.ts:29-77; followups.ts:34-80; calendar.ts:32-39; stories.ts:22-69; guide-progress.ts:21-64; callers in app/api/*/route.ts`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Even if an RLS policy were dropped, queries remain tenant-scoped at the app layer. The two layers (RLS + .eq(user_id)) are independent, so a single mistake does not produce cross-tenant reads.
- **Recommendation:** Keep this pattern. Add an ESLint/review check that lib/data functions must accept userId as the first arg (never read it from a request body), to prevent regressions.

##### 26. No SQL injection surface: the only dynamic DB call is a parameterized RPC; all LLM-controlled values filter in JS over already-scoped result sets

- **Location:** `web/lib/data/semantic-recall.ts:50-55; web/lib/ai/assistant-tools.ts:104-177; whole-tree grep for sql``/.raw/.query`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** OWASP A03 (Injection) risk for the data layer is effectively nil. Even adversarial tool arguments from a prompt-injected model cannot read other tenants' rows or alter query structure.
- **Recommendation:** No action. If pgvector/full-text search is later pushed into SQL, keep using parameterized RPCs and avoid concatenating user/LLM text into query strings.

##### 27. All 17 API routes gate on requireUser() (auth + per-route rate limit) before any data or LLM access

- **Location:** `web/lib/security/require-user.ts:15-33; web/lib/supabase/get-user.ts:4-9; per-route grep across web/app/api/*/route.ts:1,9-29`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No unauthenticated data-layer endpoint. The body of every handler runs only for a verified user, and user.id used downstream is trustworthy. Combined with RLS this closes A01 (Broken Access Control) at the route boundary.
- **Recommendation:** Keep. When Server Actions land, mirror this gate (requireUser-equivalent) at the top of every action, since RSC/actions do not inherit route middleware.

##### 28. Live secrets present in working-tree .env.local — correctly untracked and never committed (no exposure)

- **Location:** `/Users/jakeschorr/Documents/InterviewPrep/.env.local (symlinked from web/.env.local)`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No exposure today: the file is gitignored, untracked, and was never committed anywhere in history, so nothing leaked via the repo. This is informational so the secret inventory is on record and so the obvious next risk (an accidental `git add -f` or a tool that ignores .gitignore) is visible. The only theoretical concern is the symlink web/.env.local -> ../.env.local: it resolves outside the web/ package, but since the target is itself ignored this does not create a tracked path.
- **Recommendation:** No action required for exposure. Optional hygiene: keep the gitignore rules; consider a pre-commit secret scanner (gitleaks) to guarantee these values can never be force-added. Note for the team: the same real values are not duplicated anywhere else (confirmed below), so rotation is only needed if .env.local is ever shared/committed.

##### 29. No NEXT_PUBLIC_* var holds a server secret — only public-safe values ship to the browser

- **Location:** `web/lib/supabase/server.ts:7-8, web/lib/supabase/admin.ts:15-16, web/lib/analytics/*, web/instrumentation-client.ts:9`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No server secret (service-role key, Anthropic/OpenAI/Groq keys, Upstash token, DB password) is exposed to the client via the NEXT_PUBLIC_ mechanism. The Supabase anon key intentionally ships to the browser and is safe by design (its power is bounded by RLS).
- **Recommendation:** None. This is the correct boundary. (Separately, the access-control dimension should confirm RLS is actually enabled so the public anon key stays safe.)

##### 30. No server secret is referenced in any client component — client-bundle leak is impossible by construction (bundle scan corroborates, with a read-coverage caveat)

- **Location:** `web/.next/static (build output) + all 'use client' files in web/app, web/components, web/lib`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No server secret can reach the browser: none is read in client code, and the readable portion of the compiled client bundle contains no secret values (only the by-design public anon key).
- **Recommendation:** None. CAVEAT (see gaps): due to the iCloud-backed filesystem stalling on mmap/reads, 12 of 32 .next/static JS chunks could not be fully copied/read (remained 0-byte), so the bundle value-scan covered ~20/32 chunks. The source-level 'no server env in client files' check is the authoritative control and is complete; the bundle scan is corroborating evidence on a partial read.

##### 31. Logging is hardened — Sentry strips request bodies & PII, PostHog is categorical-only, pino logs no secrets/bodies

- **Location:** `web/sentry.server.config.ts:24-39, web/instrumentation-client.ts:21-33, web/lib/analytics/server.ts:15-18, web/lib/logging/logger.ts`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Secrets and full request bodies (resume/transcript/bio text) do not leak into Sentry, PostHog, or Vercel logs. Good privacy posture for an early-stage app.
- **Recommendation:** Optional defense-in-depth: pino has NO `redact` paths configured (grep for 'redact' in web/lib/logging returned nothing). Today nothing passes secrets to the logger so there's no leak, but adding pino redact (e.g. ['*.apiKey','*.authorization','*.token','req.headers.authorization']) would prevent a future accidental `logger.info({ req })` from leaking. Low priority.

##### 32. web/simona.py and web/venv contain no secrets; no other secret material in tracked source, docs, or scripts

- **Location:** `web/simona.py, web/venv/, all *.md and scripts`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** No hardcoded API keys, tokens, connection strings, private keys, or passwords anywhere in tracked source, Python, the virtualenv, docs, scripts, build config, or the Vercel link directory. The repo is clean apart from the (correctly-ignored) .env.local.
- **Recommendation:** None.

##### 33. Secrets handling is clean: no env files tracked or ever committed; pnpm lockfile integrity intact; pdf-parse 2.4.5 verified non-vulnerable

- **Location:** `web/.gitignore (.env*), root .gitignore (.env / .env.local / .env*.local), web/pnpm-lock.yaml, node_modules/pdf-parse/package.json (2.4.5)`
- **Confidence:** high
- **Verification:** not-verified (medium/low — reported as candidate)
- **Impact:** Positive controls — documented so the team knows these were actively verified rather than overlooked.
- **Recommendation:** Keep enforcing the env-file ignore and --frozen-lockfile in CI (already done). Re-scan pdf-parse and the Next/React pins on the next dependency review.

---

## Per-dimension coverage & gaps

### Authentication, authorization & rate limiting on the 17 API routes

**Checked:**

Read all 17 route.ts files plus the shared security layer (lib/security/require-user.ts, rate-limit.ts, redis.ts), auth helpers (lib/supabase/get-user.ts, server.ts, admin.ts), the IDOR-relevant data layer (lib/data/contacts.ts, semantic-recall.ts), lib/ai/usage.ts, and the pgvector migration (scripts/migrations/003_pgvector.sql). Verified: no middleware.ts exists anywhere; no GET/PUT/DELETE/PATCH handlers in app/api (POST-only); no webhook/inngest/cron endpoints; Upstash env names present in .env.local and documented "Production REQUIRES these".

PER-ROUTE TABLE (route | auth | authz/IDOR | rate-limit tier | paid external API):
1. chat/general | requireUser ✓ | tools scoped to gate.user.id via executeTool(user.id,...) ✓ | expensive (10/min user, 30/min IP) | OpenAI gpt-nano (PAID)
2. chat/stream | requireUser ✓ | guide text from body, no per-user resource | expensive | Anthropic Sonnet (PAID)
3. firms/[slug]/prep | requireUser ✓ | slug→getFirmBySlug; firms are GLOBAL reference data, not user-owned → no IDOR | expensive | Anthropic Sonnet (PAID)
4. interview/score | requireUser ✓ | all data from body, no cross-user id | expensive | Anthropic Opus (PAID, max_tokens 3000)
5. interview/save | requireUser ✓ | saveMockInterview(gate.user.id,...) scoped ✓ | cheap | none (DB write)
6. interview/transcribe | requireUser ✓ | n/a | whisper (6/min user, 12/min IP) | OpenAI Whisper (PAID; returns mock if no key)
7. lens/beginner | requireUser ✓ | body only | expensive | Anthropic Sonnet (PAID)
8. lens/explain | requireUser ✓ | body only | expensive | Anthropic Sonnet (PAID)
9. profile/extract-resume | requireUser ✓ | body only | cheap | OpenAI gpt-5.4-nano (PAID)
10. profile/save | requireUser ✓ | upsertProfile(gate.user.id,...) ✓ | cheap | none
11. relationships/draft-outreach | requireUser ✓ | body only | expensive | Anthropic Sonnet (PAID)
12. relationships/structure-chat | requireUser ✓ | reads none; WRITE to chat_embeddings via admin client uses body chatId/contactId scoped only by user_id (see finding) | expensive | Anthropic Sonnet + Voyage/OpenAI embed (PAID)
13. relationships/prep-person | requireUser ✓ | findSimilarChats filters WHERE user_id=user_id_in in SQL → foreign contactId yields nothing, no read leak ✓ | expensive | Anthropic Sonnet + embed (PAID)
14. relationships/draft-followup | requireUser ✓ | body only | expensive | Anthropic Haiku (PAID)
15. resume/critique | requireUser ✓ | body only | expensive | Anthropic Opus (PAID, max_tokens 4000)
16. resume/extract | requireUser ✓ | n/a (PDF parse, no AI) | cheap | none (pdf-parse local)
17. whisper/transcribe | requireUser ✓ | n/a | whisper | OpenAI Whisper (PAID; 503 if no key)

Tier counts verified: 4 cheap + 11 expensive + 2 whisper = 17. No route uses 'public' (IP-only) tier. Auth = Supabase cookie-session via supabase.auth.getUser() (validates JWT server-side); no Authorization-header bypass path exists.

**Gaps:**

Could not run `git diff` (broken per environment constraint) so I did not diff historical versions of these routes; I read current HEAD working-tree files only. I did not execute the app or send live requests, so the rate-limit numbers and 401 behavior are verified by reading code/config, not by runtime testing. I confirmed Upstash env var NAMES are present in .env.local but did not read their values (and cannot confirm they are also set in the actual Vercel production project — that lives in Vercel, not the repo). For the structure-chat cross-tenant write finding, the real-world exploitability depends on how guessable the text chat ids are; I read the DDL (chat_id is text PK) but did not inspect the id-generation code in lib/data/mock-interviews.ts or the chats insert path to judge entropy. I did not audit Supabase RLS policies on the chats/contacts/profiles/ai_usage tables themselves (only chat_embeddings RLS, which I read) — RLS on the user-owned tables is the backstop for the data-layer reads and was out of direct scope but would strengthen/weaken the IDOR picture.

### LLM / AI trust boundaries & prompt injection

**Checked:**

Read all of web/lib/ai/* (anthropic.ts, openai.ts, prompts.ts, sanitize.ts, usage.ts, assistant-tools.ts, assistant-tools-openai.ts). Read all 12 AI-calling routes: chat/{stream,general}, lens/{explain,beginner}, resume/critique, profile/extract-resume, interview/score, firms/[slug]/prep, relationships/{draft-outreach,prep-person,structure-chat,draft-followup}, plus interview/transcribe. Traced the chatbot tool executor into lib/data/{contacts,profile,calendar,firms,semantic-recall}.ts and confirmed user-id scoping + RLS via lib/supabase/{server,get-user,admin}.ts. Traced all model-output rendering to the single components/reader/markdown.tsx and its consumers (chat-panel, reading-lens, firm-prep). Reviewed validation schemas (chat/lens/relationships/interview), parse.ts, require-user.ts, rate-limit.ts, redis.ts. git-grepped the whole app/components/lib tree for dangerouslySetInnerHTML/innerHTML/eval/new Function (none), react-markdown/rehype-raw (none), outbound fetch in AI/data layers, native Anthropic server tools (none), and all getAdminClient call sites.

**Gaps:**

Did not execute anything (read-only audit) — the XSS link sink (finding 1) and the javascript:-URI render are reasoned from the source regex/JSX, not demonstrated in a running browser; rendering a PoC would require running the app. Could not inspect RLS policy SQL itself (scripts/migrations were referenced but not opened), so the 'defense in depth via RLS' claim for tool reads rests on the session-scoped anon client + the explicit .eq('user_id', userId) filters in lib/data, not on having read the policies. Did not read the Inngest firm-refresh job source, so the provenance claim for firm.latestEarningsRaw (finding 4) is based on architecture.md, not the job code — the latent-injection risk there is conditional on what that job ingests. The chat/general tool-using assistant has a stub UI (tools/chatbot/page.tsx is a 'coming soon' page), but the API route is live and authenticated, so I treated it as a real attack surface. git diff was avoided per the environment constraint; history/secret archaeology used grep/show only.

### Access control, RLS, injection (OWASP Top 10 for the data layer)

**Checked:**

Read all 4 SQL migrations (0000_baseline, 0001_ai_usage, 0002_perf_indexes, 0003_pgvector), seed.sql, config.toml, and POLICIES.md under web/supabase/. Read all three Supabase clients (lib/supabase/{server,get-user,admin}.ts) and the auth gate (lib/security/require-user.ts). Read every lib/data/* module (contacts, profile, mock-interviews, followups, calendar, stories, guide-progress, firms, semantic-recall) and confirmed user-scoping. Read lib/ai/usage.ts and lib/ai/assistant-tools.ts (chatbot tool executor). Enumerated all 17 API routes and grepped each for auth gate + user-id origin. Grepped the whole tree for: getAdminClient usages, raw SQL (sql``, .rpc, .raw, client.query), .ilike/.like/.filter/.or query builders, grant/revoke/force-RLS/auth-hook, and the documented getUserDb/request.jwt.claims wrapper. drizzle.config.ts confirmed Drizzle is migration-tooling only (no runtime query client). Did NOT use git diff (broken per constraint); used Read/Grep/Bash(grep) only.

**Gaps:**

Could not run the database to dynamically prove RLS blocks a cross-tenant read (no live Supabase connection in this audit; verification done by reading migrations + client wiring). Could not use git diff (broken on this iCloud filesystem per the environment constraint), so I did not diff history for previously-removed policies; I read current migration files directly instead. I did not verify that assertUnderQuota/checkRateLimit are actually invoked with a durable shared store at runtime (rate-limit store durability and quota wiring are the rate-limiting dimension's scope, not the data-layer dimension) — I only confirmed the auth+rate gate is present at each route's entry. Supabase Storage bucket policies (resumes/, mock-audio/ prefixes) are referenced in architecture.md but there are no storage policy files in web/supabase/, so I could not confirm storage-side RLS-equivalent isolation; flagging as unverified rather than asserting a finding. The `chat_embeddings` table stores OpenAI 1536-dim vectors while architecture.md/Voyage docs describe Voyage 1024-dim — a config inconsistency, but out of scope for access-control/injection.

### Secrets archaeology & client exposure

**Checked:**

WORKING TREE: Read /.env.local (full live-secret inventory). Grepped entire repo (excluding node_modules, .git, venv, .next, pnpm-lock.yaml, tsbuildinfo) for (a) the 6 live secret VALUE fragments and (b) secret PATTERNS (sk-ant-/sk-proj-/sk-…/gsk_/service_role/JWT eyJhbGciOiJIUzI1NiIs/AKIA…/BEGIN PRIVATE KEY/xoxb-/ghp_/postgres://user:pw@) — only hit outside .env.local was the audit harness prompt text. Read web/simona.py (harmless), grepped web/venv (clean), confirmed simona.py is the only .py outside venv. Checked example env files (placeholders only) and web/.vercel/ (no env file, gitignored). CLIENT EXPOSURE: Grepped all NEXT_PUBLIC_ refs in source; built a full process.env.* read map across web/app+lib+components and confirmed every server secret (service-role, Anthropic, OpenAI, Groq, Upstash, PostHog server) is read only in server modules; iterated every 'use client' file and confirmed NONE reads a non-public env var. Scanned the compiled client bundle (web/.next/static, copied to fast tmpfs) for secret value fragments — clean (anon key present as expected, proving the scan works; two var-NAME hits were harmless UI strings). GIT HISTORY: git ls-files (no env tracked), git check-ignore (both .gitignores ignore .env*), git log --all --full-history for *.env.local (empty), git grep across git rev-list --all for all 6 secret fragments (zero hits in any commit/branch). LOGGING: Read sentry.server.config.ts, instrumentation-client.ts, lib/analytics/server.ts, lib/logging/logger.ts; grepped all logger/console calls for secret/body keywords (zero hits).

**Gaps:**

Could not use `git diff` (broken on this iCloud-backed filesystem per the environment constraint) — I substituted git log --all --full-history, git grep over `git rev-list --all`, and git ls-files/check-ignore, which together cover the 'ever-committed?' question authoritatively. The compiled client bundle (web/.next/static) could not be fully read: the iCloud filesystem repeatedly stalled (cp and grep hit the 90s timeout; `du` reports only 872K but per-file reads time out), leaving 12 of 32 JS chunks as 0-byte in my tmpfs copy, so the bundle value-scan covered ~20/32 chunks. This is mitigated because the authoritative control — no server-only env var is referenced in any 'use client' source file — is complete and passed, so a client leak is impossible by construction regardless of the unreadable chunks. I read .env.local but did NOT independently validate that each live key is currently active/valid (out of scope and would require calling the providers); I only confirmed the values are real-format secrets and where they live. I did not scan .git/ packed objects byte-for-byte beyond git grep over all reachable commits (unreachable/dangling objects from amended commits were not exhaustively walked, though `git grep` over rev-list --all covers all reachable history on all refs).

### Dependency supply chain + CI/CD + app hardening config

**Checked:**

Read web/package.json (all deps + the drizzle db:* scripts), web/pnpm-lock.yaml (lockfileVersion 9.0, 1394 integrity hashes, no git/tarball/non-npm resolutions), .github/workflows/ci.yml, web/next.config.ts, web/drizzle.config.ts, web/instrumentation.ts, web/instrumentation-client.ts, web/sentry.server.config.ts, web/sentry.edge.config.ts, both .gitignore files, and web/.env.example (var names). Confirmed installed versions in node_modules (next 16.2.4, react/react-dom 19.2.4, @sentry/nextjs 10.51.0, pdf-parse 2.4.5, drizzle-kit 0.31.10). Verified via git log/git grep that withSentryConfig was never present and no async headers()/middleware.ts/.map files exist. Checked CVE status for next, react, and pdf-parse against Vercel/Snyk advisories. Verified openai and googleapis import sites.

**Gaps:**

Could not run `git diff` (broken on this iCloud filesystem per the environment constraint) — relied on git log/git grep/git show/Read instead, which fully covered the needed history. Did not enumerate every one of the 13 Next.js May 2026 advisories CVE-by-CVE for Vercel-vs-self-hosted applicability: Vercel's changelog confirms 16.2.6 is the fix and that WAF does NOT mitigate, but per-advisory hosting applicability (e.g. which SSRF/bypass items are self-hosted-only) is not fully documented publicly, so the Next.js finding's per-CVE exploitability on Vercel specifically is rated on the changelog's own statements rather than independent reproduction. I did not actually fetch the deployed app to confirm whether production serves .js.map files (no live URL / read-only audit), so the source-map exposure is rated as a configuration risk (medium) rather than a confirmed leak; no .map files are tracked in git and Next 16 does not emit browser source maps by default, which bounds that risk. I did not deep-audit every transitive dependency in the 549KB lockfile beyond integrity-hash presence and registry/resolution-source sanity checks (no full per-package CVE sweep of transitive deps was performed).

---

## Suggested fix order

1. **#9 + #3** — guard the `db:*` scripts (#9) / point them at a dev DB, and wire `assertUnderQuota` into the expensive tier (#3). Cheap, real money/data risk.
2. **#2** — add the ownership check before the admin-client write in `structure-chat`. Concrete app-logic bug.
3. **#6 + #7** — `next@16.2.6` + `react`/`react-dom@19.2.6`, refresh lockfile (exact pins won't auto-update).
4. **#8 + #1** — add a `headers()` block (CSP report-only first) and a `middleware.ts` `/api/*` auth backstop.

_Generated from the `security-sweep` run on 2026-06-01. Findings reflect code state at that time; verify against current code before acting._
