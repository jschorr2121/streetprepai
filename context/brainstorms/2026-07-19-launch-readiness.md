# Brainstorm: launch readiness

Scope: everything that isn't already tracked. `context/jakes-tasks.md` already
covers confirm-email, Sentry build env, CSP verification, the AI spend cap,
`NEXT_PUBLIC_SITE_URL`, migrations 0006–0011, the `firms` seed check, and E2E
creds — none of that repeats here. `context/brainstorms/2026-07-18-ai-cost-optimization.md`
and `2026-07-18-firm-data-refresh.md` own AI spend/firm-data; `2026-07-17-chat-onboarding.md`
owns onboarding UX — also not repeated. This file is the residual: legal/compliance
surface, ops posture, and growth-loop basics, checked against 2026 indie
SaaS/edtech launch-checklist conventions and against what actually exists in
this repo (verified by reading, not assumed). Effort is S/M/L. Gating is
**AFK-safe** (an agent can build it end-to-end on `fable/prod-readiness`, no
credentials/product calls needed) or **Jake-gated** (needs a dashboard click,
a secret, or a product/legal decision only Jake can make).

## 1. Pre-launch checklist gaps

1. **Privacy Policy + Terms of Service pages don't exist.** [S–M, AFK-safe to
   draft/wire, Jake-gated to approve legal language — **build now**] Grepped
   the whole repo: no `/privacy`, no `/terms`, nothing under `app/(marketing)/`
   beyond the single landing page (`app/(marketing)/page.tsx`), and its footer
   reads only `"Street Prep · Prototype · {year}"` — no legal links at all.
   This app ingests resumes, transcripts of mock interviews, and networking
   notes about third parties (the user's contacts) under email+password and
   Google OAuth — exactly the profile that makes a Privacy Policy and ToS
   table stakes, not optional polish, before real signups. 2026 SaaS
   launch-checklist guidance is blunt about this: "Terms of Service and
   Privacy Policy are published... they need to be accessible from your
   sign-up flow and your website footer." An agent can draft both pages
   (new marketing routes, e.g. `app/(marketing)/privacy/page.tsx` +
   `/terms/page.tsx`, linked from the footer and from `signup/page.tsx`) and
   fill in the factual parts (what's collected, Supabase/Anthropic/OpenAI/
   PostHog/Sentry as subprocessors, retention, contact email) mechanically
   from the architecture doc — but the legal-liability language (governing
   law, disclaimers, arbitration clause if desired) needs Jake's sign-off
   before it's real, so this is a draft-then-approve flow, not pure AFK.
2. **Self-serve account deletion is promised in `architecture.md` but doesn't
   exist in code.** [M, AFK-safe, **build now — this is a compliance gap, not
   a nice-to-have**] `context/architecture.md` line 218 states: *"Self-serve
   account deletion is supported in phase 1. A 'Delete my account' action in
   `/profile/settings` cascades through every user-owned table and Storage
   prefix, deletes the PostHog person, and removes the Supabase Auth user."*
   None of that exists: `app/(app)/profile/` has only `page.tsx`, `actions.ts`,
   `loading.tsx` — no `/settings` route, no delete action, no grep hit for
   `deleteAccount`/`delete.*account` anywhere in `web/`. The good news: the
   hard part is already done at the DB layer — every user-owned table in
   `supabase/migrations/0000_baseline.sql` has `references auth.users(id) on
   delete cascade`, so deleting the `auth.users` row (via the Supabase admin
   API, service-role only) already cascades every Postgres row for free. What's
   missing is (a) the route/Server Action that calls
   `supabase.auth.admin.deleteUser()`, (b) deleting the two Storage prefixes
   documented in architecture.md (`resumes/{user_id}/`, `mock-audio/{user_id}/`),
   (c) a PostHog person-delete call, (d) a confirm-twice UI in `/profile`. This
   is a GDPR "right to erasure" / CCPA "right to delete" baseline, and the fact
   that the architecture doc already commits to it in writing makes shipping
   it before real users sign up the honest move, not a stretch goal.
3. **No data export ("right to portability").** [S, AFK-safe, **file issue** —
   pair with account deletion, not blocking launch alone] GDPR/CCPA both
   expect some form of "download my data," and this app's data model
   (`profiles`, `experiences`, `resumes`, `chats`, `contacts`, `applied_jobs`)
   is exactly the kind of thing users may want a copy of before deleting.
   Simplest version: a `/profile` action that queries the same tables the
   deletion flow will touch and returns a JSON blob — reuses the enumeration
   work from item 2 almost entirely, so sequencing it right after deletion is
   cheap. Lower urgency than deletion itself (no architecture.md promise, no
   regulator expects it day one for a pre-revenue app), so file it rather than
   block on it.
4. **Custom 404 page is missing.** [S, AFK-safe, **build now — trivial**]
   `app/error.tsx` (500 boundary) and `app/global-error.tsx` (root crash
   fallback) both exist and are on-brand; there is no `app/not-found.tsx`
   anywhere, so a mistyped URL or dead link falls through to Next's generic
   default 404. A `not-found.tsx` matching `error.tsx`'s styling (same
   `eyebrow`/`font-display` pattern, a link back to `/dashboard` or `/`) is a
   15-minute add with zero risk.
5. **No uptime monitoring and no health-check endpoint.** [S, AFK-safe for the
   health route, Jake-gated for the monitor account, **build the route now,
   file the monitor setup**] Sentry (`sentry.server.config.ts`,
   `sentry.edge.config.ts`, `instrumentation.ts`) catches *application*
   errors, but nothing pings the site from outside to catch DNS/Vercel/
   Supabase-down scenarios where the app never gets far enough to throw a
   Sentry-visible error. There's no `app/api/health` or `/api/ping` route
   either — grepped `app/api/**` for `health`/`ping`, nothing. Cheapest
   version: one `GET /api/health` that does a trivial `select 1` through
   Drizzle (proves DB reachability, not just process-up) and returns 200/503;
   point a free-tier external monitor (UptimeRobot, BetterStack, Checkly — all
   have no-cost tiers sufficient for one endpoint) at it. The route is pure
   AFK work; picking and configuring the actual monitoring account is a
   5-minute Jake task, file it.
6. **Supabase backup/restore posture unverified — and the project may still
   be on the Free plan.** [S to check, Jake-gated (billing/dashboard),
   **verify now, before other items matter**] `context/jakes-tasks.md`'s Done
   section notes the Supabase project was found *paused* as recently as
   2026-07-12 ("Supabase project reachable again... no longer paused, or was
   resumed already") — free Supabase projects auto-pause after a week of
   inactivity, which is itself evidence the project was on Free. Free-tier
   Supabase has no point-in-time recovery and caps out at 500MB DB / 1GB
   storage / 5GB egress — fine for dev, not survivable for a production app
   with real signups (auto-pause alone would take the whole product offline
   silently). This needs a straight yes/no from Jake: is the project on a
   paid plan with PITR/backups enabled? If not, that's the single highest-
   priority item in this whole document — everything else here assumes the
   database doesn't just disappear after a quiet week.
7. **Password-reset flow needs a live click-through, not just a code read.**
   [S, Jake-gated (needs a real inbox + the production Supabase Auth email
   templates), **verify before launch**] `app/(auth)/forgot-password/` and
   `app/(auth)/reset-password/` both exist with actions wired, so the code
   path looks complete — but Supabase's default reset-password email template/
   redirect URL is a classic thing that's correct in dev (`localhost`) and
   silently wrong in prod (wrong Site URL, wrong redirect allow-list) until
   someone actually clicks the link from a real email. This is the same class
   of risk as the CSP-verification item already in jakes-tasks.md, just a
   different flow — bundle it into the same "click through the first prod
   deploy" pass.
8. **Google OAuth consent screen: confirm it's Published, not Testing.**
   [S to check, Jake-gated (Google Cloud Console), **verify now — see §2.1,
   this is also a Day-1 breakage risk**] `jakes-tasks.md`'s Done section
   confirms "Configure Google OAuth (Supabase provider + Google Cloud redirect
   URI) — done by Jake," but doesn't say whether the OAuth consent screen's
   *publishing status* was ever flipped from Testing to Production. This is a
   distinct toggle from the Calendar OAuth client (Unit 10's separate app,
   still explicitly pending in jakes-tasks.md) — this is the Sign-In-With-
   Google client Supabase Auth itself uses. Google caps Testing-mode apps at
   100 explicitly-listed test users and expires each test user's grant after
   7 days, on top of showing every signer an "unverified app" scare screen.
   [Manage App Audience](https://support.google.com/cloud/answer/15549945?hl=en)
   Since the app only requests basic `openid email profile` scopes (non-
   sensitive), moving to Production is a single "Publish app" click with no
   Google review wait — cheap to fix, expensive to discover in production
   when the 101st Google sign-in silently fails.
9. **Vercel plan + spend guardrail unconfirmed.** [S to check, Jake-gated
   (billing dashboard), **verify now**] Vercel's Hobby tier explicitly
   prohibits commercial/SaaS use — this needs to be on Pro regardless of
   traffic level. Separately, Pro's "Spend Management" (a configurable budget
   cap, defaults around $200) is opt-in, not automatic, and Vercel bills
   *all* served bandwidth — including a volumetric attack that reaches the
   app — at a flat per-GB rate, so an unmitigated traffic spike (bot scraping,
   a link going semi-viral, or a crude DDoS) is a real bill, not just a
   performance problem. Confirm the plan is Pro and a spend alert/cap is set;
   this is the infra-level twin of the app-level `AI_USER_MONTHLY_CAP_USD`
   cap already in jakes-tasks.md — that one caps *LLM* spend per user, this
   one caps *hosting* spend in aggregate.
10. **LLM abuse-vector review: prompt injection + cost-attack surface on the
    chatbot.** [M, AFK-safe (code-level mitigations), **file issue** — worth a
    dedicated pass, not a 10-minute fix] The chatbot (`app/api/chat/assistant/route.ts`)
    already does several things right: `expensive` rate tier (10/min user,
    30/min IP, fail-closed on a Redis outage per `lib/security/rate-limit.ts`),
    per-user monthly spend cap, and `web_search` capped at `maxUses: 3` per
    turn. What hasn't been reviewed is indirect prompt injection: `get_firm`
    pulls in web-search-sourced content and the (currently static, soon
    web-refreshed per the firm-data brainstorm) `firms` table, and
    `search_chat_logs` pulls back the user's own prior notes — both are
    untrusted-content-into-context paths where 2026 OWASP guidance flags
    indirect injection (malicious text embedded in fetched content, not typed
    by the user) as the top LLM risk. [Prompt injection: the OWASP #1 AI
    threat in 2026](https://www.securance.com/blog/prompt-injection-the-owasp-1-ai-threat-in-2026/)
    The realistic worst case here isn't data exfiltration (single-user RLS-
    scoped tools, no cross-tenant reach) but a firm-data web-search result
    steering the assistant into bad advice or wasted tool calls — low
    severity, still worth a written mitigation note (e.g., system-prompt
    framing that search/tool results are data, not instructions) before this
    scales past a handful of testers.

## 2. Day-1 operations: what breaks first at 100 real users

1. **Google OAuth's 100-test-user cap, literally.** [see §1.8] If the consent
   screen is still in Testing mode, user #101 (or anyone not on the explicit
   test-user allow-list) cannot complete Google sign-in at all — this is the
   most concrete "breaks at 100 users" item in the whole doc, because the
   number is exact and not a rough capacity estimate.
2. **Supabase Free-tier ceilings, if item §1.6 comes back "still Free."**
   50k MAU is generous, but 500MB DB / 1GB Storage is not once resumes (PDFs),
   mock-interview audio, and HireVue `.webm` video recordings
   (`context/architecture.md` lines 12–13, 136–162) start accumulating per
   user — video in particular is the kind of asset that eats a 1GB cap fast.
   Auto-pause-after-inactivity is a launch-blocker in its own right (§1.6);
   the storage/egress caps are the thing that bites specifically as *usage*
   (not just elapsed time) grows past a handful of testers.
3. **Upstash Redis's 500k-commands/month free-tier ceiling.** [worth a
   napkin check, not urgent] Every rate-limited request does at least one
   Redis round-trip per bucket checked (`lib/ratelimit/core.ts` via
   `lib/security/rate-limit.ts`'s dual user+IP check — two lookups per
   request on routes that check both). At 100 active users hitting `cheap`-
   tier routes plus chat/grading/interview/resume `expensive`-tier calls
   throughout a session, back-of-envelope math (100 users × ~20 rate-checked
   requests/day × 2 buckets ≈ 4,000/day ≈ 120k/month) stays under 500k, but
   it's not a huge margin once qbank grading and chatbot turns are counted
   per-message rather than per-session — worth a real count from Upstash's
   dashboard rather than trusting the estimate once usage looks real.
4. **The $20/user/month AI cap times 100 users is a real bill, not a
   backstop.** [product-math check, not a code change] `assertUnderQuota`
   (`lib/ai/usage.ts`) caps individual spend, but 100 users all legitimately
   using the product up to that ceiling is $2,000/month in aggregate LLM
   spend — the per-user cap protects against *one* runaway user, not against
   the aggregate bill scaling linearly with signups. Worth Jake having an
   aggregate-spend dashboard number in mind (Anthropic/OpenAI console
   billing alerts) distinct from the per-user cap, so 100 genuinely engaged
   users isn't a surprise invoice.
5. **`ivfflat` recall/behavior as `chat_embeddings` grows from ~0 rows.**
   [worth a follow-up migration, not urgent at low N] `supabase/migrations/0003_pgvector.sql`
   builds the `chat_embeddings_cosine_idx` with `lists = 100`, tuned (by the
   migration's own comment) for "up to ~1M rows" — but at 100 users with a
   handful of logged chats each, the real row count at launch is likely in
   the low hundreds to low thousands, an order of magnitude under what an
   `ivfflat` index with 100 lists is built for. This isn't a correctness bug
   (0009's `ivfflat.probes = 10` fix already protects per-user recall — see
   `context/CHANGES.md` / that migration's own comments) but it is a
   known-shape problem: `ivfflat` requires training data to build good
   cluster centroids, and organic post-launch growth (one row at a time, not
   a bulk backfill) means the index's centroids get set early against a thin
   sample and don't naturally re-balance as the real distribution fills in —
   Supabase's 2026 guidance increasingly recommends `HNSW` over `ivfflat`
   specifically because it has no training-step dependency on existing data
   and holds up better without periodic manual reindexing. Not worth blocking
   launch on — but worth filing as a follow-up to swap
   `chat_embeddings_cosine_idx` (and any future `firm_data.embedding` index
   from the firm-data-refresh brainstorm) to `HNSW` before row counts get
   large enough that a rebuild is expensive.
6. **Rate-limit IP bucket false-positives from shared/NAT'd IPs.** [worth a
   note, not urgent] `checkRateLimit`'s IP bucket (`lib/security/rate-limit.ts`)
   is a reasonable abuse guard, but at even modest real usage, students on the
   same campus/dorm network or VPN can share a public IP — the `expensive`
   tier's 30/min-per-IP ceiling could throttle multiple legitimate users
   studying from the same building during a busy evening. Not a launch
   blocker (30/min is generous for a single interactive user), but worth
   watching Sentry/logs for 429s clustering around specific IPs once real
   traffic exists, since campus NAT is exactly the profile of this app's
   target user base.

## 3. Growth basics: build now vs defer

1. **Feedback widget.** [S, AFK-safe, **build now**] Grepped for
   `feedback`/`waitlist`/`referral`/`changelog` across the repo — no hits
   outside unrelated matches (form field labels, prompt copy). A pre-launch
   product with this much AI-graded subjective surface (interview scores,
   resume critiques, grading) benefits enormously from a lightweight
   "this scored wrong" / "something's off" capture point, and it's cheap:
   a small floating button wired to a new `feedback` table (or even a
   PostHog custom event + a Slack/email webhook) captures the current
   route + a free-text field. This is the single highest-leverage cheap
   build in this whole document for a pre-launch product — it's how Jake
   finds out what's broken from the first 20 real users instead of guessing.
2. **Changelog / "what's new."** [S, AFK-safe, **defer**] Nice trust-signal
   for a product that's shipping fast (11 commits in the last session alone
   per `context/progress-tracker.md`), but it's a "looks more mature" signal,
   not a launch-blocking or Day-1-breakage item — defer until there's an
   actual audience checking it. A static MDX page fed from `context/CHANGES.md`
   entries would be nearly free to build later; not worth the slot now.
3. **Waitlist.** [S, AFK-safe, **defer / likely skip entirely**] Waitlists
   exist to manage demand before capacity is ready or to build pre-launch
   hype for a cold-start audience. This product already has real signup/
   onboarding/auth flows built and working — gating new signups behind a
   waitlist now would be adding friction to a product that's trying to
   validate real usage, not manufacturing scarcity for a product that
   doesn't have an audience problem yet. Skip unless Jake specifically wants
   to throttle signup volume for cost-control reasons during initial launch
   (in which case it's really an invite-code gate, not a waitlist — much
   smaller build).
4. **Referral program.** [M, AFK-safe to build, Jake-gated on the incentive
   design, **defer**] Referral loops are a compounding-growth lever, but they
   only pay off once there's a base of genuinely satisfied users to refer
   from, and they need a real product decision (what's the incentive — extra
   AI quota, free month, nothing) that's Jake's call, not an agent's. Building
   this before the feedback loop (#1) and legal pages (§1.1) exist would be
   optimizing growth before the product is even confirmed safe to grow.

## Top 5 recommended next actions

1. **Confirm the Supabase plan + backup posture (§1.6)** — Jake-gated, S
   effort (one dashboard check), but this is the one item that makes
   everything else moot if the answer is "still Free" and the project pauses
   itself mid-launch. Do this first, today.
2. **Publish the Google OAuth consent screen if it's still in Testing (§1.8 /
   §2.1)** — Jake-gated, S effort (one button), directly caps real signups at
   exactly 100 users if left as-is. Second thing to check today.
3. **Ship Privacy Policy + ToS pages (§1.1)** — S–M effort, AFK-safe to draft
   and wire, Jake-gated only on final legal language approval. An AI product
   ingesting resumes without a privacy policy is the single biggest
   "shouldn't have launched without this" gap found in this pass.
4. **Build self-serve account deletion (§1.2)** — M effort, fully AFK-safe
   (the hard part — cascade deletes — is already done at the DB layer via
   `on delete cascade` from `auth.users`). This closes the gap between what
   `architecture.md` already promises in writing and what the product
   actually does, and it's a GDPR/CCPA baseline that gets harder to retrofit
   the more real user data accumulates.
5. **Add a feedback widget (§3.1)** — S effort, fully AFK-safe, highest
   leverage-per-hour item in this document. Nothing else here tells Jake what
   real users actually hit first; this does.

Sources consulted this session: [How to Monitor SaaS Status in 2026](https://blog.incidenthub.cloud/monitoring-saas-status-2026-complete-guide) ·
[The Complete SaaS Launch Checklist](https://infinitysky.ai/blog/saas-launch-checklist-before-going-live) ·
[Prompt injection: the OWASP #1 AI threat in 2026](https://www.securance.com/blog/prompt-injection-the-owasp-1-ai-threat-in-2026/) ·
[Supabase Free Tier Limits 2026](https://automationatlas.io/answers/supabase-free-tier-limits-2026/) ·
[Supabase Vector & pgvector: Best Setup for 2026](https://www.kreante.co/post/build-smart-apps-with-supabase-vector-database-semantic-search-guide) ·
[Manage App Audience — Google Cloud](https://support.google.com/cloud/answer/15549945?hl=en) ·
[Upstash Redis Pricing & Limits](https://upstash.com/docs/redis/overall/pricing) ·
[Vercel Hobby Plan docs](https://vercel.com/docs/plans/hobby) · [Vercel Security](https://vercel.com/security)
