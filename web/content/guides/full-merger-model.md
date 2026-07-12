---
slug: full-merger-model
title: The Full Merger Model
description: The 8-step build from standalone financials to pro forma EPS, how synergies get layered in, and the three mistakes that break most synergy assumptions.
category: technicals
difficulty: intermediate
readingMinutes: 11
tags: ["M&A", "merger-model", "synergies", "accretion-dilution", "technicals"]
---

## What the model is actually for

A merger model answers one question with a number attached: **does this deal make the buyer's shareholders better or worse off, measured by earnings per share?** Everything else — the purchase price, the financing mix, the goodwill calculation — exists to feed that final comparison. Interviewers who ask you to "walk me through a merger model" aren't asking for a lecture on M&A; they're asking whether you can hold eight sequential steps in your head and explain why each one matters.

## The 8-step build

### Step 1: Determine the purchase price

Value the target the same way you'd value any company — comps, precedent transactions, a DCF — and land on a price. For a public target, that means a per-share offer price built off a control premium to the current share price; for a private target, it's typically framed as an implied equity value.

### Step 2: Determine the consideration mix

Decide how much of the price is cash, debt-funded cash, and stock. This sets the interest rate on any new debt, the foregone interest rate given up on cash used, and the number of new shares issued if stock is part of the mix. (See [Purchase price & consideration](/guide/purchase-price-and-consideration) for how buyers weigh these against each other.)

### Step 3: Project standalone financials for both companies

Pull or build simple projections for the buyer and target independently — revenue, operating income, interest expense, pre-tax income, net income, shares outstanding, and EPS. You don't need a full three-statement build for either company; income statement line items down through EPS are the minimum viable inputs.

### Step 4: Combine the income statements through pre-tax income

Add the buyer's and target's revenue, operating expenses, and operating income line by line. Combine interest income/expense from both companies, then layer in any new interest expense from acquisition debt or lost interest income from cash used. That gets you to **combined pre-tax income**.

A detail that trips people up constantly: apply the **buyer's tax rate** — not the target's, and not some blended average — to the combined pre-tax income to get combined net income. The buyer's tax position governs the combined entity going forward.

### Step 5: Allocate the purchase price and calculate goodwill

Wipe out the target's shareholders' equity, apply asset write-ups, create any new deferred tax liabilities, and solve for the goodwill plug that makes the combined balance sheet balance. (Full mechanics and a worked example live in [Goodwill & purchase price allocation](/guide/goodwill-and-purchase-price-allocation).)

### Step 6: Combine the balance sheets and apply acquisition adjustments

Add the two balance sheets together, then reflect every effect of the deal: cash used to pay for the acquisition goes down, new debt goes up, new shares get added to the equity section, the target's old equity is zeroed out, and the goodwill and write-ups from Step 5 land on the assets side.

### Step 7: Layer in ongoing acquisition effects

A few new items now run through the combined income statement every year: incremental interest expense on new acquisition debt, incremental depreciation and amortization from the asset write-ups (Other Intangible Assets specifically get amortized; goodwill does not), and — critically — any synergies the deal is expected to generate. This is where the model stops being a snapshot and becomes a multi-year projection.

### Step 8: Calculate pro forma EPS, compare to standalone, and sensitize

Divide combined net income (net of every adjustment in Step 7) by the combined share count. Compare that pro forma EPS to the buyer's standalone EPS. If it's higher, the deal is **accretive**; if it's lower, it's **dilutive**. From there you build sensitivity tables — flexing purchase price, cash/debt/stock mix, and synergy levels — to see how robust that conclusion is across scenarios. (Full walkthrough of the accretion/dilution math itself is in [Accretion / dilution mechanics](/guide/m-and-a-accretion-dilution).)

## Synergies: the lever that decides close calls

Synergies are the extra value the combined company can create that neither company could generate alone — the classic "2 + 2 = 5" pitch. They come in two flavors.

**Cost synergies** come from eliminating duplication: consolidating back-office functions, closing overlapping facilities, combining vendor contracts to get better pricing. They're relatively grounded because you can usually point to a specific headcount number or a specific lease that goes away.

**Revenue synergies** come from cross-selling the target's products to the buyer's customer base (or vice versa), or from pricing power gained through combined market share. They're much harder to defend, because there's no historical data point proving customers will actually buy the new combined offering at the assumed rate.

**A worked cost-synergy example.** Union Freight Co. is acquiring Delta Logistics. Union's deal team identifies that 140 of Delta's back-office staff (accounting, HR, IT support) perform work that Union's existing teams can absorb, at an average fully-loaded cost of $95,000 per employee per year.

> Annual cost synergy = 140 × $95,000 = $13,300,000

That $13.3 million reduces combined operating expenses once the roles are eliminated — but it doesn't show up immediately. Severance costs, notice periods, and system migrations mean the savings typically phase in over 12–18 months rather than landing in full on day one.

**A worked revenue-synergy example.** Union also believes it can sell its warehousing services to 10% of Delta's 3,000 existing shipping customers, at an average $22,000 in incremental annual revenue per customer, with a 35% operating margin on that new business.

> Incremental revenue = 3,000 × 10% × $22,000 = $6,600,000
> Incremental operating income = $6,600,000 × 35% = $2,310,000

Notice the second line: the revenue synergy only contributes $2.31 million to operating income, not the full $6.6 million — because delivering that new revenue has real costs attached to it.

## Three classic synergy-modeling pitfalls

1. **Treating revenue synergies as free.** The single most common mistake is dropping the full incremental revenue figure straight into pre-tax income without applying a margin. There's no such thing as revenue with zero associated cost — sales, fulfillment, and support all scale with new business.

2. **Assuming full run-rate synergies from day one.** Integration takes time. Severance obligations, system migrations, and contract wind-down periods mean cost synergies typically ramp over several quarters, and revenue synergies — which depend on actually landing new sales — often take even longer to materialize. A model that shows 100% of synergies in year one is a red flag to anyone reviewing it.

3. **Being systematically overoptimistic, especially on revenue.** Revenue synergies are notoriously unreliable because they depend on customer behavior nobody can fully predict in advance. Disciplined models weight cost synergies more heavily than revenue synergies, and often show a base case with modest or zero revenue synergies alongside an upside case that includes them — rather than baking optimistic revenue assumptions into the headline number.

## Accretion/dilution is the output, not the goal

It's worth repeating: accretion/dilution is not itself a reason to do or not do a deal — it's the scorecard. A dilutive deal can still be strategically correct (the buyer is paying for growth or capability it doesn't have and expects the dilution to reverse within a couple of years), and an accretive deal can still be a bad idea (paying for earnings with debt at any price will eventually look accretive). Bankers use the analysis to frame the deal for the board and investors, and to stress-test how much room the deal has before it stops making financial sense.

## Common mistakes

- **Combining income statements down to net income and stopping there.** You need the acquisition-specific adjustments (incremental interest, incremental D&A, synergies) layered on top before the number means anything.
- **Using the wrong tax rate when combining pre-tax income.** Always the buyer's rate.
- **Skipping the sensitivity step.** A single-scenario "the deal is accretive" answer is weaker than showing how the conclusion holds up (or doesn't) across a range of premiums and synergy assumptions.

Once you're comfortable with the base case, the natural next step is the elective material — exchange ratios, earn-outs, and tax-driven deal structures — covered in [Advanced M&A](/guide/advanced-ma).
