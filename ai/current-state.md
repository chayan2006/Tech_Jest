# Current state snapshot

This snapshot describes what is present in the repository at the time of inspection. It does not claim that remote services, production configuration, or user-facing behavior not represented in source are working.

## Project purpose

TechJest is a Next.js marketing and lead-generation website for software development services. The public site presents services, work, company/about content, contact capture, a service-selection cart, and client account/project history. An admin console provides request, people, and audit views.

The purpose is evidenced by `README.md`, page metadata, route content, and the current UI. Legal entity, final public domain, operating hours, market commitments, and production business details are **UNKNOWN / NOT VERIFIED**.

## Technology stack

- Next.js `^16.3.7`
- React `19.0.0`
- React DOM `19.0.0`
- TypeScript `5.8.2`
- `@supabase/ssr` `^0.12.7`
- `@supabase/supabase-js` `^2.117.2`
- Node.js `>=20.0.0` in `package.json`, with `.nvmrc` set to `22.14.0`
- npm lockfile (`package-lock.json`)
- Plain global CSS in `src/app/globals.css`; no Tailwind dependency is present in `package.json`

## Architecture

### Repository layout

```text
.
├── src/app/                 Next.js App Router pages, route handlers, styles, icons, link-preview image
├── src/lib/                 Site URL and safe-redirect helpers
├── src/proxy.ts             Session refresh on each request (Next 16 renamed middleware to proxy)
├── frontend/
│   ├── components/          Reusable/client components
│   └── data/                Team, service areas, fallback service catalog
├── backend/
│   └── supabase/            Browser/server/admin clients, data helpers, SQL schema, migrations, seed
├── public/                  Images, home-screen icons, Google verification file
├── ai/                      These notes
├── .github/                 CI and Dependabot configuration
├── .env.example             Environment variable names/examples
├── vercel.json              Server functions pinned to bom1 (Mumbai)
└── next.config.ts           Security-related response headers
```

### Major components

- `src/app/layout.tsx`: global Supabase user lookup, navigation, cart link, footer, metadata, organization JSON-LD, and website JSON-LD.
- `frontend/components/mobile-menu.tsx`: mobile navigation.
- `frontend/components/profile-badge.tsx`: signed-in profile presentation.
- `frontend/components/logo-model.tsx`: homepage visual component.
- `frontend/components/service-marketplace.tsx`: service search/filter/sort/catalog UI.
- `frontend/components/service-cart.tsx`: local cart state, navbar counter, add/remove controls, toast, and summary.
- `frontend/components/admin-shell.tsx`: admin navigation shell.
- `frontend/components/admin-nav.tsx`: admin sidebar links, with the current page marked.
- `frontend/components/admin-status-select.tsx`: one status control for requests, lead stages, proposals, projects, tasks, invoices, and conversations; allowed values and labels live in `frontend/data/workflow.ts`.
- `frontend/components/admin-delete-button.tsx`: deletes a project task, or a project document together with its stored file.
- `frontend/components/admin-proposal-form.tsx`: admin proposal creation form tied to a request.
- `frontend/components/admin-task-form.tsx`: admin project task creation form.
- `frontend/components/message-thread.tsx` and `project-conversation-start.tsx`: client/admin conversations, including from the project portal.
- `frontend/components/admin-project-form.tsx`: admin project creation form.
- `frontend/components/admin-site-settings.tsx`: admin editor for public homepage/contact settings.
- `frontend/components/site-intro.tsx`: opening animation and the inline script that decides, before first paint, whether it plays.
- `frontend/components/nav-links.tsx`: main navigation with the current page marked (`aria-current`).
- `frontend/components/icons.tsx`: line icons, including one icon per service category.
- `frontend/data/team.ts`: the team; the About page, Organization JSON-LD, and `/llms.txt` read it.
- `frontend/data/services.ts`: service type, category list, fallback catalog, and price formatting.

## Frontend flow

### Public navigation and content

Current application routes discovered in `src/app/`:

- `/`
- `/services`
- `/services/[slug]`
- `/portfolio`
- `/about`
- `/contact`
- `/auth`
- `/cart`
- `/dashboard`
- `/admin`
- `/admin/crm`
- `/admin/login`
- `/admin/requests`
- `/admin/requests/[id]`
- `/admin/proposals`
- `/admin/projects`
- `/admin/projects/[id]`
- `/admin/settings`
- `/admin/invoices`
- `/project/[id]`
- `/api/ai/recommend`
- `/api/health`
- `/admin/users`
- `/admin/activity`
- `/api/contact`
- `/auth/callback`
- `/auth/signout`
- generated `/robots.txt` and `/sitemap.xml`

The public homepage presents a hero, company explanation, service overview, a six-step process section (“Understand”, “Design”, “Build”, “Test”, “Deploy”, “Support”), selected work, FAQs, and a CTA.

### Services and cart

1. `/services` renders `ServiceMarketplace`.
2. Services are filtered by category and searched by name/description/category in the browser.
3. Sorting supports popular, starting price, and name (A–Z).
4. Services come from the Supabase `service_catalog` table (managed in Admin → Services); `frontend/data/services.ts` is the fallback when the table is missing. Detail pages render on demand for every catalog slug and the six broad service areas.
5. `AddToCartButton` stores unique slugs in browser `localStorage` under `techjest-service-cart`.
6. Browser events update the navbar counter, marketplace summary, and toast.
7. `/cart` displays selected catalog services, an initial starting estimate, per-service indicative delivery ranges, and a quote form.
8. Quote submission posts structured contact fields plus selected service slugs to `/api/contact`; unauthenticated users are sent to `/auth?next=/cart`.

The cart does not support quantities; selected services are unique project capabilities.

### Authenticated client flow

- `/auth` supports email/password login, signup, and a Google OAuth button.
- Signup stores user metadata fields such as full name, company, phone, and purpose.
- Successful email login/signup attempts to insert an audit event.
- OAuth returns through `/auth/callback`, exchanges the code, upserts a profile, and validates a safe relative `next` path before redirecting.
- `/dashboard` requires a logged-in user, shows profile information, and lists that user’s project requests.
- `/auth/signout` signs out through a POST route and redirects to `/`.

## Backend and data flow

### Supabase clients

- `backend/supabase/client.ts`: browser-safe `createBrowserClient` using public environment variables.
- `backend/supabase/server.ts`: cookie-aware server client using `next/headers`.
- `backend/supabase/admin.ts`: `requireAdmin()` server helper; it gets the current user and checks `app_metadata.role`.
- `backend/supabase/profiles.ts`: `profilesById()` looks up client names, companies, and phones for admin pages.
- `backend/supabase/unread.ts`: unread client/admin messages per conversation (sidebar bell, inbox, notifications page).
- `src/lib/format.ts`: dates, times, and money; always in Indian time, because Vercel renders pages in UTC.
- `src/proxy.ts`: creates a server client, calls `auth.getUser()`, and refreshes auth cookies for matched requests (static files and generated icons are excluded).

### API structure

`src/app/api/contact/route.ts` exposes `POST /api/contact`:

1. Gets the current Supabase user.
2. Returns `401` when not authenticated.
3. Parses JSON and returns `400` for invalid JSON.
4. Requires a non-empty service and a message between 20 and 5000 characters.
5. Limits service to 1000 characters and budget to 160 characters.
6. Validates submitted service slugs against the static service catalog.
7. Reads the authenticated profile’s `company_id`.
8. Inserts structured quote fields into `project_requests`.
9. Inserts service name/price snapshots into `project_request_services` when service slugs are provided.
10. Returns `200 { ok: true }` on success or a generic error response.

There is no email notification for new requests. `CONTACT_EMAIL` and `WHATSAPP_NUMBER` are fallbacks in `backend/supabase/site-settings.ts`; values saved in Admin → Website settings take priority.

### Database structure

`backend/supabase/schema.sql` defines:

- `companies`: case-insensitive name, optional website, timestamps, unique lower-case name index.
- `profiles`: one row per `auth.users` record, full name, company text/company relation, phone, purpose, timestamps.
- `project_requests`: authenticated user, optional company relation, legacy service/message/budget fields, structured name/email/phone/company/budget range/timeline/description fields, constrained status (`received`, `in_progress`, `completed`), timestamps, and indexes.
- `project_request_services`: request-linked service slug, service name snapshot, price snapshot, timestamp, and RLS policies for the owning client/admin.
- `audit_logs`: optional user, constrained event (`login`, `admin_login`, `signup`), email, optional IP address, timestamp, index.
- `proposals`: request-linked title, summary, amount/currency, validity date, and lifecycle status.
- `projects`: optional request/proposal links, name, delivery status, and target dates.
- `project_tasks`: project-linked title, description, status, due date, and timestamps.
- `project_messages`: project-linked authenticated messages with client/admin RLS.
- `project_documents`: project-linked private document metadata; storage bucket setup is not included.
- `invoices`: project/request-linked invoice amount, currency, status, and due date.

The `handle_new_user` trigger creates a profile and may create/link a company from signup metadata. The SQL also backfills profiles/companies and adds columns idempotently.

RLS is enabled on the four application tables. Users can read/update their own profile, read their own requests, and insert their own request/audit rows. Admins identified by JWT `app_metadata.role = 'admin'` can read all profiles, requests, and audit logs, and update request status.

Whether this exact SQL has been applied to the remote Supabase project is **UNKNOWN / NOT VERIFIED**.
Whether proposal/project tables have been applied to the remote Supabase project is **UNKNOWN / NOT VERIFIED**.
Whether project-task tables have been applied to the remote Supabase project is **UNKNOWN / NOT VERIFIED**.

## Authentication and authorization

- Authentication provider: Supabase Auth.
- Email/password: implemented in `/auth` and `/admin/login`.
- Google OAuth: client button and callback route are implemented; provider enablement and Google/Supabase redirect configuration are **UNKNOWN / NOT VERIFIED**.
- Admin authorization: server-side `app_metadata.role === "admin"`.
- Admin accounts signing in through `/auth` are routed to `/admin` when their refreshed session contains the admin role.
- Route behavior: dashboard redirects unauthenticated users to `/auth`; admin helpers redirect unauthenticated users to `/admin/login` and non-admin users to `/dashboard`.
- Database authorization: RLS policies in `backend/supabase/schema.sql`.

The application does not expose or store user passwords in repository source.

## Environment and configuration

Declared in `.env.example` or README:

- `NEXT_PUBLIC_SITE_URL`
- `CONTACT_EMAIL`
- `WHATSAPP_NUMBER`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_JWKS_URL`

The current source directly uses `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `CONTACT_EMAIL` and `WHATSAPP_NUMBER` are read as fallbacks by `backend/supabase/site-settings.ts`. `SUPABASE_JWKS_URL` is documented but not read by the current source.

`.env.local` exists locally but is ignored and its values are not documented here. Production environment values are **UNKNOWN / NOT VERIFIED**.

`next.config.ts` disables the powered-by header and sets `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options` response headers.

## Build, run, and deployment

### Local

From the repository root:

```bash
npm install
npm run dev
```

The documented local URL is `http://localhost:3000`.

### Verification

```bash
npm run typecheck
npm run build
npm run check
```

`npm run check` was run during this inspection and passed.

### CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`, installs with `npm ci`, and runs `npm run check` on Ubuntu using `.nvmrc`.

### Deployment

The README recommends importing the repository into Vercel and enabling Git integration. No Vercel project file, deployment job, production domain, or deployment status is present in the repository. Deployment setup and health are **UNKNOWN / NOT VERIFIED**.

## Current feature status

### Present in source

- Public marketing pages and responsive global navigation.
- Static service catalog with service detail routes.
- Browser-local service project cart and quote form.
- Supabase email/password auth and Google OAuth callback flow.
- Authenticated dashboard and request history.
- Admin overview, request list/status updates, people directory, and activity log.
- Admin CRM pipeline and request detail pages allow admins to update both operational status and commercial lead stage.
- Admin CRM pipeline with additive lead stages (`received`, `qualified`, `proposal`, `negotiation`, `won`, `project`) and protected request detail pages.
- Admin request details can create proposals; protected proposal and project list pages provide the first commercial/delivery workspace.
- Admin project details can create delivery tasks, and the client dashboard displays authorized projects and their task summaries.
- Admins can create project delivery records and clients can open a project portal with proposal, task, document, invoice, and message sections.
- Admin dashboard provides control links and counts for requests, people, CRM, proposals, projects, invoices, activity, and public website settings.
- Client project pages display authorized tasks, private document metadata, invoices, and messages; authenticated AI recommendations return service-catalog suggestions only.
- `/api/health` reports public Supabase configuration presence without exposing values.
- Supabase schema with profiles, companies, project requests, audit logs, triggers, indexes, and RLS.
- SEO metadata, JSON-LD, sitemap, robots rules, and Google verification asset.
- CI typecheck/build gate.

### Not verified or not present

- Remote Supabase schema/RLS state.
- Production Supabase/Vercel environment values and redirect URLs.
- Actual Google provider configuration.
- Email delivery, lead notifications, analytics, rate limiting, Sentry, Turnstile, Resend, or Calendly integrations.
- Automated unit, browser, accessibility, performance, or security test suites.
- Cross-device/account cart persistence.
- Remote application of the latest structured quote/request-service schema.
- Remote application of the latest CRM `lead_stage` schema.

## Dependencies and operational notes

- Runtime and build dependencies are listed in `package.json` and locked in `package-lock.json`.
- Dependabot is configured for monthly npm updates with up to five open pull requests.
- `.gitignore` excludes local environments, Next build output, coverage/test artifacts, and TypeScript build info.
