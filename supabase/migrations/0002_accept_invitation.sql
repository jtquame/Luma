-- Tribe Works: invitation acceptance RPCs (Milestone 2)
-- Clients hitting /accept-invite are NOT authenticated yet, so they can't be
-- covered by the users/invitations RLS policies. These two security-definer
-- functions are the only pre-auth surface into the invitations table, and
-- each does the minimum possible: validate a token, then finalize signup.

-- 1) Look up an invitation by token. Returns nothing (not an error) for an
--    invalid/expired/already-used token so we don't leak which tokens exist.
create or replace function public.get_invitation_by_token(p_token uuid)
returns table (
  email text,
  first_name text,
  last_name text,
  status invitation_status,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select email, first_name, last_name, status, expires_at
  from public.invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now();
$$;

revoke all on function public.get_invitation_by_token(uuid) from public;
grant execute on function public.get_invitation_by_token(uuid) to anon, authenticated;

-- 2) Finalize: called immediately after Supabase Auth creates the auth.users
--    row for this email. Creates the matching public.users profile as
--    'client' and marks the invitation accepted, atomically. Re-validates
--    the token server-side so this can't be replayed against a different
--    invitation.
create or replace function public.accept_invitation(p_token uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invitations;
begin
  select * into v_invite
  from public.invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invitation';
  end if;

  insert into public.users (id, role, first_name, last_name, email)
  values (p_user_id, 'client', v_invite.first_name, v_invite.last_name, v_invite.email);

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invite.id;
end;
$$;

revoke all on function public.accept_invitation(uuid, uuid) from public;
grant execute on function public.accept_invitation(uuid, uuid) to authenticated;
