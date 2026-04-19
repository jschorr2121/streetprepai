---
slug: enterprise-value-vs-equity-value
title: Enterprise Value vs. Equity Value
description: The bridge between enterprise value and equity value, why the distinction matters in every valuation context, and the common misconceptions that trip up candidates.
category: technicals
difficulty: beginner
readingMinutes: 6
tags: ["enterprise value", "equity value", "valuation", "technicals", "EV"]
---

## Two different ways to measure a company's worth

This is one of the most frequently tested concepts in IB technical interviews, and it's also one of the most commonly confused. Enterprise value and equity value are measuring different things — and knowing precisely what each represents will sharpen every valuation answer you give.

**Equity value** (also called market capitalization for public companies): the value of the company that belongs to its equity holders.

> Equity Value = Share Price × Diluted Shares Outstanding

**Enterprise value**: the total value of the company, reflecting what it would cost to buy the entire business — including all claims on the assets, not just the equity holders' claim.

> EV = Equity Value + Total Debt + Preferred Stock + Minority Interest − Cash

## The bridge between them

The cleanest way to think about the EV-to-equity bridge is through a simple analogy: imagine you're buying a house.

The **enterprise value** of the house is the total price you have to pay to fully own it — the purchase price on the contract.

If the house has a **mortgage** on it, you have to either assume the mortgage or pay it off. That debt is part of the cost.

When you close, you get to keep the **cash** sitting in the seller's bank account. So cash reduces the net cost.

Now translate this to buying a company:
- The total cost = equity you pay + debt you assume + preferred stock + minority interest − cash you acquire

Rearranging:

> EV − Debt − Preferred − Minority Interest + Cash = Equity Value

Or equivalently:

> Equity Value = EV − Net Debt (where Net Debt = Debt − Cash)

## Why we use EV for most valuation multiples

Most valuation multiples in banking are EV-based: EV/EBITDA, EV/EBIT, EV/Revenue. Here's why: EBITDA is available to all capital providers — debt holders and equity holders alike. So you match it to enterprise value, which also reflects all capital providers.

If you used equity value in the numerator against EBITDA in the denominator, you'd get a metric that varies with capital structure (how much debt a company has), making it hard to compare companies with different leverage profiles.

The exception: **P/E ratio** (Price/Earnings). Net income is the earnings that flow to equity holders only, after interest has been paid to debt holders. So P/E correctly pairs equity value with an equity-level earnings measure.

> Use EV multiples when the metric is pre-interest (EBITDA, Revenue, EBIT)
> Use equity multiples when the metric is post-interest (Net Income, EPS)

Getting this wrong in an interview is a significant flag — it suggests you don't understand the logic behind the metrics, just the formulas.

## Common misconceptions to watch for

**"Enterprise value is always bigger than equity value."** Mostly true, but not always. If a company has more cash than debt (net cash position), EV can be less than equity value. This sometimes happens with cash-rich tech companies.

**"Market cap is what the company is worth."** Market cap is what the equity is worth. If you want to buy the whole business, you need to pay off the debt too — the enterprise value is the true acquisition price.

**"Just use market cap for valuation multiples."** This mistake leads to inconsistent multiples. Two identical companies with different capital structures would show different "valuation" multiples if you used equity value instead of EV.

**"Minority interest is irrelevant."** If a company controls 60% of a subsidiary but consolidates 100% of its financials, the subsidiary's EBITDA fully appears in the parent's consolidated numbers. But 40% of the subsidiary's equity belongs to someone else. So you add minority interest to EV to reflect that you'd need to buy out that stake too.

## A worked example

Company A:
- Share price: $50
- Diluted shares: 100M
- Total debt: $800M
- Cash: $200M
- Preferred stock: $0
- Minority interest: $0

**Equity Value:** $50 × 100M = **$5,000M**
**Net Debt:** $800M − $200M = **$600M**
**Enterprise Value:** $5,000M + $600M = **$5,600M**

If Company A's LTM EBITDA is $560M:
> EV/EBITDA = $5,600M ÷ $560M = **10.0x**

If you had mistakenly used equity value: $5,000M ÷ $560M = 8.9x — a materially different and incorrect answer.

## How to answer in an interview

Interviewers sometimes ask: "Walk me through the bridge from enterprise value to equity value." A clean answer:

> "Enterprise value represents the total value of the business to all capital providers — equity, debt, preferred. To get from EV to equity value, you subtract debt, subtract preferred stock and minority interest, and add back cash. The logic is that when you buy a company, you're paying the equity holders directly but also assuming the debt — so EV is the all-in cost. Equity value is what's left for the shareholders after all prior claims are settled."

## Practice this

Pick three public companies in the same industry and pull their equity value (market cap) and calculate their enterprise value using publicly available balance sheet data. Then calculate EV/EBITDA for each. Notice how the ranking by equity value and the ranking by EV/EBITDA can differ — especially if one company has significantly more or less debt. That difference is exactly what EV is designed to account for.
