import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminStatusSelect } from "@/frontend/components/admin-status-select";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminProposalsPage() {
  const { supabase, user } = await requireAdmin();
  const { data: proposals, error } = await supabase
    .from("proposals")
    .select("id, request_id, title, amount, currency, valid_until, status, created_at")
    .order("created_at", { ascending: false });
  const requestIds = [...new Set((proposals ?? []).map((proposal) => proposal.request_id))];
  const { data: requests } = requestIds.length
    ? await supabase.from("project_requests").select("id, name, email").in("id", requestIds)
    : { data: [] };
  const requestById = new Map((requests ?? []).map((request) => [request.id, request]));
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Commercial workflow</div>
          <h1>Proposals.</h1>
          <p className="lead">Offers connected to client requests. Clients see a proposal once it is marked Sent.</p>
        </div>
        <span className="admin-count">{proposals?.length ?? 0} total</span>
      </div>
      {error ? (
        <div className="empty-state">
          <h2>Proposals unavailable.</h2>
          <p>Apply the latest schema before using this workspace.</p>
        </div>
      ) : proposals?.length ? (
        <div className="admin-requests">
          {proposals.map((proposal) => {
            const request = requestById.get(proposal.request_id);
            return (
              <article className="admin-request" key={proposal.id}>
                <div className="admin-request-top">
                  <div>
                    <AdminStatusSelect kind="proposal" id={proposal.id} value={proposal.status} name={proposal.title} />
                    <h2>{proposal.title}</h2>
                  </div>
                  <time dateTime={proposal.created_at}>{formatDate(proposal.created_at)}</time>
                </div>
                <p>
                  <strong>
                    {proposal.amount !== null
                      ? formatMoney(proposal.amount, proposal.currency)
                      : "Amount to be confirmed"}
                  </strong>
                  {proposal.valid_until ? ` · Valid until ${formatDate(proposal.valid_until)}` : ""}
                </p>
                <div className="admin-customer">
                  <strong>{request?.name ?? request?.email ?? "Client"}</strong>
                  <Link className="text-link" href={`/admin/requests/${proposal.request_id}`}>
                    Open request →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No proposals yet.</h2>
          <p>Create the first proposal from a request’s detail page.</p>
        </div>
      )}
    </AdminShell>
  );
}
