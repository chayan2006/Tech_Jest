-- Fixes from the 2026-10-07 site audit. Safe to run more than once.
-- Run in Supabase: SQL Editor → New query → paste this file → Run.
-- Then run 2026-10-07-project-documents-storage.sql for project document uploads.
-- schema.sql already contains these changes for fresh databases.

-- Restore the website settings table that was dropped from schema.sql in acd1f72.
create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value text not null check (char_length(value) <= 1000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select using (true);
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
insert into public.site_settings (key, value) values
  ('homepage_eyebrow', 'Independent technology partner'),
  ('homepage_title', 'Build software that moves your business forward.'),
  ('homepage_description', 'TechJest helps startups and growing teams turn good ideas into useful, dependable digital products.'),
  ('homepage_cta', 'Book a free consultation'),
  ('contact_email', 'techjest1@gmail.com'),
  ('whatsapp_number', '')
on conflict (key) do nothing;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

-- Company names are private: users see only their own company, admins see all.
drop policy if exists "Authenticated users can read companies" on public.companies;
drop policy if exists "Authenticated users can create companies" on public.companies;
drop policy if exists "Users can read their own company" on public.companies;
create policy "Users can read their own company" on public.companies for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.company_id = companies.id));
drop policy if exists "Admins can manage companies" on public.companies;
create policy "Admins can manage companies" on public.companies for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Clients can record when they last read their own conversations.
drop policy if exists "Clients can update their own read state" on public.conversation_participants;
create policy "Clients can update their own read state" on public.conversation_participants for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and role = 'client'
    and exists (select 1 from public.conversations where conversations.id = conversation_participants.conversation_id and conversations.client_id = auth.uid())
  );

-- Keep conversation status and ordering in sync with new messages, whoever sends them.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.message_type = 'internal_note' or new.sender_type = 'internal' then
    return new;
  end if;
  update public.conversations
  set last_message_at = greatest(coalesce(last_message_at, new.created_at), new.created_at),
      updated_at = now(),
      status = case
        when new.sender_type = 'client' then 'waiting_for_admin'
        when new.sender_type = 'admin' then 'waiting_for_client'
        else status
      end
  where id = new.conversation_id;
  return new;
end;
$fn$;
revoke all on function public.touch_conversation_on_message() from public, anon, authenticated;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Repair conversations whose client-side updates were silently blocked.
update public.conversations
set last_message_at = latest.created_at
from (
  select conversation_id, max(created_at) as created_at
  from public.messages
  where message_type <> 'internal_note' and deleted_at is null
  group by conversation_id
) as latest
where latest.conversation_id = conversations.id
  and (conversations.last_message_at is null or conversations.last_message_at < latest.created_at);
update public.conversations
set status = 'waiting_for_admin', updated_at = now()
where status in ('open', 'waiting_for_client')
  and (
    select messages.sender_type from public.messages
    where messages.conversation_id = conversations.id and messages.message_type <> 'internal_note' and messages.deleted_at is null
    order by messages.created_at desc limit 1
  ) = 'client';

-- Signup must never fail because of an over-long or too-short optional field.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  meta jsonb;
  v_full_name text;
  v_company text;
  v_phone text;
  v_purpose text;
  v_company_id uuid;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_full_name := left(coalesce(nullif(btrim(meta ->> 'full_name'), ''), nullif(btrim(meta ->> 'name'), ''), ''), 100);
  v_company := left(btrim(coalesce(meta ->> 'company', '')), 120);
  v_phone := nullif(left(btrim(coalesce(meta ->> 'phone', '')), 30), '');
  v_purpose := left(btrim(coalesce(meta ->> 'purpose', '')), 500);
  if char_length(v_full_name) < 2 then v_full_name := 'TechJest client'; end if;
  if char_length(v_purpose) < 3 then v_purpose := 'Project consultation'; end if;
  if char_length(v_company) >= 2 then
    insert into public.companies (name) values (v_company) on conflict do nothing;
    select id into v_company_id from public.companies where lower(name::text) = lower(v_company) limit 1;
  else
    v_company := null;
  end if;
  insert into public.profiles (id, full_name, company, company_id, phone, purpose)
  values (new.id, v_full_name, v_company, v_company_id, v_phone, v_purpose)
  on conflict (id) do nothing;
  return new;
end;
$fn$;

-- Removing a person's data must not delete other clients' conversations they took part in.
create or replace function public.admin_delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' or target_user_id = auth.uid() then
    raise exception 'Not allowed';
  end if;
  delete from public.conversations where client_id = target_user_id;
  delete from public.conversation_participants where user_id = target_user_id;
  delete from public.project_messages where user_id = target_user_id;
  delete from public.project_requests where user_id = target_user_id;
  delete from public.profiles where id = target_user_id;
end;
$fn$;

-- Draft proposals and invoices are internal until the team marks them sent.
drop policy if exists "Users can read their proposals" on public.proposals;
create policy "Users can read their proposals" on public.proposals for select
  using (status <> 'draft' and exists (select 1 from public.project_requests where project_requests.id = proposals.request_id and project_requests.user_id = auth.uid()));
drop policy if exists "Users can read their invoices" on public.invoices;
create policy "Users can read their invoices" on public.invoices for select
  using (status <> 'draft' and exists (select 1 from public.project_requests where project_requests.id = invoices.request_id and project_requests.user_id = auth.uid()));
