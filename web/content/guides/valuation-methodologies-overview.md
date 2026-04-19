---
slug: valuation-methodologies-overview
title: Valuation Methodologies Overview
description: DCF, trading comps, and precedent transactions — what each method measures, when bankers use each one, and how to explain the differences in an interview.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["valuation", "DCF", "comps", "precedents", "technicals"]
---

## Why bankers use multiple methodologies

No single valuation method is right. Each one reflects a different question: what does the business earn intrinsically, what are similar public companies worth today, what have buyers historically paid to acquire similar businesses? Bankers layer all three because the answer that matters — the price a buyer will pay or the range a board will accept — lives somewhere in the overlap.

In practice, bankers present a "football field" chart: a horizontal bar chart showing the valuation range from each methodology. If DCF says $40–$55 per share, trading comps say $38–$52, and precedents say $47–$62, the board gets a visual sense of where the company might trade vs. what a buyer might pay. The deal price needs to fit in that picture.

## The three core methodologies

### DCF — Intrinsic value

A DCF values a business based on its own projected cash flows, discounted back to present value. It's the most theoretically rigorous because it doesn't depend on what the market is doing right now — it's about the fundamental earning power of the business.

**When to use it:** Stable, mature businesses with predictable cash flows — industrials, consumer staples, utilities, established tech. Also useful when comparable companies are scarce or the market is dislocated.

**Strengths:** Captures the specific business, not the market's mood. Forces you to think carefully about growth, margins, and reinvestment.

**Weaknesses:** Garbage in, garbage out. WACC and terminal value assumptions dominate the output. Small changes in either can swing the valuation 20–30%. Also useless for pre-revenue or negative-EBITDA companies.

> Enterprise Value = Σ (UFCF / (1+WACC)^t) + Terminal Value / (1+WACC)^n

For a deeper walkthrough, see the guide "Walk Me Through a DCF."

### Trading Comps — Market-implied value

Trading comps look at what the public equity markets are paying today for similar businesses. You find a set of comparable publicly traded companies, calculate valuation multiples (EV/EBITDA, EV/Revenue, P/E), and apply those multiples to your subject company's financials.

**When to use it:** When you have a decent set of true comps — companies in the same industry, with similar size, growth profile, and margin structure. It's the most direct read of what the market currently values.

**Strengths:** Market-based, current, relatively objective (the numbers are observable).

**Weaknesses:** Reflects market sentiment — inflated during bull markets, depressed during sell-offs. The "right" comp set is always a judgment call, and two analysts can reach different conclusions from the same data.

> EV = LTM EBITDA × Median Comparable EV/EBITDA Multiple

For a detailed build, see the "Trading Comps" guide.

### Precedent Transactions — Acquisition value

Precedent transactions look at what acquirers have actually paid to buy similar companies. M&A deals include a **control premium** — buyers pay above the public market price to get the ability to control the business — so precedents typically yield higher multiples than trading comps.

**When to use it:** M&A advisory contexts — whether you're advising the buy side (is this a fair price to pay?) or the sell side (what should we expect to receive?). Also useful as a sanity check on a DCF.

**Strengths:** Reflects the actual price a strategic or financial buyer paid in the real world, including synergies and control premium.

**Weaknesses:** Every deal is different. The transaction may have been strategic in a unique way, or completed in a different rate environment. Deal data is also harder to obtain than public company data — you often rely on press releases and filings.

> Transaction EV = LTM EBITDA × Comparable Transaction EV/EBITDA Multiple

## When each methodology is most credible

| Situation | Preferred Method |
|---|---|
| Stable cash-flow business, long history | DCF + trading comps |
| High-growth tech, negative FCF | Revenue multiples, comps |
| Sell-side M&A advisory | Precedents + comps, DCF for floor |
| Buy-side fairness opinion | All three, DCF emphasized |
| Distressed company | Liquidation analysis, comps on distressed peers |

## The football field in practice

When bankers present to a board or a buyer, they show all three ranges together. A few patterns to know:

- **Precedents are typically highest** because of the control premium (often 20–40% above trading comp implied values)
- **DCF range is widest** because the assumptions carry the most uncertainty
- **Trading comps are the current market anchor** — the price the stock could realistically trade to without a deal

If a deal price is below what trading comps imply, that's a red flag for the target's board. If it's within the precedents range, the fairness opinion will likely hold.

## How to answer in an interview

A strong answer to "What are the three valuation methodologies and when would you use each?" has:
1. A one-line definition of each
2. A specific use case or limitation
3. The concept that bankers use all three together and show the results in a football field

Don't list definitions robotically. Show that you understand each method is answering a different question about value.

## Practice this

Pick any recent M&A deal in the news. Look up the deal price and, if you can find a financial filing, note the implied EV/EBITDA paid. Then find two or three comparable public companies and look up their current EV/EBITDA trading multiples. The gap between what was paid and where the comps trade is roughly the control premium. Does it feel right for the deal you're looking at?
