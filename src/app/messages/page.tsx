import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { MessageThread } from "@/frontend/components/message-thread";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/messages");
  const { data: conversations } = await supabase.from("conversations").select("id, title, status, priority, last_message_at").eq("client_id", user.id).neq("status", "archived").order("last_message_at", { ascending: false, nullsFirst: false });
  const { conversation: selectedId } = await searchParams;
  const first = conversations?.find(item => item.id === selectedId) ?? conversations?.[0];
  return <section className="section"><div className="container dashboard"><div className="dashboard-head"><div><div className="eyebrow">Client portal</div><h1>Messages.</h1><p className="lead">Keep every project conversation with the TechJest team in one secure place.</p></div><Link className="btn btn-ghost" href="/dashboard">Back to dashboard</Link></div><div className="messages-layout"><aside className="conversation-list"><div className="conversation-list-head"><h2>Conversations</h2><span>{conversations?.length ?? 0}</span></div>{conversations?.length ? conversations.map(item => <Link className={`conversation-list-item ${item.id === first?.id ? "active" : ""}`} href={`/messages?conversation=${item.id}`} key={item.id}><strong>{item.title}</strong><small>{item.status.replaceAll("_", " ")} · {item.last_message_at ? new Date(item.last_message_at).toLocaleDateString("en-IN") : "New"}</small></Link>) : <p className="admin-message">Your conversations will appear here after you submit a project request.</p>}</aside>{first ? <MessageThread conversation={first} currentUserId={user.id} /> : <div className="empty-state"><h2>No conversations yet.</h2><p>Start a project and the TechJest team will reply here.</p><Link className="btn btn-primary" href="/contact">Start a project</Link></div>}</div></div></section>;
}
