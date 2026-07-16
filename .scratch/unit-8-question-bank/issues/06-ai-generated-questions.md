# 06 — AI-generated questions (stretch)

Status: needs-triage
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

When the curated bank is thin for a topic/difficulty (or the user asks for a fresh one), a "Generate new question" button produces an AI-generated question with a rubric, inserted into `qbank_questions` with `source = 'ai_generated'`, and serves it immediately. Generated questions participate in grading, spaced re-surfacing, and mastery exactly like curated ones.

## Why needs-triage

Two product calls Jake should confirm before an agent runs with it:

1. **Sharing:** are AI-generated questions global shared content (any user can be served them later — cheaper, grows the bank, but quality is uncurated) or private to the generating user? `architecture.md` models `qbank_questions` as shared content, which implies global — but writes to shared content are admin/service-role-only under the current RLS design, so insertion must go through an explicit service-role path (`lib/db` `serviceRoleClient` per architecture) with that code path clearly auditable. Recommendation: global, flagged `ai_generated`, with an admin review surface later.
2. **Quality gate:** generate-then-serve immediately, or generate against the existing curated questions as few-shot examples with a self-check pass? Recommendation: few-shot from 2–3 curated questions of the same topic/difficulty, single generation call, forced tool `save_question` `{ prompt, rubric: { ideal_answer_outline: [...] }, difficulty, topic }`.

## Scope (once triaged)

- `lib/ai/qbank.ts#generateQuestion` — forced tool use, `logUsage` endpoint `qbank/generate`, prompt-cached system block.
- Server Action `generateQuestionAction({ topic, difficulty })` — 7-step skeleton; **strict rate limit** (e.g. 5/min — generation is the most expensive q-bank call); inserts via the explicit service-role path; returns the new question.
- Duplicate avoidance without embeddings (Voyage not installed): pass the topic's existing question prompts in-context and instruct against overlap. Embedding-based dedup is a later unit.
- UI: "Generate a new one" button on the empty/exhausted state and next to the served question.
- Tests: action gates (auth, rate limit), generation helper with mocked client, service-role insert path unit test.

## Verification

All six done-gates. Manual demo: exhaust an easy topic → generate → new question served, graded, appears in spaced state on a miss.
