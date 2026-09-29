# Backend

The backend owns server-side integrations and data access:

- `backend/supabase/client.ts` is the browser-safe Supabase client.
- `backend/supabase/server.ts` is the server-side Supabase client with cookie sessions.
- `src/app/api/` contains Next.js API route handlers. They stay there because Next.js requires route handlers inside the App Router.
- `backend/supabase/schema.sql` is the database schema and Row Level Security migration.

Secrets stay in ignored environment files. Do not expose a Supabase secret key through `NEXT_PUBLIC_*` variables.
