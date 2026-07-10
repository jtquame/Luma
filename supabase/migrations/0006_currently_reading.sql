-- Tribe Works: "What Your Therapist Is Currently Reading" (Milestone 8)
-- A single personal page, not a list — Samara updates one entry at a time.

create table public.currently_reading (
  id boolean primary key default true constraint currently_reading_singleton check (id),
  book_title text,
  author text,
  cover_image_url text,
  progress_note text,
  why_reading text,
  learning_note text,
  favorite_quote text,
  recommended_chapter text,
  updated_at timestamptz not null default now()
);

insert into public.currently_reading (id) values (true);

create trigger currently_reading_touch_updated_at
  before update on public.currently_reading
  for each row execute function public.touch_updated_at();

alter table public.currently_reading enable row level security;

create policy currently_reading_select_all on public.currently_reading
  for select using (true);

create policy currently_reading_update_therapist_only on public.currently_reading
  for update using (public.is_therapist());
