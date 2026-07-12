---
slug: the-ev-bridge
title: The EV Bridge
description: How to walk item by item from equity value to enterprise value, why each line item gets added or subtracted, and a full worked bridge.
category: technicals
difficulty: intermediate
readingMinutes: 7
tags: ["enterprise value", "equity value", "ev bridge", "net debt", "technicals"]
---

## Starting point: equity value

You always calculate equity value first, because enterprise value is built from it. For a public company, equity value is straightforward:

> Equity Value = Diluted Shares Outstanding × Current Share Price

(See [Diluted share count](/guide/diluted-share-count) if you need the treasury stock method and if-converted math to get diluted shares right.)

From there, the bridge to enterprise value adds and subtracts a specific set of items. Get comfortable with the standard formula first, then with *why* each piece belongs there — interviewers care more about the why than the memorization.

> Enterprise Value = Equity Value + Total Debt + Preferred Stock + Noncontrolling Interest − Cash & Equivalents

## Two reasons an item enters the bridge

Every item in the bridge earns its place for one of two reasons. Naming which reason applies is what separates a candidate who understands the concept from one who memorized a formula.

**Reason 1: Repayment logic.** Some items represent a claim that has to be settled — immediately or eventually — when someone buys the whole company, and that claim doesn't come out of the target's day-to-day operating cash flow. Debt gets refinanced or repaid at close. Preferred stock usually gets redeemed. Cash, in the opposite direction, is money the buyer effectively gets to keep, offsetting the price. This is the "what would it really cost to buy the whole thing" logic.

**Reason 2: Comparability.** Noncontrolling interest (NCI) isn't a claim the buyer has to settle — it's there so the numerator and denominator of a valuation multiple describe the same slice of the business. If a company owns 80% of a subsidiary, it still reports 100% of that subsidiary's revenue and EBITDA in its consolidated financials. Equity value only reflects the 80% actually owned by the parent's shareholders. Add NCI back to enterprise value and now both the multiple's numerator (EV) and denominator (consolidated EBITDA) represent the same 100% of that subsidiary — otherwise you're pairing 100% of the earnings with only 80% of the value.

## Item by item

**Cash and cash-equivalents (subtract).** Repayment logic, in reverse. A buyer effectively nets this cash against the purchase price — it's cash the buyer receives the moment the deal closes. In theory you should only subtract *excess* cash, above whatever minimum the business needs to operate, but in practice almost everyone subtracts the full balance because splitting out "minimum operating cash" is subjective and hard to standardize across companies.

**Total debt (add).** Repayment logic. Acquisition agreements typically require debt to be repaid or refinanced at close, so it functions as an additional cost layered on top of the equity purchase price.

**Preferred stock (add).** Repayment logic. Preferred pays a fixed dividend and sits ahead of common equity in the capital structure, functioning much like debt. It's also usually redeemed in an acquisition.

**Noncontrolling interest (add).** Comparability logic, as explained above. NCI shows up on the balance sheet within total equity, but it isn't common equity — it belongs to whoever owns the minority stake in the consolidated subsidiary.

## A full worked bridge

A company has:
- Share price: $85
- Diluted shares outstanding: 42,000,000
- Total debt: $1,100,000,000
- Preferred stock: $150,000,000
- Noncontrolling interest: $60,000,000
- Cash & equivalents: $310,000,000

**Step 1 — Equity Value:**
> $85 × 42,000,000 = **$3,570,000,000**

**Step 2 — Bridge to Enterprise Value:**

| Line item | Amount | Direction |
|---|---|---|
| Equity Value | $3,570,000,000 | — |
| + Total Debt | $1,100,000,000 | add |
| + Preferred Stock | $150,000,000 | add |
| + Noncontrolling Interest | $60,000,000 | add |
| − Cash & Equivalents | ($310,000,000) | subtract |
| **Enterprise Value** | **$4,570,000,000** | |

Check the arithmetic: $3,570,000,000 + $1,100,000,000 + $150,000,000 + $60,000,000 − $310,000,000 = $4,570,000,000.

If this company's LTM EBITDA is $457,000,000:
> EV/EBITDA = $4,570,000,000 ÷ $457,000,000 = **10.0x**

Net debt here is $1,100,000,000 − $310,000,000 = $790,000,000. As a shortcut, once you've added preferred and NCI, you can collapse debt and cash into one net-debt line — Enterprise Value = Equity Value + Net Debt + Preferred + NCI = $3,570,000,000 + $790,000,000 + $150,000,000 + $60,000,000 = $4,570,000,000. Same answer, fewer lines to track when you're doing it out loud.

## Common mistakes

**Forgetting that it's diluted equity value, not basic.** Using basic shares understates equity value and therefore the whole bridge — see [Diluted share count](/guide/diluted-share-count).

**Subtracting only part of the cash balance without a stated reason.** Default to subtracting the full balance unless you're explicitly told to net out a minimum operating cash requirement.

**Treating NCI as optional.** It's easy to forget because it's usually the smallest line item, but skipping it means your EV/EBITDA multiple compares 100% of a subsidiary's EBITDA against less than 100% of its value — a real distortion, not a rounding error.

**Confusing which direction preferred stock moves.** It's added, not subtracted — it behaves like debt, not like an asset.

## How interviewers probe this

A common follow-up after you state the formula: "Why do we add debt instead of leaving it out?" or "Walk me through why noncontrolling interest gets added, not subtracted." Don't just recite the line items — explain that debt and preferred get added because of repayment logic (a buyer inherits or settles those claims) and NCI gets added because of comparability (matching a fully consolidated denominator). That distinction is the actual test.
