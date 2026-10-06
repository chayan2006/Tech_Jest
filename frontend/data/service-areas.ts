// The six broad service areas promoted on the homepage. They have their own
// /services/[slug] pages and are the choices on the contact form, so the contact
// API must accept them alongside the live catalog's services and categories.
export const serviceAreas = [
  { slug: "web-development", title: "Web Development" },
  { slug: "mobile-app-development", title: "Mobile App Development" },
  { slug: "ai-ml-solutions", title: "AI / ML Solutions" },
  { slug: "cloud-devops", title: "Cloud & DevOps" },
  { slug: "ui-ux-design", title: "UI / UX Design" },
  { slug: "it-consulting-support", title: "IT Consulting & Support" },
] as const;

export const notSureService = "Not sure yet";

export function findServiceArea(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return serviceAreas.find(area => area.slug === normalized || area.title.toLowerCase() === normalized);
}
