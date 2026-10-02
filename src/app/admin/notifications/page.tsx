import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminNotificationList } from "@/frontend/components/admin-notification-list";

export default async function AdminNotificationsPage() {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("admin_notifications").select("id, title, body, type, request_id, read_at, created_at").order("created_at", { ascending: false }).limit(100);
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Admin inbox</div><h1>Notifications.</h1><p className="lead">See new service requests and mark them as read when you have reviewed them.</p></div></div><div className="admin-panel"><AdminNotificationList initialNotifications={data ?? []} /></div></AdminShell>;
}
