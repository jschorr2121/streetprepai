---
slug: advanced-accounting
title: Advanced Accounting
description: An elective tour of deferred taxes, stock-based comp, leases under ASC 842, impairments, the equity method, LIFO vs FIFO, GAAP vs IFRS, and pensions in brief.
category: technicals
difficulty: advanced
readingMinutes: 12
tags: ["accounting", "advanced", "technicals", "gaap-ifrs"]
---

## Why this section exists

Everything in the core accounting chapter gets you through a standard first-round screen. This section is different — it's the set of topics that shows up when a superday interviewer wants to see if you actually understand accounting beyond drill mechanics, or when a group with heavier technical bar (restructuring, credit, certain coverage groups) wants to push further. None of these need to be reflexive the way single-step drills do; you need enough command of each to hold a two-minute conversation about it.

## Deferred taxes and net operating losses (NOLs)

Every large company keeps two sets of books: one for reporting to shareholders ("book"), and one for the tax authority ("cash tax"). They diverge because of timing differences — accelerated depreciation for tax purposes versus straight-line for reporting purposes is the classic example.

When book taxes exceed cash taxes, a **deferred tax liability (DTL)** builds up — the company is paying less now and will owe more later. When cash taxes exceed book taxes, a **deferred tax asset (DTA)** builds up instead.

The most important DTA driver is the **net operating loss (NOL)**. If a company loses money, it can carry that loss forward to offset future taxable income. Say a company racks up $200 of cumulative pre-tax losses over two rough years; at a 25% tax rate, that creates a $50 DTA — the loss itself isn't an asset, but the future tax savings it enables are. When the company returns to profitability and applies the NOL, the DTA shrinks and cash taxes fall below book taxes for a while.

Practically, most models net the DTA and DTL into a single "net deferred tax asset/liability" line, because only one combined "deferred taxes" line typically appears on the cash flow statement.

## Stock-based compensation (SBC)

SBC is a real expense on the income statement — it dilutes shareholders just as surely as a cash salary would cost the company cash — but it's non-cash, so it gets added back on the cash flow statement, just like depreciation.

The wrinkle: under US GAAP, when employees eventually exercise options or vest shares, the company gets a tax deduction based on the value at that time, which can differ from the value originally expensed. If the stock has appreciated, this creates an *excess tax benefit* that shows up as a deferred tax adjustment. In practice, most models simplify by assuming SBC isn't cash-tax-deductible at all and just running the deferred tax mechanics through — the excess-benefit nuance is more of a "know it exists" fact than something you need to model live in an interview.

## Leases under ASC 842

Before 2019, operating leases were largely off-balance-sheet — a company could lease a building for 15 years and show only the annual rent expense, with no asset or liability recorded. ASC 842 ended that: both operating and finance leases now require a lease asset and a lease liability on the balance sheet, both set equal to the present value of future lease payments.

The two lease types still diverge on the income statement. A **finance lease** splits the payment into interest expense (on the declining lease liability) plus straight-line depreciation of the lease asset — the same mechanics as debt-financing a purchase. An **operating lease** instead shows one constant "lease expense" each period, and the balance sheet lease asset and liability are backed into so that the numbers still tie out. The practical result: total expense recognized over the life of the lease is identical either way, but the pattern (front-loaded for finance leases, level for operating leases) differs.

Interviewers occasionally ask why this distinction still exists if the economics are so similar — the honest answer is that finance leases resemble buying an asset with debt (ownership risk transfers to the lessee), while operating leases resemble genuine renting, and standard-setters wanted the income statement to keep reflecting that difference even after both moved onto the balance sheet.

## Impairments and write-downs

An impairment is a non-cash charge that reduces the book value of an asset — PP&E, goodwill, intangibles — when its fair value falls below its carrying value. Mechanically it behaves like depreciation: it reduces pre-tax income, gets added back on the cash flow statement, and reduces the asset on the balance sheet.

The key difference from depreciation: impairments are usually **not immediately deductible for cash-tax purposes**, because they're one-off, non-recurring events rather than a predictable schedule the tax authority has pre-approved. That means the tax benefit doesn't show up as cash right away — it creates a deferred tax asset instead, which only converts to real cash savings once the asset is actually sold or disposed of. (See the worked example and the simplified-drill convention in [Single-step changes](/guide/single-step-changes).)

## Equity method and noncontrolling interests (NCI)

These two rules answer the same underlying question — how do you account for owning part of another company — at different ownership thresholds.

**Equity method (roughly 20%–50% ownership, "significant influence" but not control).** The parent records Ownership % × subsidiary's net income as a single line on its income statement, then reverses that on the cash flow statement and instead records Ownership % × subsidiary's dividends as the real cash inflow. The logic: without control, the parent can't force the subsidiary to hand over its profits — it only actually receives dividends.

**Consolidation (more than 50% ownership, control).** The parent's financial statements absorb 100% of the subsidiary's revenue, expenses, assets, and liabilities, then subtract out a "noncontrolling interest" line for the portion the parent doesn't own — (1 − ownership %) × subsidiary net income comes out on the income statement, and a corresponding NCI balance sits within equity on the balance sheet, functioning almost like a second, minority shareholders' equity account.

The mental shortcut: below 20%, treat it as a normal investment (mark-to-market or cost). Between roughly 20% and 50%, use the equity method (get a slice of earnings, not consolidated line items). Above 50%, consolidate everything and carve out the minority's share separately.

## LIFO vs. FIFO vs. weighted average

When inventory is purchased at different prices over time, COGS depends on which units you say were sold. **FIFO** (first in, first out) assumes you sell your oldest, typically cheapest inventory first. **LIFO** (last in, first out) assumes you sell your newest, typically priciest inventory first. **Weighted average** recalculates a blended cost per unit continuously.

If prices are rising — the normal case — LIFO produces higher COGS, lower net income, lower ending inventory, and higher cash flow (because reported taxes are lower). FIFO produces the mirror image: lower COGS, higher net income, higher ending inventory, and lower cash flow, because it's paying tax on income that includes stale, cheap-inventory-driven margin.

IFRS bans LIFO outright, viewing it as a way to understate income and defer taxes indefinitely as long as inventory keeps growing. US GAAP still permits all three methods, which is exactly why you'll sometimes see a US company's margins look meaningfully different from an otherwise-comparable international peer for no operational reason — pure accounting-method noise, worth flagging rather than modeling around.

## GAAP vs. IFRS: the deltas that actually come up

Most of US GAAP and IFRS converge on the same economic answer through different mechanics. The differences worth knowing cold:

- **Inventory:** GAAP allows LIFO; IFRS doesn't (above).
- **Leases:** both now put leases on balance sheet, but IFRS treats operating leases like finance leases on the income statement (splitting interest and depreciation), where GAAP still shows one level lease expense for operating leases (above).
- **Convertible bonds:** IFRS generally requires splitting a convertible bond into separate debt and equity components at issuance; GAAP typically keeps it as a single debt instrument unless a cash-settlement feature triggers bifurcation.
- **Development costs:** IFRS allows capitalizing certain development costs once technical feasibility is established; GAAP is stricter and expenses most R&D as incurred.

## Pensions, briefly

Defined-benefit pension plans (still common outside the US and at older US companies) put a pension asset and a pension liability (the "projected benefit obligation") on the balance sheet, and the income statement shows a pension expense built from several components: service cost (benefits earned this period), interest cost (the obligation growing closer to payout), and the expected return on plan assets (netted against the expense). Realized gains and losses on plan assets are typically smoothed over several years rather than recognized immediately, which is part of why pension accounting has a reputation for being arbitrary. For interview purposes, know that pensions create real balance sheet volatility and can meaningfully affect valuation for pension-heavy industrials or legacy manufacturers — the mechanical detail rarely goes deeper than that in a standard process.

## How interviewers probe this

Advanced-accounting questions are usually framed as "why" rather than "walk me through," because the interviewer already assumes you know the mechanics: "why does IFRS ban LIFO?" "why do finance and operating leases still differ on the income statement if they're both on the balance sheet now?" "why doesn't an unrealized gain on equity investments create a cash tax bill?" Answer with the underlying economic logic, not just the rule — that's what separates a candidate who read a glossary from one who understands why the rule exists.
