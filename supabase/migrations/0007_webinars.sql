-- Luma: webinars (Milestone 9)

create table public.webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  speaker text,
  video_url text,
  thumbnail_url text,
  length_minutes int,
  slides_url text,
  worksheet_url text,
  scheduled_at timestamptz,
  registration_url text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index webinars_scheduled_idx on public.webinars (scheduled_at);

create trigger webinars_touch_updated_at
  before update on public.webinars
  for each row execute function public.touch_updated_at();

-- Per-client completion tracking, separate from responses since a webinar
-- isn't a structured Q&A — just watched/not watched.
create table public.webinar_completions (
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  client_id uuid not null references public.users(id),
  completed_at timestamptz not null default now(),
  primary key (webinar_id, client_id)
);

alter table public.webinars enable row level security;
alter table public.webinar_completions enable row level security;

create policy webinars_select_all on public.webinars for select using (true);
create policy webinars_write_therapist_only on public.webinars
  for all using (public.is_therapist()) with check (public.is_therapist());

create policy webinar_completions_select on public.webinar_completions
  for select using (public.is_therapist() or client_id = auth.uid());
create policy webinar_completions_insert_own on public.webinar_completions
  for insert with check (client_id = auth.uid());
