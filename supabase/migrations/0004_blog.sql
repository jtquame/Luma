-- Tribe Works: blog (Milestone 6)
-- Therapist-only publishing. No comments, no reactions, no client posting.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  cover_image_url text,
  category text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_idx on public.blog_posts (is_published, published_at desc);
create index blog_posts_category_idx on public.blog_posts (category);

create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

alter table public.blog_posts enable row level security;

create policy blog_posts_select on public.blog_posts
  for select using (public.is_therapist() or is_published);

create policy blog_posts_write_therapist_only on public.blog_posts
  for all using (public.is_therapist()) with check (public.is_therapist());
