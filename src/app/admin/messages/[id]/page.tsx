import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { MessageThread } from "@/frontend/components/message-thread";

export default async function AdminMessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: conversation } = await supabase.from("conversations").select("id, title, status, priority, last_message_at").eq("id", id).maybeSingle();
  if (!conversation) notFound();
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Communication</div><h1>{conversation.title}.</h1><p className="lead">Secure client conversation.</p></div><Link className="btn btn-ghost" href="/admin/messages">Back to inbox</Link></div><MessageThread conversation={conversation} currentUserId={user.id} admin /></AdminShell>;
}
