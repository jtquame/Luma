-- Tribe Works: terms & conditions with 30-day re-acceptance
--
-- The content lives in one editable row (therapist-only, versioned so a
-- content change forces re-acceptance). Each client's acceptance is
-- logged separately so Samara has an audit trail of who signed what and
-- when. A client is "current" only if they have an acceptance record for
-- the current version within the last 30 days — this naturally forces
-- re-signing both on a timer AND whenever the text changes.

create table public.terms_content (
  id boolean primary key default true constraint terms_content_singleton check (id),
  version int not null default 1,
  body text not null default 'By using Luma, you agree to use this portal as a supplement to your therapy sessions with Samara Lynch, not a replacement for them. Information you share here may be reviewed by your therapist as part of your care.',
  updated_at timestamptz not null default now()
);

insert into public.terms_content (id) values (true);

create or replace function public.bump_terms_version()
returns trigger
language plpgsql
as $$
begin
  if new.body is distinct from old.body then
    new.version = old.version + 1;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger terms_content_bump_version
  before update on public.terms_content
  for each row execute function public.bump_terms_version();

create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id),
  version int not null,
  accepted_at timestamptz not null default now()
);

create index terms_acceptances_client_idx on public.terms_acceptances (client_id, accepted_at desc);

alter table public.terms_content enable row level security;
alter table public.terms_acceptances enable row level security;

-- Everyone (including pre-terms-acceptance clients) needs to read the
-- current text to be shown the accept screen.
create policy terms_content_select_all on public.terms_content
  for select using (true);

create policy terms_content_update_therapist_only on public.terms_content
  for update using (public.is_therapist());

create policy terms_acceptances_select on public.terms_acceptances
  for select using (public.is_therapist() or client_id = auth.uid());

create policy terms_acceptances_insert_own on public.terms_acceptances
  for insert with check (client_id = auth.uid());
