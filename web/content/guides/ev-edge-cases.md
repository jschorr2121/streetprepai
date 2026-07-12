---
slug: ev-edge-cases
title: Edge Cases
description: Advanced elective on negative enterprise value, equity investments and NCI subtleties, pensions and leases in the bridge, book vs. market values, and where the theory breaks down.
category: technicals
difficulty: advanced
readingMinutes: 12
tags: ["enterprise value", "negative EV", "noncontrolling interest", "pensions", "operating leases", "technicals"]
---

## Negative enterprise value

Equity value can never be negative — you can't have a negative share count or a negative share price, so the floor is zero. Enterprise value has no such floor.

A company can have negative enterprise value when its cash balance exceeds equity value plus everything else in the bridge. It's rare, but mechanically simple: if equity value is $100 million and there's $250 million of cash with no debt, enterprise value is $100 million − $250 million = −$150 million.

You'll see this most often in two situations: companies burning cash quickly and heading toward distress (the market has priced in that the cash won't last, dragging equity value below the current cash balance), or occasionally a company sitting on unusually large cash reserves relative to a depressed market cap. Negative EV effectively means the market is offering to sell you the company's cash for less than the cash is worth — which sounds like free money, but the catch is you're also taking on whatever caused the market to value the operating business at less than zero. If the business is burning through that cash fast enough, the "discount" evaporates before you can realize it.

Worth separating two related but different ideas: **current** enterprise value (built from today's balance sheet and share price) essentially can't go far negative except in genuine distress. **Implied** enterprise value — the output of a DCF or another valuation model — can go negative more easily, for instance if projected unlevered free cash flow is negative and shrinking at a rate close to the discount rate. If a DCF spits out a negative implied equity value, the practical move is to floor the implied share price at zero rather than report a negative number — a company's downside for shareholders is limited to losing their investment, not going below it.

## Equity investments and noncontrolling interest subtleties

These two often get taught as opposites — subtract equity investments, add NCI — but the reasoning behind each is worth separating clearly, because it's easy to muddle them under pressure.

**Noncontrolling interest** arises when a company owns *more than 50%* of another company and therefore consolidates 100% of that subsidiary's financials into its own — even though it only economically owns a majority stake, not all of it. Since the parent's consolidated EBITDA (or revenue, or EBIT) already includes 100% of the subsidiary, enterprise value needs to reflect 100% of the subsidiary's value too, so NCI gets added back. This is almost always correct with no real exception, because the accounting rule (consolidate anything you control, meaning generally >50% ownership) doesn't have much wiggle room.

**Equity investments** (also called equity-method or associate investments) arise from the opposite ownership range — typically *20% to 50%* ownership, enough influence to require special accounting treatment but not enough to consolidate. Here, the parent doesn't report the investee's revenue or EBITDA line by line; instead, it reports its *share* of the investee's net income as a single line, usually below EBIT, close to the bottom of the income statement. Because that income sits below EBIT and EBITDA, those metrics don't include the equity investment's contribution at all — so if you're using EV/EBITDA, you subtract the equity investment from EV to make the numerator match a denominator that also excludes it.

The subtlety: whether you subtract an equity investment depends specifically on whether the *metric you're pairing with* already reflects income from that investment. If you're working with a metric that already includes equity-method income (some versions of net income or levered free cash flow do), subtracting the investment from your value figure as well would double-penalize it. Always ask: has this specific metric already captured the investment's contribution? If yes, don't also strip the investment out of the value side.

## Pensions and leases in the bridge

**Unfunded pension obligations.** A defined-benefit pension plan carries both pension assets (money set aside) and pension liabilities (the present value of promised future payments). Only the *unfunded* portion belongs in the bridge — that is, MAX(0, Pension Liabilities − Pension Assets) — added the same way debt is added. The logic mirrors debt's repayment logic: an underfunded pension usually can't be covered by ordinary operating cash flow and instead has to be plugged with new financing, much like debt. A fully funded (or overfunded) pension contributes nothing.

**Capital leases** are treated as debt-like items and added to the bridge for the same repayment-logic reason — they carry an implicit interest component and a repayment obligation the buyer effectively assumes.

**Operating leases** are the genuinely contested case. Since 2019 US GAAP changes brought operating lease liabilities onto the balance sheet, but whether to fold them into enterprise value is still a matter of house convention rather than a settled rule, because it depends on which earnings metric you're pairing EV with. If you're using EBITDAR (EBITDA plus rent/lease expense — a metric designed to be fully lease-neutral), you should include operating leases in EV, since the metric excludes the lease expense entirely. If you're using ordinary EBITDA or EBIT — which under US GAAP still includes lease expense — you typically exclude operating leases from EV to avoid effectively counting the lease obligation twice. The rule to hold onto: whichever choice you make, be consistent with how your paired earnings metric treats the same lease expense.

## Book value vs. market value

Textbook enterprise value is defined in market-value terms: market value of assets minus market value of liabilities, adjusted for non-operating items and other investor groups. In practice, only one piece of that is genuinely market-based — equity value, because share price is directly observable. Everything else in the bridge (debt, preferred stock, pension obligations, lease liabilities) usually gets pulled straight from the balance sheet at book value, because market values for those items are difficult, sometimes impossible, to observe cleanly.

This substitution is mostly harmless for debt trading near par — a healthy company's bonds usually trade close to face value, so book and market values converge. It becomes a real distortion for distressed companies, where debt might trade at 40 or 50 cents on the dollar; using book (face) value there meaningfully overstates the true economic claim debt holders have, and therefore overstates enterprise value relative to what the market actually implies the business is worth.

## Where the theory breaks down in real life

The clean version of the theory says financing decisions don't move enterprise value — only changes to the core operating business do (see [Event impacts on EV & equity value](/guide/event-impacts-on-ev)). That's a good simplifying assumption for interview-style single-event questions, but it's not fully accurate once you're valuing a company on an implied, forward-looking basis rather than reading today's balance sheet.

The reason: implied enterprise value comes from discounting projected cash flow at WACC, and WACC is itself a function of capital structure. Change the debt-to-equity mix and you change WACC, which changes the discount rate, which changes implied enterprise value — even though nothing about the operating business changed. A few forces drive this:

- **Taxes.** Interest is tax-deductible; dividends aren't. So debt and equity aren't tax-equivalent ways to fund the same business, and swapping between them has a real, if modest, effect on value.
- **Bankruptcy risk.** More debt means fixed obligations that must be paid regardless of performance, raising the odds of financial distress — a risk equity financing simply doesn't carry, since dividends can be cut.
- **Agency costs.** Debt holders and equity holders want different things from management — debt holders want safety and repayment, equity holders want growth and upside — and that tension has real economic consequences as leverage rises.
- **Market inefficiency.** The clean theory assumes markets price every security correctly at all times; in practice, especially for smaller or less-covered companies, that assumption is shaky.

The practical takeaway for an interview: don't claim enterprise value is "completely unaffected" by capital structure — that overstates the theory. The defensible version is that enterprise value is *far less sensitive* to financing changes than equity value is, especially in the short run and for **current** (not implied) enterprise value. At moderate leverage levels the effect is small enough to treat as roughly zero for interview purposes; it's really only at high leverage, where bankruptcy risk becomes material, that the effect becomes large enough to matter.

## How interviewers probe this

At this level, expect questions that test whether you can hold two ideas at once rather than picking a side: "Doesn't more debt always increase enterprise value since interest is tax-deductible?" is designed to see whether you'll overcorrect into "yes, more debt is always better" instead of correctly noting that the tax benefit competes against rising bankruptcy risk and cost of capital as leverage increases — and that the effect is second-order compared to what actually happens with operating performance. Similarly, "should you subtract this equity investment?" should trigger you to ask what the paired metric already includes, rather than reaching for a blanket subtract-or-don't rule.
