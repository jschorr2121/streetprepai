---
slug: single-step-changes
title: Single-Step Changes
description: The canonical accounting drill — one line item changes, and you walk it through the income statement, cash flow statement, and balance sheet, checking that the balance sheet still balances.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["accounting", "technicals", "three-statement", "drills"]
---

## The drill, and why it's everywhere

"If [line item] changes by $X, walk me through the impact on all three statements" is the single most common technical exercise in IB first rounds. It's not testing whether you've memorized a table — it's testing whether you understand *why* each statement moves the way it does, in the right order, with the right sign.

The reason this drill is so durable is that it forces you to demonstrate the exact mechanic every financial model depends on: one change ripples through three documents, and if you trace it correctly, the balance sheet balances at the end. If it doesn't, you made an error somewhere in the chain — that's the built-in self-check.

## The answer template

Every single-step drill follows the same three-part structure, in this order, every time:

1. **Income statement.** Does this item touch the income statement at all? If yes, walk pre-tax income down to net income, applying the stated tax rate.
2. **Cash flow statement.** Start from net income (or "no change" if the IS wasn't touched), add back anything non-cash, and reflect the direct cash impact of the item itself.
3. **Balance sheet.** Update every account the first two steps imply — the item itself, cash, and retained earnings — then check: does assets = liabilities + equity still hold?

State your tax rate assumption up front if the interviewer doesn't give you one. It keeps the arithmetic clean and shows you know taxes matter here.

## Worked example 1: Depreciation increases by $18 (30% tax rate)

**Income statement.** Depreciation is an operating expense, so pre-tax income falls by $18. Taxes fall by $18 × 30% = $5.40. Net income falls by $18 − $5.40 = **$12.60**.

**Cash flow statement.** Start with net income, down $12.60. Add back the full $18 of depreciation because it's non-cash. Net effect on cash from operations: −$12.60 + $18 = **+$5.40**. That $5.40 is the tax shield — the real cash benefit of a non-cash expense being tax-deductible. No investing or financing activity changes.

**Balance sheet.** PP&E falls by $18 (higher accumulated depreciation). Cash rises by $5.40 (from the CFS). Retained earnings fall by $12.60 (the after-tax hit to net income).

- Assets: −$18 (PP&E) + $5.40 (cash) = **−$12.60**
- Liabilities: unchanged
- Equity: **−$12.60** (retained earnings)

Assets down $12.60 = liabilities unchanged + equity down $12.60. Balances.

## Worked example 2: Deferred revenue decreases by $40 (25% tax rate)

Deferred revenue decreasing means the company is now recognizing previously-collected cash as revenue — a customer received the product or service it had already paid for.

**Income statement.** Revenue rises by $40 (assume no associated COGS for simplicity, as many interviewers will let you). Pre-tax income rises $40. Taxes rise by $40 × 25% = $10. Net income rises by $40 − $10 = **$30**.

**Cash flow statement.** Start with net income, up $30. No cash actually moved this period — the cash arrived in a prior period, when deferred revenue was first recorded. So you need a working capital adjustment: deferred revenue (a liability) is falling, which is a **use** of cash on the operating section, of $40. Net effect: $30 − $40 = **−$10**.

**Balance sheet.** Deferred revenue falls by $40 (liability side). Retained earnings rise by $30 (equity side, from the net income increase). Cash falls by $10 (from the CFS).

- Assets: **−$10** (cash)
- Liabilities: **−$40** (deferred revenue)
- Equity: **+$30** (retained earnings)

Assets down $10 = liabilities down $40 + equity up $30 = −$10. Balances.

This one catches people because it feels backwards — net income goes *up* but cash goes *down*. That's exactly the point of the drill: the income statement and the cash flow statement are measuring different things, and this is the cleanest example of them diverging in opposite directions.

## Worked example 3: A $60 inventory write-down, not cash-tax-deductible (25% tax rate)

Write-downs behave like depreciation on the income statement, but with one real-world wrinkle: because they're one-off, non-recurring events, tax authorities usually don't allow the company to deduct them for cash-tax purposes the moment they're recorded — the deduction only becomes real when the asset is eventually sold or disposed of. For this drill, keep it clean and assume the interviewer wants the standard tax-deductible treatment (the more common convention in a first-round drill); we'll flag the real-world exception at the end.

**Income statement.** The write-down is a $60 non-cash expense. Pre-tax income falls $60. Taxes fall by $60 × 25% = $15. Net income falls by $60 − $15 = **$45**.

**Cash flow statement.** Start with net income, down $45. Add back the full $60 write-down as non-cash. Net effect: −$45 + $60 = **+$15**, the tax shield again.

**Balance sheet.** Inventory falls by $60 (the asset being written down). Cash rises by $15 (from the CFS). Retained earnings fall by $45.

- Assets: −$60 (inventory) + $15 (cash) = **−$45**
- Liabilities: unchanged
- Equity: **−$45** (retained earnings)

Assets down $45 = liabilities unchanged + equity down $45. Balances.

**The real-world nuance, briefly.** If the write-down is genuinely not cash-tax-deductible yet, the $15 in tax savings doesn't hit cash immediately — it creates a deferred tax asset instead, and cash stays unchanged this period. The balance sheet still balances (inventory −$60, DTA +$15, cash unchanged, equity −$45: assets down $45, equity down $45), it's just a different asset absorbing the tax benefit. This distinction is covered fully in [Advanced accounting](/guide/advanced-accounting) — for a first-round drill, stating the simplified version out loud and then noting "in reality this might sit in a deferred tax asset rather than cash" is a strong answer.

## Common mistakes

- **Skipping the tax rate.** Every single-step drill with an income-statement impact needs an explicit or assumed tax rate — state it before you start walking through the numbers.
- **Adding back the after-tax amount instead of the full pre-tax expense on the CFS.** You always add back the *entire* non-cash charge (the full $18, $60, and so on), not the after-tax net income hit — that's how the tax shield shows up correctly.
- **Forgetting the working capital adjustment when cash and revenue recognition are in different periods** (as in the deferred revenue example) — this is the step most candidates drop first under pressure.
- **Not finishing with the balance check.** Always say the final line out loud: assets changed by X, liabilities plus equity changed by X, it balances. It's the single easiest way to show confidence in your own math.

## How interviewers probe this

Expect the tax rate to change between questions — 21%, 25%, 30% — specifically to see if you re-derive the math each time rather than reciting a memorized number. You'll also get asked to run the same item in both directions ("depreciation goes up by $18... now it goes down by $18") to check you're not just pattern-matching one direction. For a version of this drill that chains multiple events together across several years, see [Multi-step scenarios](/guide/multi-step-scenarios).
