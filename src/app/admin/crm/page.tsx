import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { AdminShell } from "@/frontend/components/admin-shell";
import { statusOptions } from "@/frontend/data/workflow";

export default async function AdminCrmPage() {
  const { supabase, user } = await requireAdmin();
  const { data: requests, error } = await supabase
    .from("project_requests")
    .select("id, user_id, service, name, email, company, budget_range, timeline, lead_stage, status, created_at")
    .order("created_at", { ascending: false });
  const profiles = await profilesById(supabase, requests?.map((request) => request.user_id) ?? []);

  const grouped = new Map(statusOptions.lead.map(([stage]) => [stage as string, [] as NonNullable<typeof requests>]));
  (requests ?? []).forEach((request) => {
    (grouped.get(request.lead_stage) ?? grouped.get("received"))?.push(request);
  });

  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Sales pipeline</div>
          <h1>CRM workspace.</h1>
          <p className="lead">Qualify enquiries, track proposal progress, and move the right opportunities forward.</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/requests">
          All requests
        </Link>
      </div>
      {error ? (
        <div className="empty-state">
          <h2>CRM unavailable.</h2>
          <p>Apply the latest schema so lead stages are available.</p>
        </div>
      ) : (
        <div className="crm-pipeline">
          {statusOptions.lead.map(([stage, label]) => (
            <section className="crm-column" key={stage}>
              <div className="crm-column-head">
                <h2>{label}</h2>
                <span>{grouped.get(stage)?.length ?? 0}</span>
              </div>
              <div className="crm-cards">
                {(grouped.get(stage) ?? []).map((request) => {
                  const profile = profiles.get(request.user_id);
                  return (
                    <Link className="crm-card" href={`/admin/requests/${request.id}`} key={request.id}>
                      <span className="project-tag">{request.service}</span>
                      <h3>{request.name ?? profile?.full_name ?? "Unnamed lead"}</h3>
                      <p>{request.company ?? profile?.company ?? request.email ?? "Contact details unavailable"}</p>
                      {request.budget_range && <small>{request.budget_range}</small>}
                      {request.timeline && <small>{request.timeline}</small>}
                    </Link>
                  );
                })}
              </div>
              {!grouped.get(stage)?.length && <p className="crm-empty">No leads here.</p>}
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
