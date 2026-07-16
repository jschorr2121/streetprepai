# 04 — Firm-data tool + "prep me for why JPM" golden path

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

"Prep me for why JPM" produces a personalized synthesis that visibly draws on: (a) the user's profile/experiences, (b) their past chats with anyone at JPM, (c) JPM's firm page data, and (d) general IB knowledge — each with a source chip. This is `project-overview.md` Success Criterion 3, the product's marquee demo.

## Scope

1. **New tool `get_firm` in `lib/ai/assistant-tools.ts`:** input `{ firm: string }` (name or slug, fuzzy-matched); returns the `firms` row (`lib/db/schema/firms.ts`: name, tier, hq, description, `latestEarningsRaw`) — via a new `lib/db/queries/firms.ts#getFirmBySlugOrName(db, q)`. Firms are shared content (read-only), so a plain read is fine; cap `latestEarningsRaw` with `capText`.
2. **New tool `search_firm_chats`** — or extend `search_chat_logs` with an optional `firm` filter (prefer extending: fewer tools = better routing). Semantic search scoped to contacts at a given firm, reusing `lib/data/semantic-recall.ts#findSimilarChats` + a firm filter on the contact join.
3. **System prompt:** a "firm-prep synthesis" instruction block — when asked "why <firm>" / interview-prep questions, consult profile + firm data + past chats at that firm, then synthesize with explicit attribution ("From your profile…", "From your chat with…", "From JPM's recent earnings…"). Never invent chats or experiences; state gaps ("you haven't logged any JPM chats yet — here's generic guidance plus next steps").
4. **UI:** nothing new beyond issue 02's citation chips — verify they read well when 3–4 tools fire in one turn.
5. **Data caveat (call out in PR):** the rich `firm_data` table (earnings/deals/news, weekly refresh) from `architecture.md` doesn't exist yet — only `firms.latestEarningsRaw`. This issue ships against `firms` as-is; the firm-data refresh pipeline is its own later unit and the tool's return shape should make adding `firm_data` rows additive.
6. **Tests:** fuzzy-match unit tests for `getFirmBySlugOrName` (slug, exact name, case-insensitive, unknown → NOT_FOUND result the model can relay); tool executor tests; a scripted multi-tool loop test with a mocked model asserting all sources appear in parts.
7. **e2e:** `tests/e2e/chatbot.spec.ts` golden path with mocked LLM (auth-gated, `STREETPREP_E2E_AUTH=1`): seeded profile + JPM contact/chat + firms row → "prep me for why JPM" → response contains source chips for profile, chats, and firm data.

## Verification

All six done-gates. Manual demo = the golden path above with the real model.
