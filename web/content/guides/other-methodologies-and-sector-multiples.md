---
slug: other-methodologies-and-sector-multiples
title: Other Methodologies & Sector Multiples
description: Elective valuation approaches beyond comps, precedents, and DCF — sum-of-the-parts, liquidation/NAV, M&A premiums analysis, LBO as a floor, and the industry-specific multiples bankers use instead of EV/EBITDA.
category: technicals
difficulty: advanced
readingMinutes: 10
tags: ["valuation", "sum-of-the-parts", "sector-multiples", "advanced", "technicals"]
---

## Beyond the core three

DCF, trading comps, and precedent transactions cover most valuation conversations, but they don't cover all of them. Some companies are too diversified for a single set of comps to fit. Some are distressed enough that intrinsic cash-flow value doesn't apply. Some sit in industries where standard EBITDA doesn't measure what actually matters. This section covers the elective methods and sector-specific multiples that come up when the standard toolkit doesn't fit the company.

## Sum-of-the-parts (SOTP)

A sum-of-the-parts valuation values each division of a diversified company separately — using the comps, multiples, or growth profile appropriate to that division's industry — then adds the pieces together and nets out corporate-level debt and other shared items to get to a total equity value.

**When to use it:** conglomerates or companies with genuinely distinct business lines that don't share a single comparable set. A single blended multiple applied to a company with one high-growth software division and one mature industrial division will misprice both.

**Why it's a pain:** you need standalone financials for each division, which companies don't always disclose cleanly, and you have to allocate shared corporate costs correctly. It's also the method most likely to conclude "the parts are worth more than the whole" — useful for activist and breakup arguments, but easy to get wrong if the allocation is sloppy.

### Worked example

Say you're valuing a diversified holding company with two segments and $150M of net corporate debt:

- **Industrial Products segment:** $60M EBITDA, industry peers trade at 6.5x EV/EBITDA → implied EV = $60M × 6.5 = **$390M**
- **Specialty Software segment:** $40M EBITDA, industry peers trade at 14.0x EV/EBITDA → implied EV = $40M × 14.0 = **$560M**

Total enterprise value = $390M + $560M = $950M. Subtract $150M of net corporate debt to get equity value of $800M. Divide by 50M diluted shares outstanding: implied share price = **$16.00**.

Compare that to what a single blended multiple would produce. Combined EBITDA is $100M ($60M + $40M). If the market were mistakenly applying an average peer multiple of, say, 9x across the whole company (a rough blend that undersells the software segment's growth), the implied EV would be $900M — equity value $750M, or $15.00 per share. The SOTP approach captures an extra dollar per share by correctly pricing the higher-multiple segment on its own terms rather than averaging it down. That gap is exactly the kind of argument an activist investor or a board considering a spinoff would make.

## Liquidation valuation / Net Asset Value (NAV)

A liquidation valuation estimates what a company's assets would fetch if sold off individually and liabilities were paid down, producing a "floor" value based on the balance sheet rather than earnings power.

**When to use it:** distressed companies, or industries where asset values are more reliable than a going-concern earnings estimate — oil & gas reserves, real estate portfolios, financial institutions with marketable securities. In these contexts it's often called a Net Asset Value model instead — an oil & gas NAV model, for instance, is essentially a DCF of the underlying reserves with no terminal value, since the reserves themselves are finite.

**Why it's usually a floor, not the answer:** for a healthy operating company, liquidation value is almost always far below what the business is actually worth as a going concern — you're throwing away the value of customer relationships, brand, and future growth. It's most credible for companies where the going-concern story is in real doubt.

## M&A premiums analysis

An M&A premiums analysis looks at what acquirers have historically paid over a public target's pre-announcement share price, then applies the median premium to the subject company's own current share price to estimate what a buyer might pay for it.

The mechanics: pull a broad set of public-target transactions (broader than a typical precedent transaction screen, since premiums are less industry-sensitive than deal multiples), and for each one calculate the premium at 1-day, 20-day, and 60-day intervals before the deal was announced — comparing the offer price to the undisturbed trading price at each interval. If a company traded at $40/share the day before a $58/share offer, that's a 45% one-day premium.

**How it differs from precedent transactions:** precedent transactions screen tightly on industry and deal size to get comparable multiples; M&A premiums analysis casts a wider net because it's measuring investor psychology (how much extra will a public shareholder demand to give up control) rather than industry-specific value drivers. It also only works for public targets — private-company acquisitions have no pre-deal trading price to measure a premium against.

## LBO analysis as a valuation floor

A leveraged buyout model isn't usually run to produce a valuation range the way a DCF or comps analysis is. Instead, you fix a target return (an IRR a private equity buyer would need to hit, commonly in the high teens to low twenties) and back-solve for the maximum purchase price that still clears that return given realistic leverage and exit assumptions.

That back-solved price functions as a **floor**: it tells you the price a financial buyer could pay and still hit their return threshold. Because an LBO only captures the value created between entry and exit — not any cash generated along the way that gets used to pay down debt rather than distributed — it tends to produce a lower implied value than a DCF, which credits the business for every year of cash flow in the forecast plus a terminal value. If a strategic buyer is bidding against financial sponsors, the LBO floor tells you roughly the price the sponsors will struggle to beat.

## Sector-specific multiples

Standard EV/EBITDA breaks down in a handful of industries where accounting conventions or business models differ enough that a straight EBITDA comparison misleads. Interviewers in these sectors expect you to know the adjusted metric.

| Sector | Multiple | Why the adjustment |
|---|---|---|
| Retail, restaurants, airlines | EV/EBITDAR | Adds back rent expense (the "R"), so a company that owns its real estate and one that leases it become comparable — otherwise the lessee looks artificially cheaper on EBITDA alone. |
| Oil & gas (exploration & production) | EV/EBITDAX | Adds back exploration expense (the "X"), since some companies expense exploration costs immediately and others capitalize them, distorting EBITDA comparisons. |
| REITs / real estate | Price/FFO, Price/AFFO | Funds From Operations adds back real estate depreciation (a large non-cash charge that doesn't reflect actual value decline) and strips out gains/losses on property sales; AFFO further adjusts for recurring capex, giving a cleaner read of distributable cash. |
| Banks | Price/Tangible Book Value (P/TBV) | Banks are valued on their balance sheet (loans, deposits, capital adequacy) more than an income-statement multiple; tangible book strips out goodwill and intangibles to get to real net asset value. |
| Subscription/media/telecom | EV/Subscriber, EV/User | For early-stage or platform businesses where revenue and EBITDA understate the value of a growing user base, per-subscriber or per-user pricing (drawn from comparable transaction or trading data) becomes the primary lens. |

Enterprise value is the correct pairing for nearly all of these (subscribers, reserves, EBITDAR — all "belong" to the whole capital structure) — the notable exception is P/TBV and P/FFO, which pair with equity value because book value and FFO are already equity-holder metrics.

## Common mistakes

- **Using SOTP when the segments aren't actually different enough.** If two "segments" have similar growth, margins, and end markets, a single blended multiple is fine — SOTP adds effort without adding accuracy.
- **Treating liquidation value as a real valuation for a healthy company.** It's a floor for distressed situations, not a competing estimate of what a going concern is worth.
- **Confusing M&A premiums analysis with precedent transactions.** They use overlapping data but answer different questions — one measures deal multiples, the other measures the premium over an undisturbed price.
- **Forgetting the LBO produces a floor, not a range.** Unlike DCF or comps, an LBO gives you one number (or a narrow band) tied to a required return, not a wide valuation range.
- **Using plain EBITDA in a sector where the adjusted metric is standard.** Quoting EV/EBITDA for an airline or a REIT signals you haven't worked in the sector.

## How interviewers probe this

Sector-specific questions are common if you've expressed interest in that group: "Why do we use EBITDAR instead of EBITDA for restaurants?" or "Why do REITs use FFO instead of net income?" The strongest answers name the specific accounting distortion being corrected — leased vs. owned real estate, non-cash depreciation on appreciating assets — rather than just naming the metric. You may also get "Would an LBO or a DCF give you a higher valuation?" — the expected answer is that the DCF is usually higher, since the LBO only captures value realized at exit. For the core three methodologies these electives sit alongside, see "The football field" and "Valuation methodologies overview" earlier in this chapter.
