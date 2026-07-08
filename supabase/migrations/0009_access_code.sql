-- Luma: shared access-code gate (Milestone 2b)
--
-- Replaces per-email invitations as the primary onboarding path: Samara
-- shares one code with clients directly (text, verbally, printed on an
-- intake form) instead of sending individual emails. The code itself is
-- never readable by anon/authenticated roles directly — only through the
-- two security-definer RPCs below, and by the therapist via her own RLS
-- policy. The old invitations table/RPCs are left in place unused in case
-- targeted email invites are wanted again later.

create table public.access_gate (
  id boolean primary key default true constraint access_gate_singleton check (id),
  code text not null,
  updated_at timestamptz not null default now()
);

-- Seed with a random default so the app isn't wide open before Samara sets
-- her own code in Settings.
insert into public.access_gate (id, code) values (true, encode(gen_random_bytes(4), 'hex'));

create trigger access_gate_touch_updated_at
  before update on public.access_gate
  for each row execute function public.touch_updated_at();

alter table public.access_gate enable row level security;

-- No public select policy at all — default-deny. Only the therapist can
-- read/update it directly; everyone else goes through verify_access_code.
create policy access_gate_therapist_only on public.access_gate
  for all using (public.is_therapist()) with check (public.is_therapist());

-- 1) Check a code without ever exposing the real one. Rate limiting against
--    brute force happens at the application layer (see lib/rate-limit.ts).
create or replace function public.verify_access_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.access_gate
    where lower(trim(code)) = lower(trim(p_code))
  );
$$;

revoke all on function public.verify_access_code(text) from public;
grant execute on function public.verify_access_code(text) to anon, authenticated;

-- 2) Finalize signup: called right after Supabase Auth creates the
--    auth.users row. Re-validates the code server-side (never trust the
--    client's earlier check) before creating the client profile.
create or replace function public.join_with_access_code(
  p_code text,
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_access_code(p_code) then
    raise exception 'Invalid access code';
  end if;

  insert into public.users (id, role, first_name, last_name, email)
  values (p_user_id, 'client', p_first_name, p_last_name, p_email);
end;
$$;

revoke all on function public.join_with_access_code(text, uuid, text, text, text) from public;
grant execute on function public.join_with_access_code(text, uuid, text, text, text) to authenticated;
