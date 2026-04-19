---
slug: lbo-paper-math
title: The Paper LBO — First-Round Math
description: How to structure and solve the paper LBO that gets asked in IB and PE first rounds — with a step-by-step worked example you can practice cold.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["LBO", "paper LBO", "returns math", "IRR", "technicals", "private equity"]
---

## What a paper LBO is

A paper LBO is a simplified leveraged buyout analysis done mentally or on scratch paper — no Excel, no model. An interviewer gives you a set of assumptions and asks you to calculate IRR and/or MOIC on the deal. It shows up in IB first rounds, PE recruiting, and even some superdays.

You don't need to build a full model. You need to estimate equity proceeds at exit and calculate the multiple (MOIC) and annualized return (IRR) the sponsor earns on their equity check.

Knowing how to structure this clearly — even if the arithmetic isn't perfect — is more important than perfect calculation speed.

## The setup: a typical prompt

> "A PE firm buys a company for $500M at 5x LTM EBITDA. They finance the deal with 60% debt and 40% equity. The company grows EBITDA from $100M to $140M over 5 years and the sponsor exits at 6x EBITDA. Debt is $300M at close and is fully paid off at exit. What's the MOIC and approximate IRR?"

This is a typical level of complexity for a first-round prompt. Here's exactly how to solve it.

## Step 1 — Calculate the purchase price and financing

> Purchase Price = $100M × 5x = **$500M**

> Debt at close: $500M × 60% = **$300M**
> Equity check: $500M × 40% = **$200M**

## Step 2 — Calculate exit enterprise value

> Exit EBITDA = $140M
> Exit EV = $140M × 6x = **$840M**

## Step 3 — Calculate equity proceeds at exit

Subtract remaining debt from exit EV. The prompt says debt is fully paid off:

> Equity Proceeds = $840M − $0 = **$840M**

## Step 4 — Calculate MOIC

> MOIC = Equity Proceeds ÷ Equity Invested = $840M ÷ $200M = **4.2x**

## Step 5 — Approximate IRR

You won't have a calculator in an interview. You need to know the IRR ↔ MOIC ↔ years heuristics cold:

| MOIC | 3 Years | 5 Years | 7 Years |
|---|---|---|---|
| 2.0x | ~26% | ~15% | ~10% |
| 2.5x | ~36% | ~20% | ~14% |
| 3.0x | ~44% | ~25% | ~17% |
| 4.0x | ~59% | ~32% | ~22% |
| 5.0x | ~71% | ~38% | ~26% |

A 4.2x MOIC over 5 years sits between the 4.0x and 5.0x rows — interpolate to **roughly 33–34% IRR**.

The interviewer wants to see the right framework and a reasonable estimate, not calculator precision. Say: "4.2x over 5 years, that's approximately 33–34% IRR" and you're fine.

## What if debt isn't fully paid off?

Modify Step 3. If $100M of the original $300M debt remains at exit:

> Equity Proceeds = $840M − $100M = **$740M**
> MOIC = $740M ÷ $200M = **3.7x** — a lower return because more debt remains

The key variable is how much free cash flow the business generates to pay down debt. In a more detailed paper LBO, you'd estimate annual free cash flow and subtract annual debt paydown each year.

## The more detailed version

Some interviewers add a twist: they give you an annual EBITDA figure, a cash conversion rate, and a debt paydown. Here's the extended framework:

1. Year 0: Calculate purchase price, debt, equity
2. Annual debt paydown: EBITDA × Cash Conversion Rate = Free Cash Flow = annual debt paydown (assumes all FCF goes to debt service)
3. Exit year: Debt remaining = Opening debt − (Annual FCF × Years); Exit EV = Exit EBITDA × Exit Multiple; Equity proceeds = Exit EV − Remaining Debt
4. MOIC and IRR as above

If the company generates $60M FCF per year for 5 years and $300M opens:
> Remaining debt = $300M − ($60M × 5) = **$0** (fully paid off)

This matches the first scenario. If FCF is only $40M/year:
> Remaining debt = $300M − ($40M × 5) = **$100M**
> Equity Proceeds = $840M − $100M = $740M
> MOIC = $740M ÷ $200M = **3.7x**

## Four things that drive paper LBO returns

1. **Entry multiple** — Paying 5x vs. 7x for the same company dramatically changes returns. Lower entry multiple = more upside.
2. **Exit multiple** — Buying at 5x and selling at 6x adds multiple expansion. Buying and selling at the same multiple means returns come purely from EBITDA growth and debt paydown.
3. **EBITDA growth** — More growth = higher exit EV. This is where operational value creation shows up.
4. **Debt paydown** — The more FCF used to pay down debt, the more equity accrues to the sponsor.

## Delivering the answer in an interview

Walk through it out loud, step by step:

> "Entry purchase price is $500M — $100M EBITDA times 5x. Financing: $300M debt, $200M equity. At exit: $140M EBITDA times 6x is $840M enterprise value. Debt is fully paid off, so equity proceeds equal $840M. MOIC is 4.2x. Over 5 years, that's roughly 33–34% IRR."

Thirty seconds. Clean. Correct. Delivered without hesitation.

If you made an arithmetic error, don't freeze — correct it and keep moving. Interviewers are watching for how you think, not whether you can multiply perfectly under pressure.

## Practice this

Have a friend give you three different paper LBO prompts using these variables: purchase price, financing mix, EBITDA growth, exit multiple, and a debt paydown assumption. Solve each one cold, out loud, on scratch paper. Time yourself — target under 90 seconds per problem. Do this until 4.2x → ~33% IRR over 5 years feels automatic.
