# Technical decisions observed in the project

This is a chronological record of decisions evidenced by repository history, current source, and existing documentation. The original rationale is marked **Verified** only when the repository states it directly. Otherwise it is **Inferred**.

## 1. Organize the repository around Next.js, frontend, and backend ownership

- **Decision:** Keep Next.js App Router files in `src/app/`, reusable frontend code in `frontend/`, and Supabase integration/schema in `backend/`.
- **Why it appears to have been made:** Next.js requires App Router routes in `src/app/`; the README files describe ownership boundaries.
- **Current implementation:** `src/app/` contains pages, layouts, route handlers, and styles; `frontend/components/` and `frontend/data/` contain reusable UI/data; `backend/supabase/` contains clients, admin authorization, and schema.
- **Files/components affected:** `README.md` (Project structure), `tsconfig.json`, `src/app/**`, `frontend/**`, `backend/supabase/**`.
- **Known trade-offs:** Ownership is clear, but Next.js-required route handlers remain mixed with page code under `src/app/`.
- **Evidence/source:** `README.md`, current directory structure.
- **Reason status:** **Verified** for the placement constraints; original broader architectural rationale is **Inferred**.

## 2. Use Next.js server/client Supabase clients with cookie sessions

- **Decision:** Use `@supabase/ssr` with a browser client, server client, and proxy (formerly middleware) session refresh.
- **Why it appears to have been made:** The application needs browser auth plus server-side authenticated page/API access.
- **Current implementation:** `backend/supabase/client.ts` calls `createBrowserClient`; `backend/supabase/server.ts` calls `createServerClient` with `next/headers` cookies; `middleware.ts` calls `auth.getUser()` and refreshes cookies.
- **Files/components affected:** `backend/supabase/client.ts`, `backend/supabase/server.ts`, `src/proxy.ts`, auth/dashboard/admin/API routes.
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

- **Decision:** Persist selected service slugs in browser `localStorage`. The catalog itself started as TypeScript data and now lives in the Supabase `service_catalog` table (Admin → Services), with `frontend/data/services.ts` as the fallback.
- **Why it appears to have been made:** The marketplace is implemented without a services table or service API, and the cart is explicitly client-side.
- **Current implementation:** `backend/supabase/services.ts` reads the catalog (falling back to `frontend/data/services.ts`); `service-marketplace.tsx` searches/filters/sorts them; `service-cart.tsx` uses the `techjest-service-cart` key and browser events; `/cart` turns selected services into a quote request.
- **Files/components affected:** `frontend/data/services.ts`, `frontend/components/service-marketplace.tsx`, `frontend/components/service-cart.tsx`, `src/app/cart/page.tsx`, `src/app/services/**`, `src/app/layout.tsx`.
- **Known trade-offs:** Cart selection is browser/device-specific and not available across devices or accounts.
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

## 11. Formal visual design with an opening animation

- **Decision:** Use a Midnight Navy (`#1B1E4A`), Warm Stone Grey (`#AFAEA2`), and Crimson Red (`#D21319`) palette, Source Serif 4 headings with Manrope text, and a short opening animation.
- **Why it was made:** **Verified**: the owner asked for this colour combination, an opening animation, and a "good and formal" look (October 2026).
- **Current implementation:** Design tokens are CSS variables at the top of `src/app/globals.css`; fonts load through `next/font` in `src/app/layout.tsx`. `frontend/components/site-intro.tsx` renders the intro and an inline `<head>` script that sets `html[data-intro]` before first paint (at most once per 30 minutes, public pages only, never for reduced motion or crawlers). Below-the-fold reveals use CSS scroll-driven animations inside `@supports`, so content never waits on JavaScript.
- **Known trade-offs:** The intro adds about two seconds on a first visit; it is skippable by any click, scroll, or key press.

## 12. One source of truth for the team

- **Decision:** Define team members once in `frontend/data/team.ts`, including LinkedIn profiles.
- **Why it was made:** **Verified**: the owner supplied LinkedIn profiles and a new team member; the list had been duplicated in the About page, layout JSON-LD, and `/llms.txt`.
- **Current implementation:** The About page, Organization JSON-LD (`founder`, `employee`, `sameAs`), metadata authors, and `/llms.txt` all map over `team`.

## 13. Category icons, generated link preview, and square app icons

- **Decision:** Show one line icon per service category instead of the free-form `icon` value stored per service; generate the link-preview image and square app icons from the brand mark.
- **Why it was made:** **Verified**: the stored per-service symbols were inconsistent with the formal design, and the wide logo made an unreadable favicon.
- **Current implementation:** `ServiceIcon` in `frontend/components/icons.tsx`; the `service_catalog.icon` column is no longer read or written (it keeps its database default). `src/app/opengraph-image.tsx` (fonts in `src/app/_og/`), `src/app/favicon.ico`, `icon.png`, `apple-icon.png`, and `public/icons/` for the web manifest.

## 14. Prettier formatting

- **Decision:** Format the codebase with Prettier (print width 120); Markdown, SQL, and generated files are excluded (`.prettierignore`).
- **Why it was made:** **Verified**: the owner asked for the code to be structured; many files were single lines several hundred characters long.

## 15. Run server functions in Mumbai

- **Decision:** Pin Vercel functions to `bom1` in `vercel.json`.
- **Why it was made:** **Verified** from response headers: the Mumbai edge forwarded every request to functions in `iad1` (US East) while Supabase runs in `ap-south-1` (Mumbai), giving 1–3 second responses.
- **Status:** Takes effect on the next production deploy.

## 16. Every workflow status is editable from the admin console

- **Decision:** Requests, lead stages, proposals, projects, tasks, invoices, and conversations all use one status control (`AdminStatusSelect`), with values and labels in `frontend/data/workflow.ts`.
- **Why it was made:** **Verified** in an October 2026 end-to-end test: proposals, invoices, tasks, and projects could be created but never moved on, so a draft proposal or invoice could never reach the client and tasks stayed "To do".
- **Current implementation:** Clients see proposals once they are Sent (dashboard and project page), invoices once they are not Draft, and every task status. Marking an invoice Paid records `paid_at`.

## 17. Dates are shown in Indian time

- **Decision:** Format dates, times, and money with `src/lib/format.ts`, fixed to `Asia/Kolkata`.
- **Why it was made:** **Verified**: Vercel renders server pages in UTC, so `toLocaleString("en-IN")` showed admin times 5½ hours early and risked hydration mismatches in client components.

## 18. Live message updates carry the signed-in session

- **Decision:** `MessageThread` passes the session token to Realtime (`supabase.realtime.setAuth`) before subscribing, and uses a unique channel name per subscription.
- **Why it was made:** **Verified** in a browser test: the channel joined anonymously before the browser client loaded its session, so RLS hid every new message and updates only arrived through the 15-second poll. Reusing one channel name also broke the second subscription when React mounted the effect twice in development.
- **Requires:** `public.messages` in the `supabase_realtime` publication (`backend/supabase/migrations/2026-10-07-live-messages-and-indexes.sql`).
