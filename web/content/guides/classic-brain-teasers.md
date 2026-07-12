---
slug: classic-brain-teasers
title: Classic brain teasers
description: A curated set of classic IB brain teasers with full solution walkthroughs, framed honestly as a fading part of the process.
category: technicals
difficulty: advanced
readingMinutes: 7
tags: [brain-teasers, problem-solving, interview-format, quant-reasoning, legacy-questions]
---

## Why this is here, and why it's optional

A decade ago, "you have two ropes that each burn unevenly in 60 minutes, how do you measure 45 minutes" was a live wire in banking interviews. Today it's mostly gone. Bulge bracket technical rounds have shifted almost entirely toward valuation, accounting, and deal mechanics, because those map directly to the analyst seat. Brain teasers got a reputation for testing puzzle-solving trivia rather than job-relevant skill, and most groups dropped them.

They haven't vanished completely. You'll still run into them at a handful of boutiques, at some hedge funds and prop shops that hire out of the same recruiting pipeline, and occasionally from an older MD who came up in an era when they were standard. Because the hit rate is low, treat this as an elective: work through it once, understand the reasoning pattern, and don't let it crowd out time you should spend on DCF mechanics or accretion/dilution. If you only have a few hours left before an interview, skip this page and drill technicals instead.

## What interviewers are actually testing

Nobody cares whether you've memorized the answer to the two-ropes problem. If you have, you'll blurt it out and the interviewer will just nod. The value they're extracting is watching how you behave when you're stuck: do you ask clarifying questions, do you think out loud, do you stay calm, do you self-correct when a first idea doesn't work. That's the transferable skill — it's the same behavior they want to see when you're handed a messy comp set or an odd research question with no template.

So when you practice these, practice narrating your thought process, not silently solving them and announcing the number. Silence during a brain teaser reads as either memorization or panic, neither of which helps you.

### The two-ropes timing problem

You have two ropes. Each takes exactly 60 minutes to burn completely, but they burn unevenly along their length — you cannot assume the halfway point takes 30 minutes. You have matches. How do you measure exactly 45 minutes?

Walk it out loud like this: "If I light a rope at one end, I only know two things reliably — it takes 60 minutes to fully burn, and if I light it at both ends simultaneously, it burns twice as fast, so both ends meeting takes 30 minutes, regardless of the uneven burn rate along its length, because the two flames are covering the rope's total burn-time between them."

That's the insight: lighting both ends collapses 60 minutes of burn time into 30 minutes of clock time, no matter how the material is distributed.

Now build the full answer: light rope A at both ends and rope B at one end, all at the same moment. Rope A finishes in 30 minutes. The instant it finishes, light the other end of rope B (which has been burning from one end for 30 minutes, so it has 30 minutes of burn-time left in it). Lighting its second end collapses that remaining 30 minutes of burn-time into 15 minutes of clock time. Total elapsed: 30 + 15 = 45 minutes.

Verify: rope B burns 60 minutes total. After 30 minutes from one end, 30 minutes of unburned rope remains (by definition of total burn time, independent of where along the rope that unburned material sits). Lighting the second end doubles the flame front on that remainder, halving its remaining time to 15 minutes. 30 + 15 = 45. Checks out.

### The 100 coins, 10 heads-up problem

You're blindfolded. In front of you are 100 coins, 10 of which are heads-up and 90 tails-up, but you can't see or feel which is which. You may flip coins as many times as you like. Split the coins into two piles (not necessarily equal size) so that both piles end up with the same number of heads-up coins.

The trick is that flipping a coin toggles its state, and you don't need to know which coins are heads — you just need the count to come out even between the two piles.

Take any 10 coins from the 100 and set them aside as pile A; the other 90 form pile B. Flip every coin in pile A. Claim: pile A now has the same number of heads as pile B.

Prove it with a variable. Say pile A originally contained h heads (some number between 0 and 10, you don't know which). Since pile A has 10 coins total, it also had (10 - h) tails. The remaining 10 - h heads from the original 10 must be sitting in pile B, since there are 10 heads total across all 100 coins. So pile B has (10 - h) heads.

Now flip every coin in pile A. The h heads become tails, and the (10 - h) tails become heads. So pile A now has (10 - h) heads-up coins. Pile B independently has (10 - h) heads-up coins, untouched. They're equal, for any value of h from 0 to 10, without ever needing to know h.

Quick numeric check: suppose by coincidence 4 of the 10 heads happened to land in your pile A of 10. Pile A: 4 heads, 6 tails. Pile B (90 coins): 6 heads, 84 tails. Flip pile A: the 4 heads become tails, the 6 tails become heads, so pile A now has 6 heads. Pile B still has 6 heads. Equal, as predicted.

### The three light switches and one bulb problem

You're in a room with three switches, only one of which controls a bulb in the next room. You can flip switches now, but you may only enter the bulb's room once. How do you determine which switch controls the bulb?

The lever you're missing if you're stuck: a bulb gives you two channels of information, not one — whether it's lit, and whether it's warm. Two channels can distinguish three possibilities.

Turn switch 1 on and leave it for a few minutes. Turn it off. Immediately turn switch 2 on. Walk into the room. If the bulb is lit, switch 2 is the answer. If it's dark but warm, switch 1 is the answer, since it was on long enough to heat the filament before you switched it off. If it's dark and cool, switch 3 is the answer by elimination.

## Common mistakes

Rushing to an answer you half-remember and getting the logic wrong under pressure is worse than never having heard the puzzle — you look like you're bluffing. If you don't know a puzzle cold, say so and reason from scratch; a clean, narrated derivation beats a garbled memorized answer.

Another mistake is treating the number as the deliverable. If you land on "45 minutes" or "6 heads" without ever explaining why, you've wasted the only signal the question was designed to produce. Slow down, state your assumptions, and check your answer against a small concrete case before declaring it final, exactly like the numeric checks above.

Finally, don't over-invest. If a recruiter or program tells you the process is behavioral- and technical-heavy with no puzzle component, spend your prep hours on accounting and valuation instead. This page exists so you're not caught flat-footed if a brain teaser does come up, not because it's likely to define your outcome.
