import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { statusLabel } from "@/frontend/data/workflow";
import { formatDateTime } from "@/lib/format";

// The team works in India, so the greeting follows Indian time rather than the server's clock.
function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(
      new Date(),
    ),
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  const [
    { data: profile },
    { count: requestCount },
    { count: awaitingReplyCount },
    { count: userCount },
    { count: projectCount },
    { count: proposalCount },
    { count: invoiceCount },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("project_requests").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "waiting_for_admin"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
    supabase
      .from("project_requests")
      .select("id, service, name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const firstName = profile?.full_name?.split(" ")[0];
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Command centre</div>
          <h1>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="lead">A live view of what is happening across TechJest.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/requests">
          Review requests
        </Link>
      </div>
      <div className="admin-stat-grid">
        <Link href="/admin/requests" className="admin-stat">
          <span>Total requests</span>
          <strong>{requestCount ?? 0}</strong>
          <small>All consultation enquiries</small>
        </Link>
        <Link href="/admin/messages" className="admin-stat">
          <span>Awaiting your reply</span>
          <strong>{awaitingReplyCount ?? 0}</strong>
          <small>Conversations where the client wrote last</small>
        </Link>
        <Link href="/admin/users" className="admin-stat">
          <span>Registered people</span>
          <strong>{userCount ?? 0}</strong>
          <small>Profiles created on TechJest</small>
        </Link>
        <Link href="/admin/projects" className="admin-stat">
          <span>Projects</span>
          <strong>{projectCount ?? 0}</strong>
          <small>Delivery workspaces</small>
        </Link>
        <Link href="/admin/proposals" className="admin-stat">
          <span>Proposals</span>
          <strong>{proposalCount ?? 0}</strong>
          <small>Commercial offers</small>
        </Link>
        <Link href="/admin/invoices" className="admin-stat">
          <span>Invoices</span>
          <strong>{invoiceCount ?? 0}</strong>
          <small>Finance records</small>
        </Link>
      </div>
      <div className="admin-control-grid">
        <Link href="/admin/settings" className="admin-control-card">
          <span className="eyebrow">Website control</span>
          <h2>Edit homepage and contact settings</h2>
          <p>Update public-facing business content from the admin workspace.</p>
        </Link>
        <Link href="/admin/crm" className="admin-control-card">
          <span className="eyebrow">Sales control</span>
          <h2>Manage the lead pipeline</h2>
          <p>Qualify requests, prepare proposals, and move opportunities forward.</p>
        </Link>
        <Link href="/admin/projects" className="admin-control-card">
          <span className="eyebrow">Delivery control</span>
          <h2>Run project workspaces</h2>
          <p>Create projects, add tasks, and keep client delivery visible.</p>
        </Link>
      </div>
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Latest requests</h2>
            <p>Stay on top of new opportunities.</p>
          </div>
          <Link href="/admin/requests">View all</Link>
        </div>
        {recentRequests?.length ? (
          <div className="admin-mini-list">
            {recentRequests.map((request) => (
              <Link href={`/admin/requests/${request.id}`} className="admin-mini-row" key={request.id}>
                <span>
                  <strong>{request.service}</strong>
                  <small>
                    {request.name ?? request.email ?? "Client"} · {formatDateTime(request.created_at)}
                  </small>
                </span>
                <span className={`admin-status status-${request.status}`}>
                  {statusLabel("request", request.status)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No requests yet.</h2>
            <p>New consultation requests will appear here.</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
