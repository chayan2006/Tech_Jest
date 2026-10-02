import type { Metadata } from "next";
import { ServiceMarketplace } from "@/frontend/components/service-marketplace";
import { getServices } from "@/backend/supabase/services";

export const metadata: Metadata = {
  title: "IT Services Marketplace",
  description: "Browse TechJest's individual web, AI, e-commerce, mobile, design, automation, and support services. Build a project package and request a quote.",
  alternates: { canonical: "/services" },
};

export default async function Services() { return <ServiceMarketplace services={await getServices()} />; }
