import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminProjectForm } from "@/frontend/components/admin-project-form";

export default async function AdminProjectsPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: projects, error }, { data: requests }] = await Promise.all([
    supabase.from("projects").select("id, request_id, name, status, start_date, target_date, created_at").order("created_at", { ascending: false }),
    supabase.from("project_requests").select("id, service, name, email, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const requestById = new Map((requests ?? []).map(request => [request.id, request]));
  const requestOptions = (requests ?? []).map(request => ({ id: request.id, label: `${request.name ?? request.email ?? "Client"} — ${request.service} (${new Date(request.created_at).toLocaleDateString("en-IN")})` }));
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Delivery workspace</div><h1>Projects.</h1><p className="lead">Track accepted work from kickoff through completion.</p></div><span className="admin-count">{projects?.length ?? 0} total</span></div>{error ? <div className="empty-state"><h2>Projects unavailable.</h2><p>Apply the latest schema before using this workspace.</p></div> : <><section className="admin-panel"><div className="admin-panel-head"><div><h2>Start a project</h2><p>Create a delivery record for a client request. The client sees it in their dashboard.</p></div></div><AdminProjectForm requests={requestOptions} /></section>{projects?.length ? <div className="admin-requests">{projects.map(project => { const request = project.request_id ? requestById.get(project.request_id) : undefined; return <Link className="admin-request admin-request-link" href={`/admin/projects/${project.id}`} key={project.id}><div className="admin-request-top"><div><span className={`admin-status status-${project.status}`}>{project.status.replace("_", " ")}</span><h2>{project.name}</h2></div><time dateTime={project.created_at}>{new Date(project.created_at).toLocaleDateString("en-IN")}</time></div><p>{project.request_id ? `Client: ${request?.name ?? request?.email ?? "linked request"}` : "Not linked to a client request"} · {project.start_date ? `Starts ${project.start_date}` : "Start date not set"}{project.target_date ? ` · Target ${project.target_date}` : ""}</p></Link>; })}</div> : <div className="empty-state"><h2>No projects yet.</h2><p>Projects will appear here after a proposal is accepted and delivery is scheduled.</p></div>}</>}</AdminShell>;
}
