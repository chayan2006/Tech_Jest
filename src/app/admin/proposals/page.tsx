import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

export default async function AdminProposalsPage() {
  const { supabase, user } = await requireAdmin();
  const { data: proposals, error } = await supabase.from("proposals").select("id, request_id, title, amount, currency, valid_until, status, created_at").order("created_at", { ascending: false });
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Commercial workflow</div><h1>Proposals.</h1><p className="lead">Draft and track offers connected to qualified requests.</p></div><span className="admin-count">{proposals?.length ?? 0} total</span></div>{error ? <div className="empty-state"><h2>Proposals unavailable.</h2><p>Apply the latest schema before using this workspace.</p></div> : proposals?.length ? <div className="admin-requests">{proposals.map(proposal => <article className="admin-request" key={proposal.id}><div className="admin-request-top"><div><span className={`admin-status status-${proposal.status}`}>{proposal.status}</span><h2>{proposal.title}</h2></div><time dateTime={proposal.created_at}>{new Date(proposal.created_at).toLocaleDateString("en-IN")}</time></div><p><strong>{proposal.amount ? `${proposal.currency} ${Number(proposal.amount).toLocaleString("en-IN")}` : "Amount to be confirmed"}</strong>{proposal.valid_until ? ` · Valid until ${proposal.valid_until}` : ""}</p><Link className="text-link" href={`/admin/requests/${proposal.request_id}`}>Open request</Link></article>)}</div> : <div className="empty-state"><h2>No proposals yet.</h2><p>Create the first proposal from a request detail page.</p></div>}</AdminShell>;
}
