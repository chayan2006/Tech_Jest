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
  status text not null default 'received' check (status in ('received', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.project_requests add column if not exists budget text;
alter table public.project_requests add column if not exists company_id uuid references public.companies(id) on delete set null;
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
