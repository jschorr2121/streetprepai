---
slug: precedent-transactions
title: Precedent Transactions Analysis
description: When precedents work and when they don't — how to build a transaction comps analysis, understand control premiums, and use precedents credibly in M&A advisory.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["valuation", "precedents", "M&A", "technicals", "control premium"]
---

## What precedents are measuring

Trading comps tell you what the public market will pay for a minority stake in a company — a few shares, no control. Precedent transactions tell you something different: what an acquirer paid to own and control an entire business.

That difference matters. When a buyer acquires 100% of a company, they're paying for the right to run it — to cut costs, redirect strategy, realize synergies. That control premium typically adds 20–40% above where the stock trades. So precedents will almost always yield higher implied values than trading comps, and that's not a flaw — it's the point.

In M&A advisory, when a banker tells a board "here's what similar companies have been acquired for," they're giving them a real-world anchor for a defensible deal price.

## Building a precedent transactions analysis

### Step 1 — Identify relevant transactions

Precedents are harder to find than public company data. Your sources:
- **Capital IQ or Bloomberg** (subscription-based, available at many universities)
- **SEC filings** — when a public company is acquired, the target files a proxy with the fairness opinion, which often includes precedents
- **News archives and press releases** — for announced deal values

Filter by:
- **Industry** — same sector as your subject company
- **Time frame** — typically the last 3–7 years; older deals may reflect a different rate/multiple environment
- **Size** — comparable revenue or EBITDA scale
- **Deal type** — strategic vs. financial (PE) buyer; strategic buyers often pay more due to synergies

### Step 2 — Calculate transaction multiples

The core formula:

> Transaction EV = Equity Consideration + Assumed Debt − Acquired Cash

> Transaction EV/EBITDA = Transaction EV ÷ Target's LTM EBITDA (at time of deal)

You'll almost always use LTM financials at the time of announcement, not today's financials, because that's what the buyer was pricing at.

The multiples you'll see most:
- **EV/EBITDA** — the primary acquisition multiple in most sectors
- **EV/Revenue** — used for high-growth or pre-EBITDA companies
- **EV/EBIT or P/E** — sometimes used for financial institutions or asset-light businesses

### Step 3 — Spread the data and calculate the range

Build a table: one row per transaction, columns for deal date, acquirer, target, deal value, target EBITDA, and resulting multiple. Calculate the median and 25th–75th percentile range for your set.

Apply the range to your subject company:

> Implied EV = Subject LTM EBITDA × [Precedent Median or Range]
> Implied Share Price = (Implied EV − Net Debt) ÷ Diluted Shares

## When precedents are most credible

Precedents work best when:
- **Lots of comparable transactions exist** — software roll-ups, regional bank M&A, and consumer deals have thick histories. Niche industrials may have two relevant deals in five years.
- **The deal environment was similar** — rates, multiples, and strategic rationale all affect transaction pricing. A deal done in a different credit cycle is a weaker precedent.
- **You can see the full transaction details** — public target acquisitions disclose more than private ones. Private deals often only disclose deal value, not target EBITDA, making multiple calculation impossible.

## When precedents break down

**Thin or stale deal history.** If you have three transactions and the most recent was five years ago in a very different rate environment, the precedent range is weak. Be transparent about this.

**Strategic one-off premiums.** Some acquisitions are driven by unique strategic logic — Disney acquiring Fox primarily for content IP, or Broadcom acquiring VMware for the enterprise software pivot. Multiples in those deals reflect synergies specific to that buyer; applying them broadly overstates what a typical acquirer would pay.

**Different deal structures.** Stock-for-stock deals, contingent payments (earn-outs), and mixed consideration all affect the "real" price. Make sure you're comparing like for like.

**Private transaction opacity.** When the target is private, you may have deal value but no income statement — which means you can't calculate EV/EBITDA. Use what you have and note the gap.

## The control premium

One of the most important concepts to internalize:

> Control Premium = (Deal Price per Share − Unaffected Stock Price) ÷ Unaffected Stock Price

The unaffected price is the stock price before any rumors or announcements. If the stock traded at $40 before the deal and the buyer paid $55, the control premium is 37.5%. This is what you pay for control — the right to capture synergies, change management, or realize strategic value that the market wasn't pricing in.

Typical control premiums in strategic M&A: **20–40%**. PE-backed deals often see lower premiums because financial buyers can't realize as many synergies as strategics.

## How to talk about precedents in an interview

The most common mistake is treating precedents as a precise answer. When asked about the methodology, signal that you understand its limitations:

> "Precedents give us a sense of what acquirers have historically paid for similar businesses, including a control premium. The key limitation is that every deal is different — the buyer's synergy expectations, the rate environment at the time, and the competitive dynamics of the auction all affect the multiple. So I'd use the precedent range as a directional sanity check alongside trading comps and a DCF rather than treating it as definitive."

That answer shows analytical maturity, not just textbook recall.

## Practice this

Look up a recently closed public-company acquisition in an industry you follow. Find the deal value, find the target's most recent 10-K for EBITDA, and calculate the implied EV/EBITDA paid. Then find two or three public peers of the target and compare their current EV/EBITDA trading multiples. Note the control premium implied by the gap. Ask yourself: does the premium make sense given the buyer's strategic rationale?
