---
slug: metrics-and-multiples
title: Metrics & Multiples
description: What EBIT, EBITDA, net income, and free cash flow each capture, why multiples are a shorthand for growth and risk, and how to reason about two companies trading at different multiples.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["valuation", "multiples", "EBITDA", "technicals"]
---

## Why the choice of metric matters

Every valuation multiple is a fraction: a value (enterprise value or equity value) divided by some measure of financial performance. Before you can use a multiple credibly, you need to know exactly what sits in the denominator — because EBIT, EBITDA, net income, and free cash flow each tell a different story about the same company, and picking the wrong one produces a number that looks precise but means nothing.

Interviewers probe this constantly because it's a fast way to tell who understands the mechanics and who memorized a formula sheet.

## The four metrics, side by side

### EBIT — operating profit before financing and taxes

EBIT (earnings before interest and taxes) is revenue minus all operating expenses, including depreciation and amortization. It captures the profitability of the core business, independent of how it's financed or taxed.

**Use it when:** you want a capital-structure-neutral view of operating performance but D&A differences between companies are meaningful — for example, a company that owns its equipment (high D&A) versus one that leases it (lower D&A but higher rent expense embedded in opex).

### EBITDA — operating cash profitability before D&A

EBITDA adds depreciation and amortization back to EBIT. Because D&A is a non-cash accounting charge, EBITDA is often treated as a rough proxy for the cash the operating business throws off before capital spending and working capital needs.

**Use it when:** you're comparing companies with different depreciation policies, capital intensity, or fixed-asset ages — EBITDA strips out the noise from those accounting choices. This is why EV/EBITDA is the most common multiple in banking: it lets you compare an asset-heavy manufacturer to an asset-light services company on more equal footing.

**The catch:** EBITDA ignores capex entirely. A capital-intensive business (say, a pipeline operator reinvesting 15% of revenue into infrastructure every year) can have identical EBITDA to an asset-light software company that reinvests almost nothing — but the two generate wildly different actual free cash flow. Never treat EBITDA as "cash flow" without checking capex separately.

### Net income — what's left for equity holders

Net income is the bottom line: revenue minus every expense, including interest and taxes. It's the only metric of the four that reflects the company's actual capital structure and tax situation.

**Use it when:** you're doing an equity-value-based comparison (like P/E), because net income is a claim available only to equity holders — the same audience equity value belongs to. Never pair net income with enterprise value; that mismatches a levered metric with an unlevered value (see the EV/equity value pairing rule from the previous chapter).

**The catch:** net income is the most "polluted" of the four metrics — it's affected by one-time items, different tax rates across jurisdictions, and leverage decisions that have nothing to do with operating performance. Two identical businesses with different debt loads will report very different net income.

### Free cash flow — the cash that's actually left over

Free cash flow (typically unlevered FCF = EBIT × (1 − tax rate) + D&A − capex − change in net working capital) is the closest of the four to real cash generation. It's what a DCF is built on, and it's the metric that ultimately determines what a business is worth intrinsically.

**Use it when:** you're doing intrinsic valuation (DCF) or want to sanity-check whether a company's reported EBITDA is translating into real cash. FCF is rarely used as a trading multiple denominator directly (EV/FCF exists but is less common than EV/EBITDA) because it's noisier from quarter to quarter — working capital swings and lumpy capex make it jump around more than EBITDA does.

## Multiples as shorthand for growth and risk

Here's the idea that ties multiples back to first principles. Recall the simplified perpetuity valuation formula:

> Value = Cash Flow / (r − g)

where `r` is the discount rate (cost of capital, reflecting risk) and `g` is the perpetual growth rate. A multiple is just this formula rearranged and expressed per dollar of some metric instead of per dollar of cash flow. If you divide both sides by the metric (say, EBITDA), you get:

> EV / EBITDA ≈ (EBITDA-to-FCF conversion) / (r − g)

That's why, all else equal, a company that's expected to grow faster (higher `g`) or is perceived as lower risk (lower `r`) trades at a higher multiple. The multiple isn't an arbitrary market number — it's compressed information about the market's view of a company's growth and risk, expressed as a single digit instead of a full discounted cash flow model.

This is also why you can't compare multiples across companies with very different growth or margin profiles and draw a clean conclusion. A 20x EBITDA multiple on a company growing revenue 25% a year is not "more expensive" than a 10x multiple on a company growing 3% a year — it might be cheaper, once you account for the growth being paid for.

## Worked example: two companies, two multiples, one question

Say you're comparing two software companies.

**Company A:** $200M revenue, 20% EBITDA margin → $40M EBITDA. Trades at an enterprise value of $800M.

**Company B:** $200M revenue, 40% EBITDA margin → $80M EBITDA. Trades at an enterprise value of $800M.

Both companies have the same revenue and the same enterprise value. But their multiples look very different:

- Company A: EV / EBITDA = $800M / $40M = **20.0x**
- Company B: EV / EBITDA = $800M / $80M = **10.0x**

At first glance, Company A looks "twice as expensive." But look at EV/Revenue instead:

- Company A: EV / Revenue = $800M / $200M = **4.0x**
- Company B: EV / Revenue = $800M / $200M = **4.0x**

Identical. The market is paying the exact same price per dollar of revenue for both companies — the EBITDA multiple gap is purely a function of Company B's much higher margin. If you only looked at EV/EBITDA, you might wrongly conclude the market thinks Company A is overvalued. In reality, the market may be pricing both companies on revenue potential (common for software, where margins are expected to expand over time), and the EBITDA multiple difference simply reflects where each company currently sits on its margin curve.

The lesson: always ask what's driving a multiple gap — different growth, different margins, different risk, or a genuine difference in how the market is valuing the business — before concluding one company is cheap or expensive relative to another.

## Common mistakes

- **Treating EBITDA as free cash flow.** EBITDA ignores capex, taxes, interest, and working capital. Two companies with identical EBITDA can have very different actual cash generation.
- **Pairing net income with enterprise value, or EBITDA with equity value.** Always match the metric to the correct side of the EV/equity value pairing (see "Pairing metrics with values" in the prior chapter).
- **Concluding a higher multiple always means "more expensive."** A higher multiple can simply reflect higher expected growth or lower risk — it isn't automatically a red flag.
- **Ignoring margin differences when comparing EBITDA multiples.** As the worked example shows, comparing EV/EBITDA across companies with very different margins can be misleading; cross-check with EV/Revenue.

## How interviewers probe this

Expect follow-ups like: "Why would two companies with the same revenue trade at different EV/EBITDA multiples?" (margin differences, as above) or "Why is EV/EBITDA more common than EV/Net Income for comparing companies?" (capital-structure neutrality). The strongest answers connect the multiple back to the underlying Value = CF/(r−g) logic rather than reciting the formula in isolation — that's what signals real understanding instead of memorization.
