---
slug: modeling-test-prep
title: Modeling Test Prep — What to Expect and How to Practice
description: What IB modeling tests actually look like, how to prepare for them efficiently, and the common traps that trip up otherwise strong candidates.
category: modeling
difficulty: intermediate
readingMinutes: 8
tags: ["modeling", "Excel", "modeling test", "technicals", "interview prep"]
---

## When modeling tests appear and why

Most IB Summer Analyst recruiting doesn't include a formal modeling test at the first-round stage — that's more common in second rounds, superdays, and PE recruiting. But some banks use timed modeling tests or case studies as part of the process, and regardless of whether you face one formally, the ability to build quickly and accurately in Excel is a baseline expectation.

The modeling test is also the purest signal of whether you can actually do the job, not just describe it. Being sharp in a behavioral round and shaky in a model is a hard gap to bridge.

## What a typical IB modeling test looks like

Modeling tests in IB recruiting usually fall into one of three formats:

**1. Three-statement model build (45–75 minutes)**
You're given a company's historical income statement and balance sheet (sometimes a few years), a set of assumptions (revenue growth, margin targets, capex as a percentage of revenue, working capital days), and asked to:
- Project the income statement 3–5 years
- Project the balance sheet (linking retained earnings, working capital, PP&E, debt)
- Build a simple cash flow statement that ties together and balances
- Sometimes: build a basic DCF on top

**2. DCF / valuation model (30–60 minutes)**
You're given projected financial data and asked to build a DCF: UFCF calculation, WACC, terminal value (both methods), enterprise value, equity bridge. Sometimes with a sensitivity table.

**3. Comparable companies (20–45 minutes)**
You're given a company and a list of comps with financial data and asked to spread the data, calculate EV and key metrics, and produce a valuation range. Speed and accuracy on financial spreading are what's being tested.

**4. M&A accretion/dilution (30–60 minutes)**
You're given an acquirer and target with basic financials and asked to model the deal: consideration structure, financing assumptions, pro forma net income, and EPS comparison.

**5. LBO model (45–90 minutes — more common in PE recruiting)**
You're given a target's financials, entry assumptions, leverage structure, and exit assumptions, and asked to build a returns model: debt schedule, equity returns, MOIC, and IRR.

## The core Excel skills you need

The modeling test is not primarily a test of financial concept knowledge — it's a test of whether you can execute quickly and accurately in Excel. The people who do well are fast, organized, and methodical.

**Must-know Excel functions:**
- `IF`, `IF(AND(...))`, `IFERROR` — for logic and error handling
- `VLOOKUP`, `INDEX(MATCH(...))` — for lookups across tables
- `SUM`, `SUMIF`, `AVERAGE` — basic aggregation
- `MAX`, `MIN` — for floor/ceiling constraints (e.g., cash balance can't go negative)
- `OFFSET` — sometimes used in dynamic models
- Keyboard shortcuts: F2 (edit cell), F4 (toggle absolute reference $), Ctrl+Shift+End (go to last used cell), Ctrl+[ (trace precedents)

**Model architecture habits:**
- Hard-code assumptions in one place (a clearly labeled inputs section), reference everywhere else — never type the same number twice in a model
- Use consistent colors: blue for hard-coded inputs, black for formulas, green for links to other sheets (this is the standard convention)
- Row and column checks: every balance sheet should have a `check` row that equals Assets − Liabilities − Equity; it should read 0 in every period. If it doesn't, you have an error.

## The most common traps

**The balance sheet doesn't balance.** This is the #1 failure mode. Almost always caused by: failing to link retained earnings correctly (beginning RE + net income − dividends = ending RE), not rolling forward debt correctly, or forgetting to link cash from the CFS to the balance sheet. If your BS doesn't balance, stop and trace the error before continuing.

**Mixing up timing.** Income statement and cash flow items are flows (they occur over a period). Balance sheet items are stocks (they represent a point in time). Confusing beginning vs. end-of-period for rolling balances (debt, retained earnings, PP&E) will break a model.

**Off-by-one errors in links.** When linking beginning-of-period balance to prior period end, students frequently link to the wrong period. Slow down when building the roll-forwards.

**Working capital getting the sign wrong.** An increase in current assets (AR, inventory) is a use of cash — it should be negative in the CFS. An increase in current liabilities (AP) is a source — positive. Getting these signs wrong breaks the CFS.

**Not checking your work.** In a real modeling test, the last 5–10 minutes should be a sanity check: does the balance sheet balance every year? Does the cash flow statement reconcile? Does the DCF output feel reasonable for this type of business?

## How to practice

**Build models from scratch.** Download a real 10-K from a company you know, strip out the financial statements, set up a blank model, and rebuild it from scratch using the historical data to calibrate your assumptions. Then project it forward 5 years. This is the closest thing to a real modeling test.

**Practice timed.** Set a timer and simulate the conditions. Can you build a clean three-statement model in 60 minutes? If not, practice until you can.

**Know the conceptual checks.** Before you submit, check: does net income flow to retained earnings, does cash from CFS equal the change in balance sheet cash, does the balance sheet balance? These three checks will catch most errors.

**Use a build template.** Have a skeleton model (formatted but empty) that you can pull up instantly — with input sections, labeled rows for the income statement, balance sheet, and CFS, and a balance check row pre-built. Building from a blank spreadsheet costs 10 minutes you don't have.

## On the day of the test

Read the instructions carefully before you start. Understand exactly what they're asking for — an outline of what's expected saves costly mid-test pivots.

Work linearly: income statement → cash flow from operations → balance sheet → then check. Don't jump around.

If you hit a snag and can't get the balance sheet to balance, move forward with a manual plug (clearly labeled) and come back — don't spend 30 minutes trying to find one error while leaving everything else empty.

## Practice this

Find a public company's most recent 10-K, copy their income statement and balance sheet for the last two years into Excel, and then project forward three years using simple assumptions (revenue growth of 5%, EBITDA margin flat, capex at 3% of revenue, no change in working capital percentage). Build the CFS, link cash to the balance sheet, and check that everything balances. Time yourself. If you can do that cleanly in 45 minutes, you're in good shape for a standard modeling test.
