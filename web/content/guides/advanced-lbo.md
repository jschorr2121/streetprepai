---
slug: advanced-lbo
title: Advanced LBO features
description: A guide to the mechanics interviewers layer onto a base LBO — dividend recaps, management rollover, return waterfalls, add-ons, and PIK interest.
category: technicals
difficulty: advanced
readingMinutes: 6
tags: [lbo, private-equity, capital-structure, returns, advanced-modeling]
---

## Why these features come up

A base-case LBO tests whether you can build a debt schedule and get from entry equity to exit equity. These five features test whether you understand how sponsors actually extract and protect value once the deal is live. Interviewers use them to separate candidates who memorized a template from candidates who understand why a sponsor would ever want a messier structure.

## Dividend recapitalizations

A dividend recap is when the sponsor has the portfolio company raise new debt and pays the proceeds out to itself as a dividend, without selling the business. It doesn't create value — it pulls forward some of the return and de-risks the position by getting cash out of the deal early.

Two mechanical effects to keep straight:

- Cash flows out of the company at the moment of the recap, so it does not compound inside the deal.
- New debt raised increases leverage and interest expense going forward, which lowers free cash flow available for future paydown and slightly reduces terminal equity value relative to a no-recap case.

**Worked example.** A sponsor buys a company for $500 million of enterprise value, funded with $300 million debt and $200 million equity. Three years in, EBITDA has grown and the company raises $100 million of incremental debt, dividending the full amount to the sponsor. At exit two years later (year 5), suppose the business is sold for $700 million enterprise value with $250 million of net debt remaining (the original paydown reduced by the recap add-back).

Exit equity value: $700M − $250M = $450M.

Total equity proceeds to sponsor: $100M (recap, received year 3) + $450M (exit, received year 5).

Without the recap, assume net debt at exit would have been $350M instead (no extra debt raised, same paydown pace), so exit equity would be $700M − $350M = $350M, all received in year 5.

Compare on a multiple-of-invested-capital basis: recap case returns $550M total on $200M invested (2.75x); no-recap case returns $350M on $200M invested (1.75x). The recap case looks better on MOIC alone, but the IRR comparison is what actually matters — getting $100M back in year 3 pulls forward cash and lifts IRR meaningfully even before you look at the year-5 numbers, because that capital is returned two years earlier than it otherwise would be.

## Management rollover and option pools

Sponsors rarely buy 100% of the founder or management team's equity in cash. A rollover means management reinvests a portion of their pre-deal proceeds into the new equity structure, which aligns incentives and reduces the check the sponsor needs to write. If a founder is owed $80 million at close and rolls $20 million into the new entity, the sponsor's cash-out obligation drops by $20 million and the founder now owns a slice of the post-LBO cap table alongside the sponsor.

A management option pool is a separate reserve of equity — typically 8% to 15% of the fully diluted post-close cap table — set aside to incentivize the operating team going forward. It matters in modeling because it dilutes the sponsor's ownership and, in a waterfall, it usually only pays out after the sponsor clears a minimum return hurdle, so it's structured more like a promote than like straight common equity.

## Waterfall returns

A distribution waterfall governs the order in which exit proceeds get paid out among different equity classes — most commonly sponsor preferred equity, sponsor common equity, and a management incentive pool. A simple structure has tiers:

1. Return of capital to preferred/senior equity holders.
2. A preferred return (hurdle), often 8% compounded annually, paid to those same holders.
3. A catch-up tranche that lets the promote holder (management or a GP) close the gap to its target share.
4. Remaining proceeds split per an agreed ratio, e.g., 80/20 between sponsor and management pool.

**Worked example.** Sponsor invests $200M preferred with an 8% hurdle, holds for 4 years, and exit proceeds available for distribution are $500M.

Tier 1 — return of capital: $200M returned, $300M remaining.

Tier 2 — preferred return: 8% compounded for 4 years on $200M is $200M × (1.08^4 − 1) = $200M × 0.3605 = $72.1M, paid next, leaving $227.9M remaining.

Tier 3 — catch-up: assume the agreement gives management a catch-up until they've received 20% of total profit distributed above return of capital ($72.1M + catch-up). Profit distributed so far is $72.1M to the sponsor; a full catch-up to a 20% share means management needs $72.1M / 0.8 × 0.2 = $18.0M, paid from the remaining pool, leaving $209.9M remaining.

Tier 4 — residual split 80/20: sponsor gets $167.9M, management pool gets $42.0M.

Total to sponsor: $200M + $72.1M + $167.9M = $440.0M. Total to management: $18.0M + $42.0M = $60.0M. Check: $440.0M + $60.0M = $500.0M, which matches total proceeds.

## Add-on acquisitions

An add-on (or bolt-on) is a smaller acquisition the portfolio company makes during the hold period, usually funded with a mix of incremental debt and free cash flow, sometimes with additional sponsor equity. The value creation logic is multiple arbitrage: if the platform trades at 10x EBITDA and it acquires a smaller competitor at 6x EBITDA, the acquired EBITDA is immediately worth more once folded into the larger platform, assuming the market applies the platform's multiple to the combined entity at exit. Add-ons also increase absolute EBITDA, which increases enterprise value at a fixed exit multiple even without any multiple expansion. In a model, add-ons show up as a use of cash (or draw on a delayed-draw term loan) in the year they close, plus their contribution to EBITDA and debt paydown capacity from that point forward.

## PIK interest

Payment-in-kind interest accrues to the principal balance of a debt tranche instead of being paid in cash each period. It's common on subordinated or mezzanine debt in more leveraged structures, where the company doesn't have enough free cash flow to service all its interest in cash. Mechanically, if a $50 million PIK note carries a 12% PIK rate, year-end balance is $50M × 1.12 = $56.0M, and the following year's interest accrues on the higher balance: $56.0M × 1.12 = $62.7M. Compounding works against the company (larger principal at exit reduces the sponsor's exit equity dollar-for-dollar) but works for cash flow flexibility during the hold, since none of that interest hits the cash flow statement or draws down the revolver.

### How interviewers probe this

Expect them to ask you to trace the second-order effect, not just define the term: does a dividend recap increase or decrease exit IRR, and why does the answer depend on timing rather than magnitude? Does a bigger option pool help or hurt the sponsor's realized MOIC? What happens to the debt schedule and the equity check if a PIK toggle note flips from PIK to cash-pay in year 3? They are checking whether you can hold two moving pieces — the cash flow statement and the equity waterfall — in your head at once, not whether you can recite a definition.

### Common mistakes

Treating a dividend recap as value creation rather than value extraction and timing. Forgetting that a rollover reduces the sponsor's required equity check, not the total transaction value. Applying a preferred return to the wrong base (it should compound on unreturned capital, not the original investment if any capital has already come back). Ignoring that add-on multiple arbitrage only works if the combined entity actually trades at the platform's multiple at exit, which is an assumption, not a guarantee. And forgetting to add PIK accrual to the ending debt balance each year, which understates leverage and overstates exit equity value.
