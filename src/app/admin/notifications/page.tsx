import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminNotificationList } from "@/frontend/components/admin-notification-list";

export default async function AdminNotificationsPage() {
  const { supabase, user } = await requireAdmin();
  const [{ data: requests }, { data: existing }] = await Promise.all([
    supabase.from("project_requests").select("id, service, name, email, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("admin_notifications").select("request_id").eq("type", "service_request").not("request_id", "is", null),
  ]);
  const existingRequestIds = new Set((existing ?? []).map(item => item.request_id));
  const missing = (requests ?? []).filter(request => !existingRequestIds.has(request.id));
  if (missing.length) {
    await supabase.from("admin_notifications").insert(missing.map(request => ({
      type: "service_request",
      title: "New service request",
      body: `${request.name ?? request.email ?? "A client"} requested ${request.service}.`,
      request_id: request.id,
      read_at: null,
    })));
  }
  const { data } = await supabase.from("admin_notifications").select("id, title, body, type, request_id, read_at, created_at").order("created_at", { ascending: false }).limit(100);
  return <AdminShell email={user.email}><div className="admin-title"><div><div className="eyebrow">Admin inbox</div><h1>Notifications.</h1><p className="lead">See new service requests and mark them as read when you have reviewed them.</p></div></div><div className="admin-panel"><AdminNotificationList initialNotifications={data ?? []} /></div></AdminShell>;
}
