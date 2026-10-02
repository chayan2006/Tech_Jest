create extension if not exists citext;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name citext not null,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_name_length check (char_length(name::text) between 2 and 160),
  constraint companies_website_length check (website is null or char_length(website) <= 300)
);

create unique index if not exists companies_name_unique on public.companies (lower(name::text));
alter table public.companies enable row level security;

drop policy if exists "Authenticated users can read companies" on public.companies;
create policy "Authenticated users can read companies"
  on public.companies for select to authenticated using (true);

drop policy if exists "Authenticated users can create companies" on public.companies;
create policy "Authenticated users can create companies"
  on public.companies for insert to authenticated with check (true);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  company text check (company is null or char_length(company) <= 120),
  company_id uuid references public.companies(id) on delete set null,
  phone text check (phone is null or char_length(phone) <= 30),
  purpose text not null check (char_length(purpose) between 3 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles add column if not exists company_id uuid references public.companies(id) on delete set null;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if nullif(new.raw_user_meta_data->>'company', '') is not null then
    insert into public.companies (name)
    values (nullif(new.raw_user_meta_data->>'company', ''))
    on conflict do nothing;
  end if;
  insert into public.profiles (id, full_name, company, company_id, phone, purpose)
  select
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'TechJest client'),
    nullif(new.raw_user_meta_data->>'company', ''),
    companies.id,
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce(nullif(new.raw_user_meta_data->>'purpose', ''), 'Project consultation')
  from (select id from public.companies where lower(name::text) = lower(nullif(new.raw_user_meta_data->>'company', '')) limit 1) as companies
  union all
  select new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'TechJest client'), nullif(new.raw_user_meta_data->>'company', ''), null, nullif(new.raw_user_meta_data->>'phone', ''), coalesce(nullif(new.raw_user_meta_data->>'purpose', ''), 'Project consultation')
  where not exists (select 1 from public.companies where lower(name::text) = lower(nullif(new.raw_user_meta_data->>'company', '')));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, full_name, company, phone, purpose)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data->>'full_name', ''), 'TechJest client'),
  nullif(users.raw_user_meta_data->>'company', ''),
  nullif(users.raw_user_meta_data->>'phone', ''),
  coalesce(nullif(users.raw_user_meta_data->>'purpose', ''), 'Project consultation')
from auth.users as users
where not exists (
  select 1 from public.profiles where profiles.id = users.id
);

insert into public.companies (name)
select distinct trim(company)
from public.profiles
where company is not null and trim(company) <> ''
on conflict do nothing;

update public.profiles
set company_id = companies.id
from public.companies
where public.profiles.company_id is null
  and public.profiles.company is not null
  and lower(public.profiles.company) = lower(companies.name::text);

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  service text not null,
  message text not null check (char_length(message) between 20 and 5000),
  budget text,
  name text,
  email text,
  phone text,
  company text,
  budget_range text,
  timeline text,
  description text,
  lead_stage text not null default 'received' check (lead_stage in ('received', 'qualified', 'proposal', 'negotiation', 'won', 'project')),
  status text not null default 'received' check (status in ('received', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_requests add column if not exists budget text;
alter table public.project_requests add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.project_requests add column if not exists name text;
alter table public.project_requests add column if not exists email text;
alter table public.project_requests add column if not exists phone text;
alter table public.project_requests add column if not exists company text;
alter table public.project_requests add column if not exists budget_range text;
alter table public.project_requests add column if not exists timeline text;
alter table public.project_requests add column if not exists description text;
alter table public.project_requests add column if not exists lead_stage text not null default 'received';
alter table public.project_requests add column if not exists updated_at timestamptz not null default now();
alter table public.project_requests drop constraint if exists project_requests_lead_stage_check;
alter table public.project_requests add constraint project_requests_lead_stage_check check (lead_stage in ('received', 'qualified', 'proposal', 'negotiation', 'won', 'project'));
create index if not exists project_requests_user_created_idx on public.project_requests (user_id, created_at desc);
create index if not exists project_requests_company_idx on public.project_requests (company_id);

alter table public.project_requests enable row level security;

drop policy if exists "Users can read their own project requests" on public.project_requests;
create policy "Users can read their own project requests"
  on public.project_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all project requests" on public.project_requests;
create policy "Admins can read all project requests"
  on public.project_requests for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Users can create their own project requests" on public.project_requests;
create policy "Users can create their own project requests"
  on public.project_requests for insert
  with check (
    auth.uid() = user_id
    and (company_id is null or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.company_id = project_requests.company_id
    ))
  );

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null check (event in ('login', 'admin_login', 'signup')),
  email text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists "Users can record their own audit events" on public.audit_logs;
create policy "Users can record their own audit events"
  on public.audit_logs for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Admins can read audit events" on public.audit_logs;
create policy "Admins can read audit events"
  on public.audit_logs for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update project requests" on public.project_requests;
create policy "Admins can update project requests"
  on public.project_requests for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.project_request_services (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.project_requests(id) on delete cascade,
  service_slug text not null check (char_length(service_slug) between 1 and 160),
  service_name_snapshot text not null check (char_length(service_name_snapshot) between 1 and 200),
  price_snapshot numeric,
  created_at timestamptz not null default now()
);

create index if not exists project_request_services_request_idx
  on public.project_request_services (request_id);

alter table public.project_request_services enable row level security;

drop policy if exists "Users can read their own request services" on public.project_request_services;
create policy "Users can read their own request services"
  on public.project_request_services for select
  using (exists (
    select 1 from public.project_requests
    where project_requests.id = project_request_services.request_id
      and project_requests.user_id = auth.uid()
  ));

drop policy if exists "Users can create their own request services" on public.project_request_services;
create policy "Users can create their own request services"
  on public.project_request_services for insert
  with check (exists (
    select 1 from public.project_requests
    where project_requests.id = project_request_services.request_id
      and project_requests.user_id = auth.uid()
  ));

drop policy if exists "Admins can read all request services" on public.project_request_services;
create policy "Admins can read all request services"
  on public.project_request_services for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.project_requests(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  summary text not null check (char_length(summary) between 1 and 5000),
  amount numeric check (amount is null or amount >= 0),
  currency text not null default 'INR' check (currency in ('INR', 'USD')),
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_request_idx on public.proposals (request_id, created_at desc);
alter table public.proposals enable row level security;
drop policy if exists "Admins can manage proposals" on public.proposals;
create policy "Admins can manage proposals" on public.proposals for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Users can read their proposals" on public.proposals;
create policy "Users can read their proposals" on public.proposals for select
  using (exists (select 1 from public.project_requests where project_requests.id = proposals.request_id and project_requests.user_id = auth.uid()));

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.project_requests(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  status text not null default 'planned' check (status in ('planned', 'active', 'on_hold', 'completed')),
  start_date date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status, created_at desc);
alter table public.projects enable row level security;
drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects" on public.projects for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Users can read their projects" on public.projects;
create policy "Users can read their projects" on public.projects for select
  using (exists (select 1 from public.project_requests where project_requests.id = projects.request_id and project_requests.user_id = auth.uid()));

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_tasks_project_idx on public.project_tasks (project_id, created_at asc);
alter table public.project_tasks enable row level security;
drop policy if exists "Admins can manage project tasks" on public.project_tasks;
create policy "Admins can manage project tasks" on public.project_tasks for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Users can read their project tasks" on public.project_tasks;
create policy "Users can read their project tasks" on public.project_tasks for select
  using (exists (
    select 1 from public.projects
    join public.project_requests on project_requests.id = projects.request_id
    where projects.id = project_tasks.project_id and project_requests.user_id = auth.uid()
  ));

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists project_messages_project_idx on public.project_messages (project_id, created_at asc);
alter table public.project_messages enable row level security;
drop policy if exists "Admins can manage project messages" on public.project_messages;
create policy "Admins can manage project messages" on public.project_messages for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Users can read and send project messages" on public.project_messages;
create policy "Users can read and send project messages" on public.project_messages for select to authenticated
  using (exists (select 1 from public.projects join public.project_requests on project_requests.id = projects.request_id where projects.id = project_messages.project_id and project_requests.user_id = auth.uid()));
create policy "Users can create project messages" on public.project_messages for insert to authenticated
  with check (auth.uid() = user_id and exists (select 1 from public.projects join public.project_requests on project_requests.id = projects.request_id where projects.id = project_messages.project_id and project_requests.user_id = auth.uid()));

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists project_documents_project_idx on public.project_documents (project_id, created_at desc);
alter table public.project_documents enable row level security;
drop policy if exists "Admins can manage project documents" on public.project_documents;
create policy "Admins can manage project documents" on public.project_documents for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Users can read project documents" on public.project_documents;
create policy "Users can read project documents" on public.project_documents for select
  using (exists (select 1 from public.projects join public.project_requests on project_requests.id = projects.request_id where projects.id = project_documents.project_id and project_requests.user_id = auth.uid()));

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  request_id uuid references public.project_requests(id) on delete set null,
  number text not null unique,
  amount numeric not null check (amount >= 0),
  currency text not null default 'INR' check (currency in ('INR', 'USD')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invoices_project_idx on public.invoices (project_id, created_at desc);
alter table public.invoices enable row level security;
drop policy if exists "Admins can manage invoices" on public.invoices;
create policy "Admins can manage invoices" on public.invoices for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Users can read their invoices" on public.invoices;
create policy "Users can read their invoices" on public.invoices for select
  using (exists (select 1 from public.project_requests where project_requests.id = invoices.request_id and project_requests.user_id = auth.uid()));

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 160),
  category text not null check (char_length(category) between 2 and 80),
  description text not null check (char_length(description) between 10 and 1000),
  price numeric check (price is null or price >= 0),
  delivery text not null check (char_length(delivery) between 2 and 80),
  icon text not null default '✦',
  popular boolean not null default false,
  included jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_catalog_included_array check (jsonb_typeof(included) = 'array'),
  constraint service_catalog_technologies_array check (jsonb_typeof(technologies) = 'array')
);

alter table public.service_catalog enable row level security;
drop policy if exists "Public can read active services" on public.service_catalog;
create policy "Public can read active services"
  on public.service_catalog for select
  to anon, authenticated
  using (is_active = true or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can manage services" on public.service_catalog;
create policy "Admins can manage services"
  on public.service_catalog for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create index if not exists service_catalog_public_order_idx on public.service_catalog (is_active, sort_order, name);

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
create index if not exists conversations_client_idx on public.conversations(client_id, last_message_at desc);
create index if not exists conversations_project_idx on public.conversations(project_id, last_message_at desc);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','admin','project_manager','support_agent')),
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_type text not null check (sender_type in ('client','admin','internal')),
  content text not null check (char_length(content) between 1 and 5000),
  message_type text not null default 'text' check (message_type in ('text','system','internal_note')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at asc);
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations" on public.conversations for select to authenticated
  using (client_id = auth.uid() or exists (select 1 from public.conversation_participants where conversation_id = conversations.id and user_id = auth.uid()) or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can manage conversations" on public.conversations;
create policy "Admins can manage conversations" on public.conversations for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Clients can create own conversations" on public.conversations;
create policy "Clients can create own conversations" on public.conversations for insert to authenticated
  with check (client_id = auth.uid() and created_by = auth.uid());
drop policy if exists "Users can read conversation participants" on public.conversation_participants;
create policy "Users can read conversation participants" on public.conversation_participants for select to authenticated
  using (user_id = auth.uid() or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can manage conversation participants" on public.conversation_participants;
create policy "Admins can manage conversation participants" on public.conversation_participants for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Clients can join own conversations" on public.conversation_participants;
create policy "Clients can join own conversations" on public.conversation_participants for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.conversations where conversations.id = conversation_participants.conversation_id and conversations.client_id = auth.uid()));
drop policy if exists "Participants can read client messages" on public.messages;
create policy "Participants can read client messages" on public.messages for select to authenticated
  using (
    (message_type <> 'internal_note' and (exists (select 1 from public.conversations where conversations.id = messages.conversation_id and (conversations.client_id = auth.uid() or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'))))
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
drop policy if exists "Clients can send messages" on public.messages;
create policy "Clients can send messages" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_type = 'client'
    and message_type = 'text'
    and exists (select 1 from public.conversations where conversations.id = messages.conversation_id and conversations.client_id = auth.uid())
  );
drop policy if exists "Admins can send messages" on public.messages;
create policy "Admins can send messages" on public.messages for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and sender_id = auth.uid() and sender_type in ('admin','internal'));
alter table public.messages replica identity full;
