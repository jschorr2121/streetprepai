# Unit N — <feature name>

> Status: <Draft | Approved | In progress | Complete | Cancelled>
> Last updated: YYYY-MM-DD
> Owner: <name>

## User-visible behavior

What a user can newly do after this unit ships. 1–3 behaviors max — one shippable slice. If you find yourself listing more, this unit is too big; split it.

## Acceptance criteria

Observable, testable conditions. Each one should be demonstrable in <60 seconds with a real signed-in user.

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Out of scope

What this unit explicitly does NOT build. Forces a small, shippable slice and prevents drive-by creep.

- ...

## Data model changes

New tables, new columns, new indexes, new RLS policies. Drizzle schema sketch or SQL DDL. "None" is a valid answer.

## Surfaces affected

Routes added, renamed, or deleted. Server Actions added. API endpoints. Components added. Sidebar nav updates. Migrations.

| Path | Change |
|---|---|
| `app/(app)/foo/page.tsx` | New |
| `app/(app)/bar/page.tsx` | Modify |
| `lib/db/queries/baz.ts` | New |

## AI prompts and tool definitions

If the unit involves Claude calls. System prompt sketch, tool JSON schemas, expected response shape (tool use output). Skip if N/A.

## Edge cases

What happens if X is empty / Y times out / Z is malformed / the user has zero records / the network drops mid-stream?

## Dependencies on other units

Which prior units must be complete before this one can start. "None" is valid for the first foundation unit.

## Verification and test plan

- **Demo path:** the exact sequence a user takes to demonstrate the new behavior.
- **Tests:** which Vitest unit tests + which Playwright assertions cover the criteria.
- **Verification gates** from `ai-workflow-rules.md`: pnpm typecheck, pnpm lint, pnpm build, no invariant violated, progress-tracker updated.

## Open questions

Anything not decided yet. Each open question needs a resolution **before** implementation starts.

- ...

## References

- Architecture invariants touched: `architecture.md` §<section>
- Code conventions invoked: `code-standards.md` §<section>
- Related progress-tracker entries: ...
