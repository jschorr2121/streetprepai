-- 0005_applied_jobs_stage_align.sql
-- Aligns the applied_jobs.stage CHECK constraint from the legacy set
-- ('bookmarked','applied','screen','interview','superday','offer','rejected')
-- to the spec's canonical set
-- ('shortlist','applied','interview','superday','offer','rejected').
--
-- Changes:
--   1. Renames legacy stage values to spec values (data migration):
--        bookmarked  → shortlist
--        screen      → interview   (closest semantic match)
--   2. Drops the old CHECK constraint.
--   3. Adds the new CHECK constraint.
--   4. Adds updated_at default (was nullable with no default in baseline).
--
-- Idempotent: all ALTER TABLE … ADD COLUMN IF NOT EXISTS, UPDATE … WHERE stage in (...).

-- Step 1 — Migrate legacy stage values before the constraint change.
update public.applied_jobs
  set stage = 'shortlist'
  where stage = 'bookmarked';

update public.applied_jobs
  set stage = 'interview'
  where stage = 'screen';

-- Step 2 — Drop old CHECK constraint (named automatically by Postgres; use a DO
-- block to handle the name gracefully in case this already ran).
do $$
declare
  _constraint text;
begin
  select conname
    into _constraint
    from pg_constraint
    where conrelid = 'public.applied_jobs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%bookmarked%';
  if _constraint is not null then
    execute format('alter table public.applied_jobs drop constraint %I', _constraint);
  end if;
end $$;

-- Step 3 — Add new CHECK constraint (idempotent: skip if it already exists).
do $$
begin
  if not exists (
    select 1
      from pg_constraint
      where conrelid = 'public.applied_jobs'::regclass
        and conname = 'applied_jobs_stage_check'
  ) then
    alter table public.applied_jobs
      add constraint applied_jobs_stage_check
        check (stage in ('shortlist','applied','interview','superday','offer','rejected'))
        not valid;
  end if;
end $$;

-- Validate the constraint (no-op if it was already valid).
alter table public.applied_jobs
  validate constraint applied_jobs_stage_check;

-- Step 4 — Ensure updated_at has a default for new rows.
alter table public.applied_jobs
  alter column updated_at set default now();
