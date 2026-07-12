---
slug: event-impacts-on-ev
title: Event Impacts on EV & Equity Value
description: A two-step test for predicting how any transaction moves equity value and enterprise value, applied to eight classic interview scenarios.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["enterprise value", "equity value", "balance sheet", "interview questions", "technicals"]
---

## Why interviewers love this question

"What happens to enterprise value if the company issues $100 of debt?" is one of the most common technical questions you'll get in this chapter, and it comes in dozens of variations — stock issuances, buybacks, dividends, asset purchases, impairments. The good news: you don't need to memorize every case. You need one two-step test, applied consistently.

These questions are always about the company's **current** equity value and enterprise value — meaning you're tracing a single balance sheet event, not projecting future cash flows.

## The two-step test

**Step 1 — Does common shareholders' equity (CSE) change?**
If CSE moves, equity value moves by the same amount, in the same direction. If CSE doesn't move, equity value doesn't move. Note: this is CSE specifically, not total equity — if the company has preferred stock or noncontrolling interest sitting in equity too, "does equity change" is not a safe shortcut. Stick to common shareholders' equity.

**Step 2 — Do net operating assets (NOA) change?**
NOA = Operating Assets − Operating Liabilities — the core, revenue-generating side of the business, excluding cash, marketable securities, debt, and equity items. If NOA moves, enterprise value moves by the same amount, in the same direction. It doesn't matter which investor group funded the change; EV reflects the whole business regardless of how it's financed.

The intuition behind why this works: enterprise value belongs to *all* capital providers together, so purely swapping which investor group holds a claim — issuing debt instead of equity, or vice versa — doesn't touch the underlying business. Only changes to the operating assets and liabilities that actually run the business move EV. This is the same logic behind the Modigliani-Miller idea that financing choices, on their own, don't create or destroy enterprise value.

## Applying it to eight events

Assume a 25% tax rate wherever taxes matter, and that each event is isolated (nothing else changes).

### 1. Issue $100 of common stock, hold the cash

CSE up $100 → **Equity value up $100.**
The $100 lands in cash, a non-operating asset; no operating liability moves, so NOA is unchanged → **EV unchanged.**

### 2. Issue $100 of debt, hold the cash

CSE unchanged (debt doesn't touch equity) → **Equity value unchanged.**
Cash (non-operating) goes up, debt (non-operating liability) goes up, NOA untouched → **EV unchanged.**

This is the one that trips people up most: issuing debt does not raise enterprise value. It just swaps which side of the balance sheet is holding the offsetting cash.

### 3. Buy $100 of inventory with cash

CSE unchanged — cash converts into inventory, both on the assets side, no effect on equity → **Equity value unchanged.**
Inventory is an operating asset; it's up $100 with no offsetting operating liability, so NOA is up $100 → **EV up $100.**

This is the cleanest example of a real operating change: cash (non-operating) becomes inventory (operating), and only EV notices.

### 4. Repurchase $100 of stock using cash on hand

CSE down $100 (treasury stock reduces common equity) → **Equity value down $100.**
Cash (non-operating) down $100, no operating item moves → **EV unchanged.**

A buyback shrinks equity value dollar for dollar but leaves the underlying business — and therefore enterprise value — untouched.

### 5. Pay a $100 dividend

Identical mechanics to the buyback: CSE down $100 via retained earnings → **Equity value down $100.**
Cash down $100, nothing operating changes → **EV unchanged.**

Buybacks and dividends are functionally the same event for this test: both drain cash and CSE by the same amount without touching operations.

### 6. Record a $100 goodwill impairment

This one runs through the income statement. Pre-tax income falls $100, so net income falls $75 at a 25% tax rate. The impairment is non-cash, so it gets added back on the cash flow statement — cash actually rises $25 (the tax shield) even as net income falls. On the balance sheet: cash up $25, goodwill down $100, so total assets are down $75; CSE is down $75 to balance.

CSE down $75 → **Equity value down $75.**
Goodwill is an operating asset; it's down $100 with nothing else operating moving → **NOA down $100 → EV down $100.**

Notice equity value and EV move by *different* amounts here — a useful reminder that the two steps are genuinely independent tests, not the same question asked twice.

### 7. Issue $100 of debt to fund a $100 stock buyback

CSE down $100 (the buyback) → **Equity value down $100.**
Debt up $100, cash unaffected on net (raised then immediately spent), CSE change is non-operating — nothing operating moves → **EV unchanged.**

A classic multi-step version of case 2 and case 4 combined: financing one non-operating event with another non-operating event still nets to zero EV impact.

### 8. Issue $100 of common stock to fund a $100 acquisition of operating assets

CSE up $100 (the stock issuance) → **Equity value up $100.**
The acquired assets are operating in nature (whether they land as PP&E, inventory, or goodwill doesn't matter for this test) — NOA up $100 → **EV up $100.**

This is the pattern to remember for any "issue X to fund an acquisition" question: equity value and EV both move by the amount of the deal, because real operating assets entered the business.

## Common mistakes

**Using "does net assets change" instead of CSE.** They're the same thing only if the company has no preferred stock or noncontrolling interest sitting in equity. When those exist, total equity can be unchanged while CSE moves (or vice versa) — always default to CSE specifically.

**Assuming any repurchase or dividend moves EV.** They never do on their own, because they're funded from cash and hit CSE — both non-operating, canceling out in the NOA test.

**Forgetting the "net" in net operating assets.** If an operating asset and an operating liability move by the same amount in the same event, NOA — and EV — don't change at all.

**Treating the impairment example as "nothing happens because it's non-cash."** It very much does happen: goodwill is an operating asset, so an impairment reduces NOA and therefore EV, even though the accounting entry is non-cash.

## How interviewers probe this

Expect the multi-step version: "the company issues debt, uses the proceeds to buy back stock, and then a year later writes down some of its goodwill — what's the net effect?" Work each event through the two-step test independently, track the running equity value and EV changes, then sum them. Interviewers are checking that you reach for CSE and NOA reflexively rather than trying to reason about ten line items at once — and that you can articulate, in plain language, *why* a given change didn't move EV (rather than just asserting that it didn't).

For the underlying bridge these events are moving along, see [The EV bridge](/guide/the-ev-bridge).
