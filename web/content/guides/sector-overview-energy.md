---
slug: sector-overview-energy
title: "Sector Overview: Energy"
description: Upstream, midstream, and downstream explained, why commodity price exposure drives valuation, and the reserve-based metrics and terminology to know before you interview.
category: sectors
difficulty: intermediate
readingMinutes: 7
tags: ["energy", "oil-and-gas", "EBITDAX", "commodity-exposure", "sectors"]
---

## What energy actually covers

Energy coverage splits along the physical path oil and gas takes from the ground to the consumer. **Upstream** companies explore for and produce oil and gas — this is exploration & production (E&P), the highest-risk and most commodity-price-sensitive segment. **Midstream** companies transport and store oil and gas — pipelines, storage terminals, processing — and behave more like toll-road businesses, earning fees on volume rather than taking direct commodity price exposure. **Downstream** companies refine crude oil and gas into usable products (gasoline, diesel, petrochemicals) and sell them; this segment is the most standard from a valuation perspective, since refiners look more like traditional manufacturers. Some banks also carve out a separate **power & utilities** or **renewables** practice, which behaves more like a regulated-return industrials business than like the rest of energy.

## Why commodity exposure changes everything

The defining feature of energy — especially upstream — is that a huge share of a company's value depends on a price it doesn't control: the price of oil or gas. A well-run E&P company producing at low cost can still be worth dramatically more or less from quarter to quarter purely because the commodity price it sells into moved, independent of anything the company itself did. This makes energy valuation unusually sensitive to price-deck assumptions (the forward curve of oil and gas prices a banker assumes when projecting revenue), and it's why energy bankers spend real time on commodity price forecasting and hedging analysis that most other sectors don't need.

Midstream companies are structured specifically to reduce this exposure — many contracts are fee-based on volume moved rather than tied to the commodity price itself, which is why midstream valuation looks calmer and more like an infrastructure business than upstream does.

## Reserve-based and production metrics

Because upstream valuation depends so heavily on what's still in the ground, standard financial multiples get paired with metrics that measure the resource itself:

- **Proved reserves** — oil and gas that geological and engineering data indicate can be recovered with reasonable certainty under current economic conditions; the most conservative and most commonly used reserve category.
- **TEV / Proved Reserves** and **TEV / Daily Production** — enterprise value multiples built around what a company has in the ground and how fast it's pulling it out, used alongside (not instead of) standard multiples.
- **NAV (Net Asset Value) model** — a long-horizon DCF variant, similar to what's used in mining, that discounts the cash flows a field will generate over its productive life without projecting a terminal value at all — the assumption being the field eventually runs dry.

## Why upstream uses EV/EBITDAX

A standard EBITDA add-back doesn't fully normalize E&P companies, because they don't all account for exploration costs the same way. Some capitalize the full cost of exploration (successful and unsuccessful wells alike); others expense unsuccessful wells immediately, which drags down reported earnings in a way that has nothing to do with underlying operating performance. **EV/EBITDAX** — EBITDA plus Exploration Expense added back — normalizes this difference so you can compare companies fairly regardless of their accounting choice.

**Worked example.** Say you're comparing two E&P companies with identical operations but different accounting treatments for exploration:

- **Driller A** capitalizes all exploration costs. Its EBITDA is $420M and its Exploration Expense (already excluded from EBITDA under this method) is effectively $0 in the P&L. EV is $2,940M, so EV/EBITDA is 7.0x.
- **Driller B** expenses unsuccessful exploration. Its EBITDA comes in lower at $360M because $60M of unsuccessful well costs hit the income statement. Its EV is also $2,940M (same underlying assets, same production), so a naive EV/EBITDA comparison gives 8.2x — making Driller B look more expensive purely because of an accounting policy difference, not because it's actually worth more or performs worse.

Add back the $60M of exploration expense to Driller B's EBITDA: EBITDAX becomes $420M, and EV/EBITDAX is 7.0x — now the two companies compare correctly, because you've normalized away the accounting difference and left only the operating comparison that actually matters.

## Midstream and the MLP structure

Many midstream companies are structured as **Master Limited Partnerships (MLPs)** — a structure that avoids corporate-level tax by passing income through directly to unitholders, in exchange for restrictions on what kind of business can qualify (largely limited to businesses tied to natural resources, like pipelines). Because of this structure, midstream valuation leans on **Distributable Cash Flow (DCF, not to be confused with the Discounted Cash Flow model)** — the cash actually available to distribute to unitholders after maintenance capital spending — rather than standard unlevered free cash flow, since MLP investors care specifically about the cash they'll receive as distributions.

## Terminology to know cold

- **Upstream / midstream / downstream** — the three segments described above; know which one any company you discuss falls into.
- **Price deck** — the assumed forward curve of commodity prices used to project revenue; a critical, disclosed assumption in every energy model.
- **Hedging** — using financial contracts to lock in future commodity prices, reducing (but not eliminating) exposure to price swings; heavily used by upstream companies to protect near-term cash flow.
- **Breakeven price** — the commodity price at which a producer's operations become unprofitable; a key comparison point across companies with different cost structures.
- **Rig count** — the number of active drilling rigs in a region, a widely watched leading indicator of upstream activity and capital spending.

## How interviewers probe this

Expect "why use EBITDAX instead of EBITDA for an E&P company?" as a near-certain question — the answer is normalizing the difference between capitalized and expensed exploration costs across companies. You'll likely also get asked how a commodity price move affects an upstream company's valuation differently than a midstream company's (upstream: direct revenue impact; midstream: much smaller impact given fee-based, volume-driven contracts). Know one current trend in the sector you're targeting — a recent commodity price move, an M&A wave in a specific basin, or a regulatory shift — since energy interviewers expect market awareness the same way TMT interviewers do.

## Common mistakes

- **Applying a standard EV/EBITDA multiple across an E&P comp set without checking for accounting differences.** Skipping the EBITDAX adjustment produces a comparison that looks rigorous but is quietly wrong.
- **Treating midstream like upstream.** Assuming midstream companies carry the same direct commodity exposure as producers misses the entire point of the fee-based MLP structure.
- **Ignoring the price deck when discussing a DCF in this sector.** In energy, the commodity price assumption often swings the valuation more than any operating assumption — naming it unprompted is a strong signal of sector fluency.

For how enterprise value is built and bridged in general before sector-specific adjustments apply, see [The EV Bridge](/guide/the-ev-bridge).
