-- Tribe Works: check-in cadence (Milestone: structured recurring check-ins)
--
-- Previously check-ins were hardcoded to "once per day" at the database
-- level. Samara wants therapist-set cadence per check-in instead: daily,
-- weekly, biweekly, or monthly. The old unique index only worked for the
-- daily case, so it's replaced with application-level eligibility checks
-- (see app/(client)/check-in/page.tsx) based on the client's last
-- submission plus the template's frequency.
--
-- Written to be safely re-runnable: each step checks whether it's already
-- been applied before doing anything, so running this twice (or resuming
-- after a partial failure) won't error out.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'check_in_frequency') then
    create type check_in_frequency as enum ('daily', 'weekly', 'biweekly', 'monthly');
  end if;
end $$;

alter table public.templates
  add column if not exists frequency check_in_frequency;

-- Existing check-in templates default to daily (their previous behavior);
-- prompts stay null since they're one-off, not recurring. Only touches
-- rows that don't have a frequency set yet, so re-running this is safe
-- even if a therapist has already customized some templates.
update public.templates
set frequency = 'daily'
where kind = 'check_in' and frequency is null;

drop index if exists public.responses_one_checkin_per_day;
