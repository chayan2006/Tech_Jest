# Instructions for future AI agents

## Scope and source of truth

- Treat the repository as the source of truth for current behavior. Inspect the relevant source, schema, configuration, and documentation before proposing or making a change.
- This file records observed conventions and cautious recommendations separately. Observed conventions are labeled **Existing convention**; recommendations are labeled **Recommended**.

## Architecture constraints

### Existing conventions

- This is a Next.js App Router application. Pages, layouts, route handlers, and global styles remain under `src/app/` because Next.js requires that convention here.
- Reusable client-facing components and service data are under `frontend/components/` and `frontend/data/`.
- Supabase integration and the SQL schema are under `backend/supabase/`.
- Static assets are served from the repository-root `public/` directory.
- The TypeScript path aliases are `@/*` for `src/*`, `@/frontend/*` for `frontend/*`, and `@/backend/*` for `backend/*`.
- Server Components are used by default. Components using browser state, effects, or browser APIs are marked `"use client"`.
- Server-side authenticated data access uses `backend/supabase/server.ts`; browser access uses `backend/supabase/client.ts`.
- Admin pages use `backend/supabase/admin.ts` and `requireAdmin()`.
- Code is formatted with Prettier (`npm run format`, print width 120). Run it before committing.
- The visual design uses the CSS variables at the top of `src/app/globals.css` (Midnight Navy, Warm Stone Grey, Crimson Red). Reuse those tokens instead of new colours.
- Team members are defined once in `frontend/data/team.ts`.

### Recommended rules

- Preserve the App Router directory placement and the existing server/client boundary unless a change is explicitly justified.
- Reuse the existing Supabase clients and service/cart helpers rather than creating parallel clients or state mechanisms.
- Keep user-facing failures explicit. Existing code generally returns a visible form or empty-state message; new work should not silently convert a failed database operation into success.
- Do not add secrets, service-role keys, or private environment values to source control, client bundles, or documentation.

## Files and areas requiring extra caution

- `backend/supabase/schema.sql`: defines tables, constraints, triggers, indexes, and Row Level Security policies. Changes can affect authentication, request submission, admin visibility, and existing data.
- `backend/supabase/admin.ts`: admin authorization is based on `user.app_metadata.role === "admin"`. Do not replace this with user-controlled metadata.
- `src/proxy.ts`, `backend/supabase/server.ts`, and `backend/supabase/client.ts`: session cookies and authentication refresh behavior depend on these boundaries.
- `src/app/api/contact/route.ts`: authenticated request creation and input length validation live here.
- `src/app/auth/page.tsx`, `src/app/auth/callback/route.ts`, and `src/app/admin/login/page.tsx`: login, signup, OAuth callback, admin authorization, and audit-event writes are handled here.
- `src/app/admin/**`: reads and updates protected Supabase data and must continue to work with the RLS policies.
- `frontend/data/services.ts`, `frontend/components/service-cart.tsx`, `frontend/components/service-marketplace.tsx`, and `src/app/cart/page.tsx`: the service catalog and project-selection flow are coupled through service slugs and `localStorage`.
- `src/app/layout.tsx`, `src/app/robots.ts`, and `src/app/sitemap.ts`: global navigation, metadata, JSON-LD, canonical URLs, and crawl rules are centralized here.

## Things not to change without approval

- Do not change database tables, constraints, triggers, RLS policies, admin-role semantics, or authentication redirect behavior without an explicit product/technical approval and a migration/rollback plan.
- Do not change public service slugs, route paths, or stored request field meanings without checking links, bookmarks, sitemap behavior, and existing data.
- Do not change the environment variable names or expose `.env.local`.
- Do not claim that email delivery, analytics, rate limiting, CSP enforcement, Sentry, Resend, Turnstile, or a production database exists unless it is verified in code/configuration and the deployed environment.
- Do not replace sample portfolio content with claims about real clients without verified approval and evidence.

## Coding and validation expectations

### Existing project validation

- Node.js is pinned to `22.14.0` in `.nvmrc`.
- The available scripts are:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
  - `npm run typecheck`
  - `npm run check` (`typecheck` followed by `build`)
  - `npm run format` / `npm run format:check`
- CI runs `npm ci` and `npm run check` on pull requests and pushes to `main`.
- `npm run check` passed during the current inspection.

### Recommended validation

- Run the smallest relevant check after a change, then run `npm run check` before release.
- For database/auth changes, verify both the code and the deployed Supabase schema/RLS state. Repository inspection alone cannot verify the remote project.
- For UI changes, test authenticated and unauthenticated routes, desktop/mobile layouts, keyboard access, and no-horizontal-overflow behavior.
- Do not run `npm run typecheck` concurrently with a build if generated `.next/types` files are being regenerated; run them sequentially as the existing `check` script does.

## Deployment and release precautions

- GitHub Actions verifies typecheck and production build only. It does not deploy the application.
- The README describes Vercel Git integration as the intended continuous-deployment path, but the actual Vercel project, domains, environment values, and deployment health are **UNKNOWN / NOT VERIFIED** from this repository.
- Production configuration must include the variables documented in `.env.example`/`README.md`, with a real `NEXT_PUBLIC_SITE_URL`. The actual production values are **UNKNOWN / NOT VERIFIED**.
- Apply and verify `backend/supabase/schema.sql` in the intended Supabase project before relying on admin audit/request features. The remote schema state is **UNKNOWN / NOT VERIFIED** during this documentation task.
- Never put `SUPABASE_SECRET_KEY` in client-exposed variables. The repository explicitly states that the current app uses the publishable key and RLS.
- Release only after confirming redirect URLs, admin role assignment, request persistence, RLS behavior, and production smoke tests.

## Security-sensitive areas

- Supabase Auth sessions and cookie refresh.
- `app_metadata.role` admin authorization.
- RLS policies for `profiles`, `companies`, `project_requests`, and `audit_logs`.
- Request validation and authenticated insertion in `/api/contact`.
- OAuth callback `next` path validation in `src/app/auth/callback/route.ts`.
- Environment variables and any future server-side keys.
- Audit-log data, including email and optional IP fields.

## User approval requirements

- Ask for approval before changing schema, auth behavior, public URLs, service catalog semantics, user-visible claims, deployment configuration, or privacy/security controls.
- When project facts are missing, record `UNKNOWN / NOT VERIFIED` rather than filling the gap with a plausible value.
- Before broad refactors, establish the intended behavior and migration/rollback plan; the current task does not authorize source-code changes.

