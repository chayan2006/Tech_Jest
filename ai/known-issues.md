# Known issues, risks, and limitations

These items are documented only; no issue was fixed during this task. Severity reflects the potential impact, not confirmed exploitation. Remote services, production configuration, and real user behavior are not available for verification here.

## 1. Email login does not consume the cart `next` parameter

- **Issue:** The cart redirects unauthenticated users to `/auth?next=/cart`, but the email login flow always redirects to `/dashboard`.
- **Severity:** Medium
- **Evidence:** `src/app/cart/page.tsx` assigns `/auth?next=/cart`; `src/app/auth/page.tsx` calls `window.location.assign("/dashboard")` after email login and does not read search parameters.
- **Affected area:** Service cart quote flow and authentication UX.
- **Current behavior:** **Resolved in source:** email login now accepts the same safe internal-path policy as the OAuth callback and returns to `/cart` when that is the requested destination. A real authenticated browser flow is still **NOT VERIFIED**.
- **Expected behavior:** The verified intended destination should be honored, or the product should explicitly choose dashboard as the post-login destination.
- **Possible impact:** Users may lose context and believe their cart/quote flow did not continue.
- **Status:** Source-level fix complete; end-to-end authenticated verification remains open.
- **Recommended next investigation/fix:** Decide and document post-login redirect policy; test both email/password and OAuth flows before changing it.

## 2. Quote form fields are serialized into an unstructured request message

- **Issue:** Name, email, phone, company, timeline, and project description from the cart form are concatenated into `project_requests.message`.
- **Severity:** Medium
- **Evidence:** `src/app/cart/page.tsx` builds one string; `src/app/api/contact/route.ts` accepts only `service`, `message`, and `budget`; schema defines no dedicated quote fields.
- **Affected area:** Quote capture, admin operations, reporting, and future integrations.
- **Current behavior:** **Partially resolved in source:** new cart submissions send structured name, email, phone, company, budget range, timeline, and description fields; legacy `message`, `service`, and `budget` fields remain for compatibility. The remote migration and end-to-end persistence are **NOT VERIFIED**.
- **Expected behavior:** A structured quote model would be expected only if the product requires reliable field-level search, notifications, exports, or automation. This expectation is **NOT VERIFIED**.
- **Possible impact:** Harder reporting, inconsistent data quality, and fragile downstream parsing.
- **Status:** Partially resolved; migration/application verification remains open.
- **Recommended next investigation/fix:** Decide whether to add a normalized quote table/columns and migration, then define privacy/retention requirements.

## 3. Service catalog is hardcoded and not admin-manageable

- **Issue:** Service records are defined in `frontend/data/services.ts`; no services table or service-management API exists.
- **Severity:** Low to Medium
- **Evidence:** `src/app/services/page.tsx` imports the client marketplace; `frontend/components/service-marketplace.tsx` imports `services`; schema has no services table.
- **Affected area:** Catalog operations and content release workflow.
- **Current behavior:** Changing a service name, price, category, or slug requires a source change and deployment.
- **Expected behavior:** Dynamic catalog management is **NOT VERIFIED** as a current requirement.
- **Possible impact:** Slower content updates and potential mismatch between displayed service data and operational offerings.
- **Status:** Open limitation documented by current architecture.
- **Recommended next investigation/fix:** Decide whether a Supabase-backed catalog and admin editing workflow are warranted.

## 4. Cart state is local to one browser/device

- **Issue:** Selected service slugs are stored in `localStorage`, not in the user account or server session.
- **Severity:** Low
- **Evidence:** `frontend/components/service-cart.tsx` uses `techjest-service-cart` and browser events.
- **Affected area:** Project cart continuity.
- **Current behavior:** Cart items survive normal browser storage lifetime on the same device, but are not synchronized across browsers/accounts and can be cleared by the user/browser.
- **Expected behavior:** Cross-device persistence is **NOT VERIFIED** as a requirement.
- **Possible impact:** A user can lose a prepared service package before submitting a quote.
- **Status:** Known limitation; intended by the current implementation.
- **Recommended next investigation/fix:** Define whether cart persistence should be account-backed or remain intentionally anonymous/local.

## 5. Audit events are client-initiated and IP addresses are not populated by current auth flows

- **Issue:** Login/signup/admin-login pages insert audit rows through the browser client; the current code does not pass an IP address.
- **Severity:** Medium
- **Evidence:** `src/app/auth/page.tsx` and `src/app/admin/login/page.tsx` call `supabase.from("audit_logs").insert(...)` without `ip_address`; `/admin/activity` displays `Not available` when it is null.
- **Affected area:** Audit reliability and activity reporting.
- **Current behavior:** Successful client-side authentication flows attempt to write events; failed audit inserts are ignored.
- **Expected behavior:** The repository documents an audit trail, but does not specify guaranteed delivery or IP collection. Stronger guarantees are **NOT VERIFIED**.
- **Possible impact:** Missing or incomplete activity records and limited investigation context.
- **Status:** Open design/reliability risk.
- **Recommended next investigation/fix:** Decide whether audit logging should move to trusted server-side events and whether IP collection is legally/operationally appropriate.

## 6. Several Supabase read/write errors are not surfaced

- **Issue:** Some page data operations ignore returned errors and render empty/default states.
- **Severity:** Medium
- **Evidence:** `src/app/dashboard/page.tsx` does not inspect the `profiles`/`project_requests` query errors; the auth pages ignore audit insert errors; `src/app/auth/callback/route.ts` ignores the profile upsert error.
- **Affected area:** Dashboard accuracy, audit reliability, and OAuth profile synchronization.
- **Current behavior:** A database failure can appear as no requests, missing profile data, or a successful login without a visible profile-sync warning.
- **Expected behavior:** The exact error UX is **NOT VERIFIED**, but operational failures should be distinguishable from genuinely empty data.
- **Possible impact:** Silent data loss perception, difficult diagnosis, and misleading admin/client views.
- **Status:** Open.
- **Recommended next investigation/fix:** Define error states and logging policy, then add targeted handling without exposing provider internals.

## 7. Environment variables are asserted rather than validated at startup

- **Issue:** Supabase URLs/keys are passed with non-null assertions in middleware and Supabase clients.
- **Severity:** Medium
- **Evidence:** `middleware.ts`, `backend/supabase/client.ts`, and `backend/supabase/server.ts` use `process.env...!`; `.env.example` leaves Supabase values blank.
- **Affected area:** Local startup, CI/build, and deployment reliability.
- **Current behavior:** The repository does not provide a centralized runtime configuration validation layer.
- **Expected behavior:** Required deployment values should be present; actual environment behavior is **NOT VERIFIED** without a target deployment.
- **Possible impact:** Misconfigured environments may fail during request handling instead of producing an early, actionable configuration error.
- **Status:** Open reliability risk.
- **Recommended next investigation/fix:** Define required-variable validation per environment and verify it in CI/deployment without exposing secret values.

## 8. Production deployment and remote Supabase state are not verifiable from the repository

- **Issue:** The repository documents Vercel and Supabase setup, but contains no deployment workflow or proof of current production configuration.
- **Severity:** High for release confidence; not evidence of a production outage.
- **Evidence:** `.github/workflows/ci.yml` only checks typecheck/build; README describes Vercel setup; `.env.local` is ignored; no deployment provider configuration is tracked.
- **Affected area:** Release, hosting, authentication, database, and production smoke testing.
- **Current behavior:** CI can pass while redirect URLs, RLS migrations, environment variables, or deployed versions are wrong.
- **Expected behavior:** Production should be verified separately; the target state is **UNKNOWN / NOT VERIFIED**.
- **Possible impact:** Broken login, missing audit/request tables, incorrect canonical URLs, or inaccessible deployed features.
- **Status:** Open verification gap.
- **Recommended next investigation/fix:** Perform a separate deployment/configuration audit with access to Vercel and the Supabase project.

## 9. Documentation contains historical/planned architecture that differs from the current package

- **Issue:** `docs/PROGRESS.md` describes an earlier planned stack and routes, including pnpm, Tailwind, MDX, email-only leads, and routes that are not present in the current source/package.
- **Severity:** Medium
- **Evidence:** Current `package.json` uses npm scripts and does not list the planned packages; current route inventory differs from the route map in `docs/PROGRESS.md`.
- **Affected area:** Onboarding, future AI-agent context, and implementation planning.
- **Current behavior:** Multiple documents can give conflicting architecture signals.
- **Expected behavior:** Current-state documentation should distinguish historical plans from implemented behavior.
- **Possible impact:** Future changes may follow obsolete assumptions or install unnecessary dependencies.
- **Status:** Open documentation debt; this task adds `ai/` current-state documentation without rewriting existing history.
- **Recommended next investigation/fix:** Reconcile or archive obsolete planning material in a separate documentation task after owner approval.

## 10. Automated validation does not cover browser, accessibility, security, or database integration behavior

- **Issue:** CI runs only `npm ci` and `npm run check`.
- **Severity:** Medium
- **Evidence:** `.github/workflows/ci.yml`; `package.json` has no test, lint, Playwright, or accessibility script.
- **Affected area:** Regression detection and release confidence.
- **Current behavior:** TypeScript and production compilation are checked; runtime route behavior and remote integrations are not automatically exercised.
- **Expected behavior:** Required coverage targets are **NOT VERIFIED**.
- **Possible impact:** UI regressions, auth redirect bugs, RLS mismatches, or accessibility issues can reach deployment.
- **Status:** Open coverage gap.
- **Recommended next investigation/fix:** Define a test strategy and scope; do not add tooling solely from this document.

## 11. CRM lead-stage changes require the remote schema migration

- **Issue:** The new admin CRM route reads `project_requests.lead_stage`, but the repository cannot prove that the remote Supabase project has the latest additive column and constraint.
- **Severity:** Medium
- **Evidence:** `backend/supabase/schema.sql` adds `lead_stage`; `src/app/admin/crm/page.tsx` selects it; the local production build passes.
- **Affected area:** Admin CRM pipeline and request detail.
- **Current behavior:** The source is ready for the CRM route; a remote project using the older schema may show the CRM as unavailable.
- **Expected behavior:** The latest schema should be applied before the route is used in the target environment.
- **Possible impact:** CRM page/database query errors until migration is applied.
- **Status:** Open deployment prerequisite; not verified against remote Supabase.
- **Recommended next investigation/fix:** Apply the idempotent schema in Supabase SQL Editor and test admin CRM access with a real authorized account.
