import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { countUnreadMessages } from "@/backend/supabase/unread";
import { BellIcon } from "@/frontend/components/icons";

export async function MessageNotification({ userId, admin = false }: { userId: string; admin?: boolean }) {
  const supabase = await createClient();
  let unread = await countUnreadMessages(supabase, userId, admin);
  if (admin) {
    const { count } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    unread += count ?? 0;
  }
  // The link is named by its visible text, so voice-control users can say what they see.
  return (
    <Link className="message-notification" href={admin ? "/admin/notifications" : "/messages"}>
      <BellIcon />
      {unread > 0 && <b aria-hidden="true">{unread > 99 ? "99+" : unread}</b>}
      <span className="message-notification-label">
        {unread ? (
          <>
            <span className="visually-hidden">Notifications: </span>
            {unread} new
          </>
        ) : (
          "Notifications"
        )}
      </span>
    </Link>
  );
}
