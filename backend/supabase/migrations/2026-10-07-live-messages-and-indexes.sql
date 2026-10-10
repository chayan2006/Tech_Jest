-- Admin review fixes (2026-10-07). Safe to run more than once.
-- Run in Supabase: SQL Editor → New query → paste this file → Run.
-- schema.sql already contains these changes for fresh databases.

-- New messages reach open conversations instantly. Until this runs, the app checks every 15 seconds.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- The signup trigger function is not meant to be called through the public API
-- (Supabase security advisor: "Public Can Execute SECURITY DEFINER Function").
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Lookups behind client dashboards, RLS checks, and unread counts.
create index if not exists projects_request_idx on public.projects (request_id);
create index if not exists invoices_request_idx on public.invoices (request_id);
create index if not exists conversation_participants_user_idx on public.conversation_participants (user_id);
