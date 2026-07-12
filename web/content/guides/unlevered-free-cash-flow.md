---
slug: unlevered-free-cash-flow
title: Unlevered Free Cash Flow
description: The full build from revenue to unlevered FCF, what gets excluded and why, and how to treat stock-based compensation correctly.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["unlevered-fcf", "DCF", "working-capital", "technicals"]
---

## What unlevered free cash flow actually measures

Unlevered free cash flow (UFCF) is the cash a business generates from its core operations that is available to *every* capital provider — lenders and shareholders alike — before anyone gets paid. It excludes anything tied to how the company happens to be financed today.

That's the whole point of the "unlevered" label. Two companies with identical operations but different debt loads should produce the same UFCF, because UFCF describes the business, not the balance sheet decisions layered on top of it. That's also why UFCF pairs with WACC (covered in [WACC & cost of equity](/guide/cost-of-capital-and-wacc)) rather than cost of equity — WACC blends the required return of all capital providers, matching the fact that UFCF belongs to all of them too.

## The build, line by line

Start from revenue and work down:

> UFCF = EBIT × (1 − Tax Rate) + D&A − CapEx − ΔNWC

Walk through each piece:

1. **Revenue → EBIT.** Project revenue growth, then apply an operating margin (or forecast COGS and opex separately) to arrive at EBIT — operating income before interest and taxes.
2. **Tax-affect EBIT to get NOPAT.** Multiply EBIT by (1 − tax rate). This is *not* the company's reported tax expense — you're computing the tax the business would owe if it had no debt, since interest tax shields belong to the financing decision, not the operating one.
3. **Add back D&A.** Depreciation and amortization reduced EBIT but never cost the company any cash, so you add it back here.
4. **Subtract the change in net working capital (ΔNWC).** If operating assets (receivables, inventory) grow faster than operating liabilities (payables, deferred revenue), the business is tying up cash to fund growth — that's a cash outflow. If liabilities grow faster, the business is generating cash from its operating cycle — a cash inflow.
5. **Subtract CapEx.** Both maintenance CapEx (keeping existing capacity running) and growth CapEx (adding new capacity) are real cash costs of running and expanding the business.

## What you deliberately leave out — and why

UFCF ignores large chunks of the income statement and cash flow statement on purpose:

- **Net interest expense and income.** These depend on the company's debt and cash balances, which are financing choices, not operating ones. Including them would make UFCF sensitive to capital structure — defeating the purpose.
- **The entire financing section** (debt issuance/repayment, dividends, buybacks, stock issuance). These are transactions with capital providers, not cash the business generates.
- **Most non-recurring items** (gains/losses, impairments, write-downs). A forecast should reflect the business's steady-state cash generation, not one-time noise.

## Stock-based compensation: don't add it back

This is the single most common mistake candidates make. On the cash flow statement, SBC shows up as a non-cash addback, and it's tempting to add it back to UFCF the same way you add back D&A.

Don't. SBC is a real economic cost — it just isn't paid in cash. Every share granted to an employee dilutes existing shareholders' claim on the company's future cash flows. If you add SBC back without any offsetting adjustment, you're valuing the company as if that dilution never happens, which overstates value.

The cleanest treatment in an interview-level model: leave SBC as an expense (don't add it back), or if you do add it back for cleanliness, make sure your diluted share count and equity bridge reflect the resulting dilution. Either way, the shareholders bear the cost somewhere in the model — never let it vanish.

## A fully worked example

Say you're projecting Year 1 for a mid-sized software company:

- Revenue: $400 million
- EBIT margin: 22% → EBIT = $400M × 22% = **$88 million**
- Tax rate: 25%
- D&A: $18 million
- CapEx: $24 million
- Accounts receivable increases by $6 million; accounts payable and deferred revenue together increase by $2 million

Work it step by step:

1. NOPAT = $88M × (1 − 25%) = **$66.0 million**
2. Add back D&A: $66.0M + $18M = **$84.0 million**
3. Change in net working capital: operating assets (AR) rose $6M, operating liabilities rose $2M, so the net use of cash is $6M − $2M = $4M. This reduces cash flow: $84.0M − $4M = **$80.0 million**
4. Subtract CapEx: $80.0M − $24M = **$56.0 million**

**UFCF = $56.0 million.**

Notice CapEx ($24M) exceeds D&A ($18M) — expected for a growing company that's still investing ahead of its depreciation schedule. If CapEx ever fell permanently below D&A for a company still claiming to grow, that would be a red flag worth questioning.

## Common mistakes

- **Adding back SBC without consequence.** Covered above — it's the fastest way to signal you don't understand why UFCF excludes financing effects.
- **Using the company's actual (reported) tax rate instead of the unlevered rate.** If you tax-affect EBIT using a rate that already reflects the interest tax shield, you've smuggled a financing benefit into an unlevered number. Use the tax rate applied to EBIT directly, not the effective rate on pre-tax income.
- **Confusing the sign on working capital.** A common slip: treating an increase in payables as a use of cash instead of a source. Always trace back to the accounting rule — asset up = cash down, liability up = cash up.
- **Forgetting CapEx has two flavors.** Interviewers sometimes probe whether you'd separate maintenance vs. growth CapEx. You don't have to for a quick build, but you should know why it matters: it tells you how much of the company's spend is defensive versus how much is buying future growth.
- **Including one-time items in the forecast.** If last year's cash flow statement shows a lawsuit settlement or a divestiture gain, don't project it forward — UFCF is meant to be recurring and predictable.

If you can rebuild this formula from memory, explain each exclusion in one sentence, and correctly handle the SBC question without prompting, you've cleared the bar most interviewers are testing for on this topic.
