import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

export default async function AdminInvoicesPage() {
  const { supabase, user } = await requireAdmin();
  const { data: invoices, error } = await supabase.from("invoices").select("id, number, amount, currency, status, due_date, created_at").order("created_at", { ascending: false });
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Finance workspace</div><h1>Invoices.</h1><p className="lead">Track invoice status; payment confirmation must be handled server-side.</p></div><span className="admin-count">{invoices?.length ?? 0} total</span></div>{error ? <div className="empty-state"><h2>Invoices unavailable.</h2><p>Apply the latest schema before using this workspace.</p></div> : invoices?.length ? <div className="admin-requests">{invoices.map(invoice => <article className="admin-request" key={invoice.id}><div className="admin-request-top"><div><span className={`admin-status status-${invoice.status}`}>{invoice.status}</span><h2>{invoice.number}</h2></div><time dateTime={invoice.created_at}>{new Date(invoice.created_at).toLocaleDateString("en-IN")}</time></div><p><strong>{invoice.currency} {Number(invoice.amount).toLocaleString("en-IN")}</strong>{invoice.due_date ? ` · Due ${invoice.due_date}` : ""}</p></article>)}</div> : <div className="empty-state"><h2>No invoices yet.</h2><p>Invoices will appear after project commercial workflows are connected.</p></div>}</AdminShell>;
}
