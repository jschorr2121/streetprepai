---
slug: walk-me-through-a-dcf
title: Walk Me Through a DCF
description: The single most-asked IB technical question. Learn the 4-step structure that turns a messy concept into a crisp 60-second answer.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["DCF", "valuation", "technicals", "must-know"]
---

## Why this question matters

"Walk me through a DCF" is the default technical screen in almost every IB first round. Interviewers aren't looking for the world's most sophisticated model — they want to see that you can structure a clear, confident explanation of how to value a company from first principles.

A good answer has three qualities: **structured** (a recognizable 4-step shape), **crisp** (60-90 seconds, not a lecture), and **honest** (you know what you're estimating vs. what you're observing).

## The 60-second structure

A strong answer follows four moves. Memorize the bones, then practice out loud until they feel natural.

### 1. Project unlevered free cash flow

Start by saying you'd project the company's unlevered free cash flow (UFCF) over an explicit forecast period, usually 5–10 years.

Unlevered free cash flow is the cash the business generates *before* any payments to debt or equity holders. The standard formula:

> UFCF = EBIT × (1 − tax rate) + D&A − CapEx − ΔNWC

You build this by starting from a revenue forecast, applying margins to get to EBIT, tax-affecting it, then adjusting for non-cash items and real cash needs. The forecast rests on assumptions about revenue growth, margins, and reinvestment — and you should be ready to defend each one.

### 2. Discount those cash flows to today

A dollar tomorrow is worth less than a dollar today. You bring each projected year of UFCF back to present value using the **Weighted Average Cost of Capital (WACC)** as the discount rate.

WACC reflects the blended cost of the company's capital structure:

> WACC = (E / V) × Cost of Equity + (D / V) × Cost of Debt × (1 − tax rate)

Cost of equity is usually estimated via CAPM (risk-free rate + beta × equity risk premium). Cost of debt is the yield on the company's existing debt or a synthetic rating-based estimate. The equity and debt weights come from market values, not book.

### 3. Calculate and discount the terminal value

Your explicit forecast only covers a handful of years. Most of the value in a DCF sits in the **terminal value** — what the business is worth from the last forecast year into perpetuity.

Two standard methods:

- **Gordon Growth (perpetuity growth) method**: TV = UFCF_final × (1 + g) / (WACC − g). You pick a perpetual growth rate `g`, typically 2–3% for mature businesses — no higher than long-run GDP.
- **Exit multiple method**: TV = EBITDA_final × an assumed exit multiple (drawn from comparable companies today).

Best practice is to use one and sanity-check with the other. Then discount the terminal value back to today using WACC over the appropriate year count.

### 4. Sum to enterprise value, then bridge to equity

Sum the present values of the explicit forecast UFCFs and the present value of the terminal value. That sum is the **enterprise value**.

To get to **equity value**, bridge: subtract debt, subtract preferred stock and minority interest, add cash. Divide equity value by diluted shares outstanding to get **implied share price** — the number you compare to the current market price.

## How bankers grade your answer

Three things differentiate an A-tier answer from a B-tier one:

1. **You name what you're assuming.** "I'd need assumptions for revenue growth, margins, capex, working capital, WACC, and a terminal-value method." Don't just list steps — signal that you understand the model rests on your judgment.
2. **You use WACC, not cost of equity.** Unlevered cash flows are available to all capital providers, so you must discount at the rate that reflects all of them. Mixing these up is the #1 giveaway that a candidate memorized without understanding.
3. **You know what the terminal value represents.** Being able to articulate *why* a Gordon Growth rate shouldn't exceed long-run GDP (because no company can outgrow the economy forever) separates real understanding from rote recall.

## Common follow-ups to expect

- "What's a reasonable WACC for a mature US consumer staples company?" (7–9% ballpark; be ready to defend with inputs.)
- "How does a higher perpetual growth rate affect the valuation?" (Higher g → higher terminal value → higher enterprise value, very sensitively.)
- "Why wouldn't you use a DCF for an early-stage tech startup?" (Negative or unpredictable cash flows, assumptions compound; relative valuation or revenue multiples more defensible.)
- "Walk me through the differences between levered and unlevered DCF." (Levered uses equity cash flows + cost of equity; unlevered uses UFCF + WACC; unlevered is the standard.)

## Practice this out loud

Set a timer for 90 seconds. Deliver the full structure without notes. Do it three times today. Then record yourself once and listen back — the goal is a clean, unhurried answer that hits all four steps.
