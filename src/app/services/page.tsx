import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { ServiceMarketplace } from "@/frontend/components/service-marketplace";
import { getServices } from "@/backend/supabase/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "IT Services Marketplace",
  description:
    "Browse TechJest's individual web, AI, e-commerce, mobile, design, automation, and support services. Build a project package and request a quote.",
  alternates: { canonical: "/services" },
};

export default async function Services() {
  const services = await getServices();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "TechJest IT Services Marketplace",
            description: "Browse practical web, mobile, AI, cloud, design, and support services from TechJest.",
            url: `${getSiteUrl()}/services`,
            about: { "@id": `${getSiteUrl()}/#organization` },
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
                  url: `${getSiteUrl()}/services/${service.slug}`,
                  provider: { "@id": `${getSiteUrl()}/#organization` },
                  areaServed: "Worldwide",
                },
              })),
            },
          }),
        }}
      />
      <ServiceMarketplace services={services} />
    </>
  );
}
