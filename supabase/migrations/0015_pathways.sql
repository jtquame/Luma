-- Tribe Works: Skill Building pathways
--
-- Self-serve, topic-based multi-step programs (breakups, anxiety, grief,
-- etc.) — a client browses the library and starts whichever they want,
-- similar to a Bible-app reading plan. Steps unlock sequentially: a step
-- isn't visible/answerable until the previous one is marked complete.

create table if not exists public.pathways (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  cover_image_url text,
  is_active boolean not null default true,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pathways_category_idx on public.pathways (category);
create index if not exists pathways_active_idx on public.pathways (is_active);

drop trigger if exists pathways_touch_updated_at on public.pathways;
create trigger pathways_touch_updated_at
  before update on public.pathways
  for each row execute function public.touch_updated_at();

create table if not exists public.pathway_steps (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.pathways(id) on delete cascade,
  position int not null,
  title text not null,
  content text not null,
  reflection_prompt text,
  reflection_max_length int,
  created_at timestamptz not null default now()
);

create index if not exists pathway_steps_pathway_idx on public.pathway_steps (pathway_id, position);

-- One row per client per pathway they've started.
create table if not exists public.pathway_enrollments (
  client_id uuid not null references public.users(id),
  pathway_id uuid not null references public.pathways(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (client_id, pathway_id)
);

-- One row per step a client has completed. Sequential unlock is computed
-- in the app: a step is available once every step before it (by position)
-- has a completion row.
create table if not exists public.pathway_step_completions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id),
  step_id uuid not null references public.pathway_steps(id) on delete cascade,
  reflection_response text,
  completed_at timestamptz not null default now(),
  unique (client_id, step_id)
);

create index if not exists pathway_step_completions_client_idx
  on public.pathway_step_completions (client_id);

alter table public.pathways enable row level security;
alter table public.pathway_steps enable row level security;
alter table public.pathway_enrollments enable row level security;
alter table public.pathway_step_completions enable row level security;

-- Pathways/steps: browsable by everyone (like the book library); writable
-- by the therapist only.
drop policy if exists pathways_select_all on public.pathways;
create policy pathways_select_all on public.pathways
  for select using (public.is_therapist() or is_active);

drop policy if exists pathways_write_therapist_only on public.pathways;
create policy pathways_write_therapist_only on public.pathways
  for all using (public.is_therapist()) with check (public.is_therapist());

drop policy if exists pathway_steps_select on public.pathway_steps;
create policy pathway_steps_select on public.pathway_steps
  for select using (
    exists (
      select 1 from public.pathways p
      where p.id = pathway_id and (public.is_therapist() or p.is_active)
    )
  );

drop policy if exists pathway_steps_write_therapist_only on public.pathway_steps;
create policy pathway_steps_write_therapist_only on public.pathway_steps
  for all using (public.is_therapist()) with check (public.is_therapist());

-- Enrollments/completions: a client manages only their own; therapist can
-- see everyone's (progress visibility).
drop policy if exists pathway_enrollments_select on public.pathway_enrollments;
create policy pathway_enrollments_select on public.pathway_enrollments
  for select using (public.is_therapist() or client_id = auth.uid());

drop policy if exists pathway_enrollments_insert_own on public.pathway_enrollments;
create policy pathway_enrollments_insert_own on public.pathway_enrollments
  for insert with check (client_id = auth.uid());

drop policy if exists pathway_enrollments_update_own on public.pathway_enrollments;
create policy pathway_enrollments_update_own on public.pathway_enrollments
  for update using (client_id = auth.uid());

drop policy if exists pathway_step_completions_select on public.pathway_step_completions;
create policy pathway_step_completions_select on public.pathway_step_completions
  for select using (public.is_therapist() or client_id = auth.uid());

drop policy if exists pathway_step_completions_insert_own on public.pathway_step_completions;
create policy pathway_step_completions_insert_own on public.pathway_step_completions
  for insert with check (client_id = auth.uid());
