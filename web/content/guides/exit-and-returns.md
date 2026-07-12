---
slug: exit-and-returns
title: Exit & returns
description: How private equity returns actually get made — IRR versus MoM, the three exit paths, and how to decompose a deal's return into EBITDA growth, multiple expansion, and debt paydown.
category: technicals
difficulty: intermediate
readingMinutes: 6
tags: [private-equity, returns, irr, leveraged-buyouts, valuation]
---

## Why this question comes up

Every private equity interview eventually asks some version of "how do you make money on a deal?" The honest answer is a sponsor buys a company, does something to it for a few years, and sells it. The interesting part — and the part that separates a candidate who has internalized the mechanics from one reciting vocabulary — is being able to say precisely how much of the return came from operating improvement versus financial engineering versus just paying a higher price at exit than you paid at entry.

## IRR versus MoM

**Multiple of money (MoM)**, also called MOIC, is the simplest measure: total cash returned to equity holders divided by total cash invested. A deal that turns $150 million into $480 million produced a 3.2x MoM. It says nothing about time.

**Internal rate of return (IRR)** is the annualized compounding rate that makes the cash flows net to zero. For a single investment and single exit with no interim distributions, it collapses to:

IRR = MoM^(1/years) − 1

These two metrics can disagree, and interviewers love probing that gap. A 3x MoM in three years (roughly 44% IRR) is a dramatically better outcome than a 3x MoM in eight years (roughly 15% IRR), even though the multiple is identical. Conversely, a deal that returns 1.3x in six months has a spectacular IRR but is a rounding error in dollar terms — funds can't live on IRR alone because it doesn't tell you how much capital was actually put to work. This is why funds report both, and why a good candidate flags the tension unprompted: IRR rewards speed, MoM rewards scale, and a fund optimizing purely for one will make different decisions (like flipping a asset in eighteen months) than one optimizing for the other.

## The three exits

A sponsor generally realizes its investment one of three ways:

**Strategic or sponsor-to-sponsor M&A.** The most common exit. A strategic acquirer pays for synergies and may accept a lower return threshold than a financial buyer, so strategics often pay up. A sale to another PE fund ("secondary buyout") is faster to execute and avoids public-market scrutiny, but the buyer is underwriting its own return off your exit price, which caps what they'll pay.

**IPO.** Gives the sponsor liquidity over time rather than in one lump sum — funds typically sell down their stake across several tranches after a lockup, so the "exit" is really a series of partial exits at whatever the market price happens to be on each date. Best suited to companies with the scale, growth story, and governance readiness for public markets; it also exposes the sponsor to market-timing risk it doesn't face in a negotiated sale.

**Dividend recapitalization.** Not a true exit — the company raises new debt and pays a special dividend to the sponsor, letting the fund pull cash out (and boost IRR by pulling a return forward) while retaining ownership. It's a way to de-risk a position and return capital to LPs early, but it releverages the company and reduces the equity cushion, so it only makes sense when the business can safely support more debt.

## Returns attribution: where the money actually came from

Interviewers care less about the exit mechanism than about your ability to explain the return itself. There are three levers in a leveraged buyout:

1. **EBITDA growth** — the business simply got bigger.
2. **Multiple expansion (or contraction)** — the market paid a different multiple of EBITDA at exit than the sponsor paid at entry.
3. **Debt paydown** — free cash flow retired debt over the hold, shifting enterprise value from lenders to equity holders without the business needing to grow at all.

### Worked example

A sponsor buys a company for 8.0x EBITDA on $50 million of EBITDA:

- Entry enterprise value = 8.0 × $50M = **$400M**
- Entry debt = **$250M**, so entry equity check = $400M − $250M = **$150M**

Over a five-year hold, EBITDA grows to $70 million and the company sells at 9.0x. Debt is paid down from $250 million to $150 million.

- Exit enterprise value = 9.0 × $70M = **$630M**
- Exit equity value = $630M − $150M debt = **$480M**

Returns:
- MoM = $480M / $150M = **3.2x**
- IRR = 3.2^(1/5) − 1 = **≈26.2%**

Now decompose the $330M of equity value created ($480M − $150M) into its three sources. Enterprise value grew from $400M to $630M, a $230M increase, which splits into:

- **EBITDA growth effect** (using the entry multiple to isolate it): ($70M − $50M) × 8.0x = **$160M**
- **Multiple expansion effect** (applying the multiple change to the new, larger EBITDA base): $70M × (9.0x − 8.0x) = **$70M**
- Check: $160M + $70M = $230M, matching the EV increase exactly.

Then add the **debt paydown effect**: $250M − $150M = **$100M**.

Total: $160M + $70M + $100M = **$330M**, which reconciles exactly to the equity value created. In this deal, operating performance (EBITDA growth) drove about 48% of the return, multiple expansion contributed about 21%, and deleveraging contributed about 30% — a healthy mix, since two-thirds of the return came from actually improving the business rather than paying-and-praying on multiple or relying on financial engineering alone.

Note the convention: EBITDA growth is priced at the *entry* multiple and multiple expansion is applied to the *exit* EBITDA. Flip that order and the two components change (though their sum won't), so if an interviewer pushes on which convention you used, that's the honest answer — the split is order-dependent, the total isn't.

### Common mistakes

- **Confusing MoM and IRR**, or citing one without the other. Always report both and note the holding period.
- **Forgetting debt paydown as a return source.** Candidates often attribute all value creation to EBITDA growth and multiple expansion and miss that deleveraging alone can be a third to half of the return in a well-levered deal.
- **Getting the attribution math backward** — applying the multiple change to entry EBITDA instead of exit EBITDA, which breaks the reconciliation to total equity value created.
- **Treating a dividend recap as a real exit.** It returns cash but doesn't crystallize the investment; the fund still owns the company and still bears execution risk on the eventual sale.

### How interviewers probe this

Expect a case where they hand you entry and exit EBITDA, entry and exit multiples, and a debt schedule, and ask you to build MoM and IRR from scratch, then break the return into its three components without a template. They're testing whether you actually understand what drives value in a leveraged deal, not whether you memorized a formula — so narrate your assumptions (which multiple you're using for the EBITDA growth slice) as you go.
