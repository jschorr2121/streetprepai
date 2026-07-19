// Canonical site metadata shared by the root layout, robots.ts, and sitemap.ts —
// single source of truth so title/description copy and the site origin never drift.
//
// URL resolution order: an explicit NEXT_PUBLIC_SITE_URL (set this in Vercel for
// every real deployment) wins; otherwise fall back to Vercel's auto-populated
// deployment URL so previews still get a valid absolute origin; otherwise assume
// local dev.
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? vercelUrl ?? "http://localhost:3000";

export const SITE_NAME = "Street Prep AI";

export const SITE_TITLE = "Street Prep AI — The recruiting cycle, reimagined with AI";

export const SITE_DESCRIPTION =
  "AI-powered prep for IB recruiting. Voice mock interviews, relationship memory, firm intel, and active-reading guides built for undergrads targeting summer analyst offers.";
