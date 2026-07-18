# 06 — New-thread router.refresh() can momentarily drop the streamed reply

Status: done (2026-07-18, relay session 6 — stable mount key, see Comments)
Blocked by: —
PRD: ../PRD.md

## Problem

On a brand-new thread, the client's `onFinish` (`app/(app)/tools/chatbot/_components/chat.tsx`,
~lines 165–172) runs `router.replace('?thread=<id>')` + `router.refresh()`. That flips
`active` from null to the thread, so `key={active?.id ?? "new"}` changes `"new" → <id>` and
**remounts** `AssistantChat` with server-fetched `initialMessages`.

The assistant message is persisted server-side in the response stream's `onEnd` — a separate
lifecycle from the client's `onFinish`. If the refresh's `getMessages` read commits before the
persist commits, the remounted component's `initialMessages` lacks the just-streamed assistant
reply and it flickers out of the UI until the next navigation/reload. Race between two server
operations with no ordering guarantee.

Found by the session-5 chatbot correctness review (PLAUSIBLE, low): the reply is never lost
from the DB — only momentarily invisible.

## Fix directions (pick smallest that works)

- Don't remount on first send: keep a stable `key` for the component instance that started as
  `"new"` (e.g. track the client-generated threadId from the start — it IS the id the URL gains,
  so `key` can be the client uuid from mount), so `router.replace` doesn't destroy state and
  `initialMessages` staleness is irrelevant.
- Or skip `router.refresh()` on first send (the rail entry can be added optimistically; titles
  arrive on a later navigation anyway).
- Or delay refresh until the persisted message is observable (extra read — probably overkill).

## Acceptance

- Send first message in a new thread; the assistant reply never disappears after stream end.
- Thread rail still gains the new thread entry (immediately or on next navigation — product
  call: note which in the PR).
- Existing chatbot e2e spec (`tests/e2e/chatbot.spec.ts`) still passes; extend it if the fix
  changes URL/remount behavior.

## Comments

Went with the first fix direction (stable key across the first send), implemented as a small
client wrapper rather than tracking a client-generated id in `page.tsx` (that's a Server
Component and can't hold the uuid).

`page.tsx` no longer keys `AssistantChat` itself; it renders a new `ChatSession` wrapper
(`_components/chat.tsx`) that owns the mount key via a pure `computeNextChatSessionState`
transition function: a `knownId: null -> non-null` change (a brand-new thread's
client-generated id getting confirmed by `router.refresh()`) keeps the existing `mountKey`
— so `AssistantChat` never remounts and `initialMessages`/`initialThreadId` prop churn is
inert (confirmed against `@ai-sdk/react@4.0.34`: `useChat`'s `Chat` instance is only
recreated when the `id` option changes, and `AssistantChat`'s own `threadId` state is a
`useState` initializer that ignores prop updates after mount — so nothing resets). Any other
transition (switching to a different existing thread, or an explicit `?thread=new` reset)
gets a new `mountKey` and remounts/resets as before. `router.refresh()` stays in `onFinish`
unchanged — the rail still updates because `ThreadRail` is a sibling server-rendered from the
same refreshed `page.tsx`, untouched by this change.

Files: `app/(app)/tools/chatbot/_components/chat.tsx` (new `computeNextChatSessionState` +
`ChatSession`), `app/(app)/tools/chatbot/page.tsx` (renders `ChatSession` instead of keying
`AssistantChat` directly). New test `tests/components/chat-session.test.ts` covers the four
transition cases as a pure-function unit test (no DOM needed).

Verified: typecheck/lint clean, full vitest suite 463/463 passing, `pnpm test:e2e` under CI's
placeholder env still reports **1 passed / 10 skipped** (no regression — the existing
`chatbot.spec.ts` golden path already covers the "URL gains `?thread=<uuid>`" and "rail gains
an entry" assertions this fix had to preserve, so it wasn't extended further).
