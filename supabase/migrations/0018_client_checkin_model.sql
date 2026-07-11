-- Tribe Works: client-wide check-in cadence, assigned (not broadcast)
-- check-ins, and opt-in response sharing
--
-- Three related changes to how check-ins work:
--
-- 1. Instead of picking a frequency per check-in, a client sets ONE
--    frequency that governs every check-in they're given.
-- 2. Instead of every active check-in showing up for every client,
--    Samara picks one or more specific check-ins for a specific client.
--    Only assigned check-ins appear for that client.
-- 3. After answering a check-in or prompt, a client chooses whether to
--    share that specific response with Samara. Unshared responses are
--    private to the client — Samara genuinely cannot see them. This is a
--    real behavior change worth being explicit about: check-ins are no
--    longer automatically visible to the therapist just by being
--    submitted.

alter table public.users
  add column if not exists preferred_checkin_frequency check_in_frequency not null default 'daily';

create table if not exists public.client_checkin_assignments (
  client_id uuid not null references public.users(id),
  template_id uuid not null references public.templates(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (client_id, template_id)
);

alter table public.client_checkin_assignments enable row level security;

drop policy if exists client_checkin_assignments_select on public.client_checkin_assignments;
create policy client_checkin_assignments_select on public.client_checkin_assignments
  for select using (public.is_therapist() or client_id = auth.uid());

drop policy if exists client_checkin_assignments_write_therapist_only on public.client_checkin_assignments;
create policy client_checkin_assignments_write_therapist_only on public.client_checkin_assignments
  for all using (public.is_therapist()) with check (public.is_therapist());

-- Opt-in sharing on responses.
alter table public.responses
  add column if not exists shared_with_therapist boolean not null default false;

drop policy if exists responses_select on public.responses;
create policy responses_select on public.responses
  for select using (
    (public.is_therapist() and shared_with_therapist = true) or client_id = auth.uid()
  );

drop policy if exists responses_client_update_share on public.responses;
create policy responses_client_update_share on public.responses
  for update using (client_id = auth.uid());

-- RLS is row-level only — without this trigger a client could also try to
-- set reviewed_at/reviewed_by on their own response via a direct API call.
create or replace function public.guard_response_client_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_therapist() then
    if new.reviewed_at is distinct from old.reviewed_at
      or new.reviewed_by is distinct from old.reviewed_by
      or new.template_id is distinct from old.template_id
      or new.client_id is distinct from old.client_id
    then
      raise exception 'Clients cannot edit review status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists responses_guard_client_edits on public.responses;
create trigger responses_guard_client_edits
  before update on public.responses
  for each row execute function public.guard_response_client_edits();
