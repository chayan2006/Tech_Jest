-- DESTRUCTIVE RESET: removes every table, function, policy, and row in public.
-- It does not remove Supabase Auth users. Run this once, then run schema.sql,
-- then seed-services-catalog.sql in new SQL Editor tabs.

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
