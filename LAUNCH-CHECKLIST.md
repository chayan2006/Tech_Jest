# Launch checklist

## Product values

- [ ] Confirm legal entity (currently not registered).
- [ ] Confirm public domain and canonical host.
- [ ] Confirm monitored contact email, lead inbox, phone, WhatsApp, hours, address, markets, and socials.
- [ ] Confirm founded year or approve omitting it.
- [ ] Approve service, project, testimonial, team, and blog content.

## Accounts and infrastructure

- [ ] Create/link Vercel project and budget for Pro commercial hosting.
- [ ] Verify Resend domain; publish SPF, DKIM, and DMARC.
- [ ] Create Upstash Redis production database if rate limiting needs managed storage.
- [ ] Create Sentry project and alert for lead-delivery failures.
- [ ] Decide whether Supabase/Prisma persistence is needed.
- [ ] Create Cloudflare Turnstile site/secret if spam requires it.
- [ ] Create Calendly event and confirm the public URL.

## Technical sign-off

- [ ] `pnpm content:check:strict` passes.
- [ ] All required environment variables are configured per environment.
- [ ] Production lead notification and non-echoing auto-reply are delivered.
- [ ] Database row is verified if persistence is enabled.
- [ ] CSP is enforced with no violations.
- [ ] Security headers scan is clean.
- [ ] Sitemap, robots, canonical URLs, OG images, and JSON-LD are validated.
- [ ] Lighthouse targets and Core Web Vitals meet the specification.
- [ ] Axe, keyboard, and screen-reader checks pass on required routes.
- [ ] Production smoke test completed on current Chrome, Safari/iOS, Firefox, and Edge.
- [ ] Search Console and Bing Webmaster sitemap submissions completed.
- [ ] Rollback procedure documented and tested.
