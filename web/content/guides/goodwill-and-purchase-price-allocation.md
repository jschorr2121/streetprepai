---
slug: goodwill-and-purchase-price-allocation
title: Goodwill & Purchase Price Allocation
description: Why goodwill exists, the full PPA formula, and a step-by-step worked example that balances the combined balance sheet.
category: technicals
difficulty: intermediate
readingMinutes: 10
tags: ["M&A", "goodwill", "purchase-price-allocation", "balance-sheet", "technicals"]
---

## Why goodwill has to exist

When a buyer acquires a target, the target's shareholders' equity disappears entirely — the target no longer exists as an independent entity, so its equity account goes to zero. But the buyer almost never pays exactly the target's book value of equity; it pays a premium, because the market (and the buyer) believe the business is worth more than what's recorded on the accounting books.

That mismatch creates a problem the moment you try to combine the two balance sheets: the assets side and the liabilities-plus-equity side no longer balance. **Goodwill is the plug that fixes it** — an intangible asset created specifically to absorb the difference between what the buyer paid and the identifiable net assets it received. It isn't a cash outflow or a real operating asset; it's an accounting placeholder for "the buyer believed this business was worth more than its book value; here's how much more."

## What else changes in purchase price allocation

Purchase price allocation (PPA) is the broader process of deciding how the purchase price gets distributed across the target's balance sheet. Besides creating goodwill, a few other things typically happen:

- **Asset write-ups.** The target's PP&E, and sometimes identifiable intangible assets (customer relationships, trademarks, developed technology), get revalued upward to fair market value, since book value often understates what those assets are actually worth.
- **Existing goodwill gets wiped to zero.** Any goodwill already sitting on the target's balance sheet from its own past acquisitions is reset — it has no meaning once the target itself is being acquired.
- **New deferred tax liabilities (DTLs) get created.** Asset write-ups create a future taxable difference: the buyer gets to depreciate the higher book value going forward, which reduces book taxes in the near term relative to cash taxes, and that timing difference is what a DTL represents. The standard approximation: New DTL = Asset Write-Up × Buyer's Tax Rate.
- **The target's existing DTLs typically get eliminated.** They belonged to the pre-deal entity and don't carry forward cleanly.

The difference between **goodwill** and **other intangible assets**: goodwill isn't amortized and only changes if it's later impaired; other intangibles (patents, customer relationships, developed technology) are amortized over their useful lives, which creates a real, recurring non-cash expense on the post-deal income statement.

## The goodwill formula

Putting the pieces together:

> Goodwill = Equity Purchase Price − Target's Book Value of Equity + Target's Existing Goodwill − Asset Write-Ups + New DTL Created − Target's Existing DTL (eliminated)

Each term has an intuitive reason for its sign:

- You **subtract** the target's book equity because that's the "starting point" of value already on the books.
- You **add back** the target's existing goodwill because wiping it to zero removes an asset, which widens the hole goodwill needs to fill.
- You **subtract** asset write-ups because those write-ups are themselves new value added to the assets side — less goodwill is needed to make the balance sheet balance.
- You **add** the new DTL because it's a new liability, which widens the gap on the liabilities-and-equity side that goodwill has to offset.
- You **subtract** the target's eliminated DTL because removing an existing liability narrows that same gap.

## A fully worked example

Trailhead Corp is acquiring Marlowe Systems for **$400 million in cash**, paid from Trailhead's own balance sheet.

**Marlowe's pre-deal balance sheet:**
- Total assets: $800M, which includes $20M of existing goodwill (so $780M of identifiable assets)
- Total liabilities: $650M, which includes a $10M existing deferred tax liability
- Shareholders' equity: $150M

**Deal adjustments Trailhead's deal team makes:**
- Write up Marlowe's PP&E by $60M to reflect fair market value
- Write off Marlowe's existing $20M of goodwill to zero
- Eliminate Marlowe's existing $10M DTL
- Create a new DTL from the write-up, at Trailhead's 25% tax rate: $60M × 25% = **$15M**

**Plug the formula:**

> Goodwill = $400M − $150M + $20M − $60M + $15M − $10M

Working left to right: $400M − $150M = $250M. Add existing goodwill: $250M + $20M = $270M. Subtract the write-up: $270M − $60M = $210M. Add the new DTL: $210M + $15M = $225M. Subtract the eliminated DTL: $225M − $10M = **$215M of new goodwill.**

**Check it by balancing the combined balance sheet directly.** Assume Trailhead's own pre-deal balance sheet is $5,000M of assets, $3,000M of liabilities, $2,000M of equity.

- Trailhead's assets after paying $400M cash: $5,000M − $400M = $4,600M
- Add Marlowe's identifiable assets (excluding its old goodwill): +$780M
- Add the PP&E write-up: +$60M
- Combined assets before new goodwill: $4,600M + $780M + $60M = **$5,440M**

- Trailhead's liabilities: $3,000M
- Add Marlowe's liabilities: +$650M
- Eliminate Marlowe's old DTL: −$10M
- Add the new DTL: +$15M
- Combined liabilities: $3,000M + $650M − $10M + $15M = **$3,655M**
- Combined equity: Trailhead's own $2,000M (Marlowe's $150M is wiped out entirely)

Total liabilities + equity = $3,655M + $2,000M = **$5,655M**

For assets to match, Goodwill = $5,655M − $5,440M = **$215M** — exactly matching the formula. That's the reconciliation you want to be able to do out loud: the formula is really just a shortcut for balancing the combined balance sheet.

## Why this matters beyond the mechanics

A large goodwill balance is a signal, not just an accounting artifact. If a buyer pays a steep premium relative to a target's tangible book value, most of the purchase price ends up sitting in goodwill — and if the acquisition later underperforms, the buyer has to record a **goodwill impairment charge**, a non-cash hit to pre-tax income that publicly signals the deal didn't work out as planned. Analysts watch goodwill-to-purchase-price ratios across a company's acquisition history as a rough scorecard of how disciplined its dealmaking has been.

## Common mistakes

- **Forgetting to reset the target's existing goodwill to zero.** It's easy to leave the old goodwill balance sitting on the combined balance sheet, which throws off the plug.
- **Applying the wrong tax rate to the new DTL.** Use the *buyer's* tax rate — the buyer is the one that will realize the deferred tax effect going forward.
- **Confusing goodwill impairment with goodwill amortization.** Under US GAAP, goodwill is not amortized on a schedule; it's tested periodically for impairment and only written down if it fails that test.
- **Assuming negative goodwill can't happen.** If a buyer pays less than the target's identifiable net assets are worth (a rare "bargain purchase"), accounting standards require recording a gain on the income statement instead of negative goodwill.

For how goodwill and the write-ups feed into the rest of the combined income statement and EPS, see [The full merger model](/guide/full-merger-model).
