import Link from "next/link";
import { createClient } from "@/backend/supabase/server";

export async function MessageNotification({ userId, admin = false }: { userId: string; admin?: boolean }) {
  const supabase = await createClient();
  const conversationsQuery = supabase.from("conversations").select("id").neq("status", "archived");
  const { data: conversations } = admin
    ? await conversationsQuery
    : await conversationsQuery.eq("client_id", userId);
  const ids = conversations?.map(item => item.id) ?? [];
  let unread = 0;
  if (ids.length) {
    const [{ data: messages }, { data: reads }] = await Promise.all([
      supabase.from("messages").select("conversation_id, sender_type, created_at").in("conversation_id", ids).neq("sender_id", userId).is("deleted_at", null),
      supabase.from("conversation_participants").select("conversation_id, last_read_at").eq("user_id", userId).in("conversation_id", ids),
    ]);
    const readMap = new Map((reads ?? []).map(item => [item.conversation_id, item.last_read_at ? new Date(item.last_read_at).getTime() : 0]));
    unread = (messages ?? []).filter(message => {
      if (!admin && message.sender_type !== "admin") return false;
      if (admin && message.sender_type !== "client") return false;
      return new Date(message.created_at).getTime() > (readMap.get(message.conversation_id) ?? 0);
    }).length;
  }
  return <Link className="message-notification" href={admin ? "/admin/messages" : "/messages"} aria-label={`${unread} unread messages`}><span aria-hidden="true">🔔</span>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}<span className="message-notification-label">{unread ? `${unread} new` : "Messages"}</span></Link>;
}
