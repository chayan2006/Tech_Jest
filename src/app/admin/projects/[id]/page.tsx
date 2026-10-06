import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/supabase/admin";
import { withDownloadLinks } from "@/backend/supabase/documents";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminTaskForm } from "@/frontend/components/admin-task-form";
import { AdminInvoiceForm } from "@/frontend/components/admin-invoice-form";
import { AdminDocumentUpload } from "@/frontend/components/admin-document-upload";

export default async function AdminProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: project, error } = await supabase.from("projects").select("id, request_id, name, status, start_date, target_date").eq("id", id).maybeSingle();
  if (error || !project) notFound();
  const [{ data: tasks }, { data: invoices }, { data: documentRows }, { data: request }, { data: conversation }] = await Promise.all([
    supabase.from("project_tasks").select("id, title, description, status, due_date").eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("invoices").select("id, number, amount, currency, status, due_date").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_documents").select("id, name, storage_path, created_at").eq("project_id", id).order("created_at", { ascending: false }),
    project.request_id ? supabase.from("project_requests").select("id, name, email, service").eq("id", project.request_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("conversations").select("id").or(project.request_id ? `project_id.eq.${project.id},request_id.eq.${project.request_id}` : `project_id.eq.${project.id}`).order("last_message_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ]);
  const documents = await withDownloadLinks(supabase, documentRows ?? []);
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Project delivery</div><h1>{project.name}.</h1><p className="lead">{request ? <>Client: <Link href={`/admin/requests/${request.id}`}>{request.name ?? request.email ?? "client request"}</Link> · {request.service}</> : "Not linked to a client request, so no client can see this project."}</p></div><div className="hero-actions">{conversation && <Link className="btn btn-ghost" href={`/admin/messages/${conversation.id}`}>Client conversation</Link>}<Link className="btn btn-ghost" href="/admin/projects">Back to projects</Link></div></div>
    <div className="admin-detail-grid"><section className="admin-panel"><div className="admin-panel-head"><div><h2>Project overview</h2><p>{project.status.replace("_", " ")} · {project.start_date ?? "Start date not set"}{project.target_date ? ` · target ${project.target_date}` : ""}</p></div></div><div className="admin-mini-list">{tasks?.length ? tasks.map(task => <div className="admin-mini-row" key={task.id}><div><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}</div><span>{task.status.replace("_", " ")}{task.due_date ? ` · ${task.due_date}` : ""}</span></div>) : <p className="admin-message">No tasks yet.</p>}</div></section><section className="admin-panel"><div className="admin-panel-head"><div><h2>Add task</h2><p>Break delivery into visible, trackable work.</p></div></div><AdminTaskForm projectId={project.id} /></section></div>
    <div className="admin-detail-grid"><section className="admin-panel"><div className="admin-panel-head"><div><h2>Invoices</h2><p>Draft invoices stay internal; sent, paid, and void invoices are visible to the client.</p></div></div><div className="admin-mini-list">{invoices?.length ? invoices.map(invoice => <div className="admin-mini-row" key={invoice.id}><strong>{invoice.number}</strong><span>{invoice.currency} {Number(invoice.amount).toLocaleString("en-IN")} · {invoice.status}{invoice.due_date ? ` · due ${invoice.due_date}` : ""}</span></div>) : <p className="admin-message">No invoices yet.</p>}</div><AdminInvoiceForm projectId={project.id} requestId={project.request_id} /></section>
    <section className="admin-panel"><div className="admin-panel-head"><div><h2>Documents</h2><p>Private files shared with this project’s client.</p></div></div><div className="admin-mini-list">{documents.length ? documents.map(document => <div className="admin-mini-row" key={document.id}><strong>{document.name}</strong><span>{document.url ? <a href={document.url} target="_blank" rel="noopener noreferrer">Download</a> : "Unavailable"}</span></div>) : <p className="admin-message">No documents yet.</p>}</div><AdminDocumentUpload projectId={project.id} /></section></div></AdminShell>;
}
