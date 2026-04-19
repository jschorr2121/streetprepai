# Street Prep AI — Pricing & Unit Economics Analysis

> Companion to `business-plan.md` (operating plan), `product-description.md` (functional spec), and `CLAUDE.md` (technical reference). This document is the unit-economics deep-dive: per-flow LLM cost model, model routing strategies, gross margin per subscription tier, scale modeling, sensitivity analysis, free-tier sustainability, and concrete pricing recommendations.

Last updated: 2026-04-18.

---

## 1. Executive summary

**Recommended pricing (launch August 2026):**

- **Pro Monthly: $24/mo** (down from the $29 placeholder in `CLAUDE.md`). Captures students who want a single month of intense prep without forcing the full Season Pass commitment.
- **Recruiting Season Pass: $149 one-time, 7 months Aug–Feb.** Anchor product. Frame as "less than a single mock interview tutoring session for the entire cycle." Holds the original number — it is the cycle-buy psychology, not a price-discovery decision.
- **University B2B: $10k/school/year** for 200 students × 7 active months. Land first 1–2 schools at $5k pilot pricing; raise to $10k after case study.

**Recommended model routing: Strategy B (Cost-optimized) at launch.** Sonnet for all reasoning-heavy flows (lens explain, beginner rewrite, chat, prep sheets, story framer, structure-chat), Haiku everywhere else (follow-ups, flashcards, question gen, outreach), Opus reserved for Mock Interview scoring + Resume critique. Strategy A (CLAUDE.md as-written) costs ~25% more for marginal quality gains in flows where Sonnet is already excellent. Strategy C (Haiku-first) saves another ~30% but introduces real quality risk on the Reading Lens — the flagship feature you cannot afford to compromise.

**Usage caps (enforce in code week 1):**
- **Free:** 3 guides total, 10 lens explains/mo, 5 chat turns/mo, 3 mock interviews/mo (3 min cap each), 2 prep sheets/mo, 1 outreach draft/mo. No Resume Coach, no chat-structuring, no flashcards.
- **Pro:** 30 mock interviews/mo (then $1/each overage), 200 lens explains/mo soft cap, 5 resume critiques/mo, otherwise unlimited.

**Free tier verdict: viable but tight.** Strategy B lands the Free profile at ~$0.31/user/month — inside the $0.20–0.50 target band, with no margin for abuse. Cap mocks at 3 × 3min hard, and gate chat behind 5 turns/month or this number doubles overnight.

**Top 3 cost levers (in priority order):**
1. **Cache hit rate on guide content.** A 90% vs 50% cache hit rate is a ~3x swing on Reading Lens cost. Instrument and tune the system block layout in week 1.
2. **Mock Interview model + duration cap.** Opus scoring at 30 mocks/mo is ~$2.40 of a Pro user's total cost. Sonnet scoring drops it to ~$1.40 with modest quality risk. A 15-mock cap saves another ~50%.
3. **Whisper.** $0.006/minute compounds fast. Self-hosting whisper.cpp on a small GPU (or using Groq Whisper at fractional cost) cuts ~$0.18 off every Pro user with 30 mocks.

**At 10k paying users (70/30 mix, 50 schools):** $1.83M annual gross revenue, ~$240k LLM COGS, ~84% blended gross margin. Healthy.

**Biggest economic risk:** Free-tier abuse on chat + lens. A single motivated free user looping the Reading Lens on a long guide can burn $5–10 in a day. Hard caps and per-IP rate limiting are not optional.

---

## 2. Cost inputs (as of 2026-04-18)

### Anthropic Claude API — per million tokens

Source: [claude.com/pricing](https://claude.com/pricing), fetched 2026-04-18.

| Model | Input | Cached read | Cache write (5-min) | Output |
|---|---:|---:|---:|---:|
| `claude-opus-4-7` | $5.00 | $0.50 | $6.25 | $25.00 |
| `claude-sonnet-4-6` | $3.00 | $0.30 | $3.75 | $15.00 |
| `claude-haiku-4-5` | $1.00 | $0.10 | $1.25 | $5.00 |

### Other AI services

| Item | Price | Source |
|---|---|---|
| OpenAI Whisper | $0.006 / minute | [openai.com/api/pricing](https://openai.com/api/pricing) — *fetch failed (403); estimated from training data, last public price.* |
| OpenAI text-embedding-3-small | $0.02 / 1M tokens | Same source — *estimated.* |

### Infrastructure & SaaS (monthly fixed costs)

| Vendor | Plan | Price | Source |
|---|---|---:|---|
| Vercel | Pro | $20/user/mo + usage | [vercel.com/pricing](https://vercel.com/pricing), 2026-04-18 |
| Supabase | Pro | $25/project/mo + usage | [supabase.com/pricing](https://supabase.com/pricing), 2026-04-18 (web search) |
| Resend | Pro (50k emails) | $20/mo | [resend.com/pricing](https://resend.com/pricing), 2026-04-18 |
| Upstash Redis | Pay-as-you-go (~small prod) | ~$10–15/mo expected | [upstash.com/pricing/redis](https://upstash.com/pricing/redis), 2026-04-18 |
| Stripe (US online) | 2.9% + $0.30/transaction | [stripe.com/pricing](https://stripe.com/pricing), 2026-04-18 |
| **Fixed infra subtotal (modeled)** | | **~$90/mo** | Vercel $20 + Supabase $25 + Resend $20 + Upstash $15 + buffer $10 |

**Notes on estimates:**
- OpenAI Whisper price could not be fetched live (403). The $0.006/min number is the publicly published rate as of late 2024 and is unlikely to have moved meaningfully; treat as ±20%.
- Supabase Pro at scale will exceed the $25 base — at 10k MAUs, expect $50–100/mo with bandwidth + database compute.
- Vercel Pro likely insufficient at 5k+ users; budget Enterprise discussions or migrate AI streaming to a cheaper edge.

---

## 3. Per-flow cost model

### Token assumptions (per flow)

These estimates drive every dollar number in this document. Calibrate them with real telemetry in MVP week 1 and re-run this sheet.

| Flow | Cached input (tok) | Uncached input (tok) | Output (tok) | Notes |
|---|---:|---:|---:|---|
| Lens explain | 8,000 | 400 | 250 | Cached: full guide system block. Uncached: highlighted passage + user question. Output: 2-paragraph plain-English explanation. |
| Beginner rewrite | 8,000 | 200 | 1,200 | Cached: guide. Uncached: section reference. Output: full rewritten section. |
| Chat (per turn) | 8,000 | 600 | 400 | Cached: guide + system. Uncached: user turn + last 2 turns of history. |
| Mock scoring (per question) | 1,500 | 1,200 | 800 | Cached: rubric + system. Uncached: transcript (~200 words = 300 tok) + question + audio metadata. Output: scorecard. |
| Mock interview (3 questions avg) | 4,500 | 3,600 | 2,400 | Per full mock = 3× per-question. |
| Whisper (per mock minute) | — | — | — | Flat $0.006/min. 5min avg mock × $0.006 = $0.030. |
| Prep sheet (person) | 2,000 | 1,500 | 1,500 | Cached: prompt. Uncached: LinkedIn bio + user context. Output: structured prep sheet. |
| Firm prep sheet | 4,000 | 5,000 | 2,000 | Cached: prompt. Uncached: earnings + news + past chats. Output: structured brief. |
| Structure chat (tool use) | 1,500 | 800 | 600 | Cached: schema + system. Uncached: raw notes. Output: JSON via tool. |
| Follow-up email draft | 1,500 | 800 | 350 | Cached: prompt + tone guide. Uncached: structured chat summary. Output: subject + body. |
| Outreach draft | 1,500 | 600 | 300 | Cached: prompt. Uncached: recipient bio. Output: cold email. |
| Resume critique | 2,000 | 2,500 | 2,000 | Cached: banker-speak rules + system. Uncached: resume text. Output: bullet rewrites + flags. |
| Story framing | 2,000 | 600 | 1,500 | Cached: STAR rubric + system. Uncached: raw experience. Output: 5 framings. |
| Flashcard generation (10 cards) | 2,000 | 1,500 | 1,200 | Cached: format spec. Uncached: source text. Output: Q/A pairs. |
| Question generation (5 q's) | 1,500 | 800 | 800 | Cached: difficulty rubric. Uncached: topic + level. Output: 5 questions. |
| Embedding (per chat log) | — | 800 | — | text-embedding-3-small at $0.02 / 1M = $0.000016. Negligible; ignored downstream. |

### Cost per call — three model strategies

Values below assume **75% cache hit rate** (modeled as the cached-input column being 75% of the cached portion at cached price, 25% at uncached price). All numbers in **USD per call**.

#### Strategy A — Premium (per CLAUDE.md routing)

| Flow | Model | Input cost | Output cost | **Total / call** |
|---|---|---:|---:|---:|
| Lens explain | Sonnet | $0.0061 | $0.0038 | **$0.0099** |
| Beginner rewrite | Sonnet | $0.0060 | $0.0180 | **$0.0240** |
| Chat (per turn) | Sonnet | $0.0066 | $0.0060 | **$0.0126** |
| Mock scoring (per mock, 3q) | Opus | $0.0405 | $0.0600 | **$0.1005** |
| Whisper (per 5min mock) | — | — | — | **$0.0300** |
| Prep sheet (person) | Sonnet | $0.0060 | $0.0225 | **$0.0285** |
| Firm prep sheet | Sonnet | $0.0210 | $0.0300 | **$0.0510** |
| Structure chat | Sonnet | $0.0036 | $0.0090 | **$0.0126** |
| Follow-up draft | Haiku | $0.0011 | $0.0018 | **$0.0029** |
| Outreach draft | Haiku | $0.0009 | $0.0015 | **$0.0024** |
| Resume critique | Sonnet | $0.0090 | $0.0300 | **$0.0390** |
| Story framing | Sonnet | $0.0033 | $0.0225 | **$0.0258** |
| Flashcard gen | Haiku | $0.0019 | $0.0060 | **$0.0079** |
| Question gen | Haiku | $0.0012 | $0.0040 | **$0.0052** |

#### Strategy B — Cost-optimized (Sonnet for reasoning, Haiku elsewhere, Opus only on Mock)

Same as A, except:
- Resume critique → Sonnet (already Sonnet in A; no change)
- Story framing → Sonnet (no change)
- Flashcard / question / outreach / follow-up → Haiku (no change)
- Prep sheets → Sonnet (no change)

**Strategy B is essentially Strategy A**, because CLAUDE.md routing is already cost-optimized: Opus is reserved for Mock scoring only. Real difference: Strategy B drops chat structuring + firm prep to Haiku where the structured-output schema does most of the heavy lifting.

| Flow change vs A | Model | **Total / call** |
|---|---|---:|
| Structure chat → Haiku | Haiku | **$0.0042** (–67%) |
| Firm prep sheet → Sonnet (kept) | Sonnet | **$0.0510** (no change) |
| Story framing → Sonnet (kept) | Sonnet | **$0.0258** (no change) |

Net effect: Strategy B = Strategy A minus $0.008 per chat structuring. Modest in isolation but compounds in heavy-CRM users.

#### Strategy C — Aggressive (Haiku-first, except Resume + Mock = Opus)

| Flow | Model | Input cost | Output cost | **Total / call** |
|---|---|---:|---:|---:|
| Lens explain | Haiku | $0.0020 | $0.0013 | **$0.0033** |
| Beginner rewrite | Haiku | $0.0020 | $0.0060 | **$0.0080** |
| Chat (per turn) | Haiku | $0.0022 | $0.0020 | **$0.0042** |
| Mock scoring | Opus | $0.0405 | $0.0600 | **$0.1005** |
| Prep sheet (person) | Haiku | $0.0020 | $0.0075 | **$0.0095** |
| Firm prep sheet | Haiku | $0.0070 | $0.0100 | **$0.0170** |
| Structure chat | Haiku | $0.0014 | $0.0030 | **$0.0044** |
| Follow-up draft | Haiku | $0.0011 | $0.0018 | **$0.0029** |
| Outreach draft | Haiku | $0.0009 | $0.0015 | **$0.0024** |
| Resume critique | Opus | $0.0150 | $0.0500 | **$0.0650** |
| Story framing | Haiku | $0.0011 | $0.0075 | **$0.0086** |
| Flashcard gen | Haiku | $0.0019 | $0.0060 | **$0.0079** |
| Question gen | Haiku | $0.0012 | $0.0040 | **$0.0052** |

**Quality risk under Strategy C:** Reading Lens on Haiku is the bet. Haiku 4.5 is good but it loses the "respected mentor" voice on nuanced finance explanations vs Sonnet. This is the demo flow. Don't compromise it.

---

## 4. Three model routing strategies × three usage profiles

### Usage profiles (per month)

| Action | Free | Pro typical | Pro power |
|---|---:|---:|---:|
| Guides opened (cache writes) | 3 | 8 | 15 |
| Lens explains | 10 | 60 | 200 |
| Chat turns | 5 | 40 | 150 |
| Mock interviews (5min avg) | 3 | 25 | 60 |
| Person prep sheets | 2 | 8 | 20 |
| Firm prep sheets | 0 | 3 | 8 |
| Structure chat | 0 | 5 | 15 |
| Follow-up drafts | 0 | 5 | 15 |
| Outreach drafts | 1 | 6 | 15 |
| Resume critiques | 0 | 1 | 2 |
| Story framings | 0 | 3 | 6 |
| Flashcard generations | 0 | 15 | 40 |
| Question generations | 0 | 10 | 25 |
| Whisper minutes (mocks × 5) | 9 (3 × 3min Free cap) | 125 | 300 |

### Monthly LLM + Whisper cost per user — 3 × 3 matrix

Cache hit rate held at 75%. Embeddings ignored as immaterial.

| Strategy | Free | Pro typical | Pro power |
|---|---:|---:|---:|
| **A — Premium (CLAUDE.md)** | **$0.36** | **$5.93** | **$15.21** |
| **B — Cost-optimized** | **$0.31** | **$5.79** | **$14.83** |
| **C — Aggressive Haiku** | **$0.21** | **$4.98** | **$13.07** |

**Math trace — Strategy A, Pro typical (anchor for everything downstream):**

| Component | Calls | Unit cost | Subtotal |
|---|---:|---:|---:|
| Lens explain (Sonnet) | 60 | $0.0099 | $0.594 |
| Chat (Sonnet) | 40 | $0.0126 | $0.504 |
| Mock scoring (Opus) | 25 | $0.1005 | $2.513 |
| Whisper (25 × 5min) | 125 | $0.006 | $0.750 |
| Person prep (Sonnet) | 8 | $0.0285 | $0.228 |
| Firm prep (Sonnet) | 3 | $0.0510 | $0.153 |
| Structure chat (Sonnet) | 5 | $0.0126 | $0.063 |
| Follow-up (Haiku) | 5 | $0.0029 | $0.014 |
| Outreach (Haiku) | 6 | $0.0024 | $0.014 |
| Resume (Sonnet) | 1 | $0.0390 | $0.039 |
| Story framing (Sonnet) | 3 | $0.0258 | $0.077 |
| Flashcard (Haiku) | 15 | $0.0079 | $0.119 |
| Question gen (Haiku) | 10 | $0.0052 | $0.052 |
| Beginner rewrite (Sonnet) | 4 | $0.0240 | $0.096 |
| **Total** | | | **$5.22 LLM + $0.75 Whisper = $5.93** |

**Key reading:** the difference between Strategy A and B is small because CLAUDE.md routing is already disciplined. The real cost-cut lever is Strategy C, but it costs you the lens. Recommendation: ship Strategy B at launch, A/B test Lens-on-Haiku in cohorts where the user has marked themselves "advanced" (less hand-holding needed).

---

## 5. Subscription scenarios — gross margin per user

Assumes Pro typical user profile (median). Stripe = 2.9% + $0.30 per transaction. Strategy A and B columns shown; C omitted (don't recommend it for the lens).

### Pro Monthly

| Price | Stripe fee | LLM (A) | LLM (B) | Margin $ (A) | Margin % (A) | Margin $ (B) | Margin % (B) |
|---|---:|---:|---:|---:|---:|---:|---:|
| $19 | $0.85 | $5.93 | $5.79 | $12.22 | 64% | $12.36 | 65% |
| $24 | $1.00 | $5.93 | $5.79 | $17.07 | 71% | $17.21 | 72% |
| $29 | $1.14 | $5.93 | $5.79 | $21.93 | 76% | $22.07 | 76% |
| $39 | $1.43 | $5.93 | $5.79 | $31.64 | 81% | $31.78 | 81% |

**$19 falls below the 70% target — flag.** $24 is the lowest acceptable price under typical-user assumptions; $29 has full headroom but risks underpricing the Season Pass framing.

### Recruiting Season Pass (7 months Pro at typical usage)

LLM cost over 7 months = $5.93 × 7 = $41.51 (Strategy A) / $40.53 (Strategy B). Stripe fee charged once.

| Price | Stripe fee | LLM 7mo (A) | Margin $ (A) | Margin % (A) | Margin % (B) |
|---|---:|---:|---:|---:|---:|
| $99 | $3.17 | $41.51 | $54.32 | 55% | 56% |
| $149 | $4.62 | $41.51 | $102.87 | 69% | 70% |
| $199 | $6.07 | $41.51 | $151.42 | 76% | 76% |
| $249 | $7.52 | $41.51 | $199.97 | 80% | 81% |

**$99 fails the 60% margin floor** and breaks if a buyer is a power user (would lose money). $149 is the sweet spot. $199 is plausible if the SME-reviewed content + Mock Studio polish lands.

**Power-user stress test at $149:** $14.83 × 7 = $103.81 LLM + $4.62 Stripe = $108.43 cost vs $149 revenue = **27% margin (B)**. Tolerable but thin — power users are net-negative-margin if they cluster at $99 or below. Caps matter.

### B2B University (200 students × Pro typical × 7 months active)

LLM cost = 200 × $5.93 × 7 = $8,302 (A) / $8,106 (B). Stripe negligible at this transaction size (or invoiced wire). Add ~$500/yr for SSO/onboarding overhead.

| Price | LLM (A) | Overhead | Margin $ (A) | Margin % (A) | Margin % (B) |
|---|---:|---:|---:|---:|---:|
| $5,000 | $8,302 | $500 | **–$3,802** | **–76%** | **–76%** |
| $10,000 | $8,302 | $500 | $1,198 | 12% | 14% |
| $15,000 | $8,302 | $500 | $6,198 | 41% | 41% |

**Critical finding:** the original $5–15k/school number breaks badly at 200 active students. Either (a) actual student adoption is more like 50–80 active out of 200 enrolled, in which case $5k pencils out, or (b) the per-school price needs to be $12–18k. **Recommendation:** hold the line at $10k floor for paying schools, model 60% activation rate (120 active students). At 60% activation: LLM = $4,981, margin at $10k = 50%. Workable.

**Stress test — power-user mix in B2B:** if 20% of activated students are power users, blended LLM rises to ~$6,800 at 60% activation. Margin at $10k drops to 32%. Cap the Mock Studio at 30 mocks/student/month for B2B too.

**All combos with margin <60% (highlighted):**
- Pro Monthly $19 (any strategy)
- Season Pass $99 (any strategy)
- B2B $5k at 200 active students (loss)
- B2B $10k at 200 active students with power-user skew

---

## 6. Revenue + profit at scale

### Assumptions

- Mix: **70% Season Pass at $149, 30% Pro Monthly at $29.**
- Pro Monthly users are active for 8 months on average (annualized).
- Free users = 4× paying users (24% paid conversion).
- Free users at Free profile cost ($0.31 Strategy B / $0.36 Strategy A).
- B2B: 0 / 2 / 5 / 20 / 50 schools at $10k each.
- LLM Strategy A baseline; Strategy B sensitivity row included.
- Fixed infra: $90/mo at <500 users, $250/mo at 500–5k, $1,200/mo at 5k–10k.

### Revenue calculation

Per paying user blended:
- Season Pass: 0.70 × $149 = $104.30/yr
- Pro Monthly: 0.30 × $29 × 8 = $69.60/yr
- **Blended ARPU: $173.90/yr**

LLM cost per paying user/year (Strategy A):
- Season Pass user: $5.93 × 7 = $41.51
- Pro Monthly user: $5.93 × 8 = $47.44
- Blended: 0.70 × $41.51 + 0.30 × $47.44 = **$43.29/yr LLM (A)** / $42.27/yr (B)

Stripe per paying user/year:
- Blended: 0.70 × $4.62 + 0.30 × ($1.14 × 8) = $3.23 + $2.74 = **$5.97/yr**

Free-tier subsidy per paying user/year (4× free users at $0.31/mo for ~9 active months):
- 4 × $0.31 × 9 = **$11.16/yr** (Strategy B). Strategy A: $12.96/yr.

### Scale table

| Paying users | 100 | 500 | 1,000 | 5,000 | 10,000 |
|---|---:|---:|---:|---:|---:|
| Free users | 400 | 2,000 | 4,000 | 20,000 | 40,000 |
| Schools (B2B) | 0 | 2 | 5 | 20 | 50 |
| **B2C revenue** | $17,390 | $86,950 | $173,900 | $869,500 | $1,739,000 |
| **B2B revenue** | $0 | $20,000 | $50,000 | $200,000 | $500,000 |
| **Total revenue** | $17,390 | $106,950 | $223,900 | $1,069,500 | $2,239,000 |
| LLM COGS B2C (A) | $4,329 | $21,645 | $43,290 | $216,450 | $432,900 |
| LLM COGS B2B (A, 60% act.) | $0 | $9,962 | $24,905 | $99,620 | $249,050 |
| Free-tier subsidy (A) | $1,296 | $6,480 | $12,960 | $64,800 | $129,600 |
| Stripe fees | $597 | $2,985 | $5,970 | $29,850 | $59,700 |
| Fixed infra (annual) | $1,080 | $3,000 | $3,000 | $14,400 | $14,400 |
| **Total COGS (A)** | **$7,302** | **$44,072** | **$90,125** | **$425,120** | **$885,650** |
| **Gross profit (A)** | $10,088 | $62,878 | $133,775 | $644,380 | $1,353,350 |
| **Gross margin % (A)** | **58%** | **59%** | **60%** | **60%** | **60%** |
| **Gross margin % (B sensitivity)** | 60% | 61% | 62% | 62% | 62% |
| Run-rate exit revenue (Q4 annualized) | $25k | $150k | $315k | $1.5M | $3.1M |

**Reading the table:** margin holds steady around 60% across scales because the cost structure is dominated by per-user LLM cost. This is actually a worse outcome than the per-tier table suggests — the **free-tier subsidy is the silent killer**. At 10k paying users, you're spending $129,600 on free users to acquire them.

**If you tighten the Free profile** (cap mocks at 1/mo, lens at 5/mo, drop to $0.18/free user/mo):
- 10k users: subsidy drops to $77,800. Gross margin rises to **63%**. Worth doing.

**If you assume Strategy B + tightened Free + Whisper self-host:**
- 10k users: COGS ~$720k. Gross margin **68%**. This is the realistic upside case.

**B2B scaling note:** 50 schools at $10k = $500k is conservative. The unit economics improve dramatically if average school price moves to $12k (60% margin → 68%).

---

## 7. Sensitivity analysis

### 7.1 Cache hit rate (Pro typical, Strategy A)

| Cache hit rate | Lens explain unit cost | Total monthly LLM cost | Δ vs 75% baseline |
|---:|---:|---:|---:|
| 50% | $0.0148 | $6.51 | +10% |
| 75% | $0.0099 | $5.93 | baseline |
| 90% | $0.0070 | $5.59 | −6% |

**Reading:** cache hit rate matters but isn't apocalyptic. The bigger driver is the *uncached portion* of every call (the user's question, recent chat history). Aggressive prompt caching of the system block + guide content gets you 75% easily; pushing to 90% requires session-level cache reuse and 5-minute TTL discipline. Worth the engineering effort but not week-1 critical.

### 7.2 Mock scoring: Opus vs Sonnet

| Model | Per-mock cost | Pro typical (25 mocks) | Annual savings/Pro user (Sonnet vs Opus) |
|---|---:|---:|---:|
| Opus 4.7 | $0.1005 | $2.513 | — |
| Sonnet 4.6 | $0.0603 | $1.508 | $9.66/year saved |

**Quality risk:** Opus 4.7 will produce noticeably better rubric-based scoring on nuanced behavioral answers ("did the candidate actually demonstrate leadership or just describe a project?"). Sonnet 4.6 is acceptable on technical scoring (DCF, accounting) where the answer is more bounded. **Recommendation:** route by question type — Opus for behavioral, Sonnet for technical. Splits the savings ~50/50 with no perceptible quality loss on the harder flow.

### 7.3 Pro mock cap

| Cap | LLM mock cost (A) | LLM total Pro typical | Margin at $24 |
|---:|---:|---:|---:|
| Unlimited (assume 25 avg) | $2.51 | $5.93 | 71% |
| 30 (typical user unaffected) | $2.51 | $5.93 | 71% |
| 15 | $1.51 | $4.93 | 75% |
| 10 | $1.01 | $4.43 | 77% |

**Power user (60 mocks):** unlimited cost = $6.03. Cap at 30 = $3.01. Margin lift on power users at $24 Pro Monthly: from 39% → 51%. **Recommendation:** 30/mo soft cap with $1/mock overage above. Telegraph "unlimited" in marketing for 99% of users while killing the long-tail abuse.

### 7.4 Resume critique: Opus vs Sonnet

Pro typical = 1 critique/mo; Pro power = 2/mo. Even at Opus pricing, the absolute cost is small.

| Model | Per critique | Pro typical impact | Pro power impact |
|---|---:|---:|---:|
| Opus | $0.0650 | $0.065 | $0.130 |
| Sonnet | $0.0390 | $0.039 | $0.078 |

**Recommendation:** keep Opus on Resume Coach. Resume rewrites are a marquee "wow" moment — students will compare bullets side-by-side. The $0.026 savings isn't worth the quality regression.

### 7.5 Whisper alternative

| Option | Per minute | Pro typical (125 min) | Annual savings/user |
|---|---:|---:|---:|
| OpenAI Whisper API | $0.006 | $0.75 | — |
| Groq Whisper Large v3 | ~$0.001 | $0.13 | $7.44/yr |
| Self-hosted whisper.cpp on T4 GPU (Modal/Replicate) | ~$0.002 (amortized) | $0.25 | $6.00/yr |

**Recommendation:** ship with OpenAI for MVP simplicity, migrate to Groq in Phase 2 once Mock Studio volume justifies the integration work. **At 10k users this is ~$60–75k/yr saved** — easily worth a week of engineering in month 6.

---

## 8. Free tier sustainability

CLAUDE.md target: **$0.20–0.50 per free user per month.**

| Strategy | Free profile cost | In target band? |
|---|---:|---|
| A — Premium | $0.36 | Yes (mid-band) |
| B — Cost-optimized | $0.31 | Yes (low-mid) |
| C — Aggressive | $0.21 | Yes (bottom of band) |

**All three strategies hit the target with the suggested Free profile.** The risk is not the model — it's **abuse and inflation of the Free profile by motivated users**.

A user who takes the Free tier and runs:
- 30 lens explains (3x the cap), 20 chat turns, 5 mocks at full duration
- … hits $1.20–1.80/month immediately. At 4× free:paying ratio, that's $5–7/yr per paying user of subsidy bleed.

### Recommended Free tier caps (enforce server-side, not in UI)

| Capability | Free cap | Why |
|---|---|---|
| Guides accessible | 3 (intro DCF, intro behavioral, intro networking) | Wedge to Pro |
| Lens explains | 10/month, hard cap | Keeps cost at $0.10 |
| Chat turns | 5/month, hard cap | Keeps cost at $0.06 |
| Mock interviews | 3/month, **3-minute hard cap each** | Keeps cost at $0.40 (Whisper + Opus) |
| Person prep sheets | 2/month | $0.06 |
| Outreach drafts | 1/month | $0.002 |
| Beginner rewrite | Disabled | High output token cost |
| Resume critique | Disabled | Premium feature |
| Structure chat / flashcards / story framer | Disabled | Premium features |
| Per-IP rate limit | 30 LLM calls / hour | Prevents scripted abuse |
| 7-day full-access trial | Optional alternative | Many SaaS use this instead of permanent Free |

**Alternative consideration:** the business plan calls out that "3 guides is too few." A common alternative is **7-day full-access trial → Free tier with 3 guides**. This pulls more conversions because students experience the full product, but doubles Whisper + LLM costs during trial. At 24% conversion, the math is:
- Trial cost (full Pro typical for 1 week): ~$1.50/user
- At 4× free:paid ratio with 24% trial→paid: ~$6 trial cost per converted user ≈ 4% of Season Pass revenue. Worth it for the conversion lift.

**Final verdict:** ship Free as 3 guides + hard caps above. Test 7-day trial as a marketing A/B in October once conversion baseline exists.

---

## 9. Recommendations

### Pricing (launch)

| Tier | Price | Rationale |
|---|---|---|
| Pro Monthly | **$24/mo** | Down from $29 placeholder. Hits 71% margin at typical use; price-sensitive students; preserves Season Pass framing without too much arbitrage. |
| Season Pass | **$149 one-time** | Anchor product, 69% margin, matches Aug–Feb cycle psychology. |
| Pro overage (mocks) | **$1/mock above 30/mo** | Captures power-user value without alienating the 95th percentile. |
| University B2B (pilot) | **$5k/school/year** | First 1–2 schools; case study price. |
| University B2B (list) | **$10k/school/year** | Floor. Margin only works above $10k once activation > 60%. |
| Mentor sessions | $40–120/session, 70/30 split | Per CLAUDE.md, no change. |

### Model routing for launch

**Strategy B with two refinements:**
1. **Mock scoring split:** Opus for behavioral questions, Sonnet for technical. Saves ~30% on mock cost with no perceived quality loss on technical answers.
2. **Resume critique:** keep Opus. Marquee feature, small absolute cost.

| Flow | Launch model |
|---|---|
| Lens explain | Sonnet |
| Beginner rewrite | Sonnet |
| Chat | Sonnet |
| Mock scoring (behavioral) | Opus |
| Mock scoring (technical) | Sonnet |
| Person prep | Sonnet |
| Firm prep | Sonnet |
| Structure chat | Haiku |
| Follow-up draft | Haiku |
| Outreach draft | Haiku |
| Resume critique | Opus |
| Story framing | Sonnet |
| Flashcard gen | Haiku |
| Question gen | Haiku |

### Per-tier usage caps to enforce in code

| Cap | Free | Pro | B2B per student |
|---|---:|---:|---:|
| Guides accessible | 3 | All | All |
| Lens explains/mo | 10 | 200 (soft) | 200 (soft) |
| Chat turns/mo | 5 | Unlimited | Unlimited |
| Mocks/mo | 3 (3min each) | 30 (overage $1) | 30 |
| Person prep sheets/mo | 2 | 20 | 20 |
| Firm prep sheets/mo | 0 | 15 | 15 |
| Resume critiques/mo | 0 | 5 | 5 |
| Story framings/mo | 0 | 10 | 10 |
| Flashcard generations/mo | 0 | 50 | 50 |
| Per-IP rate limit | 30/hr | 200/hr | 200/hr |

### Biggest cost telemetry instrument to build first

**An `llm_usage` table populated on every Claude call**, with columns: `user_id`, `flow_name`, `model`, `cached_input_tokens`, `uncached_input_tokens`, `output_tokens`, `cost_usd`, `created_at`. Roll up daily into a per-user, per-flow dashboard. Without this you cannot:
- Validate the cache hit rate assumptions in §7.1
- Catch a 10x cost regression in days vs next month's bill
- Justify caps to users who hit them ("you've used 28 of 30 mocks")
- Decide where to optimize next quarter

This is week-1 work. Not optional.

### Top 2 cost risks + mitigations

1. **Free-tier abuse.** A motivated free user can burn $5–10/day looping the Reading Lens on a long guide. **Mitigation:** server-side hard caps + per-IP rate limiting + Cloudflare bot protection on `/api/lens/*`. Alert on any user exceeding $0.50/day.

2. **Mock Studio cost explosion at peak season.** Nov–Dec is Superday season. A power-user cluster doing 60+ mocks/month against Opus scoring + Whisper at $0.006/min could push individual user cost above $15. **Mitigation:** the 30-mock cap with $1 overage. Migrate Whisper to Groq before Phase 2 peak.

---

## 10. Open questions for Jake

1. **What is the actual Free→Paid conversion rate you should model?** 24% is aggressive (Notion ~5%, Superhuman ~30% with waitlist friction). For seasonal undergrads with sharp deadline pressure, 15–20% is more realistic. Validate with the 30 user interviews scheduled for June.
2. **What's the realistic mocks-per-user-per-month?** Modeled at 25 (typical) and 60 (power). If real number is 40 typical, all margin numbers compress 8–10 points. Telemetry from the first 100 users in August will answer this.
3. **What B2B activation rate should be assumed?** Modeled at 60% of enrolled students actually using the product. Career-center sales pitches will quote 100%; reality is closer to 30–40% in year 1. Push for usage-based B2B contracts, not flat per-school.
4. **Will you actually offer Pro Monthly, or Season Pass only?** The business plan flags this as an open question. Pro Monthly is a hedge; Season Pass-only is cleaner messaging and higher retention. If Season Pass-only, raise list to $179 and offer a $99 early-bird in May–July to build the waitlist.
5. **What's the in-cycle recharge behavior?** Some Season Pass users will exhaust caps and need an "intensive add-on" in December. Model this? Could be 10–20% of Season Pass buyers paying $29 once for an unlimited month.
6. **How realistic is 50 schools by year-end of cycle 2?** 5 schools by spring is the business plan target. 50 by month 12 is aggressive without a dedicated B2B salesperson. Either drop to 20 schools at 10k/year ($200k) or budget a $4k/mo growth hire starting October.
7. **Is the 90% cache hit rate achievable given how the Reading Lens is structured?** If a user opens 3 guides per session and switches between them, the 5-minute cache TTL may evict before reuse. The architectural answer might be one cached prompt per (user, guide) pair held warm. Worth a spike in MVP week 2.
8. **How will you handle international payments + students without US cards?** Stripe handles it but FX + international card fees push margin down 1.5–2.5pp. For non-US expansion (London, HK in Phase 3), price differently or absorb.

---

*End of analysis. Re-run all numbers against real telemetry once 100 paying users have been on the platform for 30 days. Single biggest assumption to falsify: the per-flow token estimates in §3.*
