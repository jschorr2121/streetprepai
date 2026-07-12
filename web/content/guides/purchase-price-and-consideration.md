---
slug: purchase-price-and-consideration
title: Purchase Price & Consideration
description: Why buyers pay a premium, how cash, debt, and stock differ in cost and capacity, and why cash is almost always the cheapest way to pay.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["M&A", "consideration", "control-premium", "financing", "technicals"]
---

## Two separate decisions

Every acquisition involves two decisions that get discussed together but are actually independent: **how much to pay**, and **how to pay for it**. The first is a valuation exercise. The second — cash, debt, stock, or some mix — determines how expensive the deal is to the buyer and how it lands on earnings per share. This section covers both.

## Why buyers pay a premium

If you want 100% control of a public company, you almost never pay the current trading price — you pay a **control premium**, typically somewhere in the 15–30% range above the undisturbed share price, though it varies by sector and deal competitiveness. The logic: existing shareholders won't hand over their shares, and their voting control, for the price the stock happens to be trading at today. They need to be compensated for giving up the option to keep holding the stock and see where it goes.

Say a target trades at $40.00 per share right before a deal is rumored. A buyer offering a 22% premium would offer roughly $48.80 per share. You'd sanity-check that premium against recent comparable deals — if similar companies in the sector have sold for 18–25% premiums, 22% is defensible; if the norm is 10–15%, you're paying up, and you'd want a strong reason (large expected synergies, a competitive auction) to justify it.

For private companies, there's no public share price to premium off of, so the "premium" concept doesn't directly apply — the purchase price instead gets set relative to a valuation multiple (EV/EBITDA, for example) benchmarked against comparable deals.

## The three ways to pay

Once you know the price, you decide the **consideration mix** — cash, debt-funded cash, or stock, often blended.

**Cash on hand.** The buyer uses its own balance sheet cash. Simple and fast, but it isn't free — that cash was earning interest sitting in an account, so using it means giving up that interest income. This is called the **foregone interest** on cash.

**Debt.** The buyer borrows to fund the purchase. It's paying an explicit interest rate to lenders, and that interest expense reduces pre-tax income going forward. Debt capacity isn't infinite — lenders and rating agencies care about how much leverage the combined company will carry, so a buyer can only raise so much before it risks a downgrade or simply can't find willing lenders.

**Stock.** The buyer issues new shares to the seller's shareholders instead of paying cash. No cash leaves the building and no new debt gets raised, but the buyer's share count goes up — which, all else equal, dilutes earnings per share for existing shareholders. Stock capacity is limited by how much dilution the market (and the board) will tolerate, and by how the buyer's own stock price reacts to being used as currency.

## The cost ordering: cash is cheapest, then debt, then stock

There's a consistent hierarchy in the cost of each financing source, and it comes from comparing after-tax cost of capital:

> Cost of Cash = Foregone Interest Rate × (1 − Tax Rate)
> Cost of Debt = Interest Rate on New Debt × (1 − Tax Rate)
> Cost of Stock = 1 / (Buyer's P/E multiple)  — i.e., the buyer's earnings yield

Cash and debt get the tax shield because interest (foregone or paid) is measured on an after-tax basis. Stock doesn't get any tax benefit — issuing equity has no interest expense to deduct — so its "cost" is simply the inverse of the buyer's P/E, the return investors expect for holding the stock.

**Worked example.** Say Acquirer Corp can earn 3% on its idle cash, can borrow new debt at 7%, trades at a 25x P/E multiple, and faces a 25% tax rate.

- Cost of Cash = 3% × (1 − 25%) = **2.25%**
- Cost of Debt = 7% × (1 − 25%) = **5.25%**
- Cost of Stock = 1 / 25 = **4.0%**

Two things to notice. First, cash is cheaper than debt here (2.25% vs. 5.25%) — that's the normal pattern, since foregone interest on cash is usually well below what a company pays to borrow. Second, in this example stock (4.0%) is actually cheaper than debt (5.25%) because Acquirer Corp trades at a rich 25x multiple — a high P/E means a low earnings yield, which means "expensive" stock is a cheap currency to pay with. Flip the multiple to 8x instead: Cost of Stock = 1/8 = 12.5%, which would make stock by far the most expensive option. **The cost of stock is entirely a function of the buyer's own valuation — the higher the multiple, the cheaper the currency.**

## Why buyers default to cash

Given the ordering above, buyers prefer to pay with 100% cash whenever they have enough of it and don't need it for anything else — it's usually the cheapest source and it avoids both new debt covenants and share dilution. The constraint is almost never desire, it's **capacity**: most companies don't have a spare $2 billion sitting in the bank, so realistic deals blend sources. A buyer with strong cash flow and a low leverage ratio might do 40% cash, 40% debt, 20% stock. A buyer with a very high stock multiple relative to the target's might lean much more heavily on stock, since it's issuing "expensive" currency (in the market's eyes) to buy something priced at a lower multiple — which, as you'll see in accretion/dilution mechanics, tends to work in the buyer's favor on an EPS basis.

## How the mix interacts with the premium

A buyer willing to pay a bigger premium usually needs a stronger financing story to make the deal work financially — more cash or debt lowers the earnings hurdle it needs to clear, since cash and debt (properly tax-shielded) are cheaper than stock in most cases. Conversely, a buyer who wants to preserve balance sheet flexibility and avoid new debt will often reach for stock even when it's the more expensive option, accepting some short-term dilution risk in exchange for not levering up.

## How interviewers probe this

Two follow-ups come up constantly:

- **"Which is cheapest — cash, debt, or stock?"** Don't answer "cash" reflexively. Walk through the formulas: cash and debt are compared on an after-tax interest basis, stock is compared on an earnings-yield basis, and the ranking depends on the specific rates and the buyer's P/E. Cash is *usually* cheapest but stock can beat debt when the buyer's multiple is high enough.
- **"Why wouldn't a buyer just use 100% cash if it's the cheapest option?"** Because cash is capacity-constrained — most buyers simply don't have enough sitting around, and using all of it leaves no cushion for operations or other opportunities.

For how the financing mix flows into the actual EPS math, see [Accretion / dilution mechanics](/guide/m-and-a-accretion-dilution) and [The full merger model](/guide/full-merger-model).
