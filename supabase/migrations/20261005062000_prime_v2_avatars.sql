begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('prime-avatars','prime-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists prime_avatar_read on storage.objects;
create policy prime_avatar_read on storage.objects for select to authenticated
 using(bucket_id='prime-avatars' and split_part(name,'/',1)=auth.uid()::text);
drop policy if exists prime_avatar_insert on storage.objects;
create policy prime_avatar_insert on storage.objects for insert to authenticated
 with check(bucket_id='prime-avatars' and split_part(name,'/',1)=auth.uid()::text);
drop policy if exists prime_avatar_update on storage.objects;
create policy prime_avatar_update on storage.objects for update to authenticated
 using(bucket_id='prime-avatars' and split_part(name,'/',1)=auth.uid()::text)
 with check(bucket_id='prime-avatars' and split_part(name,'/',1)=auth.uid()::text);
commit;
