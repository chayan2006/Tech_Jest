alter table public.project_requests drop constraint if exists project_requests_status_check;
alter table public.project_requests add constraint project_requests_status_check check (status in ('received', 'in_progress', 'completed', 'declined'));
drop policy if exists "Admins can delete project requests" on public.project_requests;
create policy "Admins can delete project requests"
  on public.project_requests for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
