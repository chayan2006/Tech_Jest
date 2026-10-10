import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminStatusSelect } from "@/frontend/components/admin-status-select";
import { MessageThread } from "@/frontend/components/message-thread";

export default async function AdminMessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, status, priority, client_id, request_id, project_id, last_message_at")
    .eq("id", id)
    .maybeSingle();
  if (!conversation) notFound();
  const client = conversation.client_id
    ? (await profilesById(supabase, [conversation.client_id])).get(conversation.client_id)
    : undefined;
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Communication</div>
          <h1>{conversation.title}.</h1>
          <p className="lead">
            {client
              ? `With ${client.full_name}${client.company ? `, ${client.company}` : ""}.`
              : "Secure client conversation."}
          </p>
        </div>
        <div className="hero-actions">
          {conversation.request_id && (
            <Link className="btn btn-ghost" href={`/admin/requests/${conversation.request_id}`}>
              View request
            </Link>
          )}
          {conversation.project_id && (
            <Link className="btn btn-ghost" href={`/admin/projects/${conversation.project_id}`}>
              View project
            </Link>
          )}
          <Link className="btn btn-ghost" href="/admin/messages">
            Back to inbox
          </Link>
        </div>
      </div>
      <div className="conversation-controls">
        <AdminStatusSelect
          kind="conversation"
          id={conversation.id}
          value={conversation.status}
          label="Conversation status"
        />
      </div>
      <MessageThread conversation={conversation} currentUserId={user.id} admin />
    </AdminShell>
  );
}
