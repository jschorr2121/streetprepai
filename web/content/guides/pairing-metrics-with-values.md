---
slug: pairing-metrics-with-values
title: Pairing Metrics with Values
description: The funnel rule for matching a financial metric to the right numerator — why EV/EBITDA works, why Equity Value/EBITDA is broken, and the standard pairing table.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["valuation multiples", "enterprise value", "equity value", "EBITDA", "technicals"]
---

## One rule that explains every valuation multiple

Every valuation multiple has a numerator (a value: enterprise value or equity value) and a denominator (a metric: revenue, EBITDA, net income, and so on). Candidates who've only memorized "EV/EBITDA is a thing people use" get stuck the moment they're handed an unfamiliar metric. Candidates who understand the pairing rule can correctly classify any metric they've never seen before, on the spot.

The rule: **look at whether the metric includes interest.**

> If the metric is calculated *before* interest income and interest expense — pair it with Enterprise Value.
> If the metric is calculated *after* interest income and interest expense — pair it with Equity Value.

## The funnel

Picture a company's cash flow as a funnel, starting at revenue at the top and narrowing as it flows down the income statement toward what's left for common shareholders.

At the top of the funnel — revenue, EBIT, EBITDA — no interest has been paid to anyone yet. That cash flow is available to *every* capital provider: debt holders and equity holders alike, because nobody has been paid out yet. A metric measured at this level belongs with Enterprise Value, because EV represents the claims of every capital provider on the business.

Once interest expense gets paid, debt holders are done — they've collected what they're owed and have no further claim. Whatever's left flows only to equity holders. A metric measured after that point (net income, EPS, levered free cash flow) belongs with Equity Value, because equity value represents only the common shareholders' claim.

This is why the rule works structurally, not just as a convention: the numerator and denominator have to represent the same audience. EV represents all-investor claims; EBITDA represents all-investor cash flow. Equity value represents common-shareholder claims; net income represents common-shareholder earnings. Mismatch them and the ratio stops meaning anything.

## Why EV/EBITDA works and Equity Value/EBITDA doesn't

EBITDA sits above interest expense — it's a pre-financing measure of operating profitability. Two companies with identical operations but different amounts of leverage will report the *same* EBITDA, because EBITDA doesn't care how the company is financed.

Enterprise value also doesn't care how the company is financed — recall from [Event impacts on EV & equity value](/guide/event-impacts-on-ev) that swapping debt for equity, on its own, doesn't move EV. So EV/EBITDA is capital-structure-neutral end to end: you can compare two operationally similar companies with wildly different leverage and get a meaningful, apples-to-apples multiple.

Equity Value/EBITDA breaks this. Equity value *does* respond to capital structure — a heavily levered company has a smaller equity value than a lightly levered one with the same enterprise value, purely because more of the business's value is claimed by debt holders instead of shareholders. Pair that shrinking equity value against an EBITDA figure that hasn't moved at all, and two operationally identical companies produce two different multiples, with the difference explained entirely by financing choices that have nothing to do with how well the business runs. The multiple becomes noise dressed up as insight.

### Worked example

Two companies have identical operations: $500,000,000 EBITDA each, and identical enterprise value of $5,000,000,000 (10.0x EV/EBITDA for both — correct, since they're operationally identical).

Company A is unlevered: $0 debt, $5,000,000,000 equity value.
Company B carries $3,000,000,000 of debt: equity value = $5,000,000,000 − $3,000,000,000 = $2,000,000,000.

EV/EBITDA: both **10.0x** — correctly shows these are equivalent businesses.
Equity Value/EBITDA: Company A is $5,000,000,000 ÷ $500,000,000 = 10.0x. Company B is $2,000,000,000 ÷ $500,000,000 = **4.0x**.

Company B doesn't look "cheaper" because its business is worth less — it looks cheaper purely because it's more levered. Anyone using Equity Value/EBITDA to screen for undervalued companies would be fooled by capital structure, not by actual value.

## The exception that proves the rule: P/E

Price/Earnings pairs share price (a per-share expression of equity value) with EPS (a per-share expression of net income). Net income sits below interest expense — it's what's left after debt holders have been paid. That makes P/E the correct equity-value pairing, not an exception to the rule at all: it's the rule working exactly as designed, just phrased on a per-share basis instead of in aggregate dollars.

## The standard pairing table

| Metric | Includes interest? | Pair with |
|---|---|---|
| Revenue | No | Enterprise Value |
| EBIT / Operating Income | No | Enterprise Value |
| EBITDA | No | Enterprise Value |
| Unlevered Free Cash Flow | No | Enterprise Value |
| Net Income / EPS | Yes | Equity Value |
| Levered Free Cash Flow | Yes | Equity Value |

The test for any metric you haven't memorized: would you subtract interest expense and add interest income to arrive at this number? If yes, use Equity Value. If no, use Enterprise Value.

## Common mistakes

**Assuming EV always goes with the "bigger" or more sophisticated-sounding metric.** The pairing has nothing to do with which metric feels more advanced — it's strictly about whether interest has been deducted yet.

**Using EV/Net Income "because EV is the better multiple."** EV is not universally superior; it's the correct choice only when the denominator hasn't been touched by capital structure. Against net income, EV/Net Income double-penalizes leverage — interest has already reduced net income, and EV still contains the debt that generated that interest.

**Forgetting unlevered vs. levered free cash flow are different audiences.** Unlevered free cash flow deliberately excludes interest and scheduled debt paydowns to represent cash available to everyone — pair with EV. Levered free cash flow includes both, representing what's left specifically for equity holders — pair with Equity Value.

## How interviewers probe this

A common trap question: "A company invents a brand-new operating metric — how do you know whether to use EV or equity value with it?" There's no metric-specific answer to memorize; walk through the funnel logic — ask whether the metric includes the impact of interest income and expense. If it doesn't, it's available to every capital provider, so it pairs with Enterprise Value. If it does, only equity holders are left standing, so it pairs with Equity Value. Interviewers are testing whether you can generalize the rule to something you've never seen, not whether you've memorized the table.
