import { getSiteUrl } from "@/lib/site-url";

export function GET() {
  const siteUrl = getSiteUrl();
  return new Response(`# TechJest

> TechJest is a software development company for startups and growing businesses.

## What TechJest does

- Web development: websites, web applications, e-commerce, and dashboards.
- Mobile app development: native and cross-platform product experiences.
- AI and ML solutions: practical automation, assistants, and forecasting.
- Cloud and DevOps: deployment, observability, infrastructure, and delivery systems.
- UI/UX design: research-led interfaces and design systems.
- IT consulting and support: technical audits, roadmaps, maintenance, and guidance.

## Public pages

- Home: ${siteUrl}/
- Services: ${siteUrl}/services
- Work: ${siteUrl}/portfolio
- About: ${siteUrl}/about
- Contact: ${siteUrl}/contact

## Contact

Start a project through /contact. TechJest serves clients in India and worldwide.

Private authentication, dashboard, admin, API, and account routes are intentionally excluded.
`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
