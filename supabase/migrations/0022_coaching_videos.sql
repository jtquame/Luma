-- Tribe Works: coaching videos
--
-- A separate section from webinars — standalone coaching content Samara
-- uploads/links directly, browsable by every client, with view tracking
-- so she can see how much a video's actually being watched.

create table if not exists public.coaching_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coaching_videos_created_idx on public.coaching_videos (created_at desc);

drop trigger if exists coaching_videos_touch_updated_at on public.coaching_videos;
create trigger coaching_videos_touch_updated_at
  before update on public.coaching_videos
  for each row execute function public.touch_updated_at();

-- One row per view event (not per unique viewer) — a replay counts again,
-- same as a view counter on any video platform. Total views = count(*),
-- unique viewers = count(distinct client_id).
create table if not exists public.coaching_video_views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.coaching_videos(id) on delete cascade,
  client_id uuid not null references public.users(id),
  viewed_at timestamptz not null default now()
);

create index if not exists coaching_video_views_video_idx on public.coaching_video_views (video_id);
create index if not exists coaching_video_views_client_idx on public.coaching_video_views (client_id);

alter table public.coaching_videos enable row level security;
alter table public.coaching_video_views enable row level security;

drop policy if exists coaching_videos_select_all on public.coaching_videos;
create policy coaching_videos_select_all on public.coaching_videos
  for select using (true);

drop policy if exists coaching_videos_write_therapist_only on public.coaching_videos;
create policy coaching_videos_write_therapist_only on public.coaching_videos
  for all using (public.is_therapist()) with check (public.is_therapist());

-- View events: therapist sees all (that's the point — analytics); a
-- client can only log their own view.
drop policy if exists coaching_video_views_select on public.coaching_video_views;
create policy coaching_video_views_select on public.coaching_video_views
  for select using (public.is_therapist() or client_id = auth.uid());

drop policy if exists coaching_video_views_insert_own on public.coaching_video_views;
create policy coaching_video_views_insert_own on public.coaching_video_views
  for insert with check (client_id = auth.uid());
