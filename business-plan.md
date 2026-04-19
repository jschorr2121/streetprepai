# Street Prep AI — Business Plan

> Companion to `product-description.md` (functional spec), `CLAUDE.md` (technical reference), and `pricing-analysis.md` (unit economics deep-dive). This file covers the operational plan to turn the product into a real business: legal setup, distribution, pricing, defensibility, hiring, funding, metrics, and the 12-month operating calendar.

Last updated: 2026-04-18.

---

## Part A — Finishing the product (technical roadmap)

The product itself is mid-build. Phase 0 (prototype) is shipped; Phases 1 and 2 turn it into the version that can carry a business.

### Where we are today
Next.js app deployed to Vercel. 30+ MDX guides. Seven AI flows wired against real Claude (lens explain + beginner rewrite + chat + person prep + chat structuring + follow-up draft + firm prep). Everything else is a UI shell or seed data.

### Phase 1 — MVP (weeks 5–12, the version that takes money)

**Foundation work (do first; unblocks everything else):**
1. **Real auth** — Supabase Auth, email + Google OAuth.
2. **Database** — migrate the seed-TS layer to Drizzle + Postgres. Schema is already designed in the technical plan.
3. **RLS policies** — every row scoped to `user_id = auth.uid()` except guides / jobs / public mentor listings.
4. **Stripe checkout + customer portal** — Pro Monthly + Season Pass + webhook handlers + plan-gating middleware.
5. **Cost telemetry** — `llm_usage` table populated on every Claude call. Weekly dashboard. Without this you can't price the Free tier honestly.
6. **Posthog + Upstash rate limiting** — tiered by plan.

**De-stub the 12 pillars (priority order):**
7. **Mock Interview Studio** — `MediaRecorder` → Supabase Storage → Whisper → Claude scoring (Opus + tool use). Audio analysis (WPM, fillers, pause ratio) for delivery score. *This is the demo centerpiece — it has to work.*
8. **Resume Coach** — PDF upload → side-by-side bullet rewrite → apply-all.
9. **Progress + flashcards** — wire to real signals (mock scores, flashcard accuracy, time-on-section). Build the mastery taxonomy JSON tree once. Spaced-repetition queue. "Top 3 gaps" widget on the dashboard.
10. **Relationship Memory full build** — Google Calendar OAuth (read-only), pgvector embeddings, semantic-recall surfacing at firm-page load, outreach assistant with scheduled follow-ups, voice chat capture via Whisper.
11. **Job scraper** — Playwright on Vercel Cron for top 30 firms' public career pages + Greenhouse/Ashby APIs where available. Claude enrichment pass for tags. Don't touch LinkedIn or Handshake.
12. **Firm pages** — live SEC EDGAR ingest for top 60 firms, weekly cache refresh.

**Content:**
13. Grow library to **40–60 guides** (currently 32). Use the AI-assisted authoring workflow (Claude expands outlines you draft, you edit line-by-line).
14. **SME review** — pay 2 current analysts ~$500 each to review every technical guide before charging. This is the quality moat and the biggest credibility risk.

**MVP done gate:** all verification checks in the technical plan pass against real Claude with real users.

### Phase 2 — V1 (months 4–6, the "fully finished" version)

- **Mentor marketplace** — onboarding, Calendly-style scheduling, Stripe Connect for revenue-share escrow, KYC via LinkedIn + work email.
- **Community forum** — invite-only, moderated. Consider Circle vs custom.
- **Mobile PWA polish** — verify all flows usable at 375px.
- **Firm-specific deep guides** — real analyst intel, not generic.
- **University B2B pilot** — 1–2 career centers (see §6 below).
- **Quick wins from `ideas-backlog.md`:** Deal of the Week (#1), Smart Flashcards from highlights (#6), Anxiety/Delivery Coach mode (#9), Story Graph (#4), Why-this-firm generator (#3), Referral Flywheel (#15). All cheap, high-engagement.

---

## Part B — Building the business

The recruiting calendar is the real constraint. IB SA recruiting peaks Aug–Feb. Today is 2026-04-18 — roughly **4 months until the next cycle**. Plan backwards from August.

### 1. Legal / financial setup (do in next 2 weeks — blocks everything)

- **Form a Delaware C-corp** if there's any chance of raising; LLC if pure bootstrap. C-corp is the safer default — converting later is painful.
- **Stripe Atlas** for one-stop incorporation (~$500).
- **Terms of Service + Privacy Policy** — required for Stripe and Google OAuth verification. Use Termly or pay a lawyer ~$1.5k. **Critical:** explicit "we never train on user data" clause. The Relationship Memory promise depends on it.
- **Data handling:** decide an encryption-at-rest strategy for `personal_notes`. Document a deletion / export flow. FERPA-adjacent territory if you ever sell to universities.
- **Domain + business email** on a real address (not personal Gmail).
- **Business bank account + bookkeeping** — Mercury + Pilot, or QuickBooks self-employed for now.

### 2. Pre-launch distribution validation (parallel with MVP build, May–July)

The single highest-leverage thing currently not happening. Plan:

- **Standalone landing page with email waitlist.** Goal: **500 signups before August.**
- **Channels in priority order:**
  1. **Target school finance clubs** — DM IB society presidents at top-20 targets (Wharton, Stern, Ross, Booth UG, etc.) offering free Pro for the club. Warm wedge.
  2. **r/FinancialCareers + r/wallstreetoasis** — post the live demo. Reading Lens is unique enough to travel.
  3. **WSO threads** — answer questions, link to demo where genuinely helpful. Don't spam.
  4. **TikTok / Instagram** — short demos of the highlight-to-explain interaction. Visual is good.
  5. **LinkedIn** — your network if you have IB connections; else cold-message rising sophomores at targets.
- **Pre-sell 10 Season Passes at $99 (early-bird)** before the product is fully built. The only signal that genuinely de-risks pricing. If 10 students won't pay $99 to a stranger, the $149 list price is wrong.

### 3. Pricing validation

- **30 student interviews.** Ask what they paid for BIWS / WSP / Peak Frameworks. Ask what they'd pay for Street Prep AI.
- **Season Pass framing matters more than the number** — undergrads buy cycles, not subscriptions. Hit this hard in marketing copy.
- **$29/mo is on the high end for students.** Consider $19/mo with a clearer Season Pass discount (e.g., $19/mo or $99 for the cycle).
- **Free tier needs to be useful but obviously partial** — 3 guides is too few. Full access for 7 days is more standard.
- See `pricing-analysis.md` for the unit-economics deep-dive (model routing strategies, gross margins, scale modeling).

### 4. Unit economics — don't ship before this is real

- Per-Pro-user LLM cost target: **$2–4/month**. Free tier: $0.20–0.50.
- Mock Interview is the cost risk — Opus 4.7 scoring + Whisper transcription. Cap Pro at ~30/month; charge overage above.
- **Build the LLM cost dashboard week 1 of MVP work**, not last. Spot a 10x cost regression in days, not in next month's Anthropic bill.
- Stripe fees, Vercel, Supabase, Whisper — model gross margin by tier. Target ≥75% on Pro.
- Full breakdown lives in `pricing-analysis.md`.

### 5. Defensibility — what stops BIWS or WSO from copying this?

Be honest: BIWS could bolt AI onto their PDFs in a quarter. The real moats:

- **Relationship Memory data lock-in** — the longer a user has it, the more painful to switch. The real moat. **Marketing should lead with this**, not the lens.
- **Modern UX + iteration speed** — incumbents have legacy codebases and don't ship.
- **Vertical AI integration** — caching, model routing, scoring rubrics tuned to IB. Hard to replicate in a quarter without rebuilding.
- **Community + interview-report data flywheel** — Phase 2, but starts to compound.

What is *not* a moat: the content library. You can be matched there. Don't bet defensibility on it.

### 6. B2B — the second engine (start outreach in October)

The B2C cycle is seasonal. B2B career-center deals smooth cash flow and have higher LTV.

- **Target:** non-target school career centers first (Penn State, Indiana Kelley, UVA McIntire). Underserved, hungrier, decision-makers reachable.
- **Pricing:** $5–15k/school/year for unlimited student licenses (see `pricing-analysis.md` for the model).
- **Sales cycle:** 3–6 months. Start outreach in October so deals close for spring semester.
- **Offer one free pilot** at a school where you have an alumni connection — case study for the next 10 sales calls.

### 7. Funding decision (decide by July)

Two clean paths:

- **Bootstrap:** ship MVP June, charge in August, fund growth from revenue. Slower, you keep 100%, recruiting cycle is your runway. Realistic if personal runway ≥12 months.
- **Pre-seed raise ($300k–750k SAFE):** target edtech/AI angels and small funds (Reach Capital, GSV, edtech-friendly angels). Useful if you want to hire a content lead + a designer before August. Realistic if you have founder credibility (school, prior IB experience, prior shipped product).
- **Don't raise unless you have a concrete plan for the money.** Bootstrap-then-raise after the first cycle (Feb 2027) is often best — you'll have real revenue and retention numbers.

### 8. Hiring plan (in order of impact)

1. **Content lead / part-time IB analyst** ($2–4k/month or equity) — owns guide quality, SME network, interview-report curation. **First hire.**
2. **Designer** (contract, $5–10k) — landing page polish + brand for launch. Critical because incumbents look dated and yours needs to look obviously better.
3. **Growth / community marketer** — only after launch when you've proved channels work.
4. **Engineer** — only when you're past your own velocity ceiling, probably post-Series A.

### 9. Metrics that matter (track from day 1)

- **Pre-launch:** waitlist signups, waitlist → Season Pass pre-sale conversion, demo session length.
- **Launch:** Season Pass sell-through by week, Free → Pro conversion, weekly active users, mock interviews per active user, **Relationship Memory retention** (do users come back to log chats? — this is the real moat signal).
- **Operational:** per-user LLM cost, gross margin by tier, Anthropic bill week-over-week.

### 10. 12-month operating plan, mapped to the recruiting calendar

| Month | Build | Business |
|---|---|---|
| Apr–May 2026 | MVP foundation (auth, Stripe, DB) | Legal entity, ToS, landing page live, start club outreach |
| Jun 2026 | MVP feature de-stub (Mock, Resume, Progress) | 30 user interviews, pricing test, 250 waitlist |
| Jul 2026 | Relationship Memory full build, content to 40 guides, SME review | 500 waitlist, pre-sell 10 Season Passes at $99 |
| **Aug 2026** | **MVP launch** | **Season Pass on sale, paid acquisition test ($1k budget)** |
| Sep–Oct 2026 | Bug bash, conversion-rate optimization, ideas-backlog quick wins | First 100 paying users; start B2B outreach to 20 career centers |
| Nov–Dec 2026 | Phase 2 work begins (mentor marketplace) | Recruiting peak — listen, ship fixes weekly |
| Jan–Feb 2027 | Phase 2 features ship | First B2B pilots close for spring; cycle review with users |
| Mar–Apr 2027 | Off-season: content production, mobile PWA polish | Decide funding question with real numbers in hand |

---

## What to do this week

1. **Form the C-corp** (Stripe Atlas, ~1 hour).
2. **Stand up the landing page waitlist** with real email collection (Resend + Supabase, half a day).
3. **List the 20 target school finance clubs** and start writing the outreach DM (afternoon).
4. **Start building Supabase auth + Stripe** — the longest poles on the Phase 1 critical path.

---

## Open strategic questions

- Bootstrap vs raise — depends on personal runway, which only Jake knows.
- Whether to launch with the Season Pass only (forcing the framing) or alongside Pro Monthly.
- Whether B2B (career centers) is the second engine or the *primary* engine if the C-corp can land 5 schools by spring.
- International expansion timing — London + HK have meaningfully different recruiting calendars and different product needs.
- Whether the mentor marketplace is core to the product or a distraction (high ops overhead, KYC risk, marketplace cold-start problem).
