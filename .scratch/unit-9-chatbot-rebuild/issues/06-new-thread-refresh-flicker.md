# 06 — New-thread router.refresh() can momentarily drop the streamed reply

Status: ready-for-agent (filed 2026-07-18, relay session 5 — low severity, cosmetic race)
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
