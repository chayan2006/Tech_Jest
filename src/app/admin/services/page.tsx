import { requireAdmin } from "@/backend/supabase/admin";
import { fallbackServices } from "@/backend/supabase/services";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminServices } from "@/frontend/components/admin-services";

export default async function AdminServicesPage() {
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase
    .from("service_catalog")
    .select("slug, name, category, description, price, delivery, popular, included, technologies, is_active")
    .order("sort_order", { ascending: true })
    .order("name");
  const initialServices = data?.length
    ? data.map((item) => ({
        ...item,
        price: item.price === null ? null : Number(item.price),
        included: Array.isArray(item.included) ? item.included : [],
        technologies: Array.isArray(item.technologies) ? item.technologies : [],
      }))
    : fallbackServices.map((service) => ({ ...service, is_active: false }));
  const databaseError = error ? `${error.code ? `${error.code}: ` : ""}${error.message}` : "";
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Website control</div>
          <h1>Services.</h1>
          <p className="lead">
            Control every service card, detail page, price, delivery estimate, and published status.
          </p>
        </div>
      </div>
      <div className="admin-panel">
        <AdminServices initialServices={initialServices} databaseReady={!error} databaseError={databaseError} />
      </div>
    </AdminShell>
  );
}
