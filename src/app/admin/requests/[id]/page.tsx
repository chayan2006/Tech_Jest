import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminStatusSelect } from "@/frontend/components/admin-status-select";
import { AdminProposalForm } from "@/frontend/components/admin-proposal-form";
import { AdminRequestActions } from "@/frontend/components/admin-request-actions";
import { AdminProjectForm } from "@/frontend/components/admin-project-form";
import { statusLabel } from "@/frontend/data/workflow";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: request, error } = await supabase
    .from("project_requests")
    .select(
      "id, service, message, description, budget, budget_range, timeline, name, email, phone, company, lead_stage, status, created_at, user_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !request) {
    const detail = error?.message ?? "This request no longer exists.";
    return (
      <AdminShell user={user}>
        <div className="admin-title">
          <div>
            <div className="eyebrow">Request detail</div>
            <h1>Request unavailable.</h1>
            <p className="lead">{detail}</p>
          </div>
          <Link className="btn btn-ghost" href="/admin/requests">
            Back to requests
          </Link>
        </div>
        <section className="admin-panel">
          <p className="admin-message">
            The link may point to a deleted request, or the current Supabase schema/policy may not allow this admin
            account to read it.
          </p>
        </section>
      </AdminShell>
    );
  }
  const [
    profiles,
    { data: selectedServices, error: selectedServicesError },
    { data: projects },
    { data: proposals },
    { data: conversation },
  ] = await Promise.all([
    profilesById(supabase, [request.user_id]),
    supabase.from("project_request_services").select("service_name_snapshot, price_snapshot").eq("request_id", id),
    supabase.from("projects").select("id, name, status").eq("request_id", id).order("created_at", { ascending: false }),
    supabase
      .from("proposals")
      .select("id, title, amount, currency, status, valid_until")
      .eq("request_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("conversations").select("id").eq("request_id", id).maybeSingle(),
  ]);
  const profile = profiles.get(request.user_id);
  const clientName = request.name ?? profile?.full_name;
  // A new project links to the accepted proposal, or else the latest one.
  const projectProposal = proposals?.find((proposal) => proposal.status === "accepted") ?? proposals?.[0];
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Request detail</div>
          <h1>{clientName ?? "Consultation request"}</h1>
          <p className="lead">
            {request.service} · received {formatDateTime(request.created_at)}
          </p>
        </div>
        <div className="hero-actions">
          {conversation && (
            <Link className="btn btn-primary" href={`/admin/messages/${conversation.id}`}>
              Open conversation
            </Link>
          )}
          <Link className="btn btn-ghost" href="/admin/crm">
            Back to CRM
          </Link>
        </div>
      </div>
      <div className="admin-detail-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Client</h2>
              <p>Contact details from the request and the client’s profile.</p>
            </div>
            <span className={`admin-status status-${request.status}`}>{statusLabel("request", request.status)}</span>
          </div>
          <dl className="admin-detail-list">
            <div>
              <dt>Name</dt>
              <dd>{clientName ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{request.email ? <a href={`mailto:${request.email}`}>{request.email}</a> : "Not provided"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{request.phone ?? profile?.phone ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{request.company ?? profile?.company ?? "Independent project"}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{request.budget_range ?? request.budget ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>{request.timeline ?? "Not provided"}</dd>
            </div>
          </dl>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Request</h2>
              <p>What the client asked for, and where it sits in the pipeline.</p>
            </div>
          </div>
          <p className="admin-message">{request.description ?? request.message}</p>
          {selectedServicesError ? (
            <p className="admin-message">Could not load selected services: {selectedServicesError.message}</p>
          ) : selectedServices?.length ? (
            <div className="admin-mini-list">
              {selectedServices.map((service, index) => (
                <div className="admin-mini-row" key={`${service.service_name_snapshot}-${index}`}>
                  <strong>{service.service_name_snapshot}</strong>
                  <span>{service.price_snapshot ? `From ${formatMoney(service.price_snapshot)}` : "Custom quote"}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="admin-detail-controls">
            <AdminStatusSelect
              kind="lead"
              id={request.id}
              value={request.lead_stage ?? "received"}
              label="Lead stage"
            />
          </div>
        </section>
      </div>
      <section className="admin-panel admin-detail-services">
        <div className="admin-panel-head">
          <div>
            <h2>Request actions</h2>
            <p>Accept, decline, restore, complete, or permanently remove this request.</p>
          </div>
        </div>
        <AdminRequestActions
          requestId={request.id}
          initialStatus={request.status}
          hasProject={Boolean(projects?.length)}
        />
      </section>
      <section className="admin-panel admin-detail-services">
        <div className="admin-panel-head">
          <div>
            <h2>Proposals</h2>
            <p>The client sees a proposal in their dashboard once it is marked Sent. Drafts stay internal.</p>
          </div>
        </div>
        {proposals?.length ? (
          <div className="admin-mini-list">
            {proposals.map((proposal) => (
              <div className="admin-mini-row" key={proposal.id}>
                <span>
                  <strong>{proposal.title}</strong>
                  <small>
                    {proposal.amount !== null
                      ? formatMoney(proposal.amount, proposal.currency)
                      : "Amount to be confirmed"}
                    {proposal.valid_until ? ` · valid until ${formatDate(proposal.valid_until)}` : ""}
                  </small>
                </span>
                <AdminStatusSelect kind="proposal" id={proposal.id} value={proposal.status} name={proposal.title} />
              </div>
            ))}
          </div>
        ) : null}
        <AdminProposalForm requestId={request.id} defaultTitle={request.service} />
      </section>
      <section className="admin-panel admin-detail-services">
        <div className="admin-panel-head">
          <div>
            <h2>Project</h2>
            <p>Create the delivery workspace this client sees in their dashboard.</p>
          </div>
        </div>
        {projects?.length ? (
          <div className="admin-mini-list">
            {projects.map((project) => (
              <Link className="admin-mini-row" href={`/admin/projects/${project.id}`} key={project.id}>
                <strong>{project.name}</strong>
                <span className={`admin-status status-${project.status}`}>
                  {statusLabel("project", project.status)}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
        <AdminProjectForm requestId={request.id} proposalId={projectProposal?.id} defaultName={request.service} />
      </section>
    </AdminShell>
  );
}
