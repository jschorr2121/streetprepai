# UI Context — "The Analyst's Desk"

Design language for Street Prep AI. Rewritten 2026-07-06 as part of the full UI revamp
on `design/ui-overhaul`. This supersedes the previous "modern edtech" spec and the
abandoned "ink" direction (archived at tag `archive/ink-design`).

## 1. The idea

The user is a 19–21-year-old who wants a seat at Goldman and lives in Notion, Linear,
and Superhuman. Every competitor looks like 2009 forum software; every AI-generated
app looks like the same shadcn template. We do neither.

**Direction: printed prospectus meets modern instrument.** The visual language of the
documents bankers actually produce — ruled ledgers, indexed sections, serif display
type, monospaced figures — executed with the restraint and speed of a modern software
tool. It should feel like the desk of an analyst who is very good at their job: paper,
ink, one decisive color, nothing moving unless it means something.

Concretely, distinctiveness comes from four motifs, not from loud color:

1. **Indexed structure.** Sections and chapters carry mono uppercase index labels
   (`02 / NETWORKING`). The product is a course with a spine — number it like a
   prospectus table of contents.
2. **Ruled surfaces, not floating cards.** Hairline rules and background shifts
   organize the page. Shadows are reserved for true overlays (popover, dialog, sheet).
3. **Serif conviction.** Page titles and editorial moments are set in Newsreader.
   UI chrome stays grotesk. The pairing is the brand.
4. **Ledger data.** Numbers, dates, timers, scores, tickers are always mono,
   tabular, right-aligned in tables. Data looks like a deal book, not a SaaS widget.

## 2. Type

Loaded via `next/font/google` in `app/layout.tsx`:

| Role | Font | Token | Usage |
|---|---|---|---|
| Display serif | **Newsreader** (variable, w 400–700, ital) | `font-serif` | h1/h2 page titles, landing headlines, blockquote accents. Tracking slightly tight (`-0.01em`). Italic for single-word emphasis only. |
| UI sans | **Schibsted Grotesk** (variable, w 400–700) | `font-sans` | Everything else: body, nav, buttons, forms. |
| Mono | **IBM Plex Mono** (400/500/600) | `font-mono` | Index labels, eyebrows, numerals, dates, timers, scores, code, metadata rows. |

Scale: Tailwind defaults (`text-xs` … `text-5xl`), no arbitrary sizes. Body UI is
`text-sm` (14px); reading content is 17px via `.prose-guide`. Mono eyebrows are
`text-[11px] uppercase tracking-[0.14em]` — the single sanctioned arbitrary size
(exposed as the `.eyebrow` utility class in globals.css).

## 3. Color

Light mode only (dark token block deleted; `next-themes` unused). All tokens OKLCH,
warm-paper neutrals + blue-black ink + one accent.

| Token | Value | Meaning |
|---|---|---|
| `--background` | `oklch(0.978 0.005 90)` | Paper. Warm, unmistakably not-white. |
| `--foreground` | `oklch(0.22 0.015 264)` | Ink. Blue-black, never pure black. |
| `--card` | `oklch(0.992 0.003 90)` | Raised paper — one step lighter, hairline-bordered. |
| `--primary` | `oklch(0.44 0.13 262)` | **Prospectus blue.** Deep ultramarine. The only brand color. Buttons, links, active states. |
| `--primary-foreground` | `oklch(0.985 0.003 90)` | Paper on blue. |
| `--secondary` | `oklch(0.945 0.008 90)` | Pressed paper (secondary buttons, chips). |
| `--muted` | `oklch(0.955 0.006 90)` | Recessed bands, table headers. |
| `--muted-foreground` | `oklch(0.50 0.012 264)` | Supporting text. |
| `--accent` | `oklch(0.93 0.02 262)` | Pale blue wash — hovers, selected rows. |
| `--accent-foreground` | `oklch(0.30 0.06 262)` | Text on accent. |
| `--destructive` | `oklch(0.53 0.19 25)` | Market red. Errors, deletes, "down". |
| `--success` | `oklch(0.52 0.11 155)` | Market green. Confirmations, "up". Never decorative. |
| `--warning` | `oklch(0.66 0.13 75)` | Amber. Deadlines, cautions. |
| `--border` / `--input` | `oklch(0.895 0.008 90)` | Hairlines. |
| `--ring` | `oklch(0.44 0.13 262)` | Focus ring = primary. |
| `--highlight-yellow/green/blue` | kept | Reading Lens selections only. |

Rules: tokens only — no Tailwind palette classes (`bg-emerald-500`) and no hex in
components. Stage/status colors map to `success`/`warning`/`destructive`/`primary`
— the old amber/rose/emerald literals are gone. Up/down market semantics may pair
`success`/`destructive` but always with a second signal (arrow, label).

## 4. Shape, depth, spacing

- `--radius: 0.375rem` (6px). Sharper corners; instrument, not bubble. Chips/badges
  square-ish (`rounded-sm`), never pills — except avatars.
- Shadows: none on in-flow surfaces. `shadow-md` on popovers/menus, `shadow-lg` on
  dialogs/sheets. That's the entire elevation system.
- Spacing on the 4px scale. Page gutters `px-6 md:px-10`, content max-widths:
  reading 68ch, forms `max-w-2xl`, dashboards `max-w-6xl`.
- Data density is a virtue: tables over card grids where rows compete (applications,
  contacts, question banks).

## 5. Motion

- 120–200ms, `ease-out`, opacity/transform only. Nothing ambient, nothing on loop.
- Streaming AI text keeps the caret-blink cursor (semantic: "the model is speaking").
- `prefers-reduced-motion` kills everything.

## 6. Components

- shadcn/ui primitives in `components/ui/*`, edited in place to this language —
  never wrapped.
- Shared chrome: `components/page-header.tsx` (`PageHeader` — mono index eyebrow +
  serif title + supporting line) replaces the per-page hand-rolled headers.
- Sidebar (`app-nav.tsx`): paper surface, hairline right rule, mono group labels,
  active item = primary text + 2px left rule. Build states surface in the nav:
  unbuilt tools carry a mono `SOON` tag.
- Icons: lucide only, `size-4` default, stroke 1.75, `aria-hidden` when decorative.

## 7. Content honesty

The landing page carries no fabricated numbers, no fake testimonials, no invented
placement rates. A prototype introduces itself as one — the credibility play is the
live product demo (Lens excerpt, real chapter index), not social proof we don't have.

## 8. Hard layout invariants (unchanged)

- Reading Lens: natural page scroll for the center column; rails are
  `sticky top-0 h-screen`. Never `flex h-screen overflow-hidden` with nested
  ScrollArea.
- Mock Interview Studio gets full-bleed treatment distinct from single-column tools.
- Auth-gated shells unchanged; onboarding gate middleware untouched by the revamp.
