---
slug: accounting-linkages
title: Accounting Linkages — The $10 Depreciation Question
description: Walk through what happens to all three financial statements when depreciation increases by $10. The most common technical stress-test in first-round IB interviews.
category: technicals
difficulty: intermediate
readingMinutes: 7
tags: ["accounting", "technicals", "three-statement", "depreciation"]
---

## Why interviewers love this question

"If depreciation increases by $10, walk me through the impact on the three statements." It shows up in nearly every first-round technical screen. Why? Because it tests whether you actually understand how the statements connect, not just whether you memorized their definitions.

A lot of candidates freeze here — not because the math is hard, but because they haven't thought through the direction of each effect. This guide gives you the clean answer and the intuition behind it.

## The setup: assume a 25% tax rate

Interviewers will often give you a tax rate — if they don't, ask for one or state your assumption. We'll use 25% here because it keeps the math clean.

## Walking through each statement

### Income Statement

Depreciation is an operating expense (usually folded into COGS or a separate D&A line). Increasing it by $10 reduces pre-tax income by $10.

Taxes fall by $10 × 25% = **$2.50**. So:

> Net Income = ↓ by $10 − (−$2.50 in taxes) = **↓ by $7.50**

The income statement is hit for the after-tax amount. Companies pay less tax because depreciation is tax-deductible.

### Cash Flow Statement

Here's where the logic gets interesting. The CFS starts with net income — which is down $7.50. But it then adds back D&A (because depreciation is a non-cash expense):

> Operating section: Net income ↓ $7.50, then add back ↑ $10 D&A

Net cash effect from operations: **+$2.50**. That's just the tax shield — you collected $2.50 in tax savings without spending any real cash. No investing or financing activity changes.

### Balance Sheet

Two things happen:

1. **PP&E decreases by $10** — higher depreciation increases accumulated depreciation, which offsets gross PP&E. Net PP&E drops by $10.
2. **Retained earnings decrease by $7.50** — the after-tax hit to net income flows into retained earnings.

Then you pick up $2.50 in cash (from the CFS). So assets: net PP&E is down $10, cash is up $2.50. Net asset change: **−$7.50**.

Liabilities don't change. Shareholders' equity falls by $7.50 (via retained earnings). The balance sheet still balances:

> Assets ↓ $7.50 = Liabilities (unchanged) + Equity ↓ $7.50 ✓

## The clean verbal answer

> "Depreciation increases by $10. On the income statement, pre-tax income falls by $10, tax savings of $2.50 (at 25%), so net income falls $7.50. On the cash flow statement, we start with net income down $7.50 but add back the full $10 of D&A since it's non-cash, so operating cash flow increases by $2.50 — that's the tax shield. On the balance sheet, PP&E is down $10 from higher accumulated depreciation, cash is up $2.50 from the operating cash inflow, and retained earnings are down $7.50. Net assets down $7.50, equity down $7.50 — balances."

Practice that until you can say it in under 60 seconds without checking notes.

## Common variations — same logic, different starting points

### "What if CapEx increases by $10?"

CapEx is a cash outflow, not an income statement expense (at the moment of spend). So:
- Income statement: **no immediate impact**
- CFS investing section: **cash outflows increase by $10**
- Balance sheet: PP&E increases by $10, cash decreases by $10. Net assets unchanged. ✓

The P&L impact comes later as the asset depreciates over its useful life.

### "What if accounts receivable increases by $15?"

- Income statement: no direct impact (revenue was already recognized)
- CFS operations: working capital increase = cash outflow of $15
- Balance sheet: AR up $15, cash down $15. Net assets unchanged. ✓

### "What if you issue $100 of new debt?"

- Income statement: no impact at issuance
- CFS financing: cash inflows of $100
- Balance sheet: cash up $100, long-term debt up $100. Both sides rise equally. ✓

## The key intuition to carry

For any accounting linkage question, the balance sheet will always balance. If you get confused, the check is: total assets change = total liabilities change + total equity change. If that doesn't hold, you missed something.

The other big idea: the income statement and CFS both drive the balance sheet, but they measure different things. The P&L measures accrual-basis performance. The CFS measures actual cash movement. Depreciation is the clearest example of the gap between the two.

## Practice this

Ask a friend to hit you with five accounting linkage scenarios cold — no notes. The common ones: depreciation up/down, CapEx up/down, inventory write-down, debt paydown, stock buyback, goodwill impairment. Being able to trace any of them through all three statements in under a minute is a genuine competitive advantage in technicals.
