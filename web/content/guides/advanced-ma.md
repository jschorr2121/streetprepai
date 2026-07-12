---
slug: advanced-ma
title: Advanced M&A
description: Master exchange ratios, collars, earn-outs, deal structure elections, NOL limits under Section 382, and calendarization for advanced M&A interview questions.
category: technicals
difficulty: advanced
readingMinutes: 5
tags: [ma, exchange-ratio, earn-out, section-382, calendarization]
---

## Exchange Ratios and Collars

In a stock-for-stock deal, the acquirer can offer either a **fixed exchange ratio** (a set number of acquirer shares per target share) or a **floating exchange ratio** (a fixed dollar value, with the share count adjusted so the target always receives that value regardless of where the acquirer's stock trades).

A fixed ratio protects the acquirer's share count but exposes the target to acquirer stock-price risk between signing and closing. A floating ratio protects the target's deal value but means the acquirer issues more shares (more dilution) if its stock falls before close.

**Collars** are a middle ground used almost exclusively with fixed-ratio deals. A collar sets a band around the acquirer's stock price within which the exchange ratio stays fixed. Outside the band, the mechanics shift so the deal doesn't blow up if the acquirer's stock moves sharply:

- **Fixed collar**: ratio is fixed inside the band; outside it, the ratio floats to preserve dollar value up to a cap/floor.
- **Walk-away right**: below a certain price, the target can terminate (sometimes acquirer can too), because the deal economics no longer work for one side.

**Worked example**: Acquirer trades at $50/share. Deal is structured as a fixed 0.40x exchange ratio, meaning each target share converts into 0.40 acquirer shares, worth $20.00 at signing. The collar band is $45–$55.

- If acquirer stock falls to $42 (below the $45 floor), the ratio floats up to preserve value: $20.00 / $42.00 = 0.476x, so target holders get more shares to keep the value at roughly $20.00.
- If acquirer stock rises to $60 (above the $55 cap), the ratio floats down: $20.00 / $60.00 = 0.333x, capping the value the target can capture from a runup.
- Inside the band, say the stock sits at $52, the ratio stays fixed at 0.40x, so target holders get 0.40 × $52.00 = $20.80 — slightly more than the signing value, and that's fine, that's the point of a fixed ratio inside the collar.

## Earn-Outs

An earn-out lets the buyer defer part of the purchase price, contingent on the target hitting future performance milestones (usually revenue or EBITDA targets over one to three years). Sellers like earn-outs when they believe in the business more than the buyer does, or when a valuation gap can't be closed any other way. Buyers like them because they reduce upfront cash risk and keep management incentivized post-close.

**Worked example**: Base purchase price is $80 million, plus an earn-out of up to $20 million if the target hits $30 million of EBITDA in year one post-close, prorated down to zero at $24 million or below. Actual year-one EBITDA comes in at $28 million.

- Range is $24M (floor, $0 earn-out) to $30M (target, full $20M earn-out).
- Actual EBITDA is $28M, which is (28 − 24) / (30 − 24) = 4/6 = 66.7% of the way through the range.
- Earn-out payout = 66.7% × $20M = $13.33 million.
- Total consideration to sellers = $80M + $13.33M = $93.33 million.

On the buyer's model, earn-outs are typically booked as a contingent liability at estimated fair value (a probability-weighted, discounted figure) rather than the full $20 million, and that liability gets revalued each period, with changes running through the income statement.

## Deal Structure: Stock, Asset, and 338(h)(10)

- **Stock deal**: buyer acquires target's equity. Target's legal entity, contracts, and liabilities carry over unchanged (including unknown liabilities). Buyer does not get a step-up in the tax basis of target's assets, so no new depreciation/amortization shield — the target's existing tax basis and NOLs carry over, subject to Section 382 limits (below).
- **Asset deal**: buyer acquires specific assets (and assumes only specified liabilities), leaving unwanted liabilities behind. Buyer gets a stepped-up tax basis in the acquired assets, creating new depreciation and amortization deductions that shield future income. Downsides: contracts/licenses often need re-assignment (consent required), and it's typically less attractive to the seller because gain is taxed at the corporate level (and again at the shareholder level if a C-corp distributes proceeds).
- **Section 338(h)(10) election**: available when the target is an S-corp or a subsidiary within a consolidated group, and the buyer acquires stock. It lets both parties elect to treat the transaction as an asset sale for tax purposes even though it's legally a stock purchase. Buyer gets the asset-deal tax benefit (basis step-up, more D&A shield) while the deal still closes with the legal simplicity of a stock purchase (contracts, licenses, and permits don't need to be individually reassigned). It requires joint buyer/seller agreement because it can shift tax liability, and generally only makes sense where the seller's tax cost from an asset-sale treatment is manageable (e.g., no double taxation because there's no C-corp shareholder layer).

## NOLs in Deals: Section 382 Limits

When a target has net operating loss carryforwards, an acquirer wants to know how much of that NOL can actually be used post-close. **Section 382** limits the annual usable NOL after an ownership change (generally, more than 50 percentage points of ownership shifting among 5%-or-greater shareholders within a rolling three-year period).

The annual limit is calculated as:

Annual Section 382 limit = Target's equity value immediately before the ownership change × long-term tax-exempt rate (published monthly by the IRS, generally in the 3–5% range)

**Worked example**: Target has $100 million of NOLs and an equity value of $200 million at the ownership change. Assume the applicable long-term tax-exempt rate is 4.0%.

- Annual limit = $200M × 4.0% = $8 million usable per year.
- To use the full $100M NOL, it would take at least $100M / $8M = 12.5 years, assuming the company has enough taxable income each year to absorb the full $8M and no further ownership changes reset the clock.

This is why NOLs from a distressed or serially-acquired target are often modeled as only partially usable, or as a slow-burn tax shield rather than an immediate offset, in a merger model.

## Calendarization

Public companies often report on non-calendar fiscal years (e.g., fiscal year ending in June or September). When comparing two companies, or building consensus estimates on a common basis, you calendarize their financials by interpolating quarterly or LTM figures onto a standard calendar-year basis.

**Worked example**: Target's fiscal year ends June 30. FY ending June 2026 revenue is $400 million (accrued roughly evenly across quarters at $100M/quarter). You want calendar-year 2026 revenue.

- Calendar 2026 = Q3 FY2026 (Jan–Mar 2026, part of the June FY) + Q4 FY2026 (Apr–Jun 2026) + Q1 FY2027 (Jul–Sep 2026) + Q2 FY2027 (Oct–Dec 2026).
- If each quarter runs $100M in FY2026 and grows to $110M/quarter in FY2027, calendar 2026 = $100M + $100M + $110M + $110M = $420 million.

Skipping calendarization when comparing a June fiscal-year-end company to a December fiscal-year-end peer overstates or understates growth and margin comparisons, since you're not looking at the same underlying calendar period.

## Common Mistakes and How Interviewers Probe This

- Confusing which side a collar protects: interviewers will ask "who bears the risk if the stock falls before close" for fixed vs. floating ratios — know the direction cold.
- Forgetting that 338(h)(10) requires joint election and specific target types (S-corp or consolidated subsidiary) — don't apply it to a generic stock deal.
- Treating NOLs as fully usable post-acquisition; always mention the Section 382 annual limit and the equity-value-times-tax-exempt-rate formula.
- Booking an earn-out at its maximum value instead of a probability-weighted fair value on the buyer's balance sheet.
- Comparing fiscal-year companies without calendarizing — interviewers will hand you two companies with different fiscal year-ends specifically to see if you catch it.
