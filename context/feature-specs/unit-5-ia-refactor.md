# Unit 5 — IA refactor (spine + tools)

> Status: Draft
> Last updated: 2026-05-19
> Owner: Jake

## User-visible behavior

The sidebar nav and URL structure shift from a flat feature menu to the **learning flow as the spine + tools layered on top** model defined in `architecture.md`. Specifically:

1. The Library becomes the **Learn** spine.
2. Tools (Story Framer, Resume Coach, Mock Interview, Relationships, Question Bank, Chatbot) all live under `/tools/<name>` instead of as flat siblings.
3. New top-level surfaces appear in the sidebar: **Sectors**, **Chatbot** (placeholder route).
4. The sidebar order matches `ui-context.md`: Dashboard → Learn → Tools → Firms → Sectors → Profile → Progress.

This unit ships URL renames and sidebar reorganization. **No new logic.** Page contents stay identical.

## Acceptance criteria

- [ ] `/library` reachable as `/learn` (legacy `/library` either redirects or 404s — see open questions).
- [ ] `/interview` reachable as `/tools/mock-interview`.
- [ ] `/story-framer` reachable as `/tools/story-framer`.
- [ ] `/resume` reachable as `/tools/resume-coach`.
- [ ] `/relationships` reachable as `/tools/relationships`.
- [ ] `/tools/question-bank` exists as a placeholder page ("Coming soon" or similar) — first real implementation is Unit 7.
- [ ] `/tools/chatbot` exists as a placeholder page — first real implementation is Unit 8.
- [ ] `/sectors/[slug]` exists as a placeholder route — first real content is Unit 18.
- [ ] Sidebar in `components/app-nav.tsx` shows: Dashboard, Learn, Tools (collapsible or section header), Firms, Sectors, Profile, Progress. Tools section lists all six tools.
- [ ] All in-app links (any `<Link href="/...">` referencing the old paths) updated.
- [ ] All API routes unchanged (`/api/lens/explain` etc. keep their paths).
- [ ] Verification gates green.

## Out of scope

- **No logic changes** to any page. This is a routing + navigation refactor only.
- **No rebuild of the chatbot** — Unit 8 does the standalone tool-using chatbot. This unit just creates the route shell.
- **No rebuild of the Question Bank** — Unit 7. Same: placeholder route only.
- **No sector content** — Unit 18.
- **No new Server Actions** introduced.
- **No styling changes** beyond what the sidebar reorganization requires.
- **No URL changes for API routes** (`/api/...` paths stay identical).

## Data model changes

None.

## Surfaces affected

### Route renames

| From | To | Notes |
|---|---|---|
| `app/(app)/library/page.tsx` | `app/(app)/learn/page.tsx` | Rename |
| `app/(app)/guide/[slug]/page.tsx` | `app/(app)/learn/[chapter]/[section]/page.tsx` *or* keep `/guide/[slug]` until Unit 21 reorganizes content | **Open question** |
| `app/(app)/interview/*` | `app/(app)/tools/mock-interview/*` | Rename |
| `app/(app)/story-framer/*` | `app/(app)/tools/story-framer/*` | Rename |
| `app/(app)/resume/*` | `app/(app)/tools/resume-coach/*` | Rename |
| `app/(app)/relationships/*` | `app/(app)/tools/relationships/*` | Rename (subtree: `[contactId]`, `new`) |

### New routes (placeholders)

| Path | Content |
|---|---|
| `app/(app)/tools/question-bank/page.tsx` | "Coming soon — Unit 7" placeholder |
| `app/(app)/tools/chatbot/page.tsx` | "Coming soon — Unit 8" placeholder |
| `app/(app)/sectors/page.tsx` | List of sectors (statically rendered, eight cards) |
| `app/(app)/sectors/[slug]/page.tsx` | "Coming soon — Unit 18" placeholder |

### Components affected

| Path | Change |
|---|---|
| `web/components/app-nav.tsx` | Replace flat nav array with grouped: Dashboard, Learn, then a "Tools" section header, then the six tool links, then Firms / Sectors / Profile / Progress |
| All in-app link references | Find/replace `/library`→`/learn`, `/interview`→`/tools/mock-interview`, etc. |

## AI prompts and tool definitions

N/A.

## Edge cases

- **External links / SEO:** the marketing landing page and any external docs may link to `/library`, `/interview`, etc. **Open question — see below.** Default plan: add `next.config.ts` redirects for the old paths so external links don't 404.
- **Bookmarks** users may have for old URLs → redirect (above).
- **Deep links in past prep sheets / follow-up emails:** if any persisted content embeds links to old paths, the redirect catches them.
- **`/guide/[slug]` links inside MDX content** that reference other guides: grep and update if we rename the route. If we keep `/guide/[slug]` for now (deferred to Unit 21), no change needed.

## Dependencies on other units

- Unit 4 (auth UI + middleware) is a prerequisite if we want middleware-based redirects. Not strict — Next.js `redirects()` in `next.config.ts` works without middleware.

## Verification and test plan

- **Demo path:**
  1. Sign in, hit each old URL (`/library`, `/interview`, `/story-framer`, `/resume`, `/relationships`) — confirm redirect to new path.
  2. Sidebar shows the new order/grouping.
  3. Every page renders identically to before the refactor.
  4. Placeholder pages render their "Coming soon" content.
- **Tests:**
  - Playwright: assert each old URL 301-redirects to the new URL.
  - Playwright: assert sidebar nav contains the expected items in the expected order.
  - No new Vitest tests (no new logic).
- **Verification gates** per `ai-workflow-rules.md`.

## Open questions

- **Reader URL path (`/guide/[slug]`):** rename to `/learn/[chapter]/[section]` now or defer to Unit 21 (chapter content reorg)? **Recommendation:** **defer.** The chapter structure isn't built yet; renaming the URL without the underlying restructure is cosmetic and would just create a second move later. Keep `/guide/[slug]` working; route the new `/learn` page to show the chapter list (using the existing library page logic) until Unit 21 lands the full IA.
- **Old paths: redirect or 404?** **Recommendation:** redirect via `next.config.ts` for 90 days, then drop. The cost is tiny; the upside is no broken external links.
- **Tools section in sidebar — group header or first-class items?** **Recommendation:** section header with a small label ("Tools") and the six items underneath, **not collapsible** (collapsibility is a feature, not necessary now). Matches the spine + tools mental model.

## References

- System Boundaries (routes): `architecture.md` §System Boundaries → Routes
- Sidebar nav rule: `ui-context.md` §Layout Patterns → Signed-in app shell
- progress-tracker.md Unit 5 entry
