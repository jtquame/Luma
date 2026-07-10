-- Tribe Works: skill building / reflections (per-client assignments)
--
-- Distinct from templates/responses: those are broadcast to every client.
-- Assignments are targeted — Samara assigns a specific piece of homework
-- (a worksheet, a reflection prompt, a skill to practice) to one client
-- after a session, and only that client sees it.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type assignment_status as enum ('assigned', 'completed');
  end if;
end $$;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id),
  title text not null,
  instructions text not null,
  -- Optional structured reflection, reusing the same question shape as
  -- templates so it can render with the existing QuestionField component
  -- (e.g. "What's one thing you noticed this week?" capped-length text).
  reflection_prompt text,
  reflection_max_length int,
  status assignment_status not null default 'assigned',
  reflection_response text,
  completed_at timestamptz,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignments_client_idx on public.assignments (client_id, created_at desc);

drop trigger if exists assignments_touch_updated_at on public.assignments;
create trigger assignments_touch_updated_at
  before update on public.assignments
  for each row execute function public.touch_updated_at();

alter table public.assignments enable row level security;

drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments
  for select using (public.is_therapist() or client_id = auth.uid());

drop policy if exists assignments_write_therapist_only on public.assignments;
create policy assignments_write_therapist_only on public.assignments
  for insert with check (public.is_therapist());

drop policy if exists assignments_update on public.assignments;
create policy assignments_update on public.assignments
  for update using (public.is_therapist() or client_id = auth.uid());

drop policy if exists assignments_delete_therapist_only on public.assignments;
create policy assignments_delete_therapist_only on public.assignments
  for delete using (public.is_therapist());

-- RLS is row-level, not column-level — the update policy above lets a
-- client update their own row, but a client should only ever be able to
-- change their reflection_response/status/completed_at, never the
-- assignment content itself. This trigger closes that gap for anyone
-- calling the API directly rather than through the app's server actions.
create or replace function public.guard_assignment_client_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_therapist() then
    if new.title is distinct from old.title
      or new.instructions is distinct from old.instructions
      or new.reflection_prompt is distinct from old.reflection_prompt
      or new.reflection_max_length is distinct from old.reflection_max_length
      or new.client_id is distinct from old.client_id
    then
      raise exception 'Clients cannot edit assignment content';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists assignments_guard_client_edits on public.assignments;
create trigger assignments_guard_client_edits
  before update on public.assignments
  for each row execute function public.guard_assignment_client_edits();
