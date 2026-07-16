# 03 — Native web search tool

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

The chatbot can answer questions needing live information ("what deals has Evercore announced recently?", "when do JPM 2027 summer apps open?") by searching the web, with result citations (title + link) rendered in the reply.

## Scope

1. **Enable Anthropic's server-side `web_search` tool** through the AI SDK provider (`@ai-sdk/anthropic` exposes provider-defined tools — verify the current v6 API via `find-docs` before coding; it has changed across releases). Locked vendor decision per `architecture.md`: native Anthropic web search, no separate search vendor.
2. **Remove the stubbed `web_search`** entry from `lib/ai/assistant-tools.ts` (it returns empty results today) — the provider tool replaces it.
3. **Config:** `max_uses` cap (≈ 3 per request) to bound cost; note web-search pricing flows through the Anthropic bill, `logUsage` already captures the token side — add the per-search surcharge to `lib/ai/pricing.ts` if it models cost per call.
4. **UI:** render web-search result citations from the message parts (source list under the answer: favicon-less title + domain + link, `target="_blank" rel="noopener"`).
5. **System prompt:** guidance on when to search (time-sensitive firm/deal/recruiting-cycle facts) vs. answer from knowledge (evergreen technicals).
6. **Tests:** mocked-provider test asserting the tool config is attached and citations parts render; no live-network tests in CI.

## Verification

All six done-gates. Manual demo: ask a clearly time-sensitive question → search fires → answer cites sources with working links.
