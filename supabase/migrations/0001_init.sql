-- Tribe Works: core schema (Milestone 1)
-- One therapist (admin), invite-only clients. Minimal PII by design —
-- see DESIGN.md / master spec: only first name, last name, email, password.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ROLE ENUM
-- ---------------------------------------------------------------------------
create type user_role as enum ('therapist', 'client');
create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- ---------------------------------------------------------------------------
-- USERS
-- Mirrors auth.users (Supabase-managed) with app-level profile + role.
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  first_name text not null,
  last_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'App-level profile. Deliberately minimal columns — no phone, DOB, address, '
  'or demographic fields per the privacy-by-default spec.';

-- Enforce exactly one therapist at the database level, not just in app code.
create unique index one_therapist_only
  on public.users ((role = 'therapist'))
  where role = 'therapist';

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- INVITATIONS
-- Therapist-issued, single-use, expiring tokens. No public signup route
-- ever reads from this table without a valid token.
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  last_name text not null,
  token uuid not null default gen_random_uuid(),
  status invitation_status not null default 'pending',
  invited_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

create unique index invitations_token_idx on public.invitations (token);
create index invitations_email_idx on public.invitations (email);

-- ---------------------------------------------------------------------------
-- SETTINGS
-- Singleton row for app-wide/branding config the therapist controls.
-- ---------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true constraint settings_singleton check (id),
  practice_name text not null default 'Tribe Works Behavioral Services',
  primary_color text not null default '#57612F',
  accent_color text not null default '#B08D3E',
  welcome_message text not null default 'Glad you''re here.',
  session_timeout_minutes int not null default 30,
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (true);

create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- AUDIT LOG
-- Therapist-action auditing only (per spec). We do NOT log routine client
-- activity (page views, logins) beyond what auth itself retains.
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- HELPER: current user's role, used throughout RLS policies
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_therapist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'therapist' from public.users where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.invitations enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;

-- USERS: therapist sees everyone; a client sees only themselves.
create policy users_select on public.users
  for select using (public.is_therapist() or id = auth.uid());

create policy users_update_self_or_therapist on public.users
  for update using (public.is_therapist() or id = auth.uid());

-- Only the therapist can deactivate/change roles — enforced further at the
-- application layer since column-level RLS isn't practical here.
create policy users_insert_therapist_only on public.users
  for insert with check (public.is_therapist());

-- INVITATIONS: therapist-only, full stop. Clients never query this table;
-- the accept-invite flow validates tokens through a security-definer RPC
-- instead (see 0002_accept_invitation.sql) so it can run pre-auth.
create policy invitations_therapist_only on public.invitations
  for all using (public.is_therapist()) with check (public.is_therapist());

-- SETTINGS: everyone can read (branding is shown pre-login on invite pages),
-- only the therapist can write.
create policy settings_select_all on public.settings
  for select using (true);

create policy settings_update_therapist_only on public.settings
  for update using (public.is_therapist());

-- AUDIT LOG: therapist-only read; inserts happen via security-definer
-- functions/server actions, not direct client writes.
create policy audit_log_select_therapist_only on public.audit_log
  for select using (public.is_therapist());
