import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminTaskForm } from "@/frontend/components/admin-task-form";

export default async function AdminProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: project, error } = await supabase.from("projects").select("id, name, status, start_date, target_date").eq("id", id).maybeSingle();
  if (error || !project) notFound();
  const { data: tasks } = await supabase.from("project_tasks").select("id, title, description, status, due_date").eq("project_id", id).order("created_at", { ascending: true });
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Project delivery</div><h1>{project.name}.</h1><p className="lead">Plan and track the work required to deliver this project.</p></div><Link className="btn btn-ghost" href="/admin/projects">Back to projects</Link></div><div className="admin-detail-grid"><section className="admin-panel"><div className="admin-panel-head"><div><h2>Project overview</h2><p>{project.status.replace("_", " ")} · {project.start_date ?? "Start date not set"}{project.target_date ? ` · target ${project.target_date}` : ""}</p></div></div><div className="admin-mini-list">{tasks?.length ? tasks.map(task => <div className="admin-mini-row" key={task.id}><div><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}</div><span>{task.status.replace("_", " ")}{task.due_date ? ` · ${task.due_date}` : ""}</span></div>) : <p className="admin-message">No tasks yet.</p>}</div></section><section className="admin-panel"><div className="admin-panel-head"><div><h2>Add task</h2><p>Break delivery into visible, trackable work.</p></div></div><AdminTaskForm projectId={project.id} /></section></div></AdminShell>;
}
