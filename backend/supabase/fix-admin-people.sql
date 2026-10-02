drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
