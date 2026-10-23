# Post-Login Redirection & OAuth Audit

This document records the architectural security audit for post-authentication redirects across the **TechJest** application, covering email/password login and Google OAuth.

---

## 1. Flow Overview & Destination Matrix

| User Type | Trigger / Source | Destination Parameter | Final Resolved Destination |
| :--- | :--- | :--- | :--- |
| **Client** | Service Cart (`/cart`) | `?next=/cart` | `/cart` |
| **Client** | Consultation Form (`/contact`) | `?next=/contact` | `/contact` |
| **Client** | Standard Login (`/auth`) | None | `/dashboard` |
| **Admin** | Standard Login (`/auth`) | None or `?next=/dashboard` | `/admin` |
| **Admin** | Admin Login (`/admin/login`) | Direct | `/admin` |
| **Any** | Malicious Redirect (`https://evil.com`, `//evil.com`) | Unsafe parameter | `/dashboard` (fallback) |

---

## 2. Security Validation Layer (`safeNextPath`)

Located in [`src/lib/safe-next-path.ts`](../src/lib/safe-next-path.ts):

- **Protocol-Relative Exploit Protection**: Rejects paths beginning with `//`.
- **Backslash Path Confusion Protection**: Rejects paths containing `\`, which browsers often normalize to `/` to navigate cross-origin.
- **Control Character Protection**: Rejects characters in the ASCII range `[\u0000-\u001f\u007f]`.
- **Origin Boundary Enforcement**: Parses candidates with `new URL(path, base)` to ensure the resolved origin strictly matches the trusted local application.

---

## 3. Supabase Dashboard URL Configuration (Mandatory Checklist)

In the [Supabase Management Console](https://supabase.com/dashboard):

1. Navigate to **Authentication** → **URL Configuration**.
2. Set **Site URL** to the production address: `https://tech-jest-12.vercel.app` (or the custom domain once it is live, for example `https://techjest.in`).
3. In **Redirect URLs**, add only addresses TechJest controls, each ending in `**` so query strings such as `?next=/cart` and `?next=/auth/reset` are accepted:
   ```text
   http://localhost:3000/auth/callback**
   https://tech-jest-12.vercel.app/auth/callback**
   https://techjest.in/auth/callback**
   ```

> [!IMPORTANT]
> Never add a pattern such as `https://*.vercel.app/**`. It would also match sites other people deploy on Vercel, so a crafted sign-in, sign-up, or password-reset link could send a user's session to them. To test a preview deployment, add that one preview address and remove it afterwards.

---

## 4. Automated Verification

Unit and regression tests for safe redirect handling are maintained in:
- [`src/lib/lib.test.ts`](../src/lib/lib.test.ts) and [`src/lib/user-flows.test.ts`](../src/lib/user-flows.test.ts): `safeNextPath` and `getLoginDestination` (`src/lib/login-destination.ts`)
- [`src/app/routes.test.ts`](../src/app/routes.test.ts): `/auth/callback` keeps the redirect on this site
- [`e2e/account.spec.ts`](../e2e/account.spec.ts) and [`e2e/requests.spec.ts`](../e2e/requests.spec.ts): sign-up, password reset, and returning to the cart after logging in, in a real browser
