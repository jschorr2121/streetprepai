---
slug: cost-of-capital-and-wacc
title: Cost of Capital and WACC
description: How to derive WACC from first principles — CAPM for cost of equity, cost of debt, capital structure weights — and why it's the right discount rate for a DCF.
category: technicals
difficulty: intermediate
readingMinutes: 9
tags: ["WACC", "CAPM", "cost of equity", "cost of debt", "DCF", "technicals"]
---

## Why WACC matters

WACC is the discount rate you use in a DCF. Get it wrong, and your entire valuation is off. More importantly, WACC is where a lot of candidates reveal whether they actually understand the model or just memorized the formula. Interviewers will probe the inputs — what drives your beta estimate, why you use market weights, how you think about the risk-free rate — so you need to understand every component from the ground up.

The conceptual anchor: **WACC is the minimum return the company must earn on its existing assets to satisfy its capital providers.** Debt holders require interest. Equity holders require returns commensurate with risk. WACC blends these two required rates, weighted by how much of each the company uses to fund itself.

## The formula

> WACC = (E/V) × Cost of Equity + (D/V) × Cost of Debt × (1 − Tax Rate)

Where:
- **E** = market value of equity
- **D** = market value of debt
- **V** = E + D (total firm value)
- **(1 − Tax Rate)** reflects the tax deductibility of interest (the "tax shield")

## Cost of equity — using CAPM

The cost of equity is what equity investors demand as a return for bearing the risk of owning the company. The standard model is **CAPM (Capital Asset Pricing Model)**:

> Cost of Equity = Risk-Free Rate + Beta × Equity Risk Premium

### Risk-Free Rate

The yield on a long-term US Treasury bond — typically the 10-year yield. This represents the return available with (essentially) zero risk. In your analysis, use the current rate or a normalized estimate. Interviewers sometimes ask why you use the 10-year: it's because the assets you're discounting are long-duration, so you want to match the duration of the discount rate.

### Beta

Beta measures the systematic risk of the stock — how much it moves relative to the broader market. A beta of 1.0 moves with the market. Beta > 1 is more volatile (e.g., high-growth tech), beta < 1 is less volatile (e.g., utilities).

You typically pull historical beta from the last 2–5 years of stock returns regressed against the S&P 500. In practice, bankers often use **unlevered beta** (beta stripped of the capital structure effect) and then re-lever it to the target company's capital structure:

> Unlevered Beta (Asset Beta) = Levered Beta ÷ (1 + (1 − Tax Rate) × D/E)

Re-levering: Levered Beta = Unlevered Beta × (1 + (1 − Tax Rate) × D/E)

This is called the **Hamada equation**, and it lets you use comparable company betas even if their capital structures differ from your subject company.

### Equity Risk Premium (ERP)

The expected excess return of stocks over the risk-free rate. Historically, this has been in the range of 4–6% for the US market. Damodaran publishes regularly updated ERP estimates that practitioners reference. Know that this is a debated input — it's estimated, not observed.

**Putting it together:** If risk-free rate = 4.5%, beta = 1.2, ERP = 5%:

> Cost of Equity = 4.5% + 1.2 × 5% = 4.5% + 6.0% = **10.5%**

## Cost of debt

The cost of debt is the interest rate the company pays on its borrowings. You can estimate it:
- Directly from the yield on the company's outstanding debt (if publicly traded bonds exist)
- From the company's interest expense ÷ average total debt (average rate paid)
- Synthetically, using a credit rating and the spread for that rating over Treasuries

Importantly, you use the **after-tax cost of debt** in WACC because interest is tax-deductible:

> After-Tax Cost of Debt = Cost of Debt × (1 − Tax Rate)

If cost of debt is 6% and tax rate is 25%:
> After-Tax Cost of Debt = 6% × (1 − 0.25) = **4.5%**

## Capital structure weights — market, not book

A critical detail that trips up many candidates: you use **market values** of debt and equity as the weights, not book values.

Why? Because the market reflects the current economic value of each claim. Book equity can be wildly distorted by accumulated accounting adjustments. If you used book equity as a weight in a company with a large accumulated deficit but a high market cap, your WACC would be badly wrong.

For debt, the market value is often close to par (book) unless the company is distressed, so in practice, many analysts use book value of debt. For equity, always use market cap.

## Putting the full WACC together

Say a company has:
- Equity: $800M at market
- Debt: $200M
- Total firm value: $1,000M
- Cost of equity: 10.5%
- Cost of debt: 6%
- Tax rate: 25%

> WACC = (800/1000) × 10.5% + (200/1000) × 6% × (1 − 0.25)
> WACC = 0.8 × 10.5% + 0.2 × 4.5%
> WACC = 8.4% + 0.9% = **9.3%**

## Common interview follow-ups

**"Why do you use WACC to discount unlevered cash flows?"**
Because UFCF is the cash available to all capital providers (equity and debt alike). You need a discount rate that reflects all of them — WACC does exactly that. Using cost of equity alone would understate the true hurdle rate.

**"What happens to WACC if you add more debt?"**
Counterintuitive answer: it depends. More debt reduces the equity weight and adds cheaper (after-tax) debt — which initially lowers WACC. But more leverage also increases financial risk, which raises the required return on equity (higher levered beta), pushing cost of equity up. At high leverage, WACC starts rising again because equity becomes very risky. This is the foundation of the Modigliani-Miller framework.

**"What's a reasonable WACC for a large US consumer staples company?"**
Something like 7–9%, reflecting a low-beta business with modest leverage, in a normal interest rate environment. For a higher-growth tech company: maybe 10–13%. For a distressed or highly levered business: could be 12%+. Know these ballpark ranges cold.

## Practice this

Find the 10-year Treasury yield today. Pull the beta for two companies — one in utilities, one in technology. Use a 4.5–5% equity risk premium. Calculate the cost of equity for each. Then think about each company's typical capital structure and estimate a rough WACC. Notice how differently the numbers come out — and ask yourself which company's assets are inherently riskier.
