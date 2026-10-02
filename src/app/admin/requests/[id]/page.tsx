import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminRequestStatus } from "@/frontend/components/admin-request-status";
import { AdminLeadStage, leadStages } from "@/frontend/components/admin-lead-stage";
import { AdminProposalForm } from "@/frontend/components/admin-proposal-form";
import { AdminRequestActions } from "@/frontend/components/admin-request-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: request, error } = await supabase.from("project_requests").select("id, service, message, description, budget, budget_range, timeline, name, email, phone, company, lead_stage, status, created_at, user_id").eq("id", id).maybeSingle();
  if (error || !request) {
    const detail = error?.message ?? "This request no longer exists.";
    return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Request detail</div><h1>Request unavailable.</h1><p className="lead">{detail}</p></div><Link className="btn btn-ghost" href="/admin/notifications">Back to notifications</Link></div><section className="admin-panel"><p className="admin-message">The notification may point to a deleted request, or the current Supabase schema/policy may not allow this admin account to read it.</p></section></AdminShell>;
  }
  const { data: selectedServices, error: selectedServicesError } = await supabase.from("project_request_services").select("service_name_snapshot, price_snapshot").eq("request_id", id);
  return <AdminShell email={user.email}>
    <div className="admin-title"><div><div className="eyebrow">Request detail</div><h1>{request.name ?? "Consultation request"}</h1><p className="lead">{request.service}</p></div><Link className="btn btn-ghost" href="/admin/crm">Back to CRM</Link></div>
    <div className="admin-detail-grid">
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Client and project</h2><p>Structured information submitted with this request.</p></div><span className={`admin-status status-${request.status}`}>{request.status.replace("_", " ")}</span></div>
        <dl className="admin-detail-list"><div><dt>Name</dt><dd>{request.name ?? "Not provided"}</dd></div><div><dt>Email</dt><dd>{request.email ?? "Not provided"}</dd></div><div><dt>Phone</dt><dd>{request.phone ?? "Not provided"}</dd></div><div><dt>Company</dt><dd>{request.company ?? "Independent project"}</dd></div><div><dt>Budget</dt><dd>{request.budget_range ?? request.budget ?? "Not provided"}</dd></div><div><dt>Timeline</dt><dd>{request.timeline ?? "Not provided"}</dd></div></dl>
      </section>
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Pipeline stage</h2><p>Keep the commercial workflow visible to the team.</p></div></div><div className="crm-stage-badge">{request.lead_stage ?? "received"}</div><p className="admin-message">{request.description ?? request.message}</p><div className="admin-detail-controls"><AdminLeadStage requestId={request.id} initialStage={leadStages.some(([value]) => value === request.lead_stage) ? request.lead_stage : "received"} /><AdminRequestStatus requestId={request.id} initialStatus={request.status} /></div></section>
    </div>
    <section className="admin-panel admin-detail-services"><div className="admin-panel-head"><div><h2>Request actions</h2><p>Accept, decline, restore, complete, or permanently remove this request.</p></div></div><AdminRequestActions requestId={request.id} initialStatus={request.status} /></section>
    <section className="admin-panel admin-detail-services"><div className="admin-panel-head"><div><h2>Selected services</h2><p>Historical snapshots from the quote request.</p></div></div>{selectedServicesError ? <p className="admin-message">Could not load service snapshots: {selectedServicesError.message}</p> : selectedServices?.length ? <div className="admin-mini-list">{selectedServices.map((service, index) => <div className="admin-mini-row" key={`${service.service_name_snapshot}-${index}`}><strong>{service.service_name_snapshot}</strong><span>{service.price_snapshot ? `From ₹${Number(service.price_snapshot).toLocaleString("en-IN")}` : "Custom quote"}</span></div>)}</div> : <p className="admin-message">No service snapshots are available for this request.</p>}</section>
    <section className="admin-panel admin-detail-services"><div className="admin-panel-head"><div><h2>Create proposal</h2><p>Turn the qualified request into a clear commercial offer.</p></div></div><AdminProposalForm requestId={request.id} defaultTitle={request.service} /></section>
  </AdminShell>;
}
