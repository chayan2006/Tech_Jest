import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

export default async function AdminProjectsPage() {
  const { supabase, user } = await requireAdmin();
  const { data: projects, error } = await supabase.from("projects").select("id, name, status, start_date, target_date, created_at").order("created_at", { ascending: false });
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Delivery workspace</div><h1>Projects.</h1><p className="lead">Track accepted work from kickoff through completion.</p></div><span className="admin-count">{projects?.length ?? 0} total</span></div>{error ? <div className="empty-state"><h2>Projects unavailable.</h2><p>Apply the latest schema before using this workspace.</p></div> : projects?.length ? <div className="admin-requests">{projects.map(project => <Link className="admin-request admin-request-link" href={`/admin/projects/${project.id}`} key={project.id}><div className="admin-request-top"><div><span className={`admin-status status-${project.status}`}>{project.status.replace("_", " ")}</span><h2>{project.name}</h2></div><time dateTime={project.created_at}>{new Date(project.created_at).toLocaleDateString("en-IN")}</time></div><p>{project.start_date ? `Starts ${project.start_date}` : "Start date not set"}{project.target_date ? ` · Target ${project.target_date}` : ""}</p></Link>)}</div> : <div className="empty-state"><h2>No projects yet.</h2><p>Projects will appear here after a proposal is accepted and delivery is scheduled.</p></div>}</AdminShell>;
}
