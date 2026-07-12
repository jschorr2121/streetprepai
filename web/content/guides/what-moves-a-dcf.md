---
slug: what-moves-a-dcf
title: What Moves a DCF
description: Directional drills for every major DCF input — which way cost of equity, WACC, and implied value move, and why, plus the standard sensitivity-table pairs.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["DCF", "WACC", "sensitivity-analysis", "technicals"]
---

## Why interviewers love this question type

Anyone can memorize the [DCF walkthrough](/guide/walk-me-through-a-dcf) and recite formulas. Directional questions — "what happens to WACC if the company takes on more debt?" — test whether you actually understand the mechanics underneath. You can't pattern-match your way through these; you have to reason from the components.

The good news: once you understand what each input represents, the directions mostly fall out logically. Below is a drill through the inputs interviewers ask about most, organized by what changes and why.

## WACC up

**Effect on implied value: down, and the impact is large.** WACC is the discount rate applied to every single cash flow in the model — both the explicit forecast and the terminal value. A higher WACC means every future dollar is worth less today, and because it compounds across every period (and terminal value discounts over the longest horizon of all), a 1-point move in WACC typically swings implied value far more than a 1-point move in revenue growth or margin.

This is the single most consequential lever in a DCF. If an interviewer asks "would a 1% change in the discount rate or a 1% change in revenue growth matter more," the discount rate wins almost every time — it touches everything, not just next year's cash flow.

## Terminal growth rate up

**Effect on implied value: up, and disproportionately so** because terminal growth sits in the denominator of the Gordon growth formula: TV = FCF × (1 + g) / (WACC − g). As `g` approaches WACC, the denominator shrinks toward zero and TV explodes — which is exactly why terminal growth must stay well below WACC and below long-run GDP growth (see [terminal value](/guide/terminal-value)). This sensitivity is also why interviewers standardly pair WACC and terminal growth in a sensitivity table — small moves in either one swing the answer meaningfully.

## More debt in the capital structure

This one is the classic "gotcha" because the answer is genuinely two-directional depending on what you're asked about.

**Effect on WACC: initially down.** Debt is cheaper than equity — interest is tax-deductible, and debt holders take less risk than equity holders, so they demand a lower return. Swapping expensive equity financing for cheaper after-tax debt financing pulls the weighted average down, at least at moderate leverage levels.

**Effect on cost of equity: up.** More debt means more fixed payment obligations ahead of shareholders, so equity holders bear more risk of getting nothing in a downturn. That risk shows up as a higher levered beta (recall the re-levering formula from [WACC & cost of equity](/guide/cost-of-capital-and-wacc)), which pushes cost of equity higher.

**Net effect on WACC as leverage keeps rising: eventually reverses.** At low-to-moderate debt levels, the cheap-debt effect dominates and WACC falls. But keep adding debt and the rising cost of equity (plus a rising cost of debt itself, as lenders start pricing in default risk) eventually overwhelms the tax-shield benefit — WACC bottoms out and then climbs. This U-shape is the core intuition behind the Modigliani-Miller capital structure framework: there's a leverage point that minimizes WACC, not an unlimited "more debt is always cheaper" relationship.

## Smaller company

**Effect on cost of equity and WACC: up.** Smaller companies carry more business risk — less diversified revenue, thinner cushions against a bad quarter, less access to capital in a downturn — so investors demand a higher return to compensate. This shows up empirically as a higher beta and often an added size premium some banks layer on top of CAPM. Same logic applies to companies in emerging markets: more risk, less certainty, higher required return, higher WACC, lower implied value for the same cash flows.

## Front-loaded cash flows

Imagine two companies that generate the identical *total* free cash flow over a 10-year forecast, but Company A earns most of it in year 1 while Company B earns it evenly across all 10 years. Which has the higher implied value?

**It depends on what you're valuing.** Looking only at the explicit forecast period, Company A wins — money today is worth more than money later, so front-loaded cash flows have a higher present value dollar-for-dollar. But a DCF isn't just the explicit period; it also includes terminal value, and terminal value is driven by the *final year's* cash flow. Company B, with its steady cash flow, likely has a much larger final-year FCF than Company A (which front-loaded and tapered off), producing a much larger terminal value. Once you add PV of cash flows + PV of terminal value, Company B usually wins overall, because terminal value tends to dominate the total.

This is a genuinely good interview answer because it shows you understand that a DCF isn't just "sum of discounted cash flows" — it's explicit-period value plus terminal value, and the two components respond differently to timing.

## A quick worked sensitivity table

Take a company with $50 million of Year-1 UFCF projected to a 5-year forecast, growing steadily, with a base case WACC of 9% and terminal growth of 2.5%, producing a base-case implied enterprise value of roughly $850 million. Now flex the two dominant levers:

| WACC \\ Terminal g | 1.5% | 2.5% | 3.5% |
|---|---|---|---|
| 8% | $920M | $1,040M | $1,220M |
| 9% | $780M | $850M | $950M |
| 10% | $670M | $715M | $775M |

Notice two things. First, moving down a column (lower WACC) matters more than moving across a row (higher terminal growth) at any fixed WACC — WACC's reach across the entire model wins out. Second, the swings get *wider* as WACC gets closer to terminal growth (compare the 8%-row spread to the 10%-row spread) — direct evidence of that denominator effect from the Gordon growth formula.

## The standard sensitivity-table pairs

When asked "what would you sensitize in a DCF," these are the pairings interviewers expect:

- **WACC vs. terminal growth rate** — the default pair, because both drive the dominant terminal value.
- **WACC vs. terminal exit multiple** — the alternative when you're using the multiples method for TV instead of Gordon growth.
- **Revenue growth vs. operating margin** — the standard operational pairing, useful when the discount rate and terminal assumptions are already locked and you want to stress-test the business case itself.
- **Discount rate vs. an operational scenario (downside/base/upside case)** rather than a single variable, when the company's assumptions move together in a coherent story (a recession scenario drags down growth, margin, *and* raises the discount rate all at once).

## How interviewers probe this

- They'll ask you to hold everything else constant and flex one variable — resist the urge to hedge with "it depends" unless the direction genuinely is ambiguous (front-loaded cash flows is one of the few cases where it legitimately is).
- They'll test whether you know *why*, not just *which direction*. "WACC goes up" without explaining that it's because it discounts every cash flow, including the terminal value, sounds memorized rather than understood.
- They'll sometimes ask you to rank the impact of several changes by magnitude, not just direction — that's testing whether you know WACC and terminal value dominate operational assumptions like margin or CapEx.

If you can walk through each of these five levers cold, with the mechanism (not just the direction), you've cleared the bar this question type is testing for.
