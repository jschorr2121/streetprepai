---
slug: working-capital-and-operational-items
title: Working Capital & Operational Items
description: AR, AP, deferred revenue, inventory, and prepaid expenses taught as record-then-reverse pairs, plus the working capital sign convention that trips up almost everyone.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["accounting", "working-capital", "technicals", "three-statement"]
---

## The pattern underneath all five items

Accounts receivable, accounts payable, deferred revenue, inventory, and prepaid expenses look like five separate topics to memorize. They're really one idea, applied five times: a company **records** something on the income statement before the cash actually moves, and later **reverses** that timing gap when the cash catches up. Learn the pattern once and every one of these becomes predictable instead of memorized.

Each item is a timing difference between when accrual accounting recognizes an event and when cash physically changes hands. Whether the income statement moves at any given moment depends entirely on which side of that gap you're standing on.

## The five items as record/reverse pairs

### Accounts receivable (AR)

**Record (AR up):** the company delivers a product and recognizes revenue, but the customer hasn't paid yet. Revenue and net income rise; AR rises as an IOU; cash is untouched.

**Reverse (AR down):** the customer pays. Nothing happens on the income statement — the revenue was already booked. Cash goes up, AR goes down.

### Accounts payable (AP)

**Record (AP up):** the company receives an invoiced good or service and books the expense, but hasn't paid the vendor yet. The expense hits the income statement, net income falls, AP rises, cash is untouched.

**Reverse (AP down):** the company pays the vendor. No income statement impact — the expense was already recorded. Cash falls, AP falls.

### Deferred revenue

**Record (deferred revenue up):** the customer pays in advance for something not yet delivered. Cash rises immediately, but there's no revenue yet — the company hasn't earned it. Deferred revenue (a liability) rises.

**Reverse (deferred revenue down):** the company delivers the product or service it was already paid for. Revenue and net income rise now, with no new cash — deferred revenue falls as it converts into recognized revenue.

### Inventory

**Record (inventory up):** the company buys raw materials or finished goods. This is just an asset swap — cash for inventory — so nothing hits the income statement. Cash falls, inventory rises.

**Reverse (inventory down):** the company sells what it made. COGS (and often matching revenue) hits the income statement now, inventory falls, and cash or AR rises depending on whether the sale was cash or credit.

### Prepaid expenses

**Record (prepaid up):** the company pays cash in advance for something it hasn't consumed yet — a year of insurance, paid upfront. Cash falls, prepaid expenses (an asset) rise. No income statement impact yet.

**Reverse (prepaid down):** the benefit gets consumed over time — a month of that insurance elapses. The expense hits the income statement now, and prepaid expenses fall. No new cash moves.

## Why this pattern matters more than the definitions

Notice the symmetry: in every pair, exactly one side of the transaction hits the income statement, and it's never the same side twice in a row. If the "record" leg touched the income statement (AR, AP), the "reverse" leg is pure cash with no income statement impact. If the "record" leg was pure cash (deferred revenue, inventory, prepaid), the "reverse" leg is the one that finally hits the income statement. Once you see that alternation, you can work out the treatment for almost any operational item you've never seen before, just by asking: has revenue/expense been recognized yet, and has cash moved yet?

## Defining working capital, and reading a negative number correctly

The textbook definition is current assets minus current liabilities, but the version that actually matters in interviews is narrower:

> Operating working capital = operating current assets − operating current liabilities

"Operating" strips out cash, short-term investments, and short-term debt — those relate to capital structure, not running the business. What's left is AR, inventory, prepaid expenses on one side, and AP, accrued expenses, deferred revenue on the other.

Negative working capital is not automatically a red flag — its meaning depends entirely on which liabilities are driving it. A software company with $10M AR, $2M prepaid, and $60M deferred revenue has working capital of $10M + $2M − $60M = −$48M, and that's a *good* sign: customers are paying up front, funding the business before it even delivers. A struggling retailer with $10M AR, $2M prepaid, and $60M AP has the identical −$48M figure, but that version means the company is leaning hard on suppliers because it doesn't have the cash to pay its bills on time. Same number, opposite story — always ask which line items are producing it.

## The sign convention that trips people up

Here's the part that catches almost everyone at least once: on the cash flow statement, the *change* in working capital is shown with the sign flipped relative to what you might expect.

> Change in working capital on the CFS = Old working capital − New working capital

If working capital rises from $50M to $90M, the change is +$40M by simple subtraction — but the CFS shows **−$40M**. Why? Because a rising working capital balance means the company tied up more cash in operating assets (or paid down operating liabilities) than it collected. Picture it as pure inventory: if inventory goes from $50M to $90M, the company spent $40M of cash buying that inventory, so the cash flow impact is negative $40M, even though the balance sheet account itself went up.

The rule of thumb to keep in your head under pressure: **working capital up = cash used (negative on CFS); working capital down = cash freed up (positive on CFS).**

## A worked example

A company's working capital moves from $30M to $18M year over year, driven by AP rising $15M (supplier terms lengthened) while AR rose $3M.

Change in working capital = $30M − $18M = **+$12M** on the cash flow statement — a source of cash, because the company is now floating more of its bills to suppliers than it's floating to customers.

## Common mistakes

- **Applying the record/reverse logic to the wrong direction.** Always ask first: has the income statement already recognized this, or is it still pending? That answer tells you instantly whether the *current* move should hit the P&L or not.
- **Flipping the working capital sign backwards.** A rising balance is a cash use, not a cash source — say it out loud in the "up = used, down = freed" form until it's automatic.
- **Declaring negative working capital bad by reflex.** Always name which specific line item is driving it before judging it.
- **Forgetting that inventory purchases don't touch the income statement.** Buying raw materials is an asset swap; only the sale of finished goods creates COGS.

## How interviewers probe this

Expect a rapid-fire round: "deferred revenue goes up by $20 — walk me through it," then immediately "now it goes down by $20 — what changes?" The fastest tell of real understanding is answering the reverse direction just as quickly as the forward one, since most candidates have only memorized one direction per item. You'll also get "is negative working capital bad?" cold — resist the reflex answer and ask what's driving it before answering. For the drill format applied end-to-end across all three statements, see [Single-step changes](/guide/single-step-changes).
