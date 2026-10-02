# TechJest

Marketing and lead-generation website for TechJest.

## Project structure

- `frontend/` — reusable UI components and frontend ownership notes.
- `backend/` — Supabase clients, database schema, and backend ownership notes.
- `src/app/` — Next.js App Router pages and API route handlers. This remains here because it is required by Next.js.

## SEO

Set `NEXT_PUBLIC_SITE_URL` to the real public domain in production. TechJest generates canonical metadata, Open Graph/Twitter cards, leadership and organization JSON-LD, `robots.txt`, and `sitemap.xml` from that value. The leadership team is represented as Chayan Khatua (Founder / CEO), Amit Shing Panwar (Founder / CEO), Arushi Choudhary (CTO), Sindhant Dadwal (CFO), Nishtha Banerjee (CPO), and Nayan Roy (CMO).

## Production CI/CD

Every pull request and every push to `main` runs GitHub Actions from [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). It installs the locked dependencies with `npm ci`, then runs `npm run check` (typecheck plus production build).

For continuous deployment, import this repository into Vercel and enable the Git integration. Vercel will create preview deployments for pull requests and deploy `main` to production after the CI check passes. Configure these production environment variables in Vercel:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_JWKS_URL`
- `CONTACT_EMAIL`
- `WHATSAPP_NUMBER`

Never add `SUPABASE_SECRET_KEY` to client or Vercel environment variables for this application.

## Run locally

Requires Node.js 20+ and npm (or pnpm). Then:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Client accounts and project history

Authentication uses Supabase Auth and project history uses a protected PostgreSQL table.

1. Create a Supabase project.
2. In Supabase SQL Editor, run [`backend/supabase/schema.sql`](./backend/supabase/schema.sql). If you already ran an older version, run the updated file again; it is safe to rerun and adds profiles, signup metadata, structured quote fields, and selected-service snapshots.
   The latest schema also adds an additive `lead_stage` field for the protected admin CRM pipeline.

### Admin access

Open `/admin/login` and sign in with the administrator account created in Supabase
Authentication. In Supabase, set that user's **User Metadata → app_metadata** role
to `admin` using the server-side user management tools or the Supabase dashboard.
The admin console at `/admin` includes an overview, request management with status
updates, a people directory, and an audit trail for sign-ins and account events.
The audit trail requires the `audit_logs` table and policies from the latest
`backend/supabase/schema.sql`; rerun that file in Supabase SQL Editor after
pulling schema changes. The admin pages reject accounts without the `admin` role.
3. Copy the project URL and anon key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
```

Never put `SUPABASE_SECRET_KEY` in client-exposed variables or commit it to the repository. The current app uses Supabase Auth and Row Level Security with the publishable key; it does not need the secret key.

4. In Supabase Auth settings, add `http://localhost:3000/auth/callback` and your production URL followed by `/auth/callback` as redirect URLs.
5. To enable Google login, open **Authentication → Providers → Google** in Supabase, enable Google, then add the Google OAuth Client ID and Client Secret from Google Cloud Console. In Google Cloud, add Supabase’s displayed callback URL (usually `https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI. The app’s Google button will then send users through `/auth/callback` and into `/dashboard`.
6. Start the app with `npm run dev`.

Users can register at `/auth`, log in, submit authenticated project requests at `/contact`, and review their private history at `/dashboard`. Row-level security ensures users can only read their own requests.

The schema keeps companies as real relational records: each profile can reference a company, and every project request stores the authenticated user and company relationship. Run the updated SQL file in Supabase SQL Editor after schema changes; it safely backfills existing profile company names.

## Routes

- `/` home
- `/services` and `/services/[slug]`
- `/portfolio`
- `/about`
- `/contact`
- `/auth`
- `/dashboard`

The initial content intentionally labels case studies as samples until real client permission and details are available.
