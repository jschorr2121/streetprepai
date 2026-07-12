---
slug: sources-and-uses
title: Sources & Uses
description: How the purchase price gets funded — cash-free/debt-free mechanics, minimum cash, fees, and a full worked S&U schedule.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["LBO", "sources-and-uses", "technicals", "purchase-price"]
---

## Why the S&U schedule exists

Once you've picked a target and a purchase price, you need to answer a simple question: where is the money coming from, and where does it all go? The Sources & Uses (S&U) schedule answers exactly that. It's the first table you build in any LBO model, because the "plug" it produces — how much equity the sponsor actually has to write a check for — drives every downstream return calculation.

Structurally it looks like a two-column balance: **Uses** on one side (everything the deal has to pay for), **Sources** on the other (everything funding those payments). The two columns must total to the same number by definition — if they don't, something in your assumptions is wrong.

## Setting the purchase price

The mechanics differ slightly depending on whether the target is private or public.

**Private companies** are usually priced off a multiple of EBITDA, and the deal is typically done **cash-free, debt-free**: the seller keeps the company's existing cash and pays off its existing debt before or at closing, so the buyer is acquiring a clean operating business with no legacy capital structure attached. In this structure, the Uses side is based on **Purchase Enterprise Value** (EV = purchase multiple × EBITDA), because there's no existing cash or debt to adjust for.

**Public companies** are usually priced off a premium to the current (or "undisturbed") share price. These deals are less commonly cash-free, debt-free in a strict sense, so the Uses side is typically based on **Purchase Equity Value** instead — you're buying out all the shares, and the target's existing debt often needs to be refinanced anyway because most debt agreements trigger a mandatory repayment on a change of control. In practice this makes public and private deals converge: even when the old debt is technically "assumed," it functionally gets replaced by new debt sized the same way.

## The Uses side, line by line

- **Purchase price** (Enterprise Value or Equity Value, per the logic above) — almost always the largest line.
- **Refinance existing debt** — if the deal isn't structured cash-free/debt-free, or if change-of-control provisions force a payoff.
- **Transaction fees** — legal, advisory (M&A banker fees), and due diligence costs. Paid upfront in cash at close.
- **Financing fees** — fees paid to arrange the new debt (arrangement fees, original issue discount). Unlike transaction fees, these get capitalized as an asset on the balance sheet and amortized over the life of the debt rather than expensed immediately.

## The Sources side, line by line

- **New debt tranches** — the term loans, notes, and revolver commitment sized off a target leverage ratio (Debt / EBITDA) benchmarked to comparable recent deals.
- **Sponsor equity ("investor equity")** — the plug. Calculated as Total Uses minus every other source. This is the number the PE firm actually has to write a check for, and it's the denominator in every IRR and MOIC calculation later in the model.
- **Excess cash used from the target's balance sheet** — only relevant in a non-cash-free, debt-free deal. The target can contribute any cash above its required minimum cash balance toward funding the deal.
- **Management rollover equity**, if management is reinvesting existing shares rather than cashing out — reduces how much new equity and debt the sponsor needs.

Note that unlike a strategic M&A buyer, a financial sponsor cannot use stock as a source of funds — an LBO by definition is funded with cash (investor equity) and debt only. If a deal is funded entirely with equity and no debt, it's a growth-equity investment, not a leveraged buyout.

## Minimum cash

Even in a cash-free, debt-free deal, the target needs *some* operating cash on day one to run the business — payroll, vendor payments, day-to-day working capital. Deal models handle this by assuming a **minimum cash balance**, often estimated as a percentage of EBITDA or of operating costs (COGS + opex) when the company doesn't disclose a number directly. Whatever cash sits below this threshold is untouchable; whatever sits above it ("excess cash") can be swept into funding the deal or repurchasing shares.

This matters later too — in the debt schedule, the model can only sweep free cash flow toward debt paydown once the minimum cash requirement is satisfied each year.

## Worked example

Assume a private target with $80M of EBITDA, purchased at 8.0x EV/EBITDA, done cash-free, debt-free.

**Assumptions:**
- Purchase multiple: 8.0x → Enterprise Value = 8.0 × $80M = **$640M**
- New debt: 4.5x EBITDA = 4.5 × $80M = **$360M**
- Transaction fees: 2% of Enterprise Value = 2% × $640M = **$12.8M**
- Financing fees: 2% of new debt = 2% × $360M = **$7.2M**

**Uses:**

| Use | Amount |
|---|---|
| Purchase Enterprise Value | $640.0M |
| Transaction fees | $12.8M |
| Financing fees | $7.2M |
| **Total Uses** | **$660.0M** |

**Sources:**

| Source | Amount |
|---|---|
| New debt | $360.0M |
| Sponsor equity (plug) | $300.0M |
| **Total Sources** | **$660.0M** |

Sponsor equity is the plug: $660.0M Total Uses − $360.0M new debt = **$300.0M**. That $300M — not the $640M headline purchase price — is the number that goes into the sponsor's IRR and MOIC math at exit.

Notice the fees didn't just appear from nowhere — they *increased* how much equity the sponsor needed to put in, because Total Uses grew by $20M (fees) while New Debt stayed fixed at the leverage assumption. This is a common interview gotcha: fees make the deal marginally more expensive for the sponsor even though they don't change the price paid to the seller.

## Common mistakes

- **Forgetting that fees increase required equity, not debt.** New debt is sized off the leverage ratio, so any increase in Total Uses (like fees) flows entirely into a bigger equity check.
- **Mixing up transaction fees and financing fees.** Transaction fees are expensed immediately in cash; financing fees are capitalized on the balance sheet and amortized.
- **Assuming public and private deals are fundamentally different.** In practice they converge once you account for change-of-control debt repayment requirements — the difference in required sponsor equity is usually small.
- **Ignoring minimum cash in a non-cash-free, debt-free deal.** Only *excess* cash above the minimum can fund the purchase; the rest stays on the balance sheet.

Once the S&U schedule tells you how much debt is going in, the next step is understanding how that debt is structured and repaid — see [Debt tranches & the debt schedule](/guide/debt-tranches-and-the-debt-schedule).
