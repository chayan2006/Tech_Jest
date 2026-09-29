# TechJest build progress

## Current phase

Phase 1 — Foundation and initial marketing routes. Core scaffold and first-pass pages are implemented; local runtime validation is blocked because Node/npm are not installed in the execution environment.

## Project defaults proposed in Phase 0

- Brand: TechJest
- Tagline: Your Vision. Our Technology.
- Legal entity: `TODO(owner): confirm legal entity; not registered yet`
- Audience: startups and small-to-medium businesses
- Markets: India first; remote delivery worldwide
- Tone: clear, modern, practical, trustworthy
- Locale/currency: `en-IN` / INR
- Contact, phone, WhatsApp, Calendly, site URL, hours, address, socials, founded year: `TODO(owner)`
- Database: none initially; email-only lead repository behind an interface
- Analytics: Vercel Web Analytics + Speed Insights
- Bot protection: honeypot + signed timing check + rate limiting; Turnstile behind a feature flag
- Privacy law: DPDP Act (India), with legal review required before launch
- Content pipeline: MDX through `@next/mdx`
- CSP: report-only first, static policy; revisit nonce CSP if dynamic rendering becomes acceptable

## Phase 0 plan

### Stack and pins

Proposed pins at Phase 1 scaffold (registry versions must be verified immediately before install):

- Node `22.14.0` LTS, pnpm `10.6.2`
- Next.js `15.2.x`, React `19.0.x`, TypeScript `5.8.x`
- Tailwind CSS `4.1.x`, ESLint `9.x`, `eslint-config-next` matching Next
- Zod `4.x`, React Hook Form `7.x`, Motion `12.x`, next-themes `0.4.x`
- Vitest `3.x`, Testing Library `16.x`, Playwright `1.51.x`

Version-specific gotchas: Next App Router route params and search params may be promises; Tailwind v4 uses CSS-first tokens; Motion imports from `motion/react`; Zod 4 error APIs differ from Zod 3; ESLint uses flat config. The installed versions' documentation will be checked during scaffolding.

### Architecture and route map

Server Components are the default. Interactive leaves are client components. Static content routes use typed loaders and `generateStaticParams`; only contact may be dynamic for service prefill.

| URL | Rendering | Data source |
|---|---|---|
| `/` | static | `content/site.ts`, services, process, projects, testimonials, FAQs |
| `/services` | static | services, engagement models |
| `/services/[slug]` | static | service plus related projects/posts |
| `/portfolio` | static shell + client filter | projects and service slugs |
| `/portfolio/[slug]` | static | project plus services/testimonial |
| `/about` | static | site, team, values |
| `/contact` | dynamic-capable | site, services, shared lead schema |
| `/blog` | static | MDX frontmatter |
| `/blog/[slug]` | static | MDX post |
| `/feed.xml` | route handler | published MDX posts |
| `/privacy`, `/terms` | static | legal draft content |
| `/styleguide` | static, development only | design tokens and UI components |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | generated | all published content |

### Content and lead model

Content schemas follow §5 exactly: site, six services, process, FAQs, projects, testimonials, team, and posts. Unknown client facts remain visibly marked as placeholders and never appear as fabricated proof.

The lead model stores normalized name, email, optional phone/company, service, budget, message, page path, referrer, first-touch UTM values, environment, and timestamps. Honeypot, signed render timestamp, idempotency key, and optional Turnstile token are transport controls and are not treated as trusted lead content.

Lead flow:

1. Client validates on blur/change with the shared Zod schema and submits a server action.
2. Server trims, normalizes, rejects control characters, verifies timing, honeypot, idempotency, rate limit, and Turnstile when enabled.
3. Repository records the lead when enabled; email notification is the safety net.
4. Resend sends a notification to the lead inbox and a non-echoing confirmation to the visitor.
5. The action returns generic success/error states. It never exposes provider errors or stack traces.

Failure handling covers invalid input, spam, too-fast submissions, duplicate submissions, rate limits, bot-check failure, email failure, repository failure, and unexpected errors. No auto-reply is sent until abuse checks pass.

### MDX and CSP

- MDX: `@next/mdx` with remark GFM, rehype slug/autolink, pretty-code and Shiki at build time. It keeps posts in-repo, avoids a CMS, and produces no client-side syntax-highlighting bundle.
- CSP: static `Content-Security-Policy-Report-Only` initially, then enforced after reports are clean. Third parties are limited to self, Sentry tunnel, and explicitly enabled analytics/Turnstile/Calendly origins. This preserves static rendering and Lighthouse performance; nonce CSP remains a launch decision if threat modeling requires it.

### Visual direction

Colors:

- Ink `#102A43`
- Slate `#486581`
- Paper `#F7FAFC`
- White `#FFFFFF`
- Signal orange `#F97316`
- Mint accent `#0F766E`

Typography: Geist Sans for UI and body; Geist Mono only for technical snippets. The identity is an editorial, high-clarity service studio: strong ink typography, orange action accents, thin rules, generous white space, and small technical diagrams rather than stock imagery.

Home wireframe:

```text
┌────────────────────────────────────────────────────────────┐
│ TechJest   Services Portfolio About Blog Contact  [Theme] │
├────────────────────────────────────────────────────────────┤
│ Build software that moves your business forward.          │
│ Practical engineering for startups and growing teams.      │
│ [Book a free consultation]  [See our work]                │
│                                 ┌──────────────────────┐   │
│                                 │ lightweight system   │   │
│                                 │ map / UI illustration │   │
│                                 └──────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│ Services: Web · Mobile · AI/ML · Cloud · Design · Support │
├────────────────────────────────────────────────────────────┤
│ Why us → Process → Selected work → FAQ → final CTA        │
└────────────────────────────────────────────────────────────┘
```

Service wireframe:

```text
┌────────────────────────────────────────────────────────────┐
│ Breadcrumbs                                                 │
│ Web Development                                             │
│ A focused intro tied to an outcome. [Get a quote]           │
├────────────────────────────────────────────────────────────┤
│ Benefits             │ Deliverables                         │
│ proof-led list       │ concrete project outputs              │
├────────────────────────────────────────────────────────────┤
│ Process → stack → related work → pricing → FAQs             │
├────────────────────────────────────────────────────────────┤
│ Ready to discuss the project? [Book a free consultation]    │
└────────────────────────────────────────────────────────────┘
```

Design principles:

1. Lead with a measurable client outcome, not an agency adjective.
2. Use structure, rules, and typography instead of decorative card repetition.
3. Keep proof honest: placeholders are visibly labeled and real facts are specific.
4. Make every conversion step explicit and keyboard-friendly.
5. Spend visual emphasis on one hero idea; keep the rest calm and scannable.

Self-review: a generic IT-agency template would use neon gradients, stock people, repeated rounded cards, invented statistics, and vague “innovative solutions” copy. This direction uses an editorial grid, restrained orange signals, technical diagrams, concrete deliverables, and visible evidence boundaries.

### Accounts and timing

- Vercel: deployment and preview environments; Pro is expected for commercial use; Phase 6.
- Resend: transactional email; free tier is suitable for development/small volume, domain verification required; Phase 4 setup, Phase 6 production DNS.
- Upstash Redis: rate limiting/idempotency; free tier suitable for development and low traffic; Phase 4 if production abuse protection is enabled.
- Sentry: errors and alerting; free tier limits event volume; Phase 5/6.
- Supabase: not needed for the initial email-only repository; if approved later, free projects can pause and require RLS/pooled connections; Phase 4+.
- Cloudflare Turnstile: optional bot protection; free; Phase 4 behind a flag.
- Calendly: optional booking link/facade; free tier may cover one event type; Phase 4.

### Risks and mitigations

1. CSP nonce versus static performance: start report-only with a narrow static policy; revisit with evidence.
2. Third-party embeds: use links/facades and load Turnstile only when enabled.
3. Motion bundle size: use CSS for simple transitions and LazyMotion for meaningful reveals.
4. Resend reputation: verify SPF/DKIM early, start DMARC at `p=none`, test delivery.
5. Supabase exposure/pausing: defer DB, require RLS and pooled connections if enabled.
6. Vercel Hobby commercial restriction: confirm Pro budget before launch.
7. Framework churn: pin versions and verify APIs against installed docs.
8. Fabricated proof: placeholders, visible Sample badges, content integrity checks.
9. Form abuse: layered honeypot, signed timing, rate limiting, idempotency, optional Turnstile.
10. Lighthouse variance: production build, fixed mobile/desktop median-of-three protocol.

### Open questions and recommended defaults

1. Legal entity? Recommended: keep `TODO(owner)` until registration.
2. Public contact details? Recommended: use a monitored TechJest-domain inbox and business number before launch.
3. Site URL/canonical host? Recommended: apex domain as canonical, redirect `www`.
4. Markets? Recommended: India first, remote worldwide.
5. Founded year? Recommended: omit until confirmed.
6. Social profiles? Recommended: publish only verified profiles.
7. Database? Recommended: email-only first; add Prisma/Supabase only when lead volume needs persistence.
8. Turnstile? Recommended: start honeypot/timing/rate limits, enable Turnstile after spam evidence.
9. Calendly? Recommended: link to Calendly; no embed in the critical path.
10. Privacy review? Recommended: DPDP Act draft reviewed by a qualified lawyer before launch.

### Rough effort

- Phase 1 Foundation: 1–2 days
- Phase 2 Core pages/content: 2–3 days
- Phase 3 Portfolio/blog: 2–3 days
- Phase 4 Lead capture: 2–3 days
- Phase 5 SEO/accessibility/performance: 1–2 days
- Phase 6 Hardening/deployment: 1–2 days, excluding account/DNS waiting time

## Next step

Awaiting explicit `go` approval. No application code has been written.
