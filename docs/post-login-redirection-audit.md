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

Located in [`src/lib/safe-next-path.ts`](file:///Users/chayankhatua/Documents/TechJest/TechJest_W/src/lib/safe-next-path.ts):

- **Protocol-Relative Exploit Protection**: Rejects paths beginning with `//`.
- **Backslash Path Confusion Protection**: Rejects paths containing `\`, which browsers often normalize to `/` to navigate cross-origin.
- **Control Character Protection**: Rejects characters in the ASCII range `[\u0000-\u001f\u007f]`.
- **Origin Boundary Enforcement**: Parses candidates with `new URL(path, base)` to ensure the resolved origin strictly matches the trusted local application.

---

## 3. Supabase Dashboard URL Configuration (Mandatory Checklist)

In the [Supabase Management Console](https://supabase.com/dashboard):

1. Navigate to **Authentication** → **URL Configuration**.
2. Set **Site URL**:
   - Production: `https://tech-jest-12.vercel.app` (or your primary custom domain `https://techjest.in`)
   - Local: `http://localhost:3000`
3. In **Redirect URLs**, add the following entries (notice the trailing wildcard `*`):
   ```text
   http://localhost:3000/auth/callback*
   https://tech-jest-12.vercel.app/auth/callback*
   https://*.vercel.app/auth/callback*
   https://techjest.in/auth/callback*
   ```

> [!IMPORTANT]
> The trailing wildcard `*` is mandatory. Because queries like `?next=/cart` are passed to `/auth/callback`, omitting the wildcard causes Supabase to reject OAuth callbacks with `redirect_uri_mismatch`.

---

## 4. Automated Verification

Unit and regression tests for safe redirect handling are maintained in:
- [`src/lib/lib.test.ts`](file:///Users/chayankhatua/Documents/TechJest/TechJest_W/src/lib/lib.test.ts)
- [`src/lib/user-flows.test.ts`](file:///Users/chayankhatua/Documents/TechJest/TechJest_W/src/lib/user-flows.test.ts)
