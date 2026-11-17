-- Vendaz · bucket privado de comprovativos
-- Uploads so por service role (Server Action). Staff pode ler via signed URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs', 'proofs', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "proofs_staff_read" on storage.objects;
create policy "proofs_staff_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'proofs' and private.is_staff());
