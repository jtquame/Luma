-- Tribe Works: image uploads (blog covers, book covers, webinar thumbnails)
--
-- One public bucket for practice-branding images — not client data, so a
-- public bucket (readable by anyone with the URL) is fine and avoids
-- managing signed-URL expiry for images that are meant to be visible to
-- every client anyway. Only the therapist can upload/delete.

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists images_public_read on storage.objects;
create policy images_public_read on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists images_therapist_insert on storage.objects;
create policy images_therapist_insert on storage.objects
  for insert with check (bucket_id = 'images' and public.is_therapist());

drop policy if exists images_therapist_update on storage.objects;
create policy images_therapist_update on storage.objects
  for update using (bucket_id = 'images' and public.is_therapist());

drop policy if exists images_therapist_delete on storage.objects;
create policy images_therapist_delete on storage.objects
  for delete using (bucket_id = 'images' and public.is_therapist());
