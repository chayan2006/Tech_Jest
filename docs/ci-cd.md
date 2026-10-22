# CI/CD Documentation

This document provides an overview of the continuous integration and deployment pipeline for the **TechJest** project.

## GitHub Actions Workflow (`.github/workflows/ci.yml`)

- **Trigger**: Runs on every `push` to the `main` branch and on every pull request.
- **Jobs**:
  - **verify**:
    - **Environment**: `ubuntu-latest`
    - **Steps**:
      1. **Checkout** – Retrieves the repository code.
      2. **Setup Node.js** – Uses the version defined in `.nvmrc` and caches `npm` modules.
      3. **Install dependencies** – Executes `npm ci` for a clean install.
      4. **Verify application** – Runs `npm run check`, which performs:
         - Type‑checking (`tsc --noEmit`)
         - Production build (`next build`)
         - Code formatting check (`prettier --check .`)
- **Timeout**: 15 minutes per run.
- **Concurrency**: Cancels previous runs for the same branch to avoid redundant builds.

## Local Development Workflow

1. **Install dependencies**
   ```bash
   npm ci
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
3. **Run tests** (Vitest)
   ```bash
   npm test
   ```
4. **Check formatting**
   ```bash
   npm run format:check
   ```

## Deployments

The repository is configured for **Vercel** deployment (see `vercel.json`). Every push to `main` triggers a Vercel preview, and merges trigger a production deployment.

## Adding New CI Steps

If you need to add more checks (e.g., linting, security scanning, or end‑to‑end tests), extend the `ci.yml` workflow:
```yaml
- name: Lint code
  run: npm run lint
```
Ensure any new script is added to `package.json` under the `scripts` section.

---

*Feel free to modify this documentation to match any future changes in the CI/CD pipeline.*
