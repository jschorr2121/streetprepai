---
slug: trading-comps
title: Trading Comps — Comparable Company Analysis
description: How to build a comparable companies analysis from scratch, what multiples matter and why, and how to discuss comps credibly in any IB interview.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["valuation", "comps", "EV/EBITDA", "technicals", "modeling"]
---

## What comps actually tell you

A comparable companies analysis — "trading comps" — answers one question: what is the market paying today for a dollar of earnings (or revenue) from a similar business? If a set of comparable cable companies trades at 8–10x EBITDA, and your subject company is also a cable business with similar growth and margins, that range is a reasonable starting point for its valuation.

Comps are not a precise science. They're an informed judgment about what the market will bear.

## Step 1 — Select your comparable universe

The single hardest step. You want companies that are similar on:
- **Industry and business model** (a streaming company and a cable distributor are not comps, even if both are "media")
- **Size** (a $500M revenue company has a different growth profile than a $20B one)
- **Geography** (international comps trade at different multiples due to risk and growth)
- **Growth and margin profile** (a 30% EBITDA margin company shouldn't be in the same set as a 10% EBITDA margin company without a reason)
- **Capital structure** (asset-light vs. capital-intensive changes EV/EBITDA meaningfulness)

In practice, you'll rarely find more than 5–10 true comps. For niche businesses, you might have 3. That's fine — just be honest about the limitations.

## Step 2 — Spread the financial data

Once you have your comp set, you need to collect key financial metrics for each company. The standard data points:

**Market data (observed)**
- Share price (current or as-of a specific date)
- Diluted shares outstanding
- Market capitalization = share price × diluted shares

**From filings (10-K, 10-Q, earnings releases)**
- LTM (last twelve months) Revenue, EBITDA, EBIT, Net Income, EPS
- NTM (next twelve months, from consensus estimates) versions of the same
- Debt, cash, minority interest, preferred (to calculate enterprise value)

**Enterprise value calculation:**

> EV = Market Cap + Total Debt + Preferred Stock + Minority Interest − Cash

## Step 3 — Calculate multiples

The core multiples you'll use:

| Multiple | Formula | When it's most useful |
|---|---|---|
| EV/Revenue | EV ÷ LTM Revenue | Early-stage or low-margin businesses |
| EV/EBITDA | EV ÷ LTM EBITDA | Most common; capital-structure neutral |
| EV/EBIT | EV ÷ LTM EBIT | When D&A differences matter |
| P/E | Share Price ÷ EPS | Equity-level comparisons |

**EV/EBITDA is the workhorse.** It's capital-structure neutral (uses enterprise value, not equity value) and adds back D&A so you can compare businesses with different depreciation policies on the same footing. Interviewers will expect you to know this multiple cold.

## Step 4 — Benchmark and apply

Once you have multiples for each comp, calculate the median and mean of the set (median is more robust to outliers). Then apply those multiples to your subject company's financials:

> Implied EV = Subject Company LTM EBITDA × Median Comparable EV/EBITDA

> Implied Share Price = (Implied EV − Net Debt) ÷ Diluted Shares Outstanding

In a real model, you'd build a table showing the implied share price at 1-turn increments of the multiple (e.g., 7.0x, 8.0x, 9.0x, 10.0x) to give the client a range, not a point estimate.

## Key nuances that impress interviewers

**LTM vs. NTM:** LTM is backwards-looking (observable), NTM is forward-looking (consensus estimates). Bankers typically show both. For high-growth companies, NTM revenue multiples matter more because the growth trajectory is the story.

**Calendarizing:** If your comp set has different fiscal year-end dates (say one ends in June, one in December), you need to calendarize financials so you're comparing the same period. This is an operational detail that shows you've actually built a comps table.

**Footnoting outliers:** If one company trades at a 15x EV/EBITDA while the rest are 7–9x, don't just average it in. Understand why — a pending acquisition bid? Wildly different growth expectations? Then decide whether to include or exclude it, and be transparent.

**The comp is only as good as its similarity:** When an interviewer asks "what would you say is the most significant risk in your comps analysis?", the right answer is always something about the quality of the comparable set — if the businesses aren't truly alike, the multiples don't translate.

## A word on calendarization and LTM

LTM (Last Twelve Months) is calculated as: most recent annual period + most recent interim period − same interim period from the prior year. So if a company has a December fiscal year-end and you're building comps in October, LTM pulls from the full prior year plus Q1–Q3 of the current year.

> LTM = FY Annual + Q1-Q3 Current Year − Q1-Q3 Prior Year

This is a detail interviewers sometimes probe. Knowing it cold earns you points.

## Practice this

Go to any free financial data source — Capital IQ is available through many university libraries, or use public earnings releases. Pick a well-known company: let's say a major US airline. Identify 4–5 comparable airlines. Pull their market caps, net debt figures, and LTM EBITDA from the most recent annual filing. Calculate EV/EBITDA for each. Note the range and median. Then read the airline's 10-K and see whether their margins and growth profile put them at the high or low end of that range — and why.
