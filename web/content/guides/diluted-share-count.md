---
slug: diluted-share-count
title: Diluted Share Count
description: How to convert basic shares into diluted shares using the treasury stock method, and how options, warrants, RSUs, and convertibles each get treated.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["diluted shares", "treasury stock method", "equity value", "convertibles", "technicals"]
---

## Why basic shares aren't the real share count

When you pull a company's share count off a data provider, you'll usually see two numbers: basic shares and diluted shares. Basic shares are just what's currently issued and held by shareholders. Diluted shares add in every security that could turn into common stock — employee stock options, warrants, restricted stock units, and convertible bonds or preferred stock.

You always want diluted shares when calculating equity value, because the whole point of equity value is figuring out what it would actually cost to buy every claim on the company's equity. If you ignore the securities that are one exercise or one conversion away from becoming shares, you're understating that cost — sometimes by a meaningful amount.

## The treasury stock method

The treasury stock method (TSM) handles options and warrants. The logic: assume every in-the-money option gets exercised, which creates new shares and hands the company cash equal to the exercise price. Then assume the company turns around and uses that cash to buy back as many shares as it can at the current market price. The net new shares — the ones created minus the ones repurchased — are what actually dilute the share count.

Three steps:

1. **Assume exercise.** Each option creates one new share. Total new shares = number of options exercised.
2. **Company collects cash.** Proceeds = number of options × exercise price.
3. **Company buys back shares.** Shares repurchased = proceeds ÷ current share price.

Net dilution = new shares created − shares repurchased.

An option only gets this treatment if it's **in-the-money**: exercise price below the current share price. Out-of-the-money options are ignored entirely — nobody would pay more than the stock is worth to get the stock.

### Worked example

A company trades at $40 per share. It has 500,000 options outstanding at a $25 exercise price (in-the-money) and 200,000 options at a $50 exercise price (out-of-the-money).

The $50 options are ignored — they're underwater.

For the $25 options:
- New shares created: 500,000
- Cash proceeds: 500,000 × $25 = $12,500,000
- Shares repurchased: $12,500,000 ÷ $40 = 312,500
- Net new shares: 500,000 − 312,500 = **187,500**

If basic shares outstanding were 20,000,000, diluted shares from this tranche alone would be 20,187,500. There's a useful shortcut worth internalizing: net dilution = options × (1 − exercise price ÷ share price). Here that's 500,000 × (1 − 25/40) = 500,000 × 0.375 = 187,500 — same answer, faster to compute under pressure.

## Warrants

Warrants get the exact same treatment as options: treasury stock method, in-the-money test, net new shares. The mechanics don't change — warrants are just options issued to someone other than an employee (often lenders or underwriters as a sweetener).

## Restricted stock units (RSUs)

RSUs are simpler — there's no exercise price and no treasury stock method. An RSU is a promise of a share that vests over time with no cash changing hands, so once vested (or assumed vested for this purpose), it's added straight to the diluted share count at full value. If a company has 100,000 unvested RSUs, diluted shares go up by 100,000, full stop.

## Convertible securities: all or nothing

Convertible bonds and convertible preferred stock work differently from options — there's no treasury stock method involved at all, because converting doesn't put any cash into the company's pocket. Instead, you apply an if-converted, either/or test:

- **In-the-money** (conversion price below the current share price): treat the entire security as if it already converted. Add all the shares it would create to the diluted count, and remove the security from debt (or preferred stock) since it's now equity.
- **Out-of-the-money**: leave it alone. Count its face value as debt (or preferred stock, if that's what it is) and don't touch the share count.

To find how many shares a convertible bond creates, divide its par value by its conversion price, then multiply by the number of bonds:

> Shares per bond = Par Value ÷ Conversion Price
> Total new shares = Shares per bond × Number of bonds

### Worked example

A company has 10,000,000 shares outstanding at $60 per share. It also has $30,000,000 of convertible bonds outstanding, with $1,000 par value per bond and a $40 conversion price.

Conversion price ($40) is below the share price ($60), so these bonds are in-the-money — treat them as converted.

- Number of bonds: $30,000,000 ÷ $1,000 = 30,000 bonds
- Shares per bond: $1,000 ÷ $40 = 25 shares
- New shares: 30,000 × 25 = **750,000**

Diluted shares from this convertible: 10,000,000 + 750,000 = 10,750,000. And critically, that $30,000,000 no longer counts as debt in your enterprise value bridge — it's equity now, since you've already counted its shares. Double-counting it as both debt and diluted shares is one of the most common mistakes in this calculation.

## Putting it together

Say the same company also has 200,000 in-the-money options at a $20 exercise price, with the stock still at $60.

- Net new shares from options: 200,000 × (1 − 20/60) = 200,000 × 0.667 = 133,333

Total diluted shares: 10,000,000 (basic) + 750,000 (convertible) + 133,333 (options) = **10,883,333**

Diluted equity value: 10,883,333 × $60 = **$652,999,980**, versus a basic equity value of $600,000,000 — about 8.8% dilution. That's a normal magnitude; anything over roughly 10% is worth double-checking your work, and 25%+ should make you suspicious you made an error somewhere.

## Common mistakes

**Applying the treasury stock method to convertibles.** Convertibles don't generate cash on conversion — there's no exercise price being paid. Applying TSM there is a frequent and telling error.

**Forgetting the in-the-money test.** Every option, warrant, and convertible gets checked against the current share price before you do anything else. Out-of-the-money securities contribute zero dilution.

**Double-counting converted debt.** Once you've added a convertible's shares to the diluted count, remove its face value from debt in your enterprise value bridge — see the [EV bridge](/guide/the-ev-bridge) guide.

**Mixing up options outstanding and options exercisable.** Companies often report both; there's no universally "correct" choice, but be consistent across every company you analyze in a comp set.

## How interviewers probe this

Expect a multi-security question: a share price, an options tranche or two at different strikes, some RSUs, and a convertible bond, then "what's diluted equity value?" The efficient way to work it is security by security — TSM for the options and warrants, straight addition for RSUs, if-converted test for anything convertible — then sum the increments onto basic shares before multiplying by price. Interviewers are watching whether you apply the right method to each security type, not whether you can do the arithmetic fast.
