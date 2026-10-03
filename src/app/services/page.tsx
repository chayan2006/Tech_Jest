import type { Metadata } from "next";
import { ServiceMarketplace } from "@/frontend/components/service-marketplace";
import { getServices } from "@/backend/supabase/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "IT Services Marketplace",
  description: "Browse TechJest's individual web, AI, e-commerce, mobile, design, automation, and support services. Build a project package and request a quote.",
  alternates: { canonical: "/services" },
};

export default async function Services() {
  const services = await getServices();
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "TechJest IT Services Marketplace",
      description: "Browse practical web, mobile, AI, cloud, design, and support services from TechJest.",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/services`,
      about: { "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: services.length,
        itemListElement: services.slice(0, 50).map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: service.name,
            description: service.description,
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/services/${service.slug}`,
            provider: { "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/#organization` },
            areaServed: "Worldwide",
          },
        })),
      },
    }) }} />
    <ServiceMarketplace services={services} />
  </>;
}
