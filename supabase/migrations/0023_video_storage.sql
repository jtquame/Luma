-- Tribe Works: video file storage for coaching videos
--
-- Samara uploads video files directly from her phone or computer, not
-- YouTube/external links. Private bucket (like attachments, not like the
-- public images bucket) since this is paid/gated coaching content, not
-- general branding — read access requires being logged into the app.
--
-- Note: Supabase's default per-file upload size limit on some plans is
-- 50MB, which a multi-minute phone-recorded video can exceed easily. If
-- uploads start failing on longer videos, check Project Settings ->
-- Storage in the Supabase dashboard and raise the max upload size there.

insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

drop policy if exists videos_authenticated_read on storage.objects;
create policy videos_authenticated_read on storage.objects
  for select using (bucket_id = 'videos' and auth.uid() is not null);

drop policy if exists videos_therapist_insert on storage.objects;
create policy videos_therapist_insert on storage.objects
  for insert with check (bucket_id = 'videos' and public.is_therapist());

drop policy if exists videos_therapist_delete on storage.objects;
create policy videos_therapist_delete on storage.objects
  for delete using (bucket_id = 'videos' and public.is_therapist());
