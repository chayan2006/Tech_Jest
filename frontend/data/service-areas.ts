// The six broad service areas promoted on the homepage. They have their own
// /services/[slug] pages and are the choices on the contact form, so the contact
// API must accept them alongside the live catalog's services and categories.
// catalogCategory is the live catalog category whose services each area page lists as related;
// Cloud & DevOps has no single matching category, so its page lists none.
export const serviceAreas = [
  { slug: "web-development", title: "Web Development", catalogCategory: "Web Development" },
  { slug: "mobile-app-development", title: "Mobile App Development", catalogCategory: "Mobile Development" },
  { slug: "ai-ml-solutions", title: "AI / ML Solutions", catalogCategory: "AI & Automation" },
  { slug: "cloud-devops", title: "Cloud & DevOps", catalogCategory: null },
  { slug: "ui-ux-design", title: "UI / UX Design", catalogCategory: "Design" },
  { slug: "it-consulting-support", title: "IT Consulting & Support", catalogCategory: "Maintenance & Support" },
] as const;

export const notSureService = "Not sure yet";

export function findServiceArea(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return serviceAreas.find((area) => area.slug === normalized || area.title.toLowerCase() === normalized);
}
