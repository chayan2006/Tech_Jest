import { getSiteUrl } from "@/lib/site-url";
import { getSiteSettings } from "@/backend/supabase/site-settings";
import { team } from "@/frontend/data/team";

export async function GET() {
  const siteUrl = getSiteUrl();
  const { contact_email: contactEmail } = await getSiteSettings();
  return new Response(
    `# TechJest

> TechJest is a software development company for startups and growing businesses. The team builds practical, dependable digital products with clear scope and measurable progress.

## Company

- Website: ${siteUrl}
- Source repository: https://github.com/chayan2006/Tech_Jest
- Contact: ${contactEmail}
- Service area: India and worldwide

## Team

${team.map((member) => `- ${member.name}, ${member.role}: ${member.linkedin}`).join("\n")}

## Services

- Web development: marketing sites, web apps, e-commerce, and dashboards
- Mobile app development: native and cross-platform mobile products
- AI / ML solutions: automation, assistants, and forecasting grounded in customer data
- Cloud & DevOps: deployments, observability, and scalable infrastructure
- UI / UX design: research-led interfaces and design systems
- IT consulting & support: technical audits, roadmaps, and ongoing support

## How TechJest works

TechJest discovers the problem and constraints, plans a focused first release, builds in short cycles with visible progress, and improves the product after launch. Clients receive the source code, design files, and documentation created for their project.

## Important pages

- [Home](${siteUrl}/)
- [Services](${siteUrl}/services)
- [Portfolio](${siteUrl}/portfolio)
- [About and leadership](${siteUrl}/about)
- [Contact](${siteUrl}/contact)

Private authentication, dashboard, admin, API, and account routes are intentionally excluded.
`,
    {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    },
  );
}
