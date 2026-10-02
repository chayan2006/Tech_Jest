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
  updated_at timestamptz not null default now()
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

create index if not exists service_catalog_public_order_idx
  on public.service_catalog (is_active, sort_order, name);
