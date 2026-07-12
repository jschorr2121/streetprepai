---
slug: football-field-and-interpretation
title: The Football Field
description: How to assemble comps, precedents, and a DCF into a single valuation range, and how to read the resulting chart the way an interviewer expects.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["valuation", "football-field", "comps", "DCF", "technicals"]
---

## What a football field actually is

A football field is a horizontal bar chart that stacks the valuation ranges from every methodology you've run — trading comps, precedent transactions, a DCF, and sometimes others — on top of each other, all on the same per-share (or enterprise value) axis. Bankers name it after the shape: a series of horizontal bars of different lengths, laid one above the other, resembling the yard lines on a football field.

It's the single most common way valuation work gets presented to a client, a board, or a buyer. If you remember nothing else from this chapter, remember this: **a valuation is never a point estimate. It's a range, built from multiple ranges, that overlap in a way that tells a story.**

## Why ranges, not points

Every methodology you've learned produces a range, not a single number, because every methodology depends on a choice you made along the way:

- **Trading comps:** a range because you apply a spread of multiples (say, the 25th percentile to the 75th percentile of your comp set) rather than a single multiple, and because you might run multiple metrics (EV/Revenue, EV/EBITDA, P/E).
- **Precedent transactions:** the same idea, applied to historical deal multiples instead of current trading multiples.
- **DCF:** a range because you sensitize the two inputs that matter most — the discount rate (WACC) and the terminal value assumption (perpetual growth rate or exit multiple) — across a small grid rather than committing to one exact combination.

Presenting a single number invites a false sense of precision. Saying "this company is worth $47.32 per share" implies certainty that no valuation method actually has. Saying "this company is worth $42–$52 per share, with different methodologies clustering in the low-to-mid $40s and mid $50s" is both more honest and more useful — it tells the audience where the real uncertainty sits.

## Assembling the chart

To build a football field, you take the range from each methodology and lay it out as a horizontal bar on a shared price (or EV) axis:

1. **Trading comps bar(s):** typically shown for each metric you used (e.g., a bar for EV/Revenue-implied values, a separate bar for EV/EBITDA-implied values), spanning from the low end to the high end of your comp multiple range applied to the subject company's financials.
2. **Precedent transactions bar:** the range of implied values using the low to high (or 25th-to-75th percentile) of historical deal multiples.
3. **DCF bar:** the range of implied values across your WACC/terminal-value sensitivity grid — usually the widest bar, because it has the most assumption-driven inputs.
4. Any elective methodologies you ran (sum-of-the-parts, LBO floor, 52-week trading range, analyst price targets) get their own bars too.

The bars are stacked vertically, and the eye naturally looks for where they overlap — that overlap zone is the range a banker will point to as "the answer."

## Worked example

Say you're valuing a mid-cap industrial distributor with the following outputs from your analysis:

- **Trading comps (EV/EBITDA):** applying a peer range of 7.5x–9.0x to the company's $180M LTM EBITDA gives an EV range of $1,350M–$1,620M. After subtracting $220M of net debt and dividing by 40M diluted shares, that's an implied share price of **$28.25–$35.00**.
- **Precedent transactions (EV/EBITDA):** applying a deal multiple range of 9.0x–11.0x (higher than trading comps, reflecting the control premium) to the same $180M EBITDA gives an EV range of $1,620M–$1,980M, or an implied share price of **$35.00–$44.00**.
- **DCF:** sensitizing WACC from 8.5%–9.5% and perpetual growth from 2.0%–2.5% gives an enterprise value range of $1,400M–$1,750M, or an implied share price of **$29.50–$38.25**.

Laid out as a football field, the three bars are:

```
Trading Comps        $28.25 -------- $35.00
Precedents                  $35.00 -------- $44.00
DCF                   $29.50 --------------- $38.25
```

Reading this the way an interviewer expects: the overlap zone across all three sits roughly between $29.50 and $35.00 — the low end of precedents overlaps the high end of trading comps and sits inside the DCF range. If someone is negotiating a deal price, $35 looks like a reasonable target: it's at the top of what comps and the DCF support, and near the low end of what a strategic buyer has historically paid. A bid below $28 would look light relative to every methodology; a bid above $44 would be hard to justify with any of the three.

## The valuation hierarchy: which method anchors the conversation

Not every methodology carries equal weight in every conversation — which one "anchors" depends on the context:

- **Sell-side M&A advisory:** precedent transactions and trading comps usually anchor the conversation, because the client wants to know what the market will actually pay. DCF is often shown as a supporting sanity check, not the headline number.
- **Fairness opinions (buy-side or sell-side):** all three methods get equal billing, with the DCF given real weight because the opinion needs to withstand scrutiny on intrinsic value grounds, not just "what the market says today."
- **Strategic planning / internal valuation (no deal pending):** DCF often anchors, since there's no live transaction requiring a market-based defense — the company wants to understand its own intrinsic value.
- **Distressed or highly volatile situations:** trading comps and DCF both become less reliable (thin trading, unstable assumptions), so precedents and asset-based methods (liquidation, NAV) carry more weight.

Knowing which method anchors which conversation — and being able to say why — is a stronger signal in an interview than reciting the mechanics of each method in isolation.

## Common mistakes

- **Presenting a single number instead of a range.** This is the fastest way to look like you don't understand what valuation actually produces.
- **Treating all methodologies as equally reliable in every context.** A DCF anchoring an M&A negotiation, or comps anchoring a long-term intrinsic-value study, both signal you haven't thought about who's using the analysis and why.
- **Ignoring why bars don't overlap.** If your precedent transactions bar comes in below your trading comps bar (unusual, since precedents typically include a control premium), that's a signal worth investigating — maybe the comp set or the transaction set needs a second look — not something to gloss over.
- **Forgetting the DCF is usually the widest bar.** Interviewers expect you to know that DCF ranges are typically the widest of the group because they depend on the most forward-looking assumptions.

## How interviewers probe this

A classic follow-up: "If your DCF says $30–$38 but precedents say $40–$48, which do you trust more?" There's no universally correct answer — the right response walks through the context (is this a live deal? is the DCF built on aggressive assumptions? how strong is the comp set?) rather than picking one method as always superior. You might also get: "Why would precedent transactions imply a lower value than trading comps?" — the expected answer touches on control premium erosion in a down market, a stale or thin precedent set, or unusually rich current trading multiples. For the building blocks behind each bar, see "Trading comps" and "Precedent transactions" in this chapter, and "Walk me through a DCF" in the next.

## Practice this

Take the worked example above and change one assumption: suppose the DCF's perpetual growth rate range shifts up to 2.5%–3.0% instead of 2.0%–2.5%. Recalculate roughly how much the DCF bar's high end moves (terminal value is highly sensitive to the growth rate near the discount rate), and consider whether that changes which methodology anchors your conclusion about a fair deal price.
