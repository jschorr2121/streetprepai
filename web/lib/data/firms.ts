import type { Firm } from "@/lib/types";

export const seedFirms: Firm[] = [
  {
    slug: "goldman-sachs",
    name: "Goldman Sachs",
    tier: "bulge-bracket",
    hq: "New York, NY",
    description: `Goldman Sachs' Investment Banking Division advises across M&A, capital markets, and financing for the largest corporate and institutional clients globally. Historically #1 or #2 in global M&A league tables. The culture is demanding, intellectually rigorous, and prestige-conscious — graduating analysts place across top PE, hedge funds, and growth equity.`,
    latestEarningsRaw: `Goldman Sachs Q4 2025 earnings release (illustrative content for demo):
Net revenues of $13.87B, up 12% year-over-year.
Investment Banking fees of $2.41B, up 23% YoY — driven by a recovery in M&A advisory (+40% YoY) and debt underwriting (+15% YoY).
Equity underwriting remained subdued (-8% YoY) amid a still-thin IPO pipeline.
Asset & Wealth Management revenues of $4.30B.
Global Banking & Markets revenues of $7.00B.
Book value per share up 5% QoQ. ROE of 12.9%.
CFO commentary emphasized the "significantly improved dialogue" in strategic advisory and expectation of 2026 M&A recovery sustaining. Announced buyback authorization increase.`,
  },
  {
    slug: "evercore",
    name: "Evercore",
    tier: "elite-boutique",
    hq: "New York, NY",
    description: `Evercore is one of the leading independent advisory firms, known for its pure-advisory model (no commercial banking, limited capital markets conflicts) and top-tier M&A practice. Entrepreneurial culture, flat deal teams, and high responsibility early for analysts. Strong in industrials, healthcare, consumer, and generalist coverage.`,
    latestEarningsRaw: `Evercore Q4 2025 earnings release (illustrative content for demo):
Adjusted net revenues of $885M, up 28% YoY, setting a new quarterly record.
Investment Banking advisory fees of $810M, up 32% YoY — largest contributor was M&A advisory on announced deals including two $10B+ industrial transactions.
Underwriting fees of $35M (primarily IPO advisory and structuring roles).
Consulting & other $40M.
Non-comp expense ratio declined 90 bps YoY on disciplined investment.
Management commentary: "The pipeline of strategic activity we are advising on is the strongest we have seen in three years." Raised guidance on operating margin for 2026.`,
  },
  {
    slug: "morgan-stanley",
    name: "Morgan Stanley",
    tier: "bulge-bracket",
    hq: "New York, NY",
    description: `Morgan Stanley is consistently top-3 in global M&A and equity underwriting. Well-regarded analyst training program and strong TMT, Healthcare, and Industrials franchises. Culture is widely regarded as more collaborative than peers. Extensive global wealth management arm differentiates the broader franchise, but IBD analysts are a distinct career track.`,
    latestEarningsRaw: `Morgan Stanley Q4 2025 earnings release (illustrative content for demo):
Net revenues of $16.2B, up 10% YoY.
Institutional Securities revenue of $7.7B, with Investment Banking at $2.0B (+31% YoY).
Advisory revenue of $880M (+48% YoY) led by Healthcare and Technology. Equity underwriting of $420M (+5% YoY). Fixed income underwriting $700M (+22% YoY).
Wealth Management revenues of $7.5B.
CFO noted "sustained momentum in strategic dialogue" heading into 2026 and a "favorable regulatory backdrop" for M&A. Efficiency ratio improved 180 bps.`,
  },
];
