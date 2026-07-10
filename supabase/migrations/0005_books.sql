-- Tribe Works: book resource library (Milestone 7)

create type book_status as enum ('recommended', 'optional', 'advanced');

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  cover_image_url text,
  description text,
  why_recommended text,
  who_its_for text,
  favorite_chapters text,
  amazon_url text,
  library_url text,
  worksheet_url text,
  status book_status not null default 'recommended',
  categories text[] not null default '{}',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_categories_idx on public.books using gin (categories);

create trigger books_touch_updated_at
  before update on public.books
  for each row execute function public.touch_updated_at();

alter table public.books enable row level security;

-- Every client can browse the whole library — there's no draft/published
-- state here, unlike the blog, since Samara curates this list directly.
create policy books_select_all on public.books
  for select using (true);

create policy books_write_therapist_only on public.books
  for all using (public.is_therapist()) with check (public.is_therapist());
