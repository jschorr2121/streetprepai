# Brainstorm: firm_data refresh pipeline (deferred unit)

Problem: firm intel (earnings, deals, news, culture, recruiting timelines) goes
stale the moment it's written. Today it's 100% static — `firms.latestEarningsRaw`
is illustrative seed text (3 firms seeded: GS, Evercore, Morgan Stanley; the
product spec names ~21 across bulge-bracket/elite-boutique/middle-market). Unit 9
issue 04 shipped `get_firm` against `firms` as-is and explicitly deferred the
richer pipeline (`.scratch/unit-9-chatbot-rebuild/issues/04-firm-data-and-why-firm.md`
line 17). This is that unit.

## Current state

- **Schema**: only `firms` (slug, name, tier, hq, description,
  latestEarningsRaw) exists — `web/lib/db/schema/firms.ts`. The `firm_data`
  table (`kind`: earnings | deal | news | culture, content JSON, fetched_at,
  `embedding` for pgvector retrieval) is speced in `context/architecture.md`
  (lines 122, 132) but has no schema file, no migration, no rows.
- **Tool surface**: `get_firm` in `web/lib/ai/assistant-tools.ts` reads
  `firms` via `web/lib/data/firms.ts#getFirmByQuery` (fuzzy slug/name match).
  Its return shape is deliberately additive so a `firm_data` join can be
  layered in without a breaking change.
- **Web search**: Anthropic's server-side `web_search` tool is already wired
  (Unit 9 issue 03) at `$10/1,000 calls` = `WEB_SEARCH_PER_CALL_USD = 0.01` in
  `web/lib/ai/pricing.ts`, `max_uses` capped per request. It's a live-query
  tool the chatbot calls mid-conversation — not currently used by any batch
  job.
- **Inngest**: the `inngest` npm package is installed and `context/architecture.md`
  names it as the background-job runtime for "weekly firm-data refresh," but
  **`lib/inngest/` does not exist yet** — no client, no functions, no
  `app/api/inngest/route.ts`. Jake's task list has "create an Inngest
  account/app" still open (`context/jakes-tasks.md`), tied to Unit 10 calendar
  sync, not yet to this unit. So this brainstorm assumes Inngest plumbing
  (client + endpoint) gets stood up either by this unit or immediately before
  it — it's a shared prerequisite, not scope creep unique to firm data.
- **Embeddings**: `chat_embeddings` and `chats.embedding` already use pgvector
  (1536-dim, presumably switching to Voyage per progress-tracker) — the same
  pattern (`vector()` column + cosine search) applies directly to
  `firm_data.embedding`.

## How comparable products keep company intel fresh

- **Cron + LLM summarization over search results** is the dominant 2026
  pattern for "keep a knowledge base current without a bespoke crawler":
  schedule a periodic job, call a web-search-capable model, store the
  summarized output, embed it for retrieval. Inngest's own docs frame
  functions as triggerable by cron *and* events — scheduled cadence
  guarantees freshness, an event (e.g. an admin "refresh now" button)
  guarantees on-demand responsiveness. Worth copying directly. [Scheduled Functions & Cron Jobs](https://www.inngest.com/docs/guides/scheduled-functions)
  · [AI Workflow Orchestration Patterns 2026](https://www.swfte.com/blog/ai-workflow-orchestration-patterns-2026)
- **Per-call web search pricing is the real cost driver**, not tokens —
  Anthropic's `web_search` tool bills a flat rate on top of standard token
  cost. [Claude web search tool pricing](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
  This app already pays that rate ($0.01/call), so a refresh job is cheaply
  modeled as "N firms × M searches × $0.01" plus a small summarization call.
- **Dedicated news APIs are the alternative**, but nearly every one
  restricts exactly what this feature needs: NewsAPI.org bars commercial use
  on its free tier; Aylien's ToS prohibits building a database or permanent
  copies from returned data; World News API prohibits scraping or storing
  derived data. [NewsAPI Terms](https://newsapi.org/terms) · [Aylien Terms](https://aylien.com/legal/news-api-terms-of-service)
  · [World News API Terms](https://worldnewsapi.com/terms/) Rules out
  "call a news API, cache articles verbatim" — reinforces web_search + LLM
  synthesis (transform, don't republish) as the compliant default.

## Candidate architectures

**A. Weekly Inngest cron, one job per firm, web_search + summarize.**
`step.run` per firm: 2–3 `web_search` calls (earnings/deals, news — scoped
queries like `"<firm> Q_ 2026 earnings"`, `"<firm> announced deal 2026"`) →
one Haiku/Sonnet call synthesizes into `firm_data` rows per `kind` → embed
each row (Voyage) → upsert with `fetched_at`. Simplest, matches the
architecture doc's design point-for-point. *Cost*: 21 firms × 3 searches ×
$0.01 = $0.63/week in search fees + ~21 cheap summarization calls ≈
**$3–5/month** all-in at current firm count; scales linearly with firm
count, not user count — cheap even at 5x firm growth.

**B. Same cron, batched into fewer, broader searches.** One job per *tier*
does 1 broad "this week's IB deal/earnings roundup" search + per-firm
targeted searches only for firms flagged stale or high-traffic. Cuts search
volume ~40–60% at the cost of uneven freshness on rarely-viewed firms, plus
staleness/popularity-tracking complexity — **not worth it until firm count
is much larger** (revisit past ~100 firms).

**C. On-demand refresh + lazy cache, no cron.** `get_firm` checks
`fetched_at`; if stale, fire a refresh before answering. Freshness tracks
actual usage with zero wasted spend on unqueried firms, but the first user
to ask about a cold firm eats refresh latency mid-chat, and freshness
becomes unpredictable — a bad fit for a promised "refreshed weekly" firm
page (`project-overview.md` line 85) meant to render instantly.

**Recommendation: A, with C as a cheap add-on later.** Weekly cron is what
the architecture doc already commits to, costs approximately nothing at
current scale, and keeps `get_firm`/firm pages fast (pure DB read, no
inline LLM latency). Add on-demand "refresh this firm now" as an admin
action (architecture.md already grants `admin` the ability to trigger
Inngest jobs) rather than as the primary mechanism — solves the
cold-firm-launch-day problem without complicating the user-facing read path.

## Recommended slice-1 scope

1. `lib/db/schema/firm-data.ts`: `firm_data` table per architecture.md spec
   (`firmSlug` FK, `kind` enum, `content` jsonb, `embedding` vector,
   `fetchedAt`). Migration + RLS (read: `user`; write: service-role only,
   per architecture.md's shared-content policy).
2. Stand up minimal `lib/inngest/` (client + `app/api/inngest/route.ts`) if
   not already done by whichever unit lands first — this is a shared
   prerequisite worth building once, not duplicating.
3. One Inngest cron function, `refreshFirmData`, weekly, looping the (small,
   currently 3-row) `firms` table: 2 scoped `web_search` calls (earnings/deals,
   recent news) + one summarization call producing `kind: "earnings"` and
   `kind: "news"` rows. Skip `culture` for slice 1 — architecture.md already
   says culture notes come from users' own past chats, not external search.
4. Embed each `content` blob (Voyage) on write.
5. Extend `get_firm`'s query to also pull `firm_data` rows for that slug
   (additive, per issue 04's design note) and extend the return shape/system
   prompt attribution ("From <firm>'s recent earnings (refreshed <date>)…").
6. Admin manual-trigger endpoint/button (satisfies architecture.md's admin
   capability) — deferred to slice 2 if slice 1 needs to ship faster.

Explicitly out of scope for slice 1: `firm_interview_questions` refresh,
per-sector data, popularity-weighted refresh (candidate B), culture-from-web.

## Open product questions for Jake

1. **Which firms first?** Full ~21-firm target list from day one, or start
   with the 3 seeded (GS, Evercore, Morgan Stanley) and expand as the roster
   grows? Affects both cost (linear in firm count) and QA burden.
2. **Freshness SLA**: is "weekly" a real commitment users will notice if
   missed, or a soft target? Determines whether a failed/skipped Inngest run
   needs alerting (Sentry) or can just retry next week silently.
3. **Budget ceiling**: comfortable with ~$3–5/month at 21 firms scaling
   linearly? Worth a hard cap (e.g., disable refresh, alert) if firm count or
   search-per-firm count grows unexpectedly (bad query, retry storm)?
4. **Source posture**: confirms comfort with "web_search + LLM synthesis,
   never verbatim-store or republish news-API content" as the compliance
   line, given every checked news API's ToS forbids caching/derivative
   storage for commercial products.

## Risks

- **Hallucinated firm facts.** Weekly LLM synthesis over thin search results
  can fabricate specifics (deal sizes, dates). Mitigate: require the prompt
  to cite which search result backs each claim, store source URLs in
  `content`, and show an "as of `fetched_at`, sourced from web search"
  disclaimer — never present it as audited data.
- **Licensing/ToS.** Stay in "transform via LLM synthesis of search
  snippets," never "store and redisplay full articles" — see comparable-
  products section above on why caching news-API content wholesale is
  off-limits.
- **Silent staleness.** If a weekly run fails, `fetched_at` should make that
  visible on the firm page ("last updated N weeks ago") rather than quietly
  serving old data as fresh — cheap guardrail, belongs in slice 1 even if
  alerting is deferred.
- **Inngest not yet live.** Blocked on Inngest plumbing existing at all (see
  Current State) — sequence with, not after duplicating, whichever unit
  first stands up `lib/inngest/`.
