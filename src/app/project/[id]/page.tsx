import { notFound, redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { withDownloadLinks } from "@/backend/supabase/documents";
import { MessageThread } from "@/frontend/components/message-thread";
import { ProjectConversationStart } from "@/frontend/components/project-conversation-start";
import Link from "next/link";

export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/project/${encodeURIComponent(id)}`);
  const { data: project } = await supabase.from("projects").select("id, request_id, name, status, start_date, target_date").eq("id", id).maybeSingle();
  if (!project) notFound();
  // Drafts are internal to the TechJest team.
  const [{ data: tasks }, { data: documentRows }, { data: invoices }, { data: proposals }, { data: conversation }] = await Promise.all([
    supabase.from("project_tasks").select("id, title, status, due_date").eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("project_documents").select("id, name, storage_path, created_at").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("id, number, amount, currency, status, due_date").eq("project_id", id).neq("status", "draft").order("created_at", { ascending: false }),
    project.request_id ? supabase.from("proposals").select("id, title, summary, amount, currency, status, valid_until").eq("request_id", project.request_id).neq("status", "draft").order("created_at", { ascending: false }).limit(1) : Promise.resolve({ data: [] }),
    supabase.from("conversations").select("id, title, status, priority, last_message_at").eq("client_id", user.id).or(project.request_id ? `project_id.eq.${project.id},request_id.eq.${project.request_id}` : `project_id.eq.${project.id}`).order("last_message_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ]);
  const documents = await withDownloadLinks(supabase, documentRows ?? []);
  return <section className="section"><div className="container dashboard"><div className="eyebrow">Client project</div><h1>{project.name}.</h1><p className="lead">{project.status.replace("_", " ")}{project.target_date ? ` · target ${project.target_date}` : ""}</p><p><Link className="btn btn-ghost" href="/messages">Open full message center</Link></p><div className="portal-grid"><section className="admin-panel"><h2>Latest proposal</h2>{proposals?.[0] ? <><h3>{proposals[0].title}</h3><p>{proposals[0].summary}</p><strong>{proposals[0].amount ? `${proposals[0].currency} ${Number(proposals[0].amount).toLocaleString("en-IN")}` : "Amount to be confirmed"} · {proposals[0].status}</strong></> : <p className="admin-message">No proposal published yet.</p>}</section><section className="admin-panel"><h2>Tasks</h2>{tasks?.length ? tasks.map(task => <div className="admin-mini-row" key={task.id}><strong>{task.title}</strong><span>{task.status.replace("_", " ")}{task.due_date ? ` · ${task.due_date}` : ""}</span></div>) : <p className="admin-message">No tasks published yet.</p>}</section><section className="admin-panel"><h2>Documents</h2>{documents.length ? documents.map(document => <div className="admin-mini-row" key={document.id}><strong>{document.name}</strong><span>{document.url ? <a href={document.url} target="_blank" rel="noopener noreferrer">Download</a> : "Private file"}</span></div>) : <p className="admin-message">No documents published yet.</p>}</section><section className="admin-panel"><h2>Invoices</h2>{invoices?.length ? invoices.map(invoice => <div className="admin-mini-row" key={invoice.id}><strong>{invoice.number}</strong><span>{invoice.currency} {Number(invoice.amount).toLocaleString("en-IN")} · {invoice.status}</span></div>) : <p className="admin-message">No invoices yet.</p>}</section><section className="admin-panel"><h2>Messages</h2>{conversation ? <MessageThread conversation={conversation} currentUserId={user.id} /> : <ProjectConversationStart projectId={project.id} title={project.name} />}</section></div></div></section>;
}
