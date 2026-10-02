import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

export default async function AdminPage() {
  const { supabase, user } = await requireAdmin();
  const [{ count: requestCount }, { count: userCount }, { count: activeCount }, { count: projectCount }, { count: proposalCount }, { count: invoiceCount }, { data: recentRequests }] = await Promise.all([
    supabase.from("project_requests").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
    supabase.from("project_requests").select("id, service, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Command centre</div><h1>Good morning, admin.</h1><p className="lead">A live view of what is happening across TechJest.</p></div><Link className="btn btn-primary" href="/admin/requests">Review requests</Link></div>
    <div className="admin-stat-grid"><Link href="/admin/requests" className="admin-stat"><span>Total requests</span><strong>{requestCount ?? 0}</strong><small>All consultation enquiries</small></Link><Link href="/admin/users" className="admin-stat"><span>Registered people</span><strong>{userCount ?? 0}</strong><small>Profiles created on TechJest</small></Link><Link href="/admin/projects" className="admin-stat"><span>Projects</span><strong>{projectCount ?? 0}</strong><small>Delivery workspaces</small></Link><Link href="/admin/proposals" className="admin-stat"><span>Proposals</span><strong>{proposalCount ?? 0}</strong><small>Commercial offers</small></Link><Link href="/admin/invoices" className="admin-stat"><span>Invoices</span><strong>{invoiceCount ?? 0}</strong><small>Finance records</small></Link><Link href="/admin/activity" className="admin-stat"><span>Activity, 30 days</span><strong>{activeCount ?? 0}</strong><small>Recorded sign-ins and events</small></Link></div>
    <div className="admin-control-grid"><Link href="/admin/settings" className="admin-control-card"><span className="eyebrow">Website control</span><h2>Edit homepage and contact settings</h2><p>Update public-facing business content from the admin workspace.</p></Link><Link href="/admin/crm" className="admin-control-card"><span className="eyebrow">Sales control</span><h2>Manage the lead pipeline</h2><p>Qualify requests, prepare proposals, and move opportunities forward.</p></Link><Link href="/admin/projects" className="admin-control-card"><span className="eyebrow">Delivery control</span><h2>Run project workspaces</h2><p>Create projects, add tasks, and keep client delivery visible.</p></Link></div>
    <div className="admin-panel"><div className="admin-panel-head"><div><h2>Latest requests</h2><p>Stay on top of new opportunities.</p></div><Link href="/admin/requests">View all</Link></div>{recentRequests?.length ? <div className="admin-mini-list">{recentRequests.map(request => <Link href="/admin/requests" className="admin-mini-row" key={request.id}><span><strong>{request.service}</strong><small>{new Date(request.created_at).toLocaleString("en-IN")}</small></span><span className={`admin-status status-${request.status}`}>{request.status.replace("_", " ")}</span></Link>)}</div> : <div className="empty-state"><h2>No requests yet.</h2><p>New consultation requests will appear here.</p></div>}</div>
  </AdminShell>;
}
