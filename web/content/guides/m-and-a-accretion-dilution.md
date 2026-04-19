---
slug: m-and-a-accretion-dilution
title: M&A Accretion / Dilution Analysis
description: The deal math that bankers use every day — how to determine whether an acquisition increases or decreases the buyer's earnings per share, and why it matters to a board.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["M&A", "accretion", "dilution", "EPS", "technicals", "deal math"]
---

## What the analysis is actually asking

When a company announces an acquisition, its board and shareholders ask one immediate question: will this deal make us better off financially? One of the first ways bankers answer that is accretion/dilution analysis — a simple model that asks: after the deal closes, will the acquirer's **earnings per share (EPS)** go up or down?

- **Accretive deal:** Pro forma EPS > standalone EPS (deal adds to earnings per share)
- **Dilutive deal:** Pro forma EPS < standalone EPS (deal subtracts from earnings per share)

This is a first-pass test, not the final verdict. A dilutive deal can still be strategically correct. But the direction matters — it shapes how management sells the deal to shareholders and analysts.

## The three key drivers

Three things determine whether a deal is accretive or dilutive:

### 1. The acquisition price (multiple paid)

The more you pay, the more earnings you need from the target to offset the cost. Paying 15x EBITDA for a target that the market values at 12x EBITDA creates a bigger earnings hole to fill than paying 12x.

### 2. The financing mix

- **Stock deals:** You issue new shares to pay the seller. More shares = lower EPS, all else equal. Whether the deal is accretive depends on your P/E vs. the target's P/E. If you're trading at a higher multiple than you're paying for the target, you're issuing "expensive" currency to buy something "cheap" — generally accretive.
- **Cash deals (debt-financed):** You pay cash, often borrowed. The interest expense on new debt reduces earnings. Whether the deal is accretive depends on whether the target's earnings add-back (after-tax) exceeds the after-tax interest cost.
- **Mixed:** A blend of both, with blended effects.

### 3. Synergies

Cost synergies (headcount, overlapping facilities, vendor consolidation) and revenue synergies (cross-selling) add to pro forma earnings. A deal that looks dilutive on standalone numbers can become accretive once achievable synergies are included. Bankers always model a synergy-adjusted case alongside the base case.

## The math — a simple example

Let's say the acquirer (Buyer Co.) has:
- Shares outstanding: 100M
- Net income: $200M
- Standalone EPS: **$2.00**

The target (Target Co.) has:
- Net income: $50M
- Deal consideration: $600M (12x $50M = one possible framing — in practice, you'd use LTM EBITDA multiples, but EPS math works for illustration)
- Fully financed with debt at a 5% interest rate

**Interest expense from new debt:** $600M × 5% = $30M
**After-tax interest:** $30M × (1 − 25%) = **$22.5M**

**Pro forma net income:** $200M + $50M − $22.5M = $227.5M
**Shares outstanding:** still 100M (no new equity issued)
**Pro forma EPS:** $227.5M ÷ 100M = **$2.275**

Since $2.275 > $2.00, the deal is **accretive by ~$0.275, or about 13.75%**.

## The stock-deal version

If Buyer Co. (trading at 20x P/E, so $2.00 EPS × 20 = $40 stock price) acquires Target Co. by issuing stock valued at $600M:

**New shares issued:** $600M ÷ $40 = **15M new shares**
**Pro forma shares:** 100M + 15M = 115M
**Pro forma net income:** $200M + $50M = $250M (no interest expense, no debt)
**Pro forma EPS:** $250M ÷ 115M = **$2.174**

Since $2.174 > $2.00, the deal is **accretive** — because Buyer Co.'s P/E (20x) is higher than the effective multiple paid for Target Co. ($600M ÷ $50M = 12x). When your stock is expensive relative to what you're buying, stock-for-stock deals tend to be accretive.

Flip it: if Target Co.'s income were $30M and Buyer Co. still paid $600M, new shares outstanding stay at 115M but pro forma NI = $200M + $30M = $230M. Pro forma EPS = $230M ÷ 115M = **$2.00** — exactly flat. This is the **breakeven** point, and it's where the deal price equals the acquirer's P/E applied to the target's earnings.

## What makes a deal dilutive

- You pay a high premium and finance with stock when your own multiple is lower than the price paid
- You take on so much debt that interest expense exceeds the target's contribution to earnings
- You bake in optimistic synergies that never materialize — the deal was accretive on paper, dilutive in reality

## How to answer in an interview

If an interviewer asks "Walk me through an accretion/dilution analysis," structure your answer:

> "I'd start by calculating pro forma earnings — the acquirer's standalone net income plus the target's, adjusted for cost of financing. If it's debt-financed, I'd subtract after-tax interest expense. If it's stock-financed, I'd figure out how many new shares are issued and add them to the denominator. Then I'd compare pro forma EPS to the acquirer's standalone EPS. If pro forma is higher, it's accretive. I'd also run a synergy case to show what happens once cost synergies are included."

That answer shows you understand the mechanics and can explain them clearly.

## One more concept: the earnings yield / cost of debt comparison

There's a quick heuristic for stock deals: compare the **earnings yield of the target** (target earnings ÷ deal price) to the **acquirer's P/E earnings yield** (1 ÷ acquirer P/E). If target earnings yield > acquirer earnings yield, the deal is accretive for stock. Bankers use this as a quick gut-check.

## Practice this

Find a recent M&A deal where the acquirer is a publicly traded company. Look up the buyer's EPS, shares outstanding, and net income. Look up the deal price and the target's approximate net income. Do a quick back-of-the-envelope accretion/dilution assuming all-debt financing at a 5–6% rate. Is the deal accretive or dilutive? Does the press release mention synergies? How would synergies change your answer?
