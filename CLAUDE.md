## Application Building Context

Read the following files in order before implementing
or making any architectural decision:

1. `context/project-overview.md` — product definition,
   goals, features, and scope
2. `context/architecture.md` — system structure,
   boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography,
   and component conventions
4. `context/code-standards.md` — implementation rules
   and conventions
5. `context/ai-workflow-rules.md` — development workflow,
   scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase,
   completed work, open questions, and next steps
7. `context/jakes-tasks.md` — manual tasks on Jake's
   plate (dashboard config, secrets, third-party setup)
   that run concurrently with code changes

Update `context/progress-tracker.md` after each
meaningful implementation change.

Whenever an implementation needs an action Jake must
take by hand — Supabase/dashboard configuration,
secrets or env values, third-party/account setup,
manual DB migrations, or anything you cannot do
yourself — log it in `context/jakes-tasks.md` (add it
under the right section; note why/where/which unit) AND
call it out in your response. Keep that file current:
move items to "Done" once resolved. Always update this
tracker when you need Jake to do something.

If implementation changes the architecture, scope, or
standards documented in the context files, update the
relevant file before continuing.

## Agent skills

### Issue tracker

Issues and PRDs live as local markdown files under `.scratch/<feature>/` in this repo (no GitHub Issues; PRs are not a triage surface). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the five canonical role strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) are used as-is. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
