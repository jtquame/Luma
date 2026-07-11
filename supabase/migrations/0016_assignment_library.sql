-- Tribe Works: assignment template library
--
-- A "folder" of reusable assignment content — Samara builds these once,
-- then when creating an actual per-client assignment, typing/selecting a
-- saved title autofills instructions/reflection/attachment instead of
-- retyping them each time. Distinct from `assignments` (the per-client
-- assigned copies) — this table is just the reusable source material.

create table if not exists public.assignment_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null,
  reflection_prompt text,
  reflection_max_length int,
  attachment_url text,
  attachment_name text,
  attachment_type text, -- 'image' | 'document'
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists assignment_templates_title_idx
  on public.assignment_templates (lower(title));

drop trigger if exists assignment_templates_touch_updated_at on public.assignment_templates;
create trigger assignment_templates_touch_updated_at
  before update on public.assignment_templates
  for each row execute function public.touch_updated_at();

alter table public.assignment_templates enable row level security;

drop policy if exists assignment_templates_therapist_only on public.assignment_templates;
create policy assignment_templates_therapist_only on public.assignment_templates
  for all using (public.is_therapist()) with check (public.is_therapist());
