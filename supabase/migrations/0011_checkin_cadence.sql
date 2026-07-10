-- Tribe Works: check-in cadence (Milestone: structured recurring check-ins)
--
-- Previously check-ins were hardcoded to "once per day" at the database
-- level. Samara wants therapist-set cadence per check-in instead: daily,
-- weekly, biweekly, or monthly. The old unique index only worked for the
-- daily case, so it's replaced with application-level eligibility checks
-- (see app/(client)/check-in/page.tsx) based on the client's last
-- submission plus the template's frequency.

create type check_in_frequency as enum ('daily', 'weekly', 'biweekly', 'monthly');

alter table public.templates
  add column frequency check_in_frequency;

-- Existing check-in templates default to daily (their previous behavior);
-- prompts stay null since they're one-off, not recurring.
update public.templates set frequency = 'daily' where kind = 'check_in';

drop index if exists public.responses_one_checkin_per_day;
