import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminStatusSelect } from "@/frontend/components/admin-status-select";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminInvoicesPage() {
  const { supabase, user } = await requireAdmin();
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, project_id, number, amount, currency, status, due_date, paid_at, created_at")
    .order("created_at", { ascending: false });
  const projectIds = [
    ...new Set((invoices ?? []).flatMap((invoice) => (invoice.project_id ? [invoice.project_id] : []))),
  ];
  const { data: projects } = projectIds.length
    ? await supabase.from("projects").select("id, name").in("id", projectIds)
    : { data: [] };
  const projectById = new Map((projects ?? []).map((project) => [project.id, project]));
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Finance workspace</div>
          <h1>Invoices.</h1>
          <p className="lead">
            Track what has been billed and paid. Add new invoices from a project’s page; drafts stay internal.
          </p>
        </div>
        <span className="admin-count">{invoices?.length ?? 0} total</span>
      </div>
      {error ? (
        <div className="empty-state">
          <h2>Invoices unavailable.</h2>
          <p>Apply the latest schema before using this workspace.</p>
        </div>
      ) : invoices?.length ? (
        <div className="admin-requests">
          {invoices.map((invoice) => {
            const project = invoice.project_id ? projectById.get(invoice.project_id) : undefined;
            return (
              <article className="admin-request" key={invoice.id}>
                <div className="admin-request-top">
                  <div>
                    <AdminStatusSelect kind="invoice" id={invoice.id} value={invoice.status} name={invoice.number} />
                    <h2>{invoice.number}</h2>
                  </div>
                  <time dateTime={invoice.created_at}>{formatDate(invoice.created_at)}</time>
                </div>
                <p>
                  <strong>{formatMoney(invoice.amount, invoice.currency)}</strong>
                  {invoice.due_date ? ` · Due ${formatDate(invoice.due_date)}` : ""}
                  {invoice.paid_at ? ` · Paid ${formatDate(invoice.paid_at)}` : ""}
                </p>
                <div className="admin-customer">
                  {project ? (
                    <Link className="text-link" href={`/admin/projects/${project.id}`}>
                      {project.name} →
                    </Link>
                  ) : (
                    <span>Not linked to a project</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No invoices yet.</h2>
          <p>Add an invoice from a project’s page.</p>
        </div>
      )}
    </AdminShell>
  );
}
