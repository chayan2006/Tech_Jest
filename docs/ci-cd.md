# CI/CD

## GitHub Actions (`.github/workflows/ci.yml`)

Runs on every pull request and every push to `main`. A newer run on the same branch cancels the older one.

| Job | What it does |
| --- | --- |
| **Typecheck and production build** (`verify`, 15 min limit) | `npm ci`, then `npm run check`: TypeScript, unit and API tests (Vitest), Prettier format check, and a production build. |
| **Browser tests** (`e2e`, 30 min limit) | `npm ci`, installs Chrome, starts a throwaway Supabase in Docker with `schema.sql`, the seed, and every migration (`npm run e2e:db`), then runs the Playwright tests (`npm run test:e2e`). On failure the HTML report is kept as a build artifact for 7 days. |

Neither job uses real credentials or touches the live database.

## Deployments (Vercel)

- A push to `main` deploys to production (`https://tech-jest-12.vercel.app`).
- A pull request gets its own preview deployment.
- `vercel.json` runs the server code in Mumbai (`bom1`), next to the Supabase database (`ap-south-1`).
- Environment variables are set in Vercel → Settings → Environment Variables (see `.env.example` and the README).
- Database changes are not deployed automatically: run new files in `backend/supabase/migrations/` in the Supabase SQL Editor before deploying the code that needs them.

## Running the same checks locally

```bash
npm ci
npm run check          # typecheck, unit tests, format check, build
npm run e2e:db         # needs Docker Desktop running
npm run test:e2e
npm run e2e:db:stop
```

## Dependency updates

Dependabot (`.github/dependabot.yml`) opens monthly pull requests for npm packages and GitHub Actions; CI runs on each.
