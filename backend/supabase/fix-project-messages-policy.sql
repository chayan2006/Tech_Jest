drop policy if exists "Users can create project messages"
on public.project_messages;

create policy "Users can create project messages"
on public.project_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.projects
    join public.project_requests
      on project_requests.id = projects.request_id
    where projects.id = project_messages.project_id
      and project_requests.user_id = auth.uid()
  )
);
