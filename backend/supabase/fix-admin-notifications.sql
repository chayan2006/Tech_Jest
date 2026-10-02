create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('service_request','message','system')),
  title text not null check (char_length(title) between 2 and 200),
  body text not null check (char_length(body) between 1 and 500),
  request_id uuid references public.project_requests(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_inbox_idx on public.admin_notifications (admin_id, read_at, created_at desc);
alter table public.admin_notifications enable row level security;
drop policy if exists "Admins can read own notifications" on public.admin_notifications;
create policy "Admins can read own notifications" on public.admin_notifications for select to authenticated using ((admin_id is null or admin_id=auth.uid()) and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Admins can update own notifications" on public.admin_notifications;
create policy "Admins can update own notifications" on public.admin_notifications for update to authenticated using ((admin_id is null or admin_id=auth.uid()) and (auth.jwt()->'app_metadata'->>'role')='admin') with check ((admin_id is null or admin_id=auth.uid()) and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists "Users can create service request notifications" on public.admin_notifications;
create policy "Users can create service request notifications" on public.admin_notifications for insert to authenticated with check (admin_id is null and type='service_request' and exists(select 1 from public.project_requests where project_requests.id=admin_notifications.request_id and project_requests.user_id=auth.uid()));
