-- Reliability fixes, guest enquiries, and proposal answers from the 2026-10-23 audit. Safe to run more than once.
-- Run in Supabase: SQL Editor → New query → paste this file → Run. Run it BEFORE deploying the matching code:
-- the new code calls submit_project_request(), submit_guest_request(), unread_message_counts(), and
-- respond_to_proposal().
-- schema.sql already contains these changes for fresh databases. No existing rows are changed.

-- 1. A request, its services, conversation, first message, and admin notification are saved together.
--    Before, they were six separate calls, and a failure part-way left a request without its conversation.
--    Runs as the signed-in client (security invoker), so every row-level security rule still applies.
create or replace function public.submit_project_request(
  p_service text,
  p_message text,
  p_budget text default null,
  p_name text default null,
  p_email text default null,
  p_phone text default null,
  p_company text default null,
  p_timeline text default null,
  p_company_id uuid default null,
  p_services jsonb default '[]'::jsonb,
  p_notification_body text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_request uuid;
  v_conversation uuid;
begin
  if v_user is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  insert into public.project_requests
    (user_id, company_id, service, message, budget, name, email, phone, company, budget_range, timeline, description)
  values
    (v_user, p_company_id, p_service, p_message, p_budget, p_name, p_email, p_phone, p_company, p_budget, p_timeline, p_message)
  returning id into v_request;
  insert into public.project_request_services (request_id, service_slug, service_name_snapshot, price_snapshot)
  select v_request, item ->> 'slug', item ->> 'name', (item ->> 'price')::numeric
  from jsonb_array_elements(coalesce(p_services, '[]'::jsonb)) as item;
  insert into public.conversations (request_id, client_id, created_by, title)
  values (v_request, v_user, v_user, case when char_length(p_service) > 70 then left(p_service, 67) || '...' else p_service end)
  returning id into v_conversation;
  insert into public.conversation_participants (conversation_id, user_id, role) values (v_conversation, v_user, 'client');
  -- The messages_touch_conversation trigger marks the conversation as waiting for the team.
  insert into public.messages (conversation_id, sender_id, sender_type, content, message_type)
  values (v_conversation, v_user, 'client', p_message, 'text');
  insert into public.admin_notifications (type, title, body, request_id, conversation_id)
  values ('service_request', 'New service request', left(coalesce(nullif(p_notification_body, ''), 'A client sent a new request.'), 500), v_request, v_conversation);
  return v_request;
end;
$$;
revoke all on function public.submit_project_request(text, text, text, text, text, text, text, text, uuid, jsonb, text) from public, anon;
grant execute on function public.submit_project_request(text, text, text, text, text, text, text, text, uuid, jsonb, text) to authenticated;

-- 2. At most 10 requests per client per hour, however they are sent. The count lives in the database,
--    so it holds across every server instance (the in-memory limit in src/proxy.ts does not).
create or replace function public.limit_project_requests()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Admins and server-side tools (no signed-in user) are not limited.
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' then
    return new;
  end if;
  if (
    select count(*) from public.project_requests
    where user_id = new.user_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Too many project requests. Please try again in an hour.' using errcode = 'TJ429';
  end if;
  return new;
end;
$$;
drop trigger if exists project_requests_rate_limit on public.project_requests;
create trigger project_requests_rate_limit
  before insert on public.project_requests
  for each row execute function public.limit_project_requests();

-- 3. Sign-ins are recorded by the database, not the browser: every email, Google, and password-reset
--    sign-in is logged, and clients can no longer add, skip, or repeat entries.
create or replace function public.record_auth_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    if tg_op = 'INSERT' then
      insert into public.audit_logs (user_id, event, email) values (new.id, 'signup', new.email);
    elsif new.last_sign_in_at is not null and new.last_sign_in_at is distinct from old.last_sign_in_at then
      insert into public.audit_logs (user_id, event, email)
      values (new.id, case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin_login' else 'login' end, new.email);
    end if;
  exception when others then
    -- The activity log must never block someone from signing in.
    raise warning 'Audit log entry skipped: %', sqlerrm;
  end;
  return new;
end;
$$;
revoke execute on function public.record_auth_event() from public, anon, authenticated;
drop trigger if exists on_auth_user_audit on auth.users;
create trigger on_auth_user_audit
  after insert or update of last_sign_in_at on auth.users
  for each row execute function public.record_auth_event();
drop policy if exists "Users can insert audit logs" on public.audit_logs;
drop policy if exists "Users can record their own audit events" on public.audit_logs;

-- 4. Unread message counts are added up in the database. Before, the app downloaded every incoming
--    message row, and past about 1,000 rows the counts came out too low.
create or replace function public.unread_message_counts()
returns table (conversation_id uuid, unread bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select m.conversation_id, count(*)
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  left join public.conversation_participants p on p.conversation_id = m.conversation_id and p.user_id = auth.uid()
  where c.status <> 'archived'
    and m.deleted_at is null
    and m.sender_type = case when (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' then 'client' else 'admin' end
    and ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' or c.client_id = auth.uid())
    and m.created_at > coalesce(p.last_read_at, '-infinity'::timestamptz)
  group by m.conversation_id;
$$;
revoke all on function public.unread_message_counts() from public, anon;
grant execute on function public.unread_message_counts() to authenticated;

-- 5. Guest enquiries: visitors can send a request without an account. Their request has no user_id
--    and no conversation; the team replies by email. The visitor cannot write to any table directly:
--    this function checks every field again (the publishable key is public, so it can be called without
--    the website), takes service names and prices from the live catalog, and caps guest requests at
--    3 per email address and 50 in total per hour.
alter table public.project_requests alter column user_id drop not null;
create index if not exists project_requests_guest_idx on public.project_requests (created_at desc) where user_id is null;

create or replace function public.submit_guest_request(
  p_name text,
  p_email text,
  p_message text,
  p_phone text default null,
  p_company text default null,
  p_service text default null,
  p_budget text default null,
  p_timeline text default null,
  p_service_slugs text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
  v_service text := btrim(coalesce(p_service, ''));
  v_slugs text[] := coalesce(p_service_slugs, '{}');
  v_found integer;
  v_request uuid;
begin
  -- TJ400 messages are shown to the visitor as written.
  if char_length(v_name) not between 2 and 100 then
    raise exception 'Enter your name.' using errcode = 'TJ400';
  end if;
  if char_length(v_email) > 320 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.' using errcode = 'TJ400';
  end if;
  if char_length(v_message) not between 20 and 5000 then
    raise exception 'Describe your project in 20 to 5000 characters.' using errcode = 'TJ400';
  end if;
  if char_length(coalesce(p_phone, '')) > 30 or char_length(coalesce(p_company, '')) > 160
    or char_length(coalesce(p_budget, '')) > 160 or char_length(coalesce(p_timeline, '')) > 160
    or coalesce(array_length(v_slugs, 1), 0) > 30 then
    raise exception 'Some request details are too long.' using errcode = 'TJ400';
  end if;
  if (
    select count(*) from public.project_requests
    where user_id is null and email = v_email and created_at > now() - interval '1 hour'
  ) >= 3 or (
    select count(*) from public.project_requests
    where user_id is null and created_at > now() - interval '1 hour'
  ) >= 50 then
    raise exception 'Too many guest requests. Please try again later.' using errcode = 'TJ429';
  end if;
  if coalesce(array_length(v_slugs, 1), 0) > 0 then
    select count(*) into v_found from public.service_catalog where is_active and slug = any (v_slugs);
    if v_found <> (select count(distinct slug) from unnest(v_slugs) as slug) then
      raise exception 'One or more selected services are no longer available.' using errcode = 'TJ400';
    end if;
    select string_agg(name, ', ' order by sort_order, name) into v_service
    from public.service_catalog where is_active and slug = any (v_slugs);
  end if;
  if char_length(v_service) not between 1 and 1000 then
    raise exception 'Select a service.' using errcode = 'TJ400';
  end if;
  insert into public.project_requests
    (user_id, service, message, budget, name, email, phone, company, budget_range, timeline, description)
  values
    (null, v_service, v_message, nullif(btrim(p_budget), ''), v_name, v_email, nullif(btrim(p_phone), ''),
     nullif(btrim(p_company), ''), nullif(btrim(p_budget), ''), nullif(btrim(p_timeline), ''), v_message)
  returning id into v_request;
  insert into public.project_request_services (request_id, service_slug, service_name_snapshot, price_snapshot)
  select v_request, slug, name, price from public.service_catalog where is_active and slug = any (v_slugs);
  insert into public.admin_notifications (type, title, body, request_id)
  values ('service_request', 'New guest enquiry',
          left(v_name || ' (' || v_email || ') requested ' || v_service || '. No account: reply by email.', 500), v_request);
  return v_request;
end;
$$;
revoke all on function public.submit_guest_request(text, text, text, text, text, text, text, text, text[]) from public, authenticated;
grant execute on function public.submit_guest_request(text, text, text, text, text, text, text, text, text[]) to anon;

-- 6. Clients answer proposals themselves. A sent proposal can be accepted or declined once, by the client
--    whose request it belongs to, and not after its "valid until" date. The team gets a notification,
--    the conversation records the answer, and an accepted proposal moves the lead to "won".
create or replace function public.respond_to_proposal(p_proposal_id uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_title text;
  v_status text;
  v_valid_until date;
  v_request uuid;
  v_name text;
  v_conversation uuid;
  v_answer text := case when p_accept then 'accepted' else 'declined' end;
begin
  if v_user is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  select proposals.title, proposals.status, proposals.valid_until, proposals.request_id
    into v_title, v_status, v_valid_until, v_request
  from public.proposals
  join public.project_requests on project_requests.id = proposals.request_id
  where proposals.id = p_proposal_id and project_requests.user_id = v_user
  for update of proposals;
  -- TJ4xx messages are shown to the client as written.
  if not found or v_status = 'draft' then
    raise exception 'Proposal not found.' using errcode = 'TJ404';
  end if;
  if v_status <> 'sent' then
    raise exception 'This proposal has already been answered.' using errcode = 'TJ409';
  end if;
  if v_valid_until is not null and v_valid_until < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'This proposal has expired. Send the team a message for an updated one.' using errcode = 'TJ409';
  end if;
  update public.proposals set status = v_answer, updated_at = now() where id = p_proposal_id;
  if p_accept then
    update public.project_requests
    set lead_stage = 'won', updated_at = now()
    where id = v_request and lead_stage in ('received', 'qualified', 'proposal', 'negotiation');
  end if;
  select coalesce(nullif(btrim(full_name), ''), 'The client') into v_name from public.profiles where id = v_user;
  insert into public.admin_notifications (type, title, body, request_id)
  values ('system', 'Proposal ' || v_answer, left(coalesce(v_name, 'The client') || ' ' || v_answer || ' “' || v_title || '”.', 500), v_request);
  select id into v_conversation from public.conversations
  where request_id = v_request and client_id = v_user order by created_at limit 1;
  if v_conversation is not null then
    insert into public.messages (conversation_id, sender_id, sender_type, content, message_type)
    values (v_conversation, v_user, 'client', 'Proposal ' || v_answer || ': ' || v_title, 'system');
  end if;
  return v_answer;
end;
$$;
revoke all on function public.respond_to_proposal(uuid, boolean) from public, anon;
grant execute on function public.respond_to_proposal(uuid, boolean) to authenticated;
