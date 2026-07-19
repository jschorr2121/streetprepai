# 01 — Reading lens has no keyboard-accessible path

Status: ready-for-agent (filed 2026-07-19, relay session 7 — fresh-eyes UX sweep)
Blocked by: —

## Problem

`components/reader/reading-lens.tsx` (~lines 50–83) drives highlight-to-explain
entirely off `mouseup` text selection: the Explain popover only ever appears
after a pointer-driven selection. Keyboard-only users (and most screen-reader
users) can select text with Shift+arrows but nothing listens for it, so the
reading lens's core feature is unusable without a mouse. WCAG 2.1.1 (Keyboard).

## Fix directions (pick smallest that works)

- Listen for `document.onselectionchange` (debounced) or `keyup` with a
  selection check, in addition to `mouseup`, and anchor the popover to
  `selection.getRangeAt(0).getBoundingClientRect()` — the positioning code
  already works from a rect, so the delta is mostly "when do we check".
- Make the popover's Explain/Dismiss buttons reachable: after the popover
  opens, it should be next in tab order (or moved into focus), and Escape
  should dismiss it.
- Verify in a dom-project test: simulate a selection + `selectionchange`/keyup
  and assert the popover renders; assert Escape dismisses.

## Notes

- Low urgency, real a11y gap. Filed instead of fixed because the selection/
  focus interplay needs care (don't steal focus mid-selection, don't reopen the
  popover on every caret move) — worth a focused session, not a drive-by.
