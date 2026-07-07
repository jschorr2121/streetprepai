# UI Context

## Theme

**Light mode only.** No dark mode in phase 1.

The visual language is **modern edtech with finance gravity**: light, calm, off-white background; emerald primary that signals growth/trust without leaning either too "fintech" or too "school"; rounded cards on white surfaces; restrained typography; subtle shadows. The product should feel like a serious tool a sophomore can grow into, not a toy or a sales funnel.

Hierarchy comes from **whitespace and weight**, not color saturation. Color appears at moments of action (CTAs, badges, the primary highlight on a heading) and recedes everywhere else. Cards use a hairline border + faint shadow on hover rather than heavy shadows.

Selection highlights and inline AI explanations are the one place we use vivid color (the Reading Lens uses `--highlight-yellow` on highlighted prose).

## Colors

All components must use these tokens. No hardcoded hex values in component code. Tokens are defined as CSS custom properties in `app/globals.css` and exposed to Tailwind via `@theme inline`.

| Role                  | CSS Variable               | Value                            | Notes                                        |
| --------------------- | -------------------------- | -------------------------------- | -------------------------------------------- |
| Page background       | `--background`             | `oklch(0.995 0.002 90)`          | Warm off-white, ~`#fafaf7`                   |
| Surface (cards)       | `--card`                   | `oklch(1 0 0)`                   | Pure white                                   |
| Primary text          | `--foreground`             | `oklch(0.16 0.01 270)`           | Near-black with cool tint                    |
| Muted text            | `--muted-foreground`       | `oklch(0.48 0.01 270)`           | Body sub-text, captions, labels              |
| Primary accent        | `--primary`                | `oklch(0.55 0.15 160)`           | Emerald `#047857`                            |
| Primary on accent     | `--primary-foreground`     | `oklch(0.99 0 0)`                | White                                        |
| Soft accent surface   | `--accent`                 | `oklch(0.94 0.02 160)`           | Pale emerald tint for feature-icon backplates |
| Soft accent fg        | `--accent-foreground`      | `oklch(0.22 0.04 160)`           | Deep emerald, used on `--accent` backplates  |
| Border                | `--border`                 | `oklch(0.92 0.005 90)`           | Hairline border on cards, dividers           |
| Input border          | `--input`                  | `oklch(0.92 0.005 90)`           | Same as border                               |
| Focus ring            | `--ring`                   | `oklch(0.55 0.15 160)`           | Emerald                                      |
| Error                 | `--destructive`            | `oklch(0.62 0.22 25)`            | Warm red                                     |
| Error fg              | `--destructive-foreground` | `oklch(0.99 0 0)`                | White                                        |
| Reading Lens — yellow | `--highlight-yellow`       | `oklch(0.95 0.12 95)`            | Default highlight color                      |
| Reading Lens — green  | `--highlight-green`        | `oklch(0.92 0.14 160)`           | Selection highlight                          |
| Reading Lens — blue   | `--highlight-blue`         | `oklch(0.93 0.08 235)`           | Annotation marker                            |

**Rule:** any new color must be added here first. Don't reach for `bg-zinc-500` or `text-slate-700` in components — use the token.

## Typography

| Role             | Font          | Variable        | Notes                                          |
| ---------------- | ------------- | --------------- | ---------------------------------------------- |
| UI / body / headings | Geist Sans  | `--font-sans`   | Loaded via `next/font/google`; tabular numerals enabled |
| Code / monospace | Geist Mono    | `--font-mono`   | Used in DCF outputs, code, IDs                 |
| Serif fallback   | iA Writer Quattro → Charter → Iowan Old Style → Georgia | `--font-serif` | Available for the rare editorial moment; not the default |

**Scale (from `.prose-guide`):**

| Element | Size       | Weight | Letter-spacing |
| ------- | ---------- | ------ | -------------- |
| h1      | 1.875rem   | 600    | -0.01em        |
| h2      | 1.375rem   | 600    | -0.005em       |
| h3      | 1.125rem   | 600    | 0              |
| Body    | 1.0625rem  | 400    | 0              |
| Line-height (prose) | 1.7 |        |                |
| Prose max-width     | 68ch |       |                |

Marketing hero h1 goes larger: `clamp(2.25rem, 5vw, 3.75rem)` with `tracking-tight` (~`-0.025em`).

## Border Radius

`--radius` base = `0.75rem`. Derived scale:

| Token         | Class           | Value             | Used for                                    |
| ------------- | --------------- | ----------------- | ------------------------------------------- |
| `--radius-sm` | `rounded-sm`    | `calc(0.75 - 4)`  | Inputs, small badges, list-item highlights  |
| `--radius-md` | `rounded-md`    | `calc(0.75 - 2)`  | Buttons, small cards, icon backplates       |
| `--radius-lg` | `rounded-lg`    | `0.75rem`         | Default for cards and panels                |
| `--radius-xl` | `rounded-xl`    | `calc(0.75 + 4)`  | Hero cards, large feature cards, modals     |
| `rounded-full` | —              | `9999px`          | Avatars, pill badges                        |

## Component Library

**shadcn/ui (`new-york` style) on Tailwind v4.** All primitives live in `components/ui/` and are added via the shadcn CLI rather than written from scratch:

```bash
pnpm dlx shadcn@latest add <component>
```

When customizing a shadcn component, edit the file in `components/ui/` directly — do not wrap it. Do not add a sibling abstraction layer ("our Button"); if Button needs new behavior, change Button.

**Building product UI:** compose from shadcn primitives plus tokens. Custom feature-specific components (Reading Lens, mock-interview recorder, prep-sheet, etc.) live in `components/learn/`, `components/tools/*/`, or `components/shared/` — never in `components/ui/`.

## Layout Patterns

- **Marketing pages** — single column, `max-w-6xl mx-auto px-6`, sticky top nav (height 64px, hairline border-b, backdrop blur). Sections separated by `border-t` and alternating `bg-muted/30` background.
- **Signed-in app shell** — fixed-left sidebar (width 240–280px, hairline border-r) + main content area. Sidebar holds nav (Dashboard, Learn, Tools, Firms, Sectors, Profile, Progress). Main area is page-scrollable; the sidebar is fixed.
- **Chapter reader (Reading Lens) — 3-column** — **do not** use `flex h-screen overflow-hidden` with nested `ScrollArea`. Use natural page scroll for the center column; `sticky top-0 h-screen` for left and right rails.
  - Left rail (`hidden xl:block w-64 shrink-0 border-r`) → inner `sticky top-0 h-screen flex flex-col` — chapter outline.
  - Center (`flex-1 min-w-0`) → `max-w-2xl mx-auto px-6 py-10` — reading content with `.prose-guide` typography. **Natural flow, no fixed height.**
  - Right rail (`hidden md:block md:w-[380px] shrink-0 border-l`) → inner `sticky top-0 h-screen flex flex-col` — Reading Lens / Chat / Beginner Mode tabs.
- **Tool surfaces (Story Framer, Resume Coach, Mock Interview, Question Bank, Chatbot, Relationships)** — single content column inside the app shell, `max-w-4xl mx-auto px-6 py-8`. Tool-specific panels stack vertically; mock-interview recorder gets its own full-bleed treatment.
- **Firm and Sector pages** — `max-w-6xl mx-auto px-6 py-10`, hero block (firm logo + name + tier badge), then a 2/3–1/3 split: main panel (earnings, deals, intel, firm-specific Qs) + sticky right rail (chat-history-at-this-firm, prep-sheet CTA).
- **Dashboard** — 12-column grid at desktop. Recruiting Cycle Widget spans top-half-width on desktop; weak-areas + streak below as 2-column cards; upcoming events block on the right.
- **Modals** — centered overlay with `backdrop-blur-sm`, modal card uses `rounded-xl border bg-card shadow-lg`, max-width matches the content (sm/md/lg variants per shadcn `Dialog`).
- **Forms** — shadcn `Form` + `react-hook-form` + Zod. Labels above inputs, error text below. No floating labels.
- **Empty states** — small centered illustration (lucide icon at 32px on `--accent` backplate, rounded-md), bold headline, single-sentence subhead, primary CTA.
- **Loading states** — skeletons in shadcn `Skeleton` for known shapes; spinner for action button submissions only. Streaming AI responses render token-by-token with a subtle cursor.

## Icons

**Lucide React.** Stroke-based, single style across the product.

| Context              | Class       | Size  |
| -------------------- | ----------- | ----- |
| Inline within text   | `size-3.5`  | 14px  |
| Form labels, captions | `size-4`   | 16px  |
| Button icon          | `size-4`    | 16px  |
| Sidebar nav          | `size-4`    | 16px  |
| Feature-card icon    | `size-4`    | 16px (on a `size-9 rounded-md bg-accent` backplate) |
| Empty-state illustration | `size-5` | 20px (on a larger `size-12` backplate)              |

**Rules:**
- Never mix icon families (no FontAwesome, no Material).
- Default stroke is Lucide's built-in (`stroke-current`); never override stroke width manually.
- Decorative icons get `aria-hidden`; meaningful icons get an accessible name via `aria-label` or accompanying text.

## Motion

- Default transition: `transition-all duration-200` for hover/focus state changes; never longer than 300ms for UI feedback.
- Card hover: subtle lift (`hover:-translate-y-0.5`) + border color shift to `var(--primary)/30` + soft shadow ramp.
- Streaming tokens: cursor blink at 1s interval; no other ambient animation.
- Reserved animation keyframes in `globals.css`: `--animate-ticker` (logo ticker on marketing), `--animate-float-card` (hero card). No new ambient animations without a deliberate reason — they distract from study.
- Reduced motion: respect `prefers-reduced-motion: reduce` — disable lift, ticker, and float; keep transitions at 0ms.
