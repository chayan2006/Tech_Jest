# Technical decisions observed in the project

This is a chronological record of decisions evidenced by repository history, current source, and existing documentation. The original rationale is marked **Verified** only when the repository states it directly. Otherwise it is **Inferred**.

## 1. Organize the repository around Next.js, frontend, and backend ownership

- **Decision:** Keep Next.js App Router files in `src/app/`, reusable frontend code in `frontend/`, and Supabase integration/schema in `backend/`.
- **Why it appears to have been made:** Next.js requires App Router routes in `src/app/`; the README files describe ownership boundaries.
- **Current implementation:** `src/app/` contains pages, layouts, route handlers, and styles; `frontend/components/` and `frontend/data/` contain reusable UI/data; `backend/supabase/` contains clients, admin authorization, and schema.
- **Files/components affected:** `frontend/README.md`, `backend/README.md`, `tsconfig.json`, `src/app/**`, `frontend/**`, `backend/supabase/**`.
- **Known trade-offs:** Ownership is clear, but Next.js-required route handlers remain mixed with page code under `src/app/`.
- **Evidence/source:** `frontend/README.md`, `backend/README.md`, current directory structure.
- **Reason status:** **Verified** for the placement constraints; original broader architectural rationale is **Inferred**.

## 2. Use Next.js server/client Supabase clients with cookie sessions

- **Decision:** Use `@supabase/ssr` with a browser client, server client, and middleware session refresh.
- **Why it appears to have been made:** The application needs browser auth plus server-side authenticated page/API access.
- **Current implementation:** `backend/supabase/client.ts` calls `createBrowserClient`; `backend/supabase/server.ts` calls `createServerClient` with `next/headers` cookies; `middleware.ts` calls `auth.getUser()` and refreshes cookies.
- **Files/components affected:** `backend/supabase/client.ts`, `backend/supabase/server.ts`, `middleware.ts`, auth/dashboard/admin/API routes.
- **Known trade-offs:** Authentication depends on correctly configured Supabase environment variables and redirect URLs; missing values are not proactively validated in code.
- **Evidence/source:** Those files and `README.md` setup instructions.
- **Reason status:** **Inferred** from implementation; no ADR explicitly states the selection rationale.

## 3. Use Supabase Auth plus PostgreSQL Row Level Security for client data

- **Decision:** Store profiles, companies, project requests, and audit logs in Supabase tables protected by RLS.
- **Why it appears to have been made:** The README says authentication uses Supabase Auth and private project history uses a protected PostgreSQL table; the schema enables RLS and defines user/admin policies.
- **Current implementation:** `profiles`, `companies`, `project_requests`, and `audit_logs` are created in `backend/supabase/schema.sql`; policies restrict users to their records and admins to broader reads/updates.
- **Files/components affected:** `backend/supabase/schema.sql`, `src/app/api/contact/route.ts`, dashboard, admin pages, auth pages.
- **Known trade-offs:** The application relies on the remote schema being updated manually/consistently; repository SQL does not prove the deployed schema matches it.
- **Evidence/source:** `README.md`, `backend/supabase/schema.sql`.
- **Reason status:** **Verified** as the current implementation; original reason is explicitly described only at a high level.

## 4. Determine admin access from Supabase `app_metadata.role`

- **Decision:** An account is an administrator only when `user.app_metadata.role === "admin"`.
- **Why it appears to have been made:** `backend/supabase/admin.ts` comments that app metadata is managed server-side and cannot be changed by the user through the client.
- **Current implementation:** `requireAdmin()` redirects unauthenticated users to `/admin/login` and non-admin users to `/dashboard`; admin login applies the same check before redirecting to `/admin`.
- **Files/components affected:** `backend/supabase/admin.ts`, `src/app/admin/login/page.tsx`, all `src/app/admin/**` pages.
- **Known trade-offs:** Admin setup requires a Supabase dashboard/server-side metadata operation; there is no in-app admin role management.
- **Evidence/source:** `backend/supabase/admin.ts`, `README.md`, `src/app/admin/login/page.tsx`.
- **Reason status:** **Verified** for the rule; the security design rationale is **Inferred** from the source comment.

## 5. Record authentication events in an `audit_logs` table

- **Decision:** Record `login`, `signup`, and `admin_login` events and expose recent events to admins.
- **Why it appears to have been made:** The admin console is intended to show account activity, and the README documents an audit trail.
- **Current implementation:** Auth pages insert events through the browser Supabase client; `/admin/activity` reads up to 100 events; the schema constrains event names and gives authenticated users insert access for their own user ID and admins read access.
- **Files/components affected:** `src/app/auth/page.tsx`, `src/app/admin/login/page.tsx`, `src/app/admin/activity/page.tsx`, `backend/supabase/schema.sql`.
- **Known trade-offs:** Event insertion is client-initiated, and the current auth code does not populate `ip_address`; failed audit inserts are not surfaced to the user.
- **Evidence/source:** Current source and schema.
- **Reason status:** **Inferred** from the feature implementation and README language.

## 6. Add an authenticated project-request API

- **Decision:** Use `/api/contact` as the authenticated request insertion endpoint.
- **Why it appears to have been made:** Contact/project requests must be associated with the logged-in user and company while remaining behind a server route.
- **Current implementation:** The route calls `auth.getUser()`, parses JSON, validates service/message/budget lengths, looks up the profile company, and inserts into `project_requests`.
- **Files/components affected:** `src/app/api/contact/route.ts`, `src/app/contact/page.tsx`, `src/app/cart/page.tsx`, `backend/supabase/schema.sql`.
- **Known trade-offs:** The API accepts a free-form `service` string and free-form `message`; it does not provide a normalized quote model or separate fields for all cart form values.
- **Evidence/source:** Current route and schema.
- **Reason status:** **Verified** for behavior; original product rationale is **Inferred**.

## 7. Add a frontend-local service marketplace and project cart

- **Decision:** Keep the service catalog in TypeScript and persist selected service slugs in browser `localStorage`.
- **Why it appears to have been made:** The marketplace is implemented without a services table or service API, and the cart is explicitly client-side.
- **Current implementation:** `frontend/data/services.ts` is the source of catalog entries; `service-marketplace.tsx` searches/filters/sorts them; `service-cart.tsx` uses the `techjest-service-cart` key and browser events; `/cart` turns selected services into a quote request.
- **Files/components affected:** `frontend/data/services.ts`, `frontend/components/service-marketplace.tsx`, `frontend/components/service-cart.tsx`, `src/app/cart/page.tsx`, `src/app/services/**`, `src/app/layout.tsx`.
- **Known trade-offs:** Cart selection is browser/device-specific, service content requires a code release, and the cart is not available across devices or accounts.
- **Evidence/source:** Current source; the implementation contains the `localStorage` key and event names.
- **Reason status:** **Verified** for the implementation; original business rationale is **Inferred**.

## 8. Use GitHub Actions for verification and document Vercel as the intended deployment path

- **Decision:** CI runs `npm ci` and `npm run check` for pull requests and pushes to `main`; README documents Vercel Git integration as the continuous-deployment option.
- **Why it appears to have been made:** The workflow is a minimal build gate and the README describes the release setup.
- **Current implementation:** `.github/workflows/ci.yml` runs on Ubuntu with the `.nvmrc` Node version; no deployment job appears in the workflow.
- **Files/components affected:** `.github/workflows/ci.yml`, `.github/dependabot.yml`, `README.md`, `.nvmrc`.
- **Known trade-offs:** CI verifies compilation/build but does not verify browser behavior, database connectivity, or production deployment.
- **Evidence/source:** Current workflow and README.
- **Reason status:** **Verified** for CI; actual Vercel deployment status is **UNKNOWN / NOT VERIFIED**.

## 9. Keep sample portfolio content explicitly labeled

- **Decision:** Treat non-client case studies as samples until real permission/details are available.
- **Why it appears to have been made:** The README explicitly says the initial content labels case studies as samples.
- **Current implementation:** The homepage portfolio section includes “Sample project” cards; the README documents the constraint.
- **Files/components affected:** `src/app/page.tsx`, `src/app/portfolio/page.tsx`, `README.md`.
- **Known trade-offs:** The site has less social proof until verified client material is approved.
- **Evidence/source:** `README.md` and current homepage content.
- **Reason status:** **Verified**.

## 10. Separate operational request status from CRM lead stage

- **Decision:** Keep the existing request status (`received`, `in_progress`, `completed`) and add a separate commercial pipeline stage (`received`, `qualified`, `proposal`, `negotiation`, `won`, `project`).
- **Why it appears to have been made:** Delivery/processing status and sales progression represent different workflows and need independent admin controls.
- **Current implementation:** `project_requests.lead_stage` is defined in `backend/supabase/schema.sql`; `/admin/crm` groups requests by it; `/admin/requests/[id]` exposes `AdminLeadStage` alongside `AdminRequestStatus`.
- **Files/components affected:** `backend/supabase/schema.sql`, `frontend/components/admin-lead-stage.tsx`, `src/app/admin/crm/page.tsx`, `src/app/admin/requests/[id]/page.tsx`.
- **Known trade-offs:** The two fields can become inconsistent until explicit transition rules or workflow automation are added.
- **Evidence/source:** Current schema and admin routes/components.
- **Reason status:** **Inferred**; no separate ADR records the original product rationale.
