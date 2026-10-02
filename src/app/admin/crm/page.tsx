import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

const stages = [
  ["received", "Received"],
  ["qualified", "Qualified"],
  ["proposal", "Proposal"],
  ["negotiation", "Negotiation"],
  ["won", "Won"],
  ["project", "Project"],
] as const;

export default async function AdminCrmPage() {
  const { supabase, user } = await requireAdmin();
  const { data: requests, error } = await supabase
    .from("project_requests")
    .select("id, service, name, email, company, budget_range, timeline, lead_stage, status, created_at")
    .order("created_at", { ascending: false });

  const grouped = new Map(stages.map(([stage]) => [stage, [] as NonNullable<typeof requests>]));
  (requests ?? []).forEach(request => {
    const stage = stages.some(([value]) => value === request.lead_stage) ? request.lead_stage : "received";
    grouped.get(stage)?.push(request);
  });

  return <AdminShell email={user.email}>
    <div className="admin-title">
      <div><div className="eyebrow">Sales pipeline</div><h1>CRM workspace.</h1><p className="lead">Qualify enquiries, track proposal progress, and move the right opportunities forward.</p></div>
      <Link className="btn btn-ghost" href="/admin/requests">All requests</Link>
    </div>
    {error ? <div className="empty-state"><h2>CRM unavailable.</h2><p>Apply the latest schema so lead stages are available.</p></div> : <div className="crm-pipeline">
      {stages.map(([stage, label]) => <section className="crm-column" key={stage}>
        <div className="crm-column-head"><h2>{label}</h2><span>{grouped.get(stage)?.length ?? 0}</span></div>
        <div className="crm-cards">{(grouped.get(stage) ?? []).map(request => <Link className="crm-card" href={`/admin/requests/${request.id}`} key={request.id}>
          <span className="project-tag">{request.service}</span>
          <h3>{request.name ?? "Unnamed lead"}</h3>
          <p>{request.company ?? request.email ?? "Contact details unavailable"}</p>
          {request.budget_range && <small>{request.budget_range}</small>}
          {request.timeline && <small>{request.timeline}</small>}
        </Link>)}</div>
        {!grouped.get(stage)?.length && <p className="crm-empty">No leads here.</p>}
      </section>)}
    </div>}
  </AdminShell>;
}
