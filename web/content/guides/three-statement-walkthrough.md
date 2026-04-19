---
slug: three-statement-walkthrough
title: Three-Statement Model Walkthrough
description: How the income statement, balance sheet, and cash flow statement connect to each other — and why understanding the linkages is the foundation of all financial modeling.
category: technicals
difficulty: intermediate
readingMinutes: 8
tags: ["accounting", "three-statement", "modeling", "technicals"]
---

## Why this is the foundation of everything

Before DCFs, before LBOs, before M&A accretion math — there are three financial statements. Every model you build in banking starts with these three documents working together. Interviewers ask about the linkages not to catch you on accounting trivia, but to see whether you actually understand what drives financial performance.

If you can walk through the three statements fluently, you signal that you're not just memorizing formulas — you're thinking about how a business generates and uses cash.

## The three statements at a glance

**Income Statement (P&L)** — Measures economic performance over a period (a quarter, a year). Starts with revenue, subtracts costs and expenses, arrives at net income. Key line items: Revenue, COGS, Gross Profit, EBITDA, EBIT, EBT, Net Income.

**Balance Sheet** — A snapshot of financial position at a single point in time. Assets = Liabilities + Equity. Key sections: current assets, PP&E, intangibles on the left; debt, accounts payable, deferred revenue on the right; shareholders' equity at the bottom.

**Cash Flow Statement (CFS)** — Reconciles net income to actual cash. Three sections: Cash Flow from Operations (CFO), Cash Flow from Investing (CFI), Cash Flow from Financing (CFF). The bottom line is the net change in cash for the period.

## How they connect

This is the part that trips people up in interviews. The three statements are a closed system — changes in one ripple through the others in predictable ways.

### Net income links income statement to both others

Net income is the top line of the cash flow statement's operating section. It also flows directly into retained earnings on the balance sheet:

> Retained Earnings (end of period) = Retained Earnings (beginning) + Net Income − Dividends

Every dollar of profit the company keeps increases retained earnings, which sits in shareholders' equity, which keeps the balance sheet balanced.

### The cash flow statement reconciles to cash on the balance sheet

The ending cash balance on the cash flow statement equals the cash line on the balance sheet:

> Beginning Cash + Net Change in Cash (from CFS) = Ending Cash on Balance Sheet

This is the mechanical check. If your model balances, these two numbers will match. If they don't, you have an error somewhere.

### Depreciation: the most important linkage to master

Depreciation is a non-cash expense on the income statement — it reduces net income, but no cash leaves the door. The cash flow statement adds it back in operating activities (because you're going from net income to actual cash, and D&A wasn't a real cash outflow). Meanwhile, accumulated depreciation reduces PP&E on the balance sheet.

So: if you increase depreciation by $10 (pre-tax), net income falls by $10 × (1 − tax rate), D&A gets added back on the CFS for the full $10, and PP&E on the balance sheet falls by $10. This is such a common interview question that it has its own guide — see "Accounting Linkages."

### Working capital links all three

Changes in working capital (accounts receivable, inventory, accounts payable) flow through the operating section of the cash flow statement, and update current assets/liabilities on the balance sheet. A company growing revenue fast often consumes cash because receivables grow faster than payables — the cash flow statement captures this even when the income statement looks great.

## Walking an interviewer through it

A clean answer sounds like this:

> "The income statement measures profitability over a period and produces net income. Net income flows into retained earnings on the balance sheet and is also the starting point on the cash flow statement. The CFS then adjusts net income for non-cash items like D&A, adds back changes in working capital, and captures investing and financing activities. The bottom line of the CFS — net change in cash — reconciles to the change in the cash line on the balance sheet between periods."

That's 60 seconds. Practice until it flows naturally.

## Common interview follow-ups

- **"What happens if you write down inventory by $50?"** Net income falls (pre-tax $50, after-tax $50 × (1−t)), inventory falls on the balance sheet, retained earnings fall. The CFS operating section shows the write-down as a non-cash add-back.
- **"Can a company be profitable and still go bankrupt?"** Yes — if working capital changes or debt service consume cash faster than the income statement generates it. That's why banks care about free cash flow, not just net income.
- **"What makes a balance sheet balance?"** Any transaction hits at least two line items. If you buy equipment for cash, assets shift but total stays constant. If you take on debt to fund CapEx, assets and liabilities both rise equally.

## Practice this

Take a 10-K from a company you know — Apple, Home Depot, Delta Air Lines. Open the three statements side by side. Find net income on the income statement, confirm it's the first line on the cash flow statement, and trace it down to the change in retained earnings on the balance sheet. Then find the ending cash on the CFS and confirm it matches the balance sheet. Doing this once with real numbers will make the linkages click faster than any flashcard.
