# Unit 7 — Application Tracker

> Status: Draft
> Last updated: 2026-05-19
> Owner: Jake

## User-visible behavior

A signed-in user can:

1. **Add a job application** to their personal tracker (firm, role, stage, optional URL, optional deadline, optional notes).
2. **View their applications** filtered by stage, sorted by most recent activity.
3. **Update or delete an application** as their pipeline evolves.
4. **Ask the chatbot** "what stage is my GS application at?" and have it pull from the tracker via a `get_applied_jobs` tool.

This is rebuilt from scratch using the spec'd patterns (Drizzle queries, Server Actions, the 7-step skeleton). The legacy `lib/data/applied-jobs.ts` + REST API + UI deleted in Unit 1 is **not** restored — Unit 7 ships the same conceptual feature on the new architecture.

## Acceptance criteria

- [ ] `/tools/applications` route renders the tracker page (sidebar entry "Applications" — `Briefcase` icon).
- [ ] Form to add a new application; submission goes through a Server Action `createApplicationAction` following the 7-step skeleton.
- [ ] Applications list filterable by stage chips (shortlist / applied / interview / superday / offer / rejected) — URL-state, not local-state.
- [ ] Each application card has inline stage edit + delete button.
- [ ] `getApplications(db, userId)` and other queries live in `lib/db/queries/applications.ts`.
- [ ] `applied_jobs` Drizzle schema in `lib/db/schema/applied-jobs.ts` matches whatever the Supabase table currently looks like (from introspection in Unit 3).
- [ ] Chatbot tool `get_applied_jobs` re-added to `lib/ai/assistant-tools.ts`, but now calling through the new Drizzle query layer.
- [ ] Vitest unit tests for the actions (validation, auth, ownership, rate-limit).
- [ ] Vitest unit tests for the chatbot tool (grouping by stage, filtering).
- [ ] Playwright e2e: add an application, see it appear, filter, delete, gone.
- [ ] Verification gates green.

## Out of scope

- **No deadlines reminder/Inngest scheduler.** Deadlines are stored but no notifications fire. Future unit.
- **No bulk import.** Single-record CRUD only.
- **No analytics chart** (e.g. "your funnel: 30 applied → 8 interview → 2 offer"). Future enhancement.
- **No integration with calendar.** Interview events from Google Calendar (Unit 9) don't auto-attach to applications. Future.
- **No "discover firms to apply to" suggestions.** That's a different feature.

## Data model changes

If the `applied_jobs` table still exists in Supabase (it should — Unit 1 only deleted application code, not DB rows), schema is roughly:

```ts
// lib/db/schema/applied-jobs.ts
export const appliedJobs = pgTable("applied_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  firm: varchar("firm", { length: 200 }).notNull(),
  role: varchar("role", { length: 200 }).notNull(),
  stage: varchar("stage", { length: 32 }).notNull(), // enum-via-check
  url: text("url"),
  deadline: date("deadline"),
  notes: text("notes"),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Plus RLS: `USING (user_id = auth.uid())` + `WITH CHECK (user_id = auth.uid())`. Verify policies exist; add if missing.

Stage enum (Zod): `["shortlist", "applied", "interview", "superday", "offer", "rejected"]`.

## Surfaces affected

| Path | Change |
|---|---|
| `app/(app)/tools/applications/page.tsx` | New — server component, lists user's applications |
| `app/(app)/tools/applications/actions.ts` | New — `createApplicationAction`, `updateApplicationAction`, `deleteApplicationAction` |
| `app/(app)/tools/applications/_components/application-form.tsx` | New — client form using react-hook-form + Zod |
| `app/(app)/tools/applications/_components/application-row.tsx` | New — single row with inline edit |
| `app/(app)/tools/applications/_components/stage-filter.tsx` | New — URL-state chips |
| `lib/db/schema/applied-jobs.ts` | New — Drizzle schema |
| `lib/db/queries/applications.ts` | New — `getApplications`, `createApplication`, `updateApplication`, `deleteApplication` |
| `lib/ai/assistant-tools.ts` | Modify — re-add `get_applied_jobs` tool (now uses Drizzle query) |
| `components/app-nav.tsx` | Modify — add "Applications" sidebar entry under the Tools section |
| `lib/ratelimit/limiters.ts` | Modify — `applicationsLimiter` (cheap, generous limit) |
| `tests/unit/lib/db/queries/applications.test.ts` | New |
| `tests/unit/lib/ai/assistant-tools.test.ts` | Modify — re-add `get_applied_jobs` cases |
| `tests/e2e/applications.spec.ts` | New |

## AI prompts and tool definitions

Re-add to `ASSISTANT_TOOLS`:

```ts
{
  name: "get_applied_jobs",
  description: "List jobs the user has applied to, optionally filtered by stage.",
  input_schema: {
    type: "object",
    properties: {
      stage: {
        type: "string",
        enum: ["shortlist","applied","interview","superday","offer","rejected"],
        description: "Only return jobs at this stage.",
      },
    },
    required: [],
  },
}
```

Execute handler returns `{ count, byStage }` where `byStage` is grouped. Same as deleted version, but the implementation now goes through `lib/db/queries/applications.ts` instead of the legacy raw-Supabase data layer.

## Edge cases

- **Deadline in the past:** accept it (user may be tracking historical applications). No warning.
- **URL invalid:** Zod URL validation; reject at the boundary.
- **Stage transitions:** any → any allowed. No state machine enforcement (e.g. you can move from "offer" back to "applied" if the offer fell through).
- **Duplicate (firm, role):** allowed. Users may have multiple roles at a firm.
- **Notes length:** cap at 5000 chars to prevent abuse.
- **Empty stage filter:** return all stages.
- **Chatbot tool when user has zero applications:** return `{ count: 0, byStage: {} }`, not an error.

## Dependencies on other units

- Unit 3 (Drizzle wrap) — uses the new Drizzle schema + query pattern.
- Unit 4 (auth UI + middleware) — `requireUser()` and middleware.
- Unit 5 (IA refactor) — `/tools/*` URL space exists; sidebar Tools section exists.
- Unit 6 (Server Action pattern proof) — `createApplicationAction` follows the same pattern.

(So Unit 7 starts after Unit 6 lands.)

## Verification and test plan

- **Demo path:**
  1. Sign in.
  2. Click "Applications" in sidebar.
  3. Click "Add application" → fill firm, role, stage=applied → submit.
  4. Row appears in list.
  5. Click stage filter "interview" → row hides; "applied" → row shows.
  6. Edit stage to "interview"; row moves between filter views.
  7. Delete row; row disappears.
  8. Open chatbot, ask "what's my application status?"; chatbot calls `get_applied_jobs`, returns the row.
- **Tests:**
  - Vitest: Zod schema rejects invalid URLs, missing firm, etc.
  - Vitest: `createApplicationAction` returns `UNAUTHORIZED` when called without a session.
  - Vitest: queries respect `user_id` (no row leakage between users — use two-user fixture).
  - Vitest: `get_applied_jobs` tool groups by stage correctly + filters when stage provided.
  - Playwright: full demo path above.

## Open questions

- **Sidebar label:** "Applications" or "Application Tracker"? **Recommendation:** "Applications" — shorter, matches the URL.
- **Where does the chatbot tool re-emerge?** Unit 8 rebuilds the chatbot. Unit 7 re-adds the tool but the active chatbot UI doesn't exist until Unit 8. Two options: (a) restore the legacy embedded chat-panel registration of the tool until Unit 8 lands, or (b) just register the tool in `assistant-tools.ts` and wire it through in Unit 8. **Recommendation:** option (b) — tool definition lives in `assistant-tools.ts` ready for Unit 8; legacy chat-panel can also consume it but no extra wiring required.
- **Does this come before Q-Bank?** Q-Bank was originally Unit 7 (the "first net-new feature"). Application Tracker is simpler and more obviously valuable. **Recommendation:** Application Tracker becomes the new Unit 7, Q-Bank shifts to Unit 8 (and Chatbot rebuild to Unit 9, etc.). Renumber across the backlog.

## References

- Scope addition: `project-overview.md` §In Scope → Application Tracker
- Server Action skeleton: `code-standards.md` §Next.js → 7-step skeleton
- Drizzle query pattern: `code-standards.md` §Data Access
- Sidebar IA: `ui-context.md` §Layout Patterns; `architecture.md` §System Boundaries
- progress-tracker.md Unit 7 entry
