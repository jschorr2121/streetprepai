---
slug: sector-overview-fig
title: "Sector Overview: FIG"
description: Why Enterprise Value breaks down for banks and insurers, why P/E, P/TBV, and the dividend discount model take over instead, and the terminology to know before you interview.
category: sectors
difficulty: intermediate
readingMinutes: 7
tags: ["FIG", "banks", "insurance", "P-TBV", "sectors"]
---

## What FIG actually covers

Financial Institutions Group covers companies whose core business is managing other people's money or risk — a fundamentally different kind of business from anything an industrial or consumer company does. The main subsectors are **commercial and regional banks** (deposit-taking lenders), **insurance** (life, property & casualty, reinsurance), **asset managers and brokerages** (firms that manage or trade money for a fee rather than lend it), and **fintech** (payments, lending platforms, and financial infrastructure companies, which increasingly straddle FIG and TMT coverage). Banks and insurers are where FIG valuation departs most sharply from every other sector; asset managers, brokerages, and fintech mostly use standard valuation tools.

## Why Enterprise Value doesn't work here

Every other sector in this chapter relies on a core distinction: separate a company's operating assets and liabilities from its non-operating ones (cash, debt, financial investments), and value the operating business using Enterprise Value. That distinction collapses for a bank.

A normal company's loans and investments are non-operating — a manufacturer's excess cash sitting in a money market fund isn't part of its core business. But for a bank, loans and investments *are* the core business. A bank's entire operation is lending money it takes in as deposits and earning a spread; you can't separate its "operating" and "non-operating" assets the way you can for a company that makes and sells physical products. Debt, similarly, isn't a discretionary financing choice for a bank — its funding (deposits, borrowings) is functionally its raw material, not a capital-structure decision layered on top of an operating business. Once you can't cleanly define what's operating versus non-operating, Enterprise Value as a concept stops meaning anything, and the DCF built around unlevered free cash flow stops working too, because you can't isolate cash flow available to "all investors" separately from the bank's funding activities.

The same logic extends to insurance companies, whose core business — collecting premiums and investing them until claims come due — has the same problem: investments are the operating business, not a side pool of non-operating cash.

## What replaces Enterprise Value: P/E, P/TBV, and the dividend discount model

Since Enterprise Value doesn't apply, FIG valuation works entirely off Equity Value, using metrics banks and insurers actually generate:

- **P/E (Price / Earnings)** — the standard equity multiple, used here just as it is anywhere else, but weighted more heavily than in other sectors since it's often the primary multiple rather than one of several.
- **P/TBV (Price / Tangible Book Value)** — Equity Value divided by tangible book value (book value minus goodwill and other intangibles). This is the signature FIG multiple, because a bank or insurer's balance sheet — not its income statement — is what actually generates its earnings power. P/TBV correlates closely with **Return on Equity (ROE)**: a bank earning a higher return on every dollar of equity it holds trades at a higher multiple of that equity.
- **Dividend Discount Model (DDM)** — used in place of the DCF. Instead of projecting unlevered free cash flow, you project the dividends a bank or insurer can sustainably pay out (constrained by regulatory capital requirements) and discount them at the cost of equity, since equity holders are the only relevant investor group once Enterprise Value is off the table.
- **Embedded Value** — specific to life insurance, a long-duration variant of DCF-style analysis that values a life insurer's existing policy book plus the value of new business it's expected to write, accounting for how long life insurance liabilities can run.

**Worked example.** Say you're valuing a regional bank, MeridianBank, against three peers using P/TBV:

| Bank | Equity Value ($M) | Tangible Book Value ($M) | ROE | P/TBV |
|---|---|---|---|---|
| Peer A | 3,200 | 2,000 | 11% | 1.60x |
| Peer B | 2,700 | 2,250 | 8% | 1.20x |
| Peer C | 4,100 | 2,560 | 12% | 1.60x |

MeridianBank has tangible book value of $1,800M and an ROE of 10.5% — between Peer B's 8% and Peers A/C's 11-12%. Since P/TBV tracks ROE closely here, you'd expect MeridianBank to trade somewhere between 1.20x and 1.60x, closer to the higher end given its ROE is closer to Peers A and C. Applying roughly 1.45x gets you an implied equity value of about $2,610M. Note there's no enterprise value step at all — you go straight from the multiple to equity value, because that's the only value that means anything here.

## Terminology to know cold

- **Net Interest Margin (NIM)** — the spread a bank earns between interest income on loans/investments and interest paid on deposits/borrowings; the core driver of bank profitability.
- **Tier 1 capital ratio** — a regulatory measure of a bank's core capital relative to its risk-weighted assets; regulators set minimums, and this ratio constrains how much a bank can lend or pay out in dividends.
- **Loan loss provisions** — the amount a bank sets aside for loans it expects to go bad; a major swing factor in reported earnings, especially in a downturn.
- **Combined ratio** — for P&C insurers, claims paid plus expenses divided by premiums earned; below 100% means the insurer is profitable on underwriting alone, before investment income.
- **Float** — the pool of premium dollars an insurer holds and invests before claims come due; a core source of insurance company profitability separate from underwriting itself.

## How interviewers probe this

Expect "why can't you use a DCF or Enterprise Value for a bank?" as a near-certain question — the answer is that a bank's debt and investments are its operating business, not a financing layer on top of one, so you can't isolate unlevered free cash flow the way you can elsewhere. You'll also likely get "what's the difference between P/E and P/TBV, and when would you use each?" (P/TBV is more useful for comparing banks with different risk profiles and capital levels; P/E is more standard and comparable across sectors generally). Be ready to explain why ROE drives P/TBV, since that link is the crux of bank valuation.

## Common mistakes

- **Saying Enterprise Value "doesn't apply well" to banks instead of explaining why.** The reason (loans and investments are operating assets for a bank, not non-operating ones) is the actual answer interviewers want.
- **Using EV/EBITDA on a bank or insurer.** This is one of the fastest ways to signal you don't understand the sector — banks don't even present EBITDA in a way that means anything, since interest income/expense is central to the business, not a financing add-back.
- **Forgetting regulatory capital constraints when discussing dividends.** A bank can't simply pay out whatever it wants — capital ratio requirements cap how much it can distribute, which is exactly why the DDM needs a sustainable payout assumption, not a wishful one.

For how the equity-value-to-enterprise-value bridge works everywhere else, see [Enterprise Value vs Equity Value](/guide/enterprise-value-vs-equity-value) — useful context for understanding exactly what breaks down in this sector.
