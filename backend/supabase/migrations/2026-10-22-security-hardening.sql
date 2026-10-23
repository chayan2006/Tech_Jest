-- Security hardening from the 2026-10-22 audit. Safe to run more than once.
-- Run in Supabase: SQL Editor → New query → paste this file → Run.
-- schema.sql already contains these changes for fresh databases.
-- Nothing here deletes or rewrites existing rows; it only tightens what signed-in clients may write.

-- 1. Clients could record "admin_login" events for themselves, which made the admin activity log untrustworthy.
--    "Users can insert audit logs" came from older copies of migrations/sync-all.sql; policies add up, so it
--    would keep the hole open next to the stricter one.
drop policy if exists "Users can insert audit logs" on public.audit_logs;
drop policy if exists "Users can record their own audit events" on public.audit_logs;
create policy "Users can record their own audit events"
  on public.audit_logs for insert to authenticated
  with check (
    auth.uid() = user_id
    and (event in ('login', 'signup') or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- 2. A new request always starts at the beginning of the pipeline; only admins move it along.
drop policy if exists "Users can create their own project requests" on public.project_requests;
create policy "Users can create their own project requests"
  on public.project_requests for insert
  with check (
    auth.uid() = user_id
    and status = 'received'
    and lead_stage = 'received'
    and (company_id is null or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.company_id = project_requests.company_id
    ))
  );

-- 3. Clients could open a conversation on someone else's request or project (and, because each request
--    allows one conversation, block the real client's thread), or start it as "urgent".
drop policy if exists "Clients can create own conversations" on public.conversations;
create policy "Clients can create own conversations" on public.conversations for insert to authenticated
  with check (
    client_id = auth.uid()
    and created_by = auth.uid()
    and status = 'open'
    and priority = 'normal'
    and (request_id is null or exists (
      select 1 from public.project_requests
      where project_requests.id = conversations.request_id and project_requests.user_id = auth.uid()
    ))
    and (project_id is null or exists (
      select 1 from public.projects
      join public.project_requests on project_requests.id = projects.request_id
      where projects.id = conversations.project_id and project_requests.user_id = auth.uid()
    ))
  );

-- 4. Clients could add themselves to their conversation with the "admin" role.
drop policy if exists "Clients can join own conversations" on public.conversation_participants;
create policy "Clients can join own conversations" on public.conversation_participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'client'
    and exists (select 1 from public.conversations where conversations.id = conversation_participants.conversation_id and conversations.client_id = auth.uid())
  );

-- 5. Clients could point their profile at any company record (and then read that company's name).
--    They may still edit their own name, phone, and purpose from the dashboard.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, purpose, updated_at) on public.profiles to authenticated;
