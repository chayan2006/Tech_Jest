drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.admin_delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') <> 'admin' or target_user_id = auth.uid() then
    raise exception 'Not allowed';
  end if;
  delete from public.project_requests where user_id = target_user_id;
  delete from public.profiles where id = target_user_id;
end;
$$;
revoke all on function public.admin_delete_user_data(uuid) from public;
grant execute on function public.admin_delete_user_data(uuid) to authenticated;
