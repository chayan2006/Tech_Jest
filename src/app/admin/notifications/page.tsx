import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { unreadByConversation } from "@/backend/supabase/unread";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminNotificationList } from "@/frontend/components/admin-notification-list";
import { formatDateTime } from "@/lib/format";

export default async function AdminNotificationsPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: requests }, { data: existing }, unread] = await Promise.all([
    supabase
      .from("project_requests")
      .select("id, service, name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("admin_notifications")
      .select("request_id")
      .eq("type", "service_request")
      .not("request_id", "is", null),
    unreadByConversation(supabase, user.id, true),
  ]);
  // Safety net: a request whose notification failed to save still shows up here.
  const existingRequestIds = new Set((existing ?? []).map((item) => item.request_id));
  const missing = (requests ?? []).filter((request) => !existingRequestIds.has(request.id));
  if (missing.length) {
    await supabase.from("admin_notifications").insert(
      missing.map((request) => ({
        type: "service_request",
        title: "New service request",
        body: `${request.name ?? request.email ?? "A client"} requested ${request.service}.`.slice(0, 500),
        request_id: request.id,
        read_at: null,
      })),
    );
  }
  const unreadIds = [...unread.keys()];
  const [{ data }, { data: unreadConversations }] = await Promise.all([
    supabase
      .from("admin_notifications")
      .select("id, title, body, type, request_id, conversation_id, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    unreadIds.length
      ? supabase
          .from("conversations")
          .select("id, title, client_id, last_message_at")
          .in("id", unreadIds)
          .order("last_message_at", { ascending: false, nullsFirst: false })
      : Promise.resolve({ data: [] }),
  ]);
  const profiles = await profilesById(supabase, unreadConversations?.map((item) => item.client_id) ?? []);
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Admin inbox</div>
          <h1>Notifications.</h1>
          <p className="lead">New service requests and unread client messages, in one place.</p>
        </div>
      </div>
      {unreadConversations?.length ? (
        <div className="admin-panel admin-unread-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Unread messages</h2>
              <p>Client replies you have not opened yet.</p>
            </div>
            <Link href="/admin/messages">Open inbox</Link>
          </div>
          <div className="admin-mini-list">
            {unreadConversations.map((item) => (
              <Link className="admin-mini-row" href={`/admin/messages/${item.id}`} key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {(item.client_id && profiles.get(item.client_id)?.full_name) || "Client"}
                    {item.last_message_at ? ` · ${formatDateTime(item.last_message_at)}` : ""}
                  </small>
                </span>
                <span className="notification-unread-dot">{unread.get(item.id)} new</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="admin-panel">
        <AdminNotificationList initialNotifications={data ?? []} />
      </div>
    </AdminShell>
  );
}
