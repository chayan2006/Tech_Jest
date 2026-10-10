import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { unreadByConversation } from "@/backend/supabase/unread";
import { AdminShell } from "@/frontend/components/admin-shell";
import { statusLabel } from "@/frontend/data/workflow";
import { formatDateTime } from "@/lib/format";

export default async function AdminMessagesPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: conversations }, unread] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, status, client_id, last_message_at")
      .neq("status", "archived")
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    unreadByConversation(supabase, user.id, true),
  ]);
  const profiles = await profilesById(supabase, conversations?.map((item) => item.client_id) ?? []);
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Communication</div>
          <h1>Messages.</h1>
          <p className="lead">
            Reply to clients, set each conversation’s status, and keep project communication in one place.
          </p>
        </div>
      </div>
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Conversation inbox</h2>
            <p>{conversations?.length ?? 0} active conversations · archived conversations are hidden</p>
          </div>
        </div>
        {conversations?.length ? (
          <div className="conversation-inbox">
            {conversations.map((item) => {
              const client = item.client_id ? profiles.get(item.client_id) : undefined;
              const newCount = unread.get(item.id) ?? 0;
              return (
                <Link className="conversation-inbox-row" href={`/admin/messages/${item.id}`} key={item.id}>
                  <div>
                    <strong>
                      {item.title}
                      {newCount > 0 && <span className="notification-unread-dot">{newCount} new</span>}
                    </strong>
                    <small>
                      {client?.full_name ?? "Client"}
                      {client?.company ? ` · ${client.company}` : ""}
                    </small>
                  </div>
                  <div>
                    <span className={`admin-status status-${item.status}`}>
                      {statusLabel("conversation", item.status)}
                    </span>
                    <small>{item.last_message_at ? formatDateTime(item.last_message_at) : "No messages"}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No conversations yet.</h2>
            <p>New client conversations will appear here.</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
