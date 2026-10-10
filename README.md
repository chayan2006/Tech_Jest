# TechJest

Marketing website, client portal, and admin console for TechJest, built with Next.js 16 (App Router) and Supabase.

## Project structure

```text
src/app/              Pages, layouts, API routes, and global styles (Next.js App Router)
  _og/                Fonts used only by the generated link-preview image
src/lib/              Small shared helpers (site URL, safe post-login redirects)
src/proxy.ts          Refreshes the Supabase session cookie on each request
frontend/components/  Reusable UI components
frontend/data/        Static content: team, service areas, fallback service catalog
backend/supabase/     Supabase clients and data helpers, schema.sql, migrations, seed data
public/               Images, home-screen icons, Google Search Console verification file
ai/                   Notes for AI agents: rules, current state, decisions, known issues
```

Path aliases: `@/*` → `src/*`, `@/frontend/*` → `frontend/*`, `@/backend/*` → `backend/*`.

## Design

- **Colours** are CSS variables at the top of [`src/app/globals.css`](./src/app/globals.css): Midnight Navy `#1B1E4A`, Warm Stone Grey `#AFAEA2`, and Crimson Red `#D21319`.
- **Fonts:** Source Serif 4 for headings and Manrope for text, self-hosted through `next/font`.
- **Opening animation:** [`frontend/components/site-intro.tsx`](./frontend/components/site-intro.tsx). It plays on public pages at most once every 30 minutes, and never for visitors who prefer reduced motion or for crawlers. Any click, scroll, or key press skips it.
- **Icons:** [`frontend/components/icons.tsx`](./frontend/components/icons.tsx), including one icon per service category.
- **Link preview and app icons:** [`src/app/opengraph-image.tsx`](./src/app/opengraph-image.tsx), `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`, and `public/icons/`.

## Everyday changes

- **Team members:** edit [`frontend/data/team.ts`](./frontend/data/team.ts). The About page, search-engine structured data, and `/llms.txt` all read from it.
- **Homepage text, contact email, WhatsApp number:** Admin → Website settings. WhatsApp links stay hidden until a real number is saved.
- **Services and prices:** Admin → Services.

## Run locally

Requires Node.js 20+ (`.nvmrc` pins 22.14.0).

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

| Script                 | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Development server                            |
| `npm run build`        | Production build                              |
| `npm run start`        | Serve the production build                    |
| `npm run typecheck`    | TypeScript check                              |
| `npm run check`        | Typecheck, then production build (used by CI) |
| `npm run format`       | Format the code with Prettier                 |
| `npm run format:check` | Report files that need formatting             |

## Deployment

Every pull request and push to `main` runs [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (`npm ci`, then `npm run check`). Vercel's Git integration deploys `main` to production. [`vercel.json`](./vercel.json) runs the server code in Mumbai (`bom1`), next to the Supabase database (`ap-south-1`).

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SITE_URL` (the public domain; used for canonical URLs, the sitemap, and link previews)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_JWKS_URL` (optional; reserved for token verification, not read by the current code)
- `CONTACT_EMAIL` and `WHATSAPP_NUMBER` (fallbacks; the values saved in Admin → Website settings take priority)

Never add `SUPABASE_SECRET_KEY` to client or Vercel environment variables for this application, and never commit it. The app uses Supabase Auth and Row Level Security with the publishable key only.

## Supabase setup

1. Create a Supabase project.
2. In the SQL Editor, run [`backend/supabase/schema.sql`](./backend/supabase/schema.sql), then [`backend/supabase/seed-services-catalog.sql`](./backend/supabase/seed-services-catalog.sql). Both are safe to run again.
   - Existing databases also need the dated files in [`backend/supabase/migrations/`](./backend/supabase/migrations/), run in name order (both are safe to rerun).
   - For a clean rebuild, run [`backend/supabase/reset-database.sql`](./backend/supabase/reset-database.sql) first. It is destructive: it removes all public application data (not Auth users).
3. Copy the project URL and publishable key into `.env.local` (see [`.env.example`](./.env.example)):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
   ```

4. In Supabase Auth settings, add `http://localhost:3000/auth/callback` and your production URL followed by `/auth/callback` as redirect URLs.
5. For Google login, enable **Authentication → Providers → Google** in Supabase with the OAuth client ID and secret from Google Cloud, and add Supabase's callback URL (usually `https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI in Google Cloud.

`/api/health` reports whether the public Supabase configuration is present; it never returns secret values.

### Admin access

Sign in at `/admin/login` with an account whose Supabase `app_metadata.role` is `admin` (set it in the Supabase dashboard or with server-side user management). Admins who sign in through `/auth` are sent to `/admin`. If the role was added while the account was signed in, log out and back in to refresh the session.

The console covers requests, the CRM pipeline, proposals, projects (tasks, invoices, documents), messages, notifications, people, activity, services, and website settings.

Every status (requests, lead stages, proposals, projects, tasks, invoices, conversations) can be changed from the console. Clients see a proposal once it is marked **Sent** and an invoice once it is no longer a **Draft**; internal notes in a conversation are never shown to the client.

## Routes

- Public: `/`, `/services`, `/services/[slug]`, `/portfolio`, `/about`, `/contact`, `/cart`
- Accounts: `/auth`, `/dashboard`, `/messages`, `/project/[id]`
- Admin: `/admin` and its sub-pages, `/admin/login`
- Generated: `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, `/opengraph-image`

Case studies stay labelled as samples until real client permission and details are available.
