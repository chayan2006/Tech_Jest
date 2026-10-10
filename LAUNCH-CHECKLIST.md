# Launch checklist

What is still open before TechJest is fully launch-ready. Items marked _owner_ need information or a decision from the founders.

## Business details (owner)

- [ ] Chitwandeep Kaur's job title (the About page shows "Team member" until then).
- [ ] Confirm the spelling of Amit's surname: the site uses "Shing", his LinkedIn URL uses "singh".
- [ ] WhatsApp business number, saved in Admin → Website settings.
- [ ] Custom domain (for example `techjest.in`), then set `NEXT_PUBLIC_SITE_URL` in Vercel and add the new `/auth/callback` URL in Supabase Auth.
- [ ] A professional contact email on that domain to replace the Gmail address.
- [ ] Registered company name, address, phone, GSTIN (if registered), and the company LinkedIn page for the footer.
- [ ] Real case studies, testimonials, or client logos, with the clients' permission, to replace the two sample projects.
- [ ] Professional photos of the team for the About page.
- [ ] Optional: a flat or SVG version of the logo in the site colours.

## Features that need an account or approval (owner)

- [ ] Email alerts for new enquiries: an email service account (for example Resend) and the inbox that should receive alerts.
- [ ] Privacy Policy and Terms pages: approve a draft, then have it reviewed (the site collects names, emails, and phone numbers; India's DPDP Act applies).
- [ ] Decide whether visitors may send an enquiry without creating an account first.
- [ ] Turn on Vercel Web Analytics if visitor numbers are wanted.
- [ ] Supabase → Authentication: turn on leaked-password protection (needs the Supabase Pro plan).

## Technical sign-off

- [ ] Production deploy includes `vercel.json` (server region `bom1`, next to the database).
- [ ] Run `backend/supabase/migrations/2026-10-07-live-messages-and-indexes.sql` on the live database (instant message updates, one security fix, three indexes).
- [x] Sign-in, dashboard, messages, and every admin page tested end to end on a local copy of the database (126 checks, October 2026).
- [ ] After deploying, one real run on the live site: a test request, an admin reply, and a proposal marked Sent.
- [ ] Spot-check on Safari/iPhone, Firefox, and Edge.
- [ ] Sitemap submitted in Google Search Console and Bing Webmaster Tools.
