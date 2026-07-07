# AI Workflow Rules

## Approach

Build this project **incrementally using a spec-driven workflow.** The context files (`project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, this file, `progress-tracker.md`) define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch.

**Default mode for any non-trivial task: plan first, then execute.**

1. Read the relevant context files.
2. Read the relevant existing code.
3. Draft a short plan: the user-visible behavior the unit ships, the steps to get there, the files to touch (including new ones), the database changes if any, the risks, and the verification step.
4. **Wait for approval.** Don't start coding until the plan is acknowledged.
5. Execute the plan, marking progress as you go.
6. Verify end-to-end (the verification step from the plan).
7. Update `progress-tracker.md`.
8. Summarize what changed for review.

Trivial tasks (typo fixes, single-line bug fixes, content tweaks) skip the plan step and go straight to execute → verify → summarize.

## Scoping Rules

- **Work on one feature unit at a time.** A "unit" is a tracer-bullet vertical slice (see below).
- **Prefer small, verifiable increments** over large speculative changes. If you can't demo the change in 60 seconds after it merges, it's too big.
- **Do not combine unrelated system boundaries in a single implementation step.** Schema change + new feature + UI refactor in one PR is too much; split it.
- **No drive-by changes.** If you notice unrelated issues while implementing, log them as open questions in `progress-tracker.md` — don't fix them in the same PR.

## Slicing: Tracer-Bullet Vertical Slices

Each unit ships one user-visible behavior end-to-end:

1. **Schema migration** (Drizzle Kit) if needed.
2. **Query function** in `lib/db/queries/<domain>.ts`.
3. **Server Action** (with Zod schema colocated) or Route Handler.
4. **UI** that calls the action and reflects the result.
5. **Tests** for the pure logic (Vitest) and a Playwright assertion if the unit changes a critical user flow.

**Example unit:** "User can log a chat note about a contact and see it appear in the contact's history."

- Migration: add `chats` table if missing, or add a column if extending.
- Query: `createChat(db, input)`, `listChatsForContact(db, contactId, userId)`.
- Action: `logChatAction({ contactId, rawNotes })` returns `{ ok: true, data: { chatId } }` or `{ ok: false, error }`.
- UI: contact-detail page "Log chat" tab with a form; on success, history list refreshes.
- Tests: Vitest on the chat-structuring prompt builder; Playwright that asserts the chat appears after submission.

Every unit must be **independently shippable** — merging it shouldn't break anything else, and reverting it shouldn't take more than a single `git revert`.

## When to Split Work

Split an implementation step if it combines:

- **UI changes and background-job changes** in the same unit (split into "ship the UI first, then the job that supports it").
- **Multiple unrelated Server Actions or domains** — each domain is its own unit.
- **A schema change with substantial new feature logic** — land the migration in its own PR first if the migration is non-trivial (renames, type changes, data backfills).
- **Behavior not clearly defined in the context files** — clarify the spec first (see "Handling Missing Requirements").
- **More than ~400 lines of net new code** in a single PR — almost always splittable.

If a change cannot be verified end to end quickly, **the scope is too broad — split it.**

## Handling Missing Requirements

- **Do not invent product behavior not defined in the context files.** If the spec doesn't say what should happen when a user uploads an unsupported file type, ask — don't guess.
- **If a requirement is ambiguous, resolve it in the relevant context file before implementing.** Don't bury the interpretation in code.
- **If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.** Decide the answer, write it into the appropriate context file, then implement.
- **If you discover that a context file is wrong** (e.g. an invariant in `architecture.md` doesn't actually hold), surface that explicitly. Don't quietly route around it.

## Protected Files

Do not modify the following unless explicitly instructed:

- **`components/ui/*`** — shadcn primitives are CLI-generated. Customize in place only when the task explicitly asks for it (per `ui-context.md`'s "edit, don't wrap" rule).
- **`lib/db/migrations/*`** — Drizzle Kit generates these. Editing a generated migration is a footgun; always create a new migration with `pnpm drizzle-kit generate`.
- **`templates/context/*`** — spec files are deliberate, discussed changes tracked in `CHANGES.md`. Don't silently edit a spec file mid-task; raise the question, get agreement, then update the spec and log it.
- **`.env*` files and any secret-bearing config** — never touch. The values live elsewhere (Vercel, password manager). The repo holds only `.env.example`.
- **Anything in `node_modules/` or third-party library internals.**

## Commit and PR Conventions

**Conventional commits.** Every commit message starts with a type:

- `feat:` new user-visible behavior
- `fix:` bug fix
- `refactor:` no behavior change, code restructure only
- `chore:` infra, deps, config
- `docs:` docs, comments, README, CLAUDE.md, context files
- `test:` test-only changes
- `perf:` performance change without behavior change

Example: `feat: log chat notes against a contact`

**One feature per PR.** PR title mirrors the primary commit type and reads as the unit's user-visible behavior: `feat: user can log a chat note against a contact`.

**PR description has three sections, each 1–3 bullets:**

- **What changed** — the actual edits.
- **Why** — the user-facing behavior or constraint that drove it.
- **How to verify** — concrete steps (or links to the Playwright test that does it).

Commit history within a PR can have multiple logical commits if it makes the story clearer (schema → query → action → UI). Don't squash unless the commits are noisy WIP.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- **System architecture or boundaries** → `architecture.md` + log the change in `CHANGES.md`.
- **Storage model decisions** (new table, retention rule, embedding location) → `architecture.md` Storage Model section + `CHANGES.md`.
- **Auth or access model change** → `architecture.md` Auth section.
- **A new architectural invariant or a removed one** → `architecture.md` Invariants section.
- **UI tokens, layout patterns, motion rules** → `ui-context.md`.
- **A new code-standards rule** (e.g. new lint rule, new naming convention) → `code-standards.md`.
- **Feature scope change** (something cut, something added, phase boundary moved) → `project-overview.md` Scope section + `CHANGES.md`.
- **A new AI tool, new vendor, new env variable** → `architecture.md` Stack section.

`CHANGES.md` is the running log of decisions. Every spec change gets a one-line entry with date and rationale.

## Before Moving to the Next Unit

A unit is "done" only when **all** of these are true:

1. **The current unit works end-to-end** within its defined scope. You can demo it.
2. **No invariant defined in `architecture.md` was violated.** (Spot-check the 10 invariants.)
3. **`progress-tracker.md` reflects the completed work** and any new open questions.
4. **`pnpm typecheck`, `pnpm lint`, and the relevant tests pass locally.**
5. **`pnpm build` passes** — no production build regressions.
6. **The PR is merged**, or if working solo, the commit is on `main` and pushed.

Only then start the next unit.

## When Things Go Wrong

- **A test fails:** fix the root cause, not the test. Tests fail because something they expected isn't true; the test is usually right.
- **A type error blocks progress:** never use `as any` to shut it up. Find the real type or write a proper type guard.
- **An invariant from `architecture.md` is inconvenient:** the right move is to discuss whether the invariant should change, not to quietly violate it.
- **The plan turns out to be wrong mid-execution:** stop, re-plan, get approval on the new plan. Don't ship the wrong thing because the plan said so.
- **You hit a context limit / get confused / lose the thread:** stop and report. Better to surface the situation than to ship a half-understood change.

## Working With This Workflow

This is a single-developer product with AI assistance. The discipline of the spec-driven workflow is the substitute for the discipline of a team. The cost is small (~10% of dev time spent on planning and docs); the payoff is that any future contributor — including a future version of yourself, or any AI agent — can land in this repo and immediately know:

- **What the product is** (`project-overview.md`)
- **How it's built** (`architecture.md`)
- **How it looks** (`ui-context.md`)
- **How code is written** (`code-standards.md`)
- **How work proceeds** (this file)
- **What's been done and what's next** (`progress-tracker.md`)

No tribal knowledge. No "ask the founder." The spec is the source of truth.
