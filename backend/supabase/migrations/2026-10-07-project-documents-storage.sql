-- Private storage for project documents (2026-10-07 site audit). Safe to run more than once.
-- Run after 2026-10-07-fix-site-audit-issues.sql in the Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-documents', 'project-documents', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
drop policy if exists "Admins manage project document files" on storage.objects;
create policy "Admins manage project document files" on storage.objects for all to authenticated
  using (bucket_id = 'project-documents' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'project-documents' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Clients read their project document files" on storage.objects;
create policy "Clients read their project document files" on storage.objects for select to authenticated
  using (
    bucket_id = 'project-documents'
    and exists (
      select 1 from public.projects
      join public.project_requests on project_requests.id = projects.request_id
      where projects.id::text = (storage.foldername(objects.name))[1]
        and project_requests.user_id = auth.uid()
    )
  );
