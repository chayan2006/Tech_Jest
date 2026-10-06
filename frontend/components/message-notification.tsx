import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { countUnreadMessages } from "@/backend/supabase/unread";

export async function MessageNotification({ userId, admin = false }: { userId: string; admin?: boolean }) {
  const supabase = await createClient();
  let unread = await countUnreadMessages(supabase, userId, admin);
  if (admin) {
    const { count } = await supabase.from("admin_notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread += count ?? 0;
  }
  return <Link className="message-notification" href={admin ? "/admin/notifications" : "/messages"} aria-label={`${unread} unread notifications`}><span aria-hidden="true">🔔</span>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}<span className="message-notification-label">{unread ? `${unread} new` : "Notifications"}</span></Link>;
}
