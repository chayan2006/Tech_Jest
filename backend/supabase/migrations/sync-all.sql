-- ============================================================================
-- TechJest: Consolidated Database & Storage Migration Sync
-- For EXISTING databases only, after schema.sql has been applied at least once. Safe to run again.
-- A fresh database needs schema.sql instead: this file depends on its tables (projects, project_requests).
-- Run in Supabase: Dashboard → SQL Editor → New Query → Paste this file → Run.
-- Table definitions below must stay identical to schema.sql.
-- ============================================================================

-- 1. EXTENSIONS: none needed; gen_random_uuid() is built into Postgres.

-- 2. SITE SETTINGS TABLE & RLS
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

-- 3. AUDIT LOGS TABLE & RLS
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null check (event in ('login', 'admin_login', 'signup')),
  email text,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- Earlier versions of this file added these duplicates of the schema.sql policies; the first let
-- clients record admin_login events.
drop policy if exists "Users can insert audit logs" on public.audit_logs;
drop policy if exists "Admins can view audit logs" on public.audit_logs;
drop policy if exists "Users can record their own audit events" on public.audit_logs;
-- Sign-ins are recorded by the record_auth_event trigger in schema.sql; browsers cannot write here.
drop policy if exists "Admins can read audit events" on public.audit_logs;
create policy "Admins can read audit events" on public.audit_logs for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. SERVICE CATALOG TABLE & RLS
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
create policy "Public can read active services" on public.service_catalog for select to anon, authenticated using (is_active = true or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can manage services" on public.service_catalog;
create policy "Admins can manage services" on public.service_catalog for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 5. PROJECT DOCUMENTS TABLE & STORAGE BUCKET
create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.project_documents enable row level security;

drop policy if exists "Admins manage project documents" on public.project_documents;
drop policy if exists "Admins can manage project documents" on public.project_documents;
create policy "Admins can manage project documents" on public.project_documents for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Clients read their project documents" on public.project_documents;
drop policy if exists "Users can read project documents" on public.project_documents;
create policy "Users can read project documents" on public.project_documents for select
  using (
    exists (
      select 1 from public.projects
      join public.project_requests on project_requests.id = projects.request_id
      where projects.id = project_documents.project_id
        and project_requests.user_id = auth.uid()
    )
  );

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

-- 6. PERFORMANCE & REALTIME ENHANCEMENTS
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

create index if not exists projects_request_idx on public.projects (request_id);
create index if not exists invoices_request_idx on public.invoices (request_id);
create index if not exists conversation_participants_user_idx on public.conversation_participants (user_id);
