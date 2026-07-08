-- Luma: support groups & announcements (Milestone 10)
-- No forum, no chat, no client-to-client discussion — therapist-managed
-- meeting info and announcements only.

create table public.support_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  who_should_attend text,
  meets_at timestamptz,
  location text,
  virtual_link text,
  is_recurring boolean not null default false,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_groups_meets_at_idx on public.support_groups (meets_at);

create trigger support_groups_touch_updated_at
  before update on public.support_groups
  for each row execute function public.touch_updated_at();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index announcements_created_idx on public.announcements (created_at desc);

alter table public.support_groups enable row level security;
alter table public.announcements enable row level security;

create policy support_groups_select_all on public.support_groups for select using (true);
create policy support_groups_write_therapist_only on public.support_groups
  for all using (public.is_therapist()) with check (public.is_therapist());

create policy announcements_select_all on public.announcements for select using (true);
create policy announcements_write_therapist_only on public.announcements
  for all using (public.is_therapist()) with check (public.is_therapist());
