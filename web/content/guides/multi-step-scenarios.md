---
slug: multi-step-scenarios
title: Multi-Step Scenarios
description: How to chain several accounting events together across multiple years, carry balances forward correctly, and answer cumulative versus sequential questions without losing track.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["accounting", "technicals", "three-statement", "drills"]
---

## Why single-step drills aren't the whole test

[Single-step changes](/guide/single-step-changes) teaches you the mechanics of one item moving in isolation. But real interview follow-ups rarely stop at one step — a sharp interviewer will chain several events together: the company borrows money, buys an asset with it, operates for a year, depreciates the asset, then sells it. Each step depends on the state left behind by the step before it.

The skill being tested here isn't new arithmetic — it's whether you can **carry a balance forward** correctly instead of re-deriving each fact from scratch, and whether you can tell the difference between a **cumulative** question ("what's the total impact over both years?") and a **sequential** one ("what's the impact in year two, given what already happened in year one?").

## The discipline: track three running balances

In any multi-step scenario, keep a running tally of exactly three things as you move through each step: the **book value of any asset involved**, the **balance of any debt involved**, and **cumulative retained earnings**. Everything else — cash, taxes, the balance check — falls out of those three once you keep them straight.

## A worked example: borrow, buy, operate, depreciate, sell

Assume a 25% tax rate throughout, and that interest is paid in cash each year it accrues.

### Step 1 — Start of Year 1: borrow $200

The company takes on $200 of long-term debt. No income statement impact at issuance (it's not revenue or an expense). Cash rises $200, debt rises $200. Balances trivially: assets +$200 = liabilities +$200.

### Step 2 — Immediately: buy equipment for $200

The $200 just borrowed is spent on equipment. No income statement impact (this is CapEx, not an expense — it fails the period-matching test from [The income statement](/guide/income-statement-anatomy)). Cash falls $200, PP&E rises $200. Combined with Step 1, cash is back to its starting level, PP&E is $200 higher, and debt is $200 higher.

### Step 3 — Operate through Year 1: pay interest on the new debt

At 5% on $200, interest expense is $10. Pre-tax income falls $10; taxes fall by $10 × 25% = $2.50; net income falls by **$7.50**. Since interest is paid in cash, that $7.50 flows straight through to a $7.50 cash decrease. No balance sheet account other than cash and retained earnings moves.

### Step 4 — End of Year 1: depreciate the equipment

Straight-line over a 10-year life, $200 / 10 = $20 of depreciation. Pre-tax income falls $20; taxes fall $5; net income falls **$15**. On the cash flow statement, add back the full $20 non-cash charge: −$15 + $20 = **+$5** (the tax shield). PP&E falls $20, cash rises $5, retained earnings fall $15.

### Year 1 running balances

| Account | Change in Year 1 |
|---|---|
| PP&E | +$200 − $20 = **$180** |
| Debt | **$200** (unchanged after the initial borrow) |
| Cash | +$200 − $200 − $7.50 + $5 = **−$2.50** |
| Retained earnings | −$7.50 − $15 = **−$22.50** |

Balance check: assets moved by $180 (PP&E) − $2.50 (cash) = +$177.50. Liabilities moved by +$200. Equity moved by −$22.50. $177.50 = $200 − $22.50. Balances.

### Step 5 — Year 2: pay another year of interest and depreciation

Same as Year 1: interest of $10 (net income −$7.50, cash −$7.50), and depreciation of $20 (net income −$15, cash +$5). Notice you must use the *carried-forward* PP&E balance of $180 as your starting point — depreciation is still $20/year on the original $200 basis, but the asset's book value going into Year 2 is $180, not $200. This is the carrying-state discipline in action: get the starting balance wrong and every downstream number is wrong too.

After this step, PP&E's book value is $180 − $20 = **$160**.

### Step 6 — End of Year 2: sell the equipment for $190

Book value at the moment of sale is $160 (carried forward from Step 5 — not $200, and not $180). Gain on sale = $190 − $160 = **$30**.

Income statement: pre-tax income rises $30; taxes rise $7.50; net income rises **$22.50**.

Cash flow statement: net income (+$22.50, including the gain) starts CFO, but the gain gets reversed there (−$30, per [The cash flow statement](/guide/cash-flow-statement-anatomy)), giving −$7.50 in CFO from this item. The full $190 of sale proceeds appears in CFI. Net cash impact: −$7.50 + $190 = **+$182.50** — which should equal book value plus the after-tax gain: $160 + ($30 × 75%) = $160 + $22.50 = $182.50. It matches, which is your arithmetic check.

Balance sheet: PP&E falls the remaining $160 to zero, cash rises $182.50, retained earnings rise $22.50.

### Step 7 — Immediately after: repay the $200 debt

Principal repayment has no income statement impact. Cash falls $200, debt falls $200 to zero.

### Year 2 running balances

| Account | Change in Year 2 |
|---|---|
| Net income | −$7.50 (interest) − $15 (depreciation) + $22.50 (gain) = **$0.00** |
| PP&E | −$20 (depreciation) − $160 (sale) = **−$180** (to zero) |
| Debt | **−$200** (to zero) |
| Cash | −$7.50 (interest) + $5 (depreciation tax shield) + $182.50 (net sale proceeds) − $200 (debt repayment) = **−$20** |

Balance check: assets moved by −$180 (PP&E) − $20 (cash) = −$200. Liabilities moved by −$200 (debt). Equity moved by $0 (net income was flat). −$200 = −$200 + $0. Balances.

## The cumulative-versus-sequential lesson

Two things about this example are worth sitting with, because they're exactly what interviewers are checking for when they chain steps together:

**Net income in Year 2 nets to exactly zero**, even though three real events happened — interest, depreciation, and a gain on sale. If you were asked "what was the net income impact in Year 2?" and answered "zero, nothing happened," you'd be dead wrong about the mechanics even though the number matches. The correct answer walks through all three effects and shows they happen to offset.

**Cash tells a completely different story.** Cash fell $20 in Year 2 despite flat net income — because the debt repayment (a real $200 cash outflow) has zero income statement impact and would be invisible if you only tracked net income.

**Across the full two years, cash and retained earnings converge exactly:** cumulative retained earnings fell $22.50, and cumulative cash also fell $22.50 ($−2.50 in Year 1, −$20 in Year 2). That's not a coincidence — the equipment and the debt both fully round-tripped to zero net change over the two years, so nothing is left "in progress" on the balance sheet to explain a gap between cash and earnings. That's the difference between a sequential question (state at the end of Year 2 alone) and a cumulative one (total change from day zero to the end of Year 2) — they can look very different mid-scenario and converge once every account fully unwinds.

## Common mistakes

- **Re-deriving depreciation from the wrong basis.** Depreciation stays fixed at $20/year (based on original cost), but the *book value* you compare a sale price against is whatever's been carried forward — confusing the two throws off the gain/loss calculation.
- **Forgetting a step's cash flow depends on prior steps.** The interest expense in Year 2 only exists because of the borrowing in Step 1 — if the interviewer says "assume the debt was repaid at the end of Year 1 instead," Year 2 has zero interest expense, and you have to notice that.
- **Answering "cumulative" questions by only reporting the final year's numbers**, or answering "what happened this year" by re-summing every step since day one. Read the question carefully — it will specify one or the other.
- **Skipping the balance check at each step.** Checking assets = liabilities + equity after every single step (not just at the end) is what catches an error before it compounds through five more steps.

## How interviewers probe this

Expect the scenario to be extended live: "now assume they don't sell it — walk me through Year 3" or "what if they'd repaid $50 of debt at the end of Year 1 instead of holding it flat?" You're not expected to have memorized the answer; you're expected to be able to re-run the same disciplined process — track book value, track debt balance, track retained earnings — from wherever the state currently sits. Being asked for both a cumulative total and a single year's isolated impact in the same conversation is common specifically to check you don't conflate the two.
