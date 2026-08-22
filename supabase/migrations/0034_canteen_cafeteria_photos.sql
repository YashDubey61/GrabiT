-- Migration 0034: Vendor/Cafeteria Photo Gallery (max 5 photos)
-- Applied live via Supabase MCP; saved here for repo parity/history.

insert into storage.buckets (id, name, public)
values ('canteen-photos', 'canteen-photos', true)
on conflict (id) do nothing;

create policy "Public read canteen photos" on storage.objects
  for select using (bucket_id = 'canteen-photos');

create policy "Admins upload canteen photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'canteen-photos'
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins update canteen photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'canteen-photos'
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins delete canteen photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'canteen-photos'
    and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

alter table public.canteens
  add column if not exists photo_urls text[] not null default '{}';

alter table public.canteens
  add constraint canteens_photo_urls_max_five
  check (array_length(photo_urls, 1) is null or array_length(photo_urls, 1) <= 5);
