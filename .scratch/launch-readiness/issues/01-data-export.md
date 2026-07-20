# 01 — Self-serve data export ("download my data")

Status: ready-for-agent
Blocked by: account deletion landing (relay session 8) — reuse its table/storage enumeration

## Problem

GDPR/CCPA both expect some form of data portability, and this app's data model
(`profiles`, `experiences`, `resumes`, `chats`, `contacts`, `applied_jobs`,
`chat_threads`/`chat_messages`, qbank attempts) is exactly the kind of thing a
user may want a copy of before deleting their account. Nothing in `web/`
implements it (grep `export.*data` / `download.*data` — no hits). Source:
`context/brainstorms/2026-07-19-launch-readiness.md` §1.3.

## Fix direction

- A Server Action (or route handler returning a download) on the same
  profile/settings surface as "Delete my account" that queries every user-owned
  table the deletion flow enumerates and returns one JSON blob
  (`streetprep-export-<date>.json`). Storage objects (resumes, audio) can be
  listed with signed URLs rather than inlined.
- Reuse the table enumeration from the deletion work (relay session 8) —
  that's most of the effort; the rest is serialization + a download link.
- Rate-limit (non-AI limiter, e.g. 2/hour) — the export is a heavy read.
- Tests: action auth-required + shape-of-output with mocked DB.

## Notes

- Lower urgency than deletion (no architecture.md promise; no regulator
  expects it day one for a pre-revenue app). Pair it with the settings page
  that deletion introduces.
