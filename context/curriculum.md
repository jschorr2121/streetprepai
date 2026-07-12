# Street Prep AI — Curriculum & Learning Workflow

**Status:** Draft — for Jake's review
**Date:** 2026-07-12
**Inputs:** (1) content inventories of 30 PDFs in `extra_content/` (BIWS IB Interview Guide modules, M&I 400 Questions, personal question compilations, Maddy Kozower's prep binder); (2) web research on competitor curricula (BIWS/WSP/M&I/WSO/Peak Frameworks/10X EBITDA), the 2025–26 recruiting timeline, and learning science; (3) the locked 16-chapter skeleton in `project-overview.md`. Full extraction inventories live in the session scratchpad; this doc is the durable synthesis.

This doc resolves the progress-tracker open question "Chapter structure migration: how do the 32 MDX guides map to the 16 chapters?" — see §6.

---

## 1. Design principles

These are the findings the whole design hangs on:

1. **Every serious prep product uses the same technical spine** — Accounting → EV vs Equity Value → Valuation → DCF → M&A → LBO. The Kozower binder (a real successful candidate's self-made prep) independently converges on the identical order. Our spec's chapter order already matches. Don't innovate on sequence; innovate on *mechanics*.
2. **Fit comes early, never last.** Every vendor puts story/behavioral before or parallel to technicals; Kozower's binder opens with fit. Our spec already places Behavioral & Fit (ch. 7) before the technicals. Correct — keep it.
3. **Memorization is the #1 reported failure mode.** Interviewers probe past the first answer. The product must train *adaptive understanding*: follow-up trees, parameterized questions with random numbers, and interleaved mixed drills — not flashcard recall of scripted answers.
4. **The differentiation lane is what a PDF structurally can't do:** enforced retrieval practice after every section, spaced re-exposure the platform schedules for you, interleaving once a topic is past first exposure, mastery-gated progression (~85% before the next chapter unlocks), and — uniquely — a **published grading rubric**. Every AI-graded competitor (Superday AI, Cook'd, IB Mock, Final Round) is a black box; showing the rubric per answer is our credibility wedge.
5. **The timeline is brutal and personal.** Class-of-2027 BB apps opened Dec 2025 and closed within weeks; sophomore-summer prerequisites are now common. The curriculum must serve three entry speeds (see §5), anchored by the recruiting cycle widget.
6. **Learn / Drill / Mock are three modes, not one linear course.** Reading, retrieval practice, and simulated interviews are distinct activities with distinct surfaces. Chapters bundle all three (see §2), and the Q-bank + Mock Studio expose Drill/Mock standalone.
7. **Real-candidate workflow signals worth building** (from the Kozower binder + M&I interview checklist): a randomized "3-statement change" drill generator; a living **current-deals** section refreshed before each interview (her binder had blank placeholders for "recent M&A deal" — static content can't serve this); a fill-in-the-blank **pre-interview checklist** auto-assembled per interview.
8. **Brain teasers are fading** from modern guides (dropped from BIWS's newest edition; only 4 of M&I's 400 questions). Keep chapter 14 but slim it and center it on mental math that transfers (accretion/dilution arithmetic, paper-LBO IRR estimation), not riddles.

## 2. Chapter anatomy (uniform across all chapters)

Every chapter follows the same internal structure so the UI, progress model, and grading are consistent:

```
Chapter
├── Sections (3–8 per chapter)
│   ├── Reading (MDX; Reading Lens + Beginner Mode apply)
│   ├── Worked example(s) — step-by-step reveal (worked-example effect:
│   │   new topics OPEN with a fully worked solution, fading to unaided)
│   └── Section drill — 3–6 retrieval questions, AI-graded, fired
│       immediately after the reading (retrieval > re-reading)
├── Interactive tutorial (1+ per chapter; format per author: inline
│   exercise / worked walkthrough / AI socratic)
├── Tool exercise (chapters that teach a tool: guided first-use)
├── Chapter gate — mixed quiz over all sections, ~85% to pass;
│   passing marks the chapter complete and feeds the mastery model
└── Elective sections — advanced material excluded from the gate
    (marked ⭐ below); surfaced to users targeting PE/experienced tracks
```

After a chapter's gate is passed, its topics enter the **interleaved daily drill pool**: the Q-bank's spaced re-surfacing (weak items every 2–3 days, per spec) draws from *all* passed chapters mixed together, not the current chapter — interleaving beats blocking for transfer once past first exposure.

**Two chapter types:** *spine chapters* (linear, gated, ordered) and *reference chapters* (Firm Overviews, Sector Deep-Dives — browsable anytime, no gate, consumed just-in-time before networking calls and interviews). This resolves the awkwardness of "reading about 20 firms" blocking progress to technicals.

## 3. Chapter-by-chapter curriculum

Spine chapters in order. Sections marked ⭐ are elective/advanced (outside the gate).

### Ch 1 — Recruiting Cycle & Timeline
1. How recruiting actually works — the funnel: application/GPA screen → HireVue + numerical test → first rounds → superday (5–10 interviews) → fast offers (~30–40% superday conversion)
2. The calendar by class year — freshman exploration → sophomore-fall networking + sophomore-summer prerequisite reality → apps opening ~Dec/Jan two summers ahead → off-cycle/MM stragglers into July
3. Firm tiers — BB vs EB vs MM: what differs (deal type, pay, exits, culture) and what it means for *your* target list
4. Group types — M&A, LevFin, ECM/DCM, industry coverage; generalist vs direct-placement
5. **Build your plan** (interactive) — user confirms grad year/semester → generates their personal timeline → seeds the recruiting cycle widget
*Gate:* light quiz + completed personal plan.

### Ch 2 — How to Apply
1. Application mechanics — portals, rolling review reality ("day one or don't bother"), ATS/GPA filters
2. Building the target list — counts by tier, realistic reach/match/safety framing
3. Cover letters — when required, structure, what kills them
4. HireVue & online assessments — format (fixed questions, ~30s prep / 2min answer, algorithmic scoring), numerical test types; points to HireVue practice mode (ch. 15)
5. Off-cycle & recovery paths — MM/boutique later cycles, cold-emailing for off-cycle roles
*Gate:* quiz + target list started in Application Tracker (tool exercise).

### Ch 3 — Firm Overviews *(reference chapter — no gate)*
Backed by firm pages (live earnings/deals/intel + firm-specific question sets). Curriculum layer adds: how to research a firm, how to answer "why us," reading league tables. Consumed just-in-time.

### Ch 4 — Sector Deep-Dives *(reference chapter — no gate)*
Backed by sector pages. Curriculum layer adds: how sector choice affects recruiting, sector-specific multiples primer (EV/EBITDAR, P/FFO, EV/EBITDAX, P/TBV — cross-linked from ch. 10 §6).

### Ch 5 — Resume & Cover Letter
1. One-page conventions & ATS-safe formatting
2. Banker bullets — action verb + what + quantified result; before/after examples
3. Deal sheets (returning interns) & experience framing for non-finance backgrounds
4. Red flags & fixes
5. **Tool exercise: Resume Coach** — upload, review flags, accept/reject rewrites
*Gate:* quiz + one Resume Coach pass completed.

### Ch 6 — Networking Mastery
1. Who to reach & how to find them — alumni search, clubs, career center
2. Cold email anatomy — subject, body, ask; timing and volume norms
3. The coffee chat — prep, conduct, questions by seniority (analyst vs VP vs MD)
4. Follow-up cadence & converting chats into referrals
5. **Tool exercise: Relationship Manager** — add 3 real contacts, log a chat, generate a follow-up
*Gate:* quiz + tool exercise.

### Ch 7 — Behavioral & Fit
1. Walk me through your resume — the 4-part arc (origin → spark → deepening interest → why here now); persona variants (finance background, non-finance, engineer, athlete, international)
2. Why investment banking / why our firm — hooks that survive follow-ups; the "background + IB = long-term goal" equation
3. The story bank — 5–8 STAR stories covering leadership/failure/conflict/teamwork/persuasion/ethics; **train adaptation, not memorization** (same story re-angled per prompt)
4. Strengths & weaknesses — real-weakness selection (safe list + banned-cliché list), objection handling by background type (low GPA, no finance experience, late start…)
5. Discussing deals & markets — 4-part deal discussion (background → rationale → numbers → your opinion); markets fluency; the **current-deals living section** (auto-refreshed recent deals to have ready — static content can't do this)
6. Discussing your own experience/deals — personal-contribution framing, honest boundaries (teach framing, not embellishment)
7. **Tool exercise: Story Framer** — build the story bank from real experiences; gap detection ("no conflict story yet")
*Gate:* quiz + story bank ≥5 stories + one graded verbal resume walkthrough.

### Ch 8 — Technicals: Accounting & the 3 Statements *(the foundation — biggest chapter)*
1. The income statement — anatomy; the two-part inclusion test (period-matching + affects common shareholders)
2. The balance sheet — assets/liabilities/equity, line-item glossary (AR, prepaid, inventory, PP&E, goodwill, AP, accrued, deferred revenue, debt, equity components)
3. The cash flow statement — why it exists, CFO/CFI/CFF, common myths about section mapping
4. Linking the three statements — the mechanical loop (NI → retained earnings; non-cash add-backs; net change in cash → BS cash); "each item once and only once"
5. Working capital & operational items — AR/AP/deferred revenue/inventory/prepaid, each taught as a record-then-reverse pair
6. Single-step changes — the canonical drill: "line item X changes by $Y — walk the statements," answered in the **IS → CFS → BS → intuition** template (this template is also the grading rubric, §4)
7. Multi-step scenarios — chained events (borrow → buy → operate → depreciate → sell)
8. ⭐ Advanced accounting — deferred taxes & NOLs, stock-based comp, leases (post-ASC-842), impairments, equity method & NCI, LIFO/FIFO, GAAP vs IFRS, pensions
*Signature interactive:* **randomized 3-statement drill generator** — random line item × amount × direction, parameterized so answers can't be memorized; step-graded per statement with a final "does the BS balance?" check. (Directly modeled on the drill a real successful candidate built for herself by hand.)
*Gate:* mixed quiz incl. ≥3 generated single-step and ≥1 multi-step drill.

### Ch 9 — Technicals: Enterprise Value vs Equity Value
1. What each measures — equity value (value to common shareholders) vs enterprise value (value of core operations to all investors); myth-busting (EV ≠ acquisition price)
2. Diluted share count — treasury stock method, options/warrants/RSUs/converts; worked math
3. The bridge — item by item: cash, debt, preferred, NCI; *why* each is added/subtracted (repayment logic + comparability logic)
4. Event impacts — "company does X: does equity value change? does EV change?" — a two-step test (does common equity change? do net operating assets change?)
5. Pairing metrics with values — the funnel rule: metric includes interest? → equity value; capital-structure-neutral? → EV; why EV/EBITDA works and Equity Value/EBITDA doesn't
6. ⭐ Edge cases — negative EV, equity investments, pensions/leases in the bridge, book vs market values
*Signature interactive:* rapid-fire "does this change EV?" drills; parameterized TSM/convert calculations.
*Gate:* mixed quiz incl. a full bridge calculation.

### Ch 10 — Technicals: Valuation — Comps & Precedent Transactions
1. The big picture — intrinsic vs relative valuation; the master formula (Value = CF / (r − g)) as the throughline that explains *why* multiples are shorthand for growth/risk
2. Metrics & multiples — EBIT vs EBITDA vs net income vs FCF; when each fits
3. Building a comp set — screening (industry/geography/size), the 5–10 comp norm, spreading and applying multiples
4. Precedent transactions — deltas from comps: control premium (10–30% typical), deal-structure noise, time-window screening
5. Interpreting output — the football field, ranges not point estimates, valuation hierarchy (precedents > comps usually; DCF is the wildcard)
6. ⭐ Other methodologies & sector multiples — SOTP, liquidation/NAV, M&A premiums, LBO-as-floor; sector-specific multiples (links to ch. 4)
*Signature interactive:* pick-the-right-multiple drills; back-calculate-the-multiple problems; curveball questions ("value this apple tree / vending-machine business") graded on framework not answer.
*Gate:* mixed quiz.

### Ch 11 — Technicals: DCF *(most-tested single topic)*
1. Walk me through a DCF — the 6-step verbal script, graded as a verbal answer (see §4 T5)
2. Unlevered free cash flow — the build (revenue → EBIT → NOPAT → +D&A − ΔWC − CapEx); what's excluded and why; SBC treatment
3. WACC & cost of equity — CAPM, equity risk premium, beta (unlever comps → median → relever) as its own worked mechanic
4. Terminal value — Gordon growth vs exit multiple; cross-checking one against the other (implied growth / implied multiple); sanity bounds (terminal growth ≤ GDP; TV% of total value)
5. What moves a DCF — directional-impact drills (X changes → cost of equity / WACC / implied value go which way?); the standard sensitivity pairs
6. ⭐ Advanced — mid-year convention, stub periods, levered DCF, DDM/residual income for banks, emerging-market adjustments
*Signature interactive:* a guided **mini-DCF walkthrough tutorial** (worked-example format, numbers revealed step by step); directional-impact rapid-fire drills.
*Gate:* mixed quiz incl. graded verbal walkthrough + directional drills.

### Ch 12 — Technicals: M&A & Merger Models
1. Why companies buy + how deals happen — rationale taxonomy; sell-side process (teaser → CIM → bids → close)
2. Accretion/dilution mechanics — the 5-step build; **cost-of-acquisition vs seller's-yield framework** (after-tax cost of cash/debt/stock weighted vs E/P of target); the all-stock P/E shortcut *and when it fails*
3. Purchase price & consideration — premiums, cash/debt/stock capacity limits, buyer/seller preferences
4. Goodwill & purchase price allocation — goodwill formula, write-ups, DTL creation; balance-sheet combination
5. The full merger model — 8-step build; synergies (revenue vs cost) and the classic synergy-modeling pitfalls
6. ⭐ Advanced — exchange ratios & collars, earn-outs, stock vs asset vs 338(h)(10), NOLs in deals (§382 limits)
*Signature interactive:* escalating accretion/dilution scenario drills with mental-math grading (tolerance bands); "is this deal accretive?" rapid-fire.
*Gate:* mixed quiz.

### Ch 13 — Technicals: LBO Models
1. Why leverage amplifies returns — the mechanics (and the downside case: leverage amplifies losses too); who actually bears the debt (target, not sponsor)
2. What makes a good LBO candidate — stable FCF > growth, price discipline, industry traits
3. Sources & uses — purchase price (public vs private, cash-free/debt-free), minimum cash, fees
4. Debt & the debt schedule — tranche taxonomy (revolver → TLA → TLB → senior notes → sub notes → mezz: rate, amortization, covenants, prepayment), revolver mechanics, mandatory vs optional paydown, the circularity problem
5. Exit & returns — IRR and MoM; returns attribution (EBITDA growth vs multiple expansion vs debt paydown)
6. **Paper LBO & IRR mental math** — the memorizable multiple↔IRR table (2x/5yr ≈ 15%, 3x/5yr ≈ 25%, 2x/3yr ≈ 26%…), Rule of 72, timed paper-LBO drills
7. ⭐ Advanced — dividend recaps, waterfall/management incentives, add-on acquisitions, modeling-test formats
*Signature interactive:* timed **paper LBO drill** (grading on estimate accuracy within tolerance + method); IRR estimation rapid-fire.
*Gate:* mixed quiz incl. one timed paper LBO.

### Ch 14 — Mental Math & Pressure Drills *(slimmed from "Brain Teasers")*
1. Mental math that transfers — percentages, quick multiplication, P/E↔yield conversions, IRR estimation (reinforces ch. 12–13)
2. Thinking out loud under pressure — the meta-skill: structure before answer, asking clarifying questions, recovering from errors
3. Market awareness quick-hits — where's the S&P/10-year/Fed funds; forming a defensible market view (links to ch. 7 §5 current-deals)
4. ⭐ Classic brain teasers — a small curated set, framed as "declining in usage, don't over-invest"
*Signature interactive:* daily timed mental-math sprints (streak-friendly).
*Gate:* timed drill benchmark.

### Ch 15 — Mock Interviews & HireVue Practice
1. Interview formats & what scorers reward — content vs delivery; how real interviewers probe (follow-up trees — which the user has now experienced all curriculum long)
2. **HireVue simulation** — exact format replication: fixed question count, 30s prep / 2min answer timers, camera on; AI scorecard on structure/clarity/pace/filler
3. First-round & technical-round strategy — mixing fit and technical under time pressure
4. **Tool exercise: Mock Interview Studio** — one full voice mock, graded scorecard with rubric + chapter citations
*Gate:* one completed mock ≥ threshold score.

### Ch 16 — Superday & Logistics
1. The day — 5–10 back-to-back interviews across seniority levels; what changes between an analyst interview and an MD interview
2. Consistency & energy — same story every room (they compare notes), managing fatigue
3. **The pre-interview checklist** (interactive) — auto-assembled per interview: ✓ resume story rehearsed, ✓ 3 STAR stories, ✓ strengths/weaknesses, ✓ objection prep, ✓ one firm deal, ✓ one market view, ✓ own-deal discussion (if applicable), ✓ technical mastery by chapter (pulled live from the mastery model). Auto-attached to calendar-detected interviews (Unit 10 integration).
4. Thank-yous & offer/rejection handling
*Gate:* checklist completed against a real or simulated interview.

## 4. Interactive technical questions & AI grading

### Question types
| Type | Example | Grading approach |
|---|---|---|
| **T1 Conceptual** | "Why can't you pair equity value with EBITDA?" | Key-point checklist + misconception flags |
| **T2 Single-step 3-statement** | "Depreciation up $10 — walk the statements" | Step-graded: IS → CFS → BS each sub-scored, + balance check |
| **T3 Multi-step scenario** | "Borrow $100, buy a factory, operate a year, sell it" | Chained T2 with carried state; partial credit per step |
| **T4 Calculation (parameterized)** | TSM, accretion/dilution, IRR estimate, multiple back-calc | Random numbers per serve (kills memorization); final answer + shown-work steps; tolerance bands for mental-math (e.g., IRR ±2pts) |
| **T5 Verbal walkthrough** | "Walk me through a DCF" (voice) | Step completeness + correct order + pacing |
| **T6 Curveball/framework** | "Value this apple tree" | Framework applied (intrinsic + relative) — graded on approach, not a number |

### Rubric dimensions (published to the user, every graded answer)
1. **Accuracy** — required key points hit; known misconceptions flagged explicitly ("you said EV changes when the company issues stock — it doesn't, here's why")
2. **Completeness** — required steps present (for T2/T3/T5, the canonical step sequence *is* the rubric)
3. **Structure** — right order (IS→CFS→BS; walkthrough steps in sequence); answer-first framing
4. **Numeric correctness** — exact or within tolerance band (T4)
5. **Depth calibration** — the dimension nobody else grades: did the user answer at interview-appropriate depth and *stop*, leaving detail for follow-ups? Over-explaining is penalized (a real candidate's notes literally annotated "do NOT explain X unless asked"). Delivery metrics (WPM, filler) stay separate per spec.

Every scorecard cites back to the chapter section that teaches what was missed (spec's existing requirement) — the rubric makes those citations precise.

### Follow-up trees (per spec, 3–5 probes per question)
Model on real interviewer escalation patterns from the inventories: correct answer → harder variant ("now the deal is 50% cash — still accretive?"), edge case ("when does that rule of thumb fail?"), or "why" one level deeper. Tree depth reached = strong mastery signal (feeds the mastery model with higher weight than first-answer correctness).

### Scheduling
- **Section drills** fire immediately after each reading (retrieval practice).
- **Chapter gates** at ~85%; elective ⭐ sections excluded from gates.
- **Spaced re-surfacing** (per spec, every 2–3 days for weak items) draws from an **interleaved pool** of all passed chapters — the daily drill is always mixed-topic once ≥2 chapters are passed.
- **Difficulty tiers** map from source taxonomy: easy ≈ "basic conceptual," medium ≈ single-step/standard calc, hard ≈ multi-step/advanced/paper-LBO. ⭐ content serves only to users who opt into the advanced track.

### Bank sizing (curated, original — see §7)
Coverage targets by topic, informed by the source-material distributions (what real guides weight): Accounting ~80, EV/EqV ~50, Valuation ~60, DCF ~70 (most-tested), M&A ~60, LBO ~50, Fit/behavioral ~60, Mental math via generators. Plus parameterized T4 generators (3-statement changes, TSM, accretion/dilution, paper LBO) which multiply effective bank size indefinitely. The highlighted-question layer extracted from a real candidate's marked-up 400Q copy (184 highlights, heavily skewed to core fit + core technicals, skipping restructuring/brain teasers) is used as a **priority weighting signal** for which question archetypes are "most drilled in the wild" — metadata only, no source text.

## 5. Workflow across the recruiting cycle

Three entry paths, selected by the recruiting cycle widget from grad year + semester:

- **Foundation path** (freshman → sophomore fall): full linear spine, ch. 1–16 in order, networking running in parallel from ch. 6 onward. Pace: ~2 chapters/month is comfortable against the 40–70 total prep hours the market converges on.
- **Accelerated path** (sophomore spring → junior, apps open in ≤4 months): compressed order — ch. 1 (plan) → ch. 7 (story, immediately) → ch. 8–13 core sections only (⭐ skipped) → ch. 15 mocks → ch. 2/16 just-in-time. Networking + Resume chapters interleaved as tool tasks rather than full reads.
- **Interview mode** (interview detected ≤7 days out, via calendar or manual): daily plan = pre-interview checklist (ch. 16 §3) + firm page review + current-deals refresh + rapid drills targeted at the user's 3 weakest topics + one mock/day. This is a dashboard takeover, not a chapter.

The dashboard's "recommended next" always reflects the active path; the mastery model's weak-area CTAs work identically in all three.

## 6. Mapping the 32 existing MDX guides → chapters

**Resolution of the open question: (b)-then-(a) — keep guides as the reading unit, reorganize them under chapters as sections, and expand.** No rewrite from scratch; every existing guide slots in as a section seed. Chapters need 2–6 *new* sections each to reach the anatomy in §2.

| Existing guide | → Chapter / section |
|---|---|
| three-statement-walkthrough, accounting-linkages | Ch 8 §1–4 |
| enterprise-value-vs-equity-value | Ch 9 §1/§3 |
| valuation-methodologies-overview, trading-comps, precedent-transactions | Ch 10 §1/§3/§4 |
| walk-me-through-a-dcf, cost-of-capital-and-wacc | Ch 11 §1/§3 |
| m-and-a-accretion-dilution | Ch 12 §2 |
| lbo-basics, lbo-paper-math | Ch 13 §1–4/§6 |
| modeling-test-prep | Ch 13 §7 ⭐ |
| walk-me-through-your-resume, tell-me-about-yourself, why-investment-banking, why-our-firm, strengths-and-weaknesses, star-framework | Ch 7 §1–4 |
| tell-me-about-a-deal, how-to-follow-the-market | Ch 7 §5 |
| deal-sheet-for-returning-interns, banker-bullet-structure | Ch 5 §2–3 |
| alumni-networking, cold-outreach-email-template, coffee-chat-framework | Ch 6 §1–3 |
| superday-day-of-logistics | Ch 16 §1–2 |
| goldman-sachs-guide, jpmorgan-guide, morgan-stanley-guide, evercore-guide, lazard-guide, centerview-guide | Ch 3 reference / firm pages (not spine content) |

**Biggest content gaps to author:** ch. 1 and ch. 2 (nothing exists), ch. 8 §5–8 (working capital, single/multi-step drills, advanced accounting), ch. 9 §2/§4–5 (dilution, event impacts, pairing rule), ch. 11 §2/§4–5 (FCF build, terminal value, sensitivities), ch. 12 §1/§3–5, ch. 13 §5, ch. 14 (all), sector deep-dive pages.

## 7. Content sourcing & copyright posture

The `extra_content/` corpus splits cleanly:

- **Commercial (BIWS / M&I — ~24 of 30 docs, incl. all 7 course modules, all 8 topic guides, both 400Q copies, all 6 behavioral guides, 2 process docs):** copyrighted paid products, several as watermarked lead-magnet excerpts. **Safe:** topic taxonomies, sequencing, question-type categories, difficulty tiers, which concepts are flagged as high-frequency/gotcha — facts and structure, mined above. **Not safe:** any prose, worked examples with their specific numbers, templates, named case studies, or close paraphrase. All reading content and all bank questions must be **authored originally** (AI-drafted + reviewed is fine; "inspired by the question *type*" is fine; same numbers/phrasing is not).
- **Personal (Kozower binder, Max Ellis Q&A, Technical Cheat Sheet, Technical Concepts, the highlight layer on the 400Q copy):** friends' own work. With their permission, their *frameworks, prioritization signals, and workflow patterns* (the drill generator pattern, the "don't explain unless asked" pacing notes, the highlight priorities, the checklist habit) are used as design inputs — already reflected in §1–4. Prose still gets rewritten; no names attached to content. **Action for Jake:** confirm permission with Maddy, Max, and Zach before launch.

## 8. Open decisions for Jake

1. **Gate strictness** — hard gate (next spine chapter locked until ~85%) vs soft gate (warning + recommendation, but browsable). Recommendation: **hard gate on the technical spine (ch. 8–13) only**, soft everywhere else — mastery gating is the pedagogical win, but blocking someone from reading the networking chapter is pointless friction.
2. **Advanced (⭐) track packaging** — a per-user toggle ("targeting PE / have prior experience") vs per-chapter opt-in. Recommendation: per-user toggle set at onboarding, changeable in profile.
3. **Ch 14 naming** — spec says "Brain Teasers & Mental Math"; this doc reframes as "Mental Math & Pressure Drills." Needs a spec update if accepted.
4. **Friend permissions** (§7) — needed before any derived content ships.
