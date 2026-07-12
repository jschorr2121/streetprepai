---
slug: debt-tranches-and-the-debt-schedule
title: Debt Tranches & the Debt Schedule
description: The tranche taxonomy from revolver to mezzanine, how mandatory and optional paydown work, and the circularity problem interest expense creates in every LBO model.
category: technicals
difficulty: intermediate
readingMinutes: 10
tags: ["LBO", "debt-schedule", "technicals", "leverage"]
---

## Why debt isn't just one line item

A real LBO capital structure is rarely a single loan. Sponsors typically stack several tranches of debt, each with a different lender base, interest rate, seniority, and repayment structure. Understanding the taxonomy — and why lenders accept different terms for different risk — is one of the most commonly tested technical areas in a private equity or leveraged-finance interview.

The general rule: **rate rises as seniority falls.** The most senior, best-secured debt gets paid first in a bankruptcy and therefore commands the lowest rate; the most junior debt takes the most risk and demands the highest rate to compensate.

## The tranche taxonomy

**Revolver** — a revolving credit facility, functionally similar to a corporate credit card. Lowest interest rate of any tranche, floating rate, short tenor (3–5 years), no scheduled amortization, and it sits at the very top of the capital structure. The company draws on it when cash flow falls short of what's needed for interest and mandatory principal payments, and repays it whenever there's excess cash.

**Term Loan A ("TLA")** — bank debt, floating rate, moderate tenor (4–6 years), straight-line amortization (equal principal payments each year, often 10–20% of the original balance annually). Held mostly by conservative commercial banks. Comes with **maintenance covenants** — ongoing financial tests the company must pass every period, like Total Debt / EBITDA staying below a set ratio.

**Term Loan B ("TLB")** — also bank/institutional debt, floating rate, longer tenor (4–8 years), but with only minimal scheduled amortization (often 1% per year) and a large bullet payment at maturity. Slightly higher rate than TLA because lenders get less principal back along the way.

**Senior Notes** — unsecured or senior-subordinated high-yield bonds, fixed rate, longer tenor (7–10 years), bullet repayment (no amortization at all). Held by hedge funds, mezzanine funds, and other high-yield investors rather than banks. Comes with **incurrence covenants** instead — one-time tests triggered by a specific action (like taking on more debt or making an acquisition), rather than an ongoing ratio test.

**Subordinated Notes** — next in line below senior notes, higher fixed rate, similar bullet structure, incurrence covenants, often carries **call protection** — a period during which the company simply cannot redeem the debt early, guaranteeing investors a minimum number of interest payments.

**Mezzanine** — the most junior debt tranche, highest interest rate, longest tenor, and frequently allows interest to be paid **in kind (PIK)** rather than in cash — meaning the interest accrues onto the principal balance instead of being paid out. Mezzanine investors often also receive an equity kicker (warrants or a small equity stake) to compensate for the risk.

| Tranche | Rate | Amortization | Covenant type | Prepayable? |
|---|---|---|---|---|
| Revolver | Lowest, floating | None | Maintenance | Yes |
| Term Loan A | Low, floating | Straight-line | Maintenance | Yes |
| Term Loan B | Higher, floating | Minimal + bullet | Maintenance | Yes |
| Senior Notes | Higher, fixed | Bullet | Incurrence | Usually no |
| Subordinated Notes | Highest fixed (ex-mezz) | Bullet | Incurrence | No (call protection) |
| Mezzanine | Highest | Bullet, often PIK | Incurrence | No |

**Maintenance vs. incurrence covenants**, since interviewers love this distinction: a maintenance covenant is tested every period regardless of what the company does — "EBITDA / interest expense must always exceed 3.0x." An incurrence covenant is only tested when the company takes a specific action — "the company cannot take on more debt if doing so would push leverage above 5.0x." Bank debt uses maintenance covenants because banks want continuous visibility; high-yield debt uses incurrence covenants because bondholders are more passive and only care when the company does something that changes their risk.

## Revolver mechanics

The revolver behaves like an overdraft facility. Each period:

- **If cash flow available for debt repayment is negative** (the company can't cover mandatory obligations from operations), the company **draws** on the revolver to make up the shortfall.
- **If cash flow available for debt repayment is positive**, any revolver balance outstanding gets **repaid first**, before any other tranche receives an optional paydown.

This "revolver first" rule holds throughout the capital structure: within the waterfall of debt repayment, the revolver is repaid before Term Loan A, which is repaid before Term Loan B, and so on down the stack — because that's the seniority order, and it's also usually the order of lowest-to-highest interest rate, so paying down the revolver first is both the safest and the cheapest thing to do with excess cash.

## Mandatory vs. optional paydown

Every period, the debt schedule works through two distinct buckets:

1. **Mandatory repayments** — contractually required regardless of how much cash the company has. Term Loan A's straight-line amortization is the classic example: even in a bad year, the company owes its scheduled 10–15% principal payment. If cash flow can't cover it, the company draws on the revolver to make the mandatory payment.
2. **Optional (voluntary) repayments** — anything left over after mandatory obligations and after maintaining the minimum cash balance gets swept, at the sponsor's discretion, toward paying down additional principal — starting with the revolver, then the most senior prepayable tranche, working down the stack. Bullet tranches like senior notes and subordinated notes generally can't be prepaid this way (or carry a penalty for doing so), so the cash flow sweep effectively only touches the revolver and term loans.

## The circularity problem

Here's the wrinkle that trips up almost everyone building their first debt schedule. Interest expense depends on how much debt is outstanding during the year. The standard convention is to base interest on the **average** of the beginning and ending debt balances, since debt gets paid down throughout the year, not all at once.

But the ending debt balance depends on how much free cash flow was available to repay principal — which depends on net income — which depends on interest expense. You've just defined interest expense in terms of itself. That's a circular reference, and depending on your build, it can make the spreadsheet either fail to calculate or resolve to an unstable, flickering number.

**The workaround:** base interest expense on the **beginning-of-period debt balance only**, rather than the average. This breaks the circularity entirely — the interest expense for the year is now a known quantity as soon as the year starts, calculated purely off last period's ending balance. It's slightly less precise (it doesn't reflect debt paid down mid-year), but it's the standard simplification in timed modeling tests and most interview-level builds. If you do want the more precise average-balance method, you need to explicitly enable iterative/circular calculation in your spreadsheet software and understand that a small error term is now embedded in the model.

## Common mistakes

- **Confusing call protection with prepayment restrictions.** Call protection prevents redeeming the *entire* balance early; prepayment refers to paying down *part* of the principal ahead of schedule. They're related but distinct terms, and interviewers test the difference.
- **Getting the covenant types backwards.** Maintenance = continuous test, tied to bank debt. Incurrence = triggered-by-action test, tied to high-yield debt.
- **Not knowing why the circularity happens.** Be ready to explain *why* averaging beginning and ending balances creates the loop, not just that it does.
- **Assuming the revolver is repaid last.** It's the opposite — the revolver is cheapest and most senior, so both mandatory logic and optional sweeps hit it first.

Once the debt schedule is built out, the next question is how all that leverage translates into returns at exit — see [Exit & returns](/guide/exit-and-returns).
