import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

export default async function AdminMessagesPage() {
  const { supabase, user } = await requireAdmin();
  const { data: conversations } = await supabase.from("conversations").select("id, title, status, priority, client_id, last_message_at").neq("status", "archived").order("last_message_at", { ascending: false, nullsFirst: false });
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Communication</div><h1>Messages.</h1><p className="lead">Reply to clients, manage conversation status, and keep project communication in one place.</p></div></div><div className="admin-panel"><div className="admin-panel-head"><div><h2>Conversation inbox</h2><p>{conversations?.length ?? 0} active conversations</p></div></div>{conversations?.length ? <div className="conversation-inbox">{conversations.map(item => <Link className="conversation-inbox-row" href={`/admin/messages/${item.id}`} key={item.id}><div><strong>{item.title}</strong><small>Client ID: {item.client_id}</small></div><div><span className={`admin-status status-${item.status}`}>{item.status.replaceAll("_", " ")}</span><small>{item.last_message_at ? new Date(item.last_message_at).toLocaleString("en-IN") : "No messages"}</small></div></Link>)}</div> : <div className="empty-state"><h2>No conversations yet.</h2><p>New client conversations will appear here.</p></div>}</div></AdminShell>;
}
