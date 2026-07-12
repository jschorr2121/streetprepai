---
slug: mental-math-that-transfers
title: Mental Math That Transfers
description: The specific arithmetic shortcuts — percentages, quick multiplication, P/E-to-earnings-yield conversion, and IRR estimation — that actually show up under interview pressure.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["mental math", "IRR", "P/E ratio", "technicals", "drills"]
---

## Why this is its own skill

Knowing the DCF framework and being able to execute basic arithmetic *out loud, without a calculator, while someone watches you think* are two different skills. Interviewers test the second one constantly — not because the arithmetic is hard, but because it's a clean proxy for composure. If you freeze multiplying two two-digit numbers, it's a preview of how you'll behave when a client asks a hard question on a live call.

The good news: you only need a handful of specific shortcuts, not general math talent. Below are the ones that actually recur.

## Percentages, fast

Most interview math reduces to percentage moves. Build these reflexes:

**Break percentages into 10%, 5%, and 1% chunks.** To find 17% of 240:
- 10% of 240 = 24
- 5% of 240 = 12 (half of 10%)
- 2% of 240 = 4.8 (double 1%, and 1% = 2.4)
- 17% = 10% + 5% + 2% = 24 + 12 + 4.8 = **40.8**

You never need to do the multiplication in one shot. Chain the pieces you already know.

**Percentage change goes the other direction.** Revenue moved from $180M to $207M. What's the growth rate?
> Change = $27M. $27M / $180M — round $180M to $200M first for a sanity check: 27/200 = 13.5%, then adjust up slightly since the real denominator is smaller. Real answer: 15%. The rounded estimate gets you in the neighborhood fast; refine only if you have time.

## Quick multiplication

**Round and adjust.** For 34 × 26, treat it as (30 + 4) × 26 = 780 + 104 = 884. Or use the difference-of-squares trick when two numbers straddle a round number evenly: 34 × 26 = (30 + 4)(30 − 4) = 30² − 4² = 900 − 16 = 884. Same answer, whichever path is faster for the specific numbers.

**Multiplying by 15:** ×10, then add half of that. 15 × 48 = 480 + 240 = 720.

**Multiplying by 9 or 11:** ×10 and adjust by one factor. 9 × 68 = 680 − 68 = 612. 11 × 68 = 680 + 68 = 748.

Practice these on anything — restaurant totals, sports scores — until the pattern-matching is automatic rather than effortful.

## P/E ratio and earnings yield are the same information, inverted

A company trades at a **P/E of 20x**. Its **earnings yield** — earnings as a percentage of price — is simply 1 / 20 = **5%**.

This conversion matters because interviewers use it to test whether you actually understand what a multiple means, rather than having memorized "high P/E good, low P/E bad."

> Worked example: A stock trades at $80/share with $4.00 of EPS. P/E = 80 / 4 = 20x. Earnings yield = 4 / 80 = 5%. If a "risk-free" 10-year bond yields 4.5%, this stock's 5% earnings yield offers only a half-point premium for equity risk — expensive relative to history, where equities typically demand several points of premium over bonds.

Flip it the other way just as fast: a stock with a 25x P/E has a 4% earnings yield (1/25 = 0.04). A stock with an 8x P/E has a 12.5% earnings yield (1/8 = 0.125). The lower the multiple, the higher the yield — same fact, stated two ways. Being fluent in both directions is what interviewers are checking for.

## IRR estimation from a multiple and a holding period

Private equity and paper-LBO questions ask you to estimate an internal rate of return without a calculator. You don't compute this exactly — you recognize it from a small set of anchor points and interpolate.

The two you must know cold:

| MOIC (money multiple) | 3-year hold | 5-year hold |
|---|---|---|
| 2.0x | ~26% IRR | ~15% IRR |
| 3.0x | ~44% IRR | ~25% IRR |

Where these come from, roughly: a 2x return compounded over 3 years needs an annual growth rate `r` such that (1+r)³ ≈ 2, and 1.26³ ≈ 2.0. Over 5 years, (1.15)⁵ ≈ 2.0. You don't need to derive it live — just memorize the table and interpolate between rows and columns.

> Worked example: A fund invests $40M and exits with $110M after 4 years. First get the multiple: $110M / $40M = 2.75x. That sits between 2.0x and 3.0x, closer to 3.0x. The holding period (4 years) sits between the 3-year and 5-year columns. At 3 years a 2.75x would be a bit under 44% (call it ~38%); at 5 years it'd be a bit under 25% (call it ~22%). Averaging across the 4-year midpoint: roughly **28–30% IRR**. State the range, not a false-precision single number — "somewhere in the high-20s" is a completely acceptable answer.

For the full paper-LBO drill with a longer table and worked multi-step problems, see [The Paper LBO — First-Round Math](/guide/lbo-paper-math).

## Rule of 72

To estimate how many years it takes an amount to double at a given annual growth rate, divide 72 by the rate:

> Years to double = 72 / rate

At 8% annual growth: 72 / 8 = **9 years** to double. At 12%: 72 / 12 = **6 years**. At 6%: 72 / 6 = **12 years**.

This is the same relationship as the IRR table above, just generalized to any doubling (not just specific hold periods) and any rate (not just 15% or 26%). If someone asks "how long until this business doubles at a 9% growth rate?" you now have a 5-second answer: 72 / 9 = 8 years.

> Worked example: An interviewer says a portfolio company grows revenue at roughly 18% a year and asks how long until revenue triples. Rule of 72 is built for doubling, not tripling — but you can chain it. Doubling takes 72/18 = 4 years. Tripling is roughly 1.6x a doubling in log terms, so a fast estimate is "a bit more than one doubling period plus half of another" — call it 6–6.5 years. If precision matters more than speed, note you'd want to check in Excel, but give the estimate first.

## How interviewers probe this

- **They watch your process, not just your final number.** Narrate the chunks ("10% is 24, half of that is 12...") rather than going silent and producing an answer. Silence reads as "I don't know how to start"; narration reads as "I have a method."
- **They'll ask you to sanity-check your own answer.** If you compute 17% of 240 as 408 instead of 40.8, a quick gut check — "that can't be right, 17% of anything under 300 shouldn't exceed 50" — catches decimal-point errors before they cost you.
- **They'll push past the anchor points.** If you only know 2x/3yr and 3x/5yr cold, a question about a 2.5x over 4 years should still be answerable by interpolating between rows and columns, not by freezing because it's not a table row you memorized.
- **Common mistake: rushing to a fake-precise answer.** "23.7% IRR" delivered with total confidence, when the honest estimate is "high teens to low twenties," signals you don't understand these are approximations. Round appropriately and say so.

## Practice this

Set a timer for five minutes. Write ten percentage-of-a-number problems (mix of easy and awkward numbers), five multiplication pairs, and three MOIC/holding-period combinations. Solve all eighteen out loud, narrating your method, before the timer runs out. Repeat daily for a week — this is a speed skill, and speed only comes from repetition.
