import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { unreadByConversation } from "@/backend/supabase/unread";
import { AdminConversationInbox } from "@/frontend/components/admin-conversation-inbox";
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
    unreadByConversation(supabase),
  ]);
  const profiles = await profilesById(supabase, conversations?.map((item) => item.client_id) ?? []);
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Communication</div>
          <h1>Messages.</h1>
          <p className="lead">
            Reply to clients, set each conversation’s status, and delete old conversations, one at a time or several
            together, to keep the inbox clean.
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
          <AdminConversationInbox
            conversations={conversations.map((item) => {
              const client = item.client_id ? profiles.get(item.client_id) : undefined;
              return {
                id: item.id,
                title: item.title,
                client: `${client?.full_name ?? "Client"}${client?.company ? ` · ${client.company}` : ""}`,
                status: item.status,
                statusLabel: statusLabel("conversation", item.status),
                lastMessage: item.last_message_at ? formatDateTime(item.last_message_at) : "No messages",
                newCount: unread.get(item.id) ?? 0,
              };
            })}
          />
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
