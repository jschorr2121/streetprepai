---
slug: income-statement-anatomy
title: The Income Statement
description: The income statement top to bottom, the two-part test for what belongs on it, and why some very real expenses never show up there.
category: technicals
difficulty: beginner
readingMinutes: 7
tags: ["accounting", "income-statement", "technicals", "fundamentals"]
---

## What the income statement actually measures

The income statement (also called the P&L, or profit and loss statement) answers one question: how much money did the business make over a period of time? Not a snapshot — a period. A quarter, a year, sometimes a month. Everything on it describes activity that happened between two dates.

That "over a period" framing is the whole key to understanding the statement. It's also the reason some transactions you'd intuitively expect to see — buying a building, taking out a loan — never appear on it at all. More on that below.

## Reading it top to bottom

A standard income statement flows through five stages:

**Revenue.** The value of goods or services delivered to customers during the period. Recognized when earned, not necessarily when cash is collected — a sale on 60-day credit terms still counts as revenue today.

**Cost of goods sold (COGS) and gross profit.** COGS is the cost directly tied to producing what was sold — materials, direct labor, manufacturing overhead. Revenue minus COGS is gross profit, and gross profit divided by revenue is gross margin, one of the first numbers analysts check to gauge pricing power.

**Operating expenses and operating income.** These are costs that keep the business running but aren't tied to a specific unit sold: R&D, selling and marketing, general and administrative (G&A) costs, and depreciation and amortization (D&A), which is sometimes buried inside COGS or opex rather than broken out. Subtract operating expenses from gross profit and you get operating income, often called EBIT (earnings before interest and taxes).

**Non-operating items.** Between operating income and pre-tax income sits a bucket for things that aren't part of the core business: interest expense on debt, interest income on cash balances, gains or losses on selling an asset, and one-time items like impairment charges or litigation settlements.

**Taxes and net income.** Apply the tax rate to pre-tax income to get the tax provision, and what's left is net income — the bottom line, the number that ultimately flows into retained earnings on the balance sheet.

## The two-part inclusion test

Here's the test interviewers actually want you to be able to state: for an item to appear on the income statement, it has to pass **both** of the following.

1. **It corresponds only to the period being shown.** If you spend money on something that will benefit the company for 15 years, you can't dump the whole cost into this year's income statement — that would badly overstate this year's expenses and understate every year after. Instead you capitalize it on the balance sheet and expense a slice of it each year (that's exactly what depreciation is).

2. **It affects the company's taxable income.** Interest paid on debt is tax-deductible, so it shows up on the income statement. Repaying the debt principal is not tax-deductible — you're just returning cash you borrowed — so it never appears there at all.

Items don't need to be cash to pass this test. Depreciation and stock-based compensation are both non-cash, and both sit squarely on the income statement because they meet the two criteria above.

## What never appears, and why

Run these through the same test and you'll see why they fail:

- **Capital expenditures** — spending on equipment or property lasts for years, so it fails the period-matching test. It hits the balance sheet as an asset and trickles onto the income statement later, as depreciation.
- **Debt principal issuance or repayment** — no tax effect, so it fails test two.
- **Share issuance or buybacks** — moving cash between the company and its shareholders isn't an operating expense or revenue event, and it has no tax effect.
- **Dividends** — paid out of after-tax profit the company already earned; they reduce retained earnings directly, never net income.

## A worked example

Say a company generates $80 million of revenue this year, with $30 million of COGS, $20 million of operating expenses (including $4 million of D&A embedded inside that number), $2 million of interest expense, and a 25% tax rate.

Walk it down:

- Gross profit: $80M − $30M = $50M
- Operating income (EBIT): $50M − $20M = $30M
- Pre-tax income: $30M − $2M interest = $28M
- Tax provision: $28M × 25% = $7M
- Net income: $28M − $7M = **$21M**

If you're asked for EBITDA, add back the $4 million of D&A to EBIT: $30M + $4M = $34M. Interviewers like asking for EBITDA specifically because it strips out both non-cash D&A and financing structure (interest), leaving a cleaner read on core operating performance — which is part of why it's the anchor metric for so many valuation multiples (see [Metrics & multiples](/guide/metrics-and-multiples)).

## Common mistakes

- **Confusing "non-cash" with "doesn't belong here."** Depreciation, amortization, and stock-based comp are all non-cash and all belong on the income statement. Non-cash is not the disqualifier — the two-part test is.
- **Forgetting embedded D&A.** Many companies fold depreciation into COGS or opex instead of breaking it out on its own line. If you're asked to back into EBITDA and you can't find a D&A line, check the cash flow statement — it's always broken out there.
- **Putting CapEx or debt repayment on the income statement.** This is the single fastest way to signal you don't actually understand the inclusion test rather than just having memorized a line-item list.
- **Treating gains/losses as operating.** A gain on selling a building is real income statement income, but it belongs in the non-operating bucket — it isn't part of what the business does day to day, even though it clearly affects taxes and the current period.

## How interviewers probe this

Expect to be handed an unusual line item — a legal settlement, a currency translation gain, a change in a warranty reserve — and asked "does this belong on the income statement, and if so, where?" Run it through the two-part test out loud rather than guessing from memory. Interviewers are listening for the reasoning, not just the right answer. A related favorite is "why doesn't purchasing inventory show up on the income statement?" — the answer is that inventory is an asset swap (cash for inventory) until it's actually sold, at which point it becomes COGS. That mechanic is covered in full in [Working capital & operational items](/guide/working-capital-and-operational-items).
