-- seed.sql — deterministic seed data for local dev and integration tests.
-- Applied by `supabase db reset` after all migrations.
-- All UUIDs are fixed so tests can reference them by value.

-- ──────────────────────────────────────────────────────────────────────────────
-- Firms (reference data — same as lib/data/firms.ts seedFirms)
-- ──────────────────────────────────────────────────────────────────────────────
insert into public.firms (slug, name, tier, hq, description, latest_earnings_raw) values
  ('goldman-sachs', 'Goldman Sachs', 'bulge-bracket', 'New York, NY',
   'Goldman Sachs'' Investment Banking Division advises across M&A, capital markets, and financing for the largest corporate and institutional clients globally.',
   'Goldman Sachs Q4 2025 earnings (illustrative): Net revenues $13.87B (+12% YoY). IB fees $2.41B (+23% YoY).'
  ),
  ('evercore', 'Evercore', 'elite-boutique', 'New York, NY',
   'Evercore is one of the leading independent advisory firms, known for its pure-advisory model and top-tier M&A practice.',
   'Evercore Q4 2025 earnings (illustrative): Adjusted net revenues $885M (+28% YoY), IB advisory fees $810M (+32% YoY).'
  ),
  ('morgan-stanley', 'Morgan Stanley', 'bulge-bracket', 'New York, NY',
   'Morgan Stanley is consistently top-3 in global M&A and equity underwriting. Well-regarded analyst training program.',
   'Morgan Stanley Q4 2025 earnings (illustrative): Net revenues $16.2B (+10% YoY). IB revenues $2.0B (+31% YoY).'
  )
on conflict (slug) do nothing;
