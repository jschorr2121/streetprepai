---
slug: terminal-value
title: Terminal Value
description: Gordon growth vs. exit multiple, how to cross-check one against the other, and the sanity bounds that keep a terminal value assumption defensible.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["terminal-value", "gordon-growth", "exit-multiple", "DCF", "technicals"]
---

## Why terminal value dominates the answer

Your explicit forecast in a [DCF](/guide/walk-me-through-a-dcf) usually only covers 5–10 years. But the business doesn't stop generating cash after that — it keeps going, in theory forever. Terminal value (TV) is your estimate of everything the company is worth from the end of the forecast period onward, compressed into a single number as of that final year.

Because TV represents decades of cash flow squeezed into one figure, it's usually the largest single piece of a DCF's total value — commonly 60–80% of enterprise value, sometimes more. That's exactly why interviewers probe it so hard: get the terminal value assumption wrong, and the rest of your careful five-year build barely matters.

## Method 1: Gordon growth (perpetuity growth)

This method assumes the company's unlevered free cash flow grows at a constant, modest rate forever:

> TV = UFCF_final × (1 + g) / (WACC − g)

Where `g` is the terminal growth rate and WACC is the discount rate from [cost of capital](/guide/cost-of-capital-and-wacc). The logic is the standard growing-perpetuity formula: a cash flow stream growing slower than your discount rate converges to a finite present value, even summed to infinity.

The critical constraint: **g must be less than or equal to long-run GDP growth** — typically 1.5–3% for a mature developed-market company. No company can outgrow the entire economy forever; if it did, it would eventually become larger than the country it operates in, which is absurd on its face.

## Method 2: Exit multiple

This method sidesteps the perpetuity math entirely and instead assumes the company gets "sold" at the end of the forecast period for a multiple of a financial metric, usually EBITDA:

> TV = EBITDA_final × Exit Multiple

The exit multiple is typically drawn from where comparable public companies trade today, sometimes trimmed down slightly because multiples tend to compress as growth slows and a business matures.

## Cross-checking one against the other

Because both methods are estimating the same thing — what the company is worth from the terminal year forward — you should never rely on just one. The standard move: pick a primary method, then back into what the *other* method implies, and sanity-check that implied number.

- If you used Gordon growth, divide your TV by final-year EBITDA to get an **implied exit multiple**. Does it fall inside the range of where comparable companies actually trade?
- If you used the exit multiple method, solve for the **implied growth rate** the multiple assumes. Is it a plausible long-run growth rate — comfortably below GDP growth?

## A fully worked example

Take a mid-cap consumer products company with these final-year (Year 5) figures:

- Unlevered FCF: $60 million
- EBITDA: $95 million
- WACC: 9%
- Comparable companies trade at 8.0x–11.0x EBITDA

**Gordon growth, assuming g = 2.5%:**

> TV = $60M × (1 + 2.5%) / (9% − 2.5%) = $61.5M / 6.5% = **$946.2 million**

Cross-check: implied multiple = $946.2M / $95M EBITDA = **9.96x**, roughly 10.0x. That sits comfortably inside the 8.0x–11.0x comp range — this growth assumption is defensible.

**Exit multiple, assuming 8.5x (near the low end of comps, reflecting some multiple compression as growth slows):**

> TV = $95M × 8.5x = **$807.5 million**

Cross-check: back out the implied growth rate using the same Gordon growth formula, solved for g:

> Implied g = (TV × WACC − UFCF_final) / (TV + UFCF_final)
> Implied g = ($807.5M × 9% − $60M) / ($807.5M + $60M) = ($72.675M − $60M) / $867.5M = **1.46%**

That's a reasonable long-run growth rate — below GDP growth, consistent with a maturing business. Both methods land in a sensible, mutually-supporting range, which is exactly what you want to see.

**Sizing up the TV share of total value:** suppose the present value of the five explicit forecast years of UFCF sums to $220 million. Discounting the Gordon growth TV back 5 years at 9% ($946.2M ÷ 1.09⁵ ≈ $614.8M) and adding it to the $220 million gives an enterprise value of about $834.8 million — meaning terminal value alone is **~74% of total value**. That's a normal, expected share, not a red flag by itself. It only becomes a concern if the underlying growth or multiple assumption pushing that share up is itself indefensible.

## Sanity bounds to hold yourself to

- **Terminal growth rate ≤ long-run GDP growth** of the company's home market (roughly 1.5–3% for the US). Emerging-market companies can run slightly higher but should still stay well below the country's current headline growth rate, since that rate won't persist forever either.
- **Implied exit multiple should sit near or below the current comp range**, not above it — a company shouldn't command a *richer* multiple as a mature, slow-growing business than fast-growing peers command today.
- **TV as a share of total value in the 50–85% range is typical**; north of 90% usually means your explicit forecast period is too short or your growth/multiple assumption is doing too much work.

## Common mistakes and how interviewers probe this

- **Picking a growth rate that ignores the exit-multiple cross-check (or vice versa).** If asked "what does that imply," and you haven't run the other method, you'll visibly stall — always keep both in your back pocket.
- **Using a Terminal Multiple from precedent transactions instead of trading comps.** Precedent deal multiples bake in a control premium, which doesn't belong in a standalone valuation of the business as a going concern.
- **Forgetting that Terminal FCF in the Gordon growth formula is the FCF one year *after* the last explicit forecast year**, not the final forecast year's FCF itself — that's why you multiply by (1 + g) in the numerator.
- **Applying the mid-year convention inconsistently to the two TV methods** — this gets more detail in [advanced DCF](/guide/advanced-dcf), but know that the exit-multiple TV and the Gordon growth TV are discounted slightly differently once you introduce mid-year timing.
- **Treating a negative terminal growth rate as automatically wrong.** It isn't — a company facing structural decline (a patent cliff, a shrinking market) can validly have a negative terminal growth rate. It just means the company is worth less, not worthless.

Being able to run both methods cold, on the spot, with made-up but internally consistent numbers, is what separates candidates who understand terminal value from those who memorized the formula.
