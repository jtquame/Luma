-- Tribe Works: assignment attachments + client-chosen check-in cadence

alter table public.assignments
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text; -- 'image' | 'document'

-- Attachment bucket is separate from the public "images" bucket used for
-- blog/book/webinar branding images — assignment attachments are specific
-- to a client's homework, so read access requires being logged into the
-- app (any authenticated user) rather than being fully public.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists attachments_authenticated_read on storage.objects;
create policy attachments_authenticated_read on storage.objects
  for select using (bucket_id = 'attachments' and auth.uid() is not null);

drop policy if exists attachments_therapist_insert on storage.objects;
create policy attachments_therapist_insert on storage.objects
  for insert with check (bucket_id = 'attachments' and public.is_therapist());

drop policy if exists attachments_therapist_delete on storage.objects;
create policy attachments_therapist_delete on storage.objects
  for delete using (bucket_id = 'attachments' and public.is_therapist());

-- ---------------------------------------------------------------------------
-- Client-chosen check-in cadence: the therapist still sets a default
-- frequency on the template, but a client can override it for themselves
-- (e.g. she sets a check-in to "weekly" by default, a specific client
-- prefers "daily"). No override row means "use the template's default".
-- ---------------------------------------------------------------------------
create table if not exists public.client_template_preferences (
  client_id uuid not null references public.users(id),
  template_id uuid not null references public.templates(id) on delete cascade,
  frequency check_in_frequency not null,
  updated_at timestamptz not null default now(),
  primary key (client_id, template_id)
);

drop trigger if exists client_template_preferences_touch_updated_at on public.client_template_preferences;
create trigger client_template_preferences_touch_updated_at
  before update on public.client_template_preferences
  for each row execute function public.touch_updated_at();

alter table public.client_template_preferences enable row level security;

drop policy if exists client_template_preferences_select on public.client_template_preferences;
create policy client_template_preferences_select on public.client_template_preferences
  for select using (public.is_therapist() or client_id = auth.uid());

drop policy if exists client_template_preferences_upsert on public.client_template_preferences;
create policy client_template_preferences_upsert on public.client_template_preferences
  for insert with check (client_id = auth.uid());

drop policy if exists client_template_preferences_update on public.client_template_preferences;
create policy client_template_preferences_update on public.client_template_preferences
  for update using (client_id = auth.uid());
