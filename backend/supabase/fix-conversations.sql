create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.project_requests(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references auth.users(id) on delete set null,
  title text not null default 'TechJest conversation',
  status text not null default 'open' check (status in ('open','waiting_for_client','waiting_for_admin','resolved','closed','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  last_message_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists conversations_request_unique on public.conversations(request_id) where request_id is not null;
create table if not exists public.conversation_participants (conversation_id uuid not null references public.conversations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'client', last_read_at timestamptz, joined_at timestamptz not null default now(), primary key (conversation_id,user_id));
create table if not exists public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid not null references auth.users(id) on delete cascade, sender_type text not null check (sender_type in ('client','admin','internal')), content text not null check (char_length(content) between 1 and 5000), message_type text not null default 'text', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), edited_at timestamptz, deleted_at timestamptz);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at asc);
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations" on public.conversations for select to authenticated using (client_id=auth.uid() or exists(select 1 from public.conversation_participants where conversation_id=conversations.id and user_id=auth.uid()) or (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Admins can manage conversations" on public.conversations;
create policy "Admins can manage conversations" on public.conversations for all to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin') with check ((auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Clients can create own conversations" on public.conversations;
create policy "Clients can create own conversations" on public.conversations for insert to authenticated with check (client_id=auth.uid() and created_by=auth.uid());
drop policy if exists "Clients can join own conversations" on public.conversation_participants;
create policy "Clients can join own conversations" on public.conversation_participants for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.conversations where conversations.id=conversation_participants.conversation_id and conversations.client_id=auth.uid()));
drop policy if exists "Participants can read client messages" on public.messages;
create policy "Participants can read client messages" on public.messages for select to authenticated using ((message_type<>'internal_note' and exists(select 1 from public.conversations where conversations.id=messages.conversation_id and (conversations.client_id=auth.uid() or (auth.jwt()->'app_metadata'->>'role')='admin'))) or (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Clients can send messages" on public.messages;
create policy "Clients can send messages" on public.messages for insert to authenticated with check (sender_id=auth.uid() and sender_type='client' and message_type='text' and exists(select 1 from public.conversations where conversations.id=messages.conversation_id and conversations.client_id=auth.uid()));
drop policy if exists "Admins can send messages" on public.messages;
create policy "Admins can send messages" on public.messages for insert to authenticated with check ((auth.jwt()->'app_metadata'->>'role')='admin' and sender_id=auth.uid() and sender_type in ('admin','internal'));
