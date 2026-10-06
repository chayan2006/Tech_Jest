import type { createClient } from "@/backend/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Messages from the other side (client ↔ admin) that arrived after this user last opened the conversation.
export async function countUnreadMessages(supabase: ServerClient, userId: string, admin: boolean): Promise<number> {
  const conversationsQuery = supabase.from("conversations").select("id").neq("status", "archived");
  const { data: conversations } = admin ? await conversationsQuery : await conversationsQuery.eq("client_id", userId);
  const ids = conversations?.map(item => item.id) ?? [];
  if (!ids.length) return 0;
  const [{ data: messages }, { data: reads }] = await Promise.all([
    supabase.from("messages").select("conversation_id, sender_type, created_at").in("conversation_id", ids).neq("sender_id", userId).is("deleted_at", null),
    supabase.from("conversation_participants").select("conversation_id, last_read_at").eq("user_id", userId).in("conversation_id", ids),
  ]);
  const readMap = new Map((reads ?? []).map(item => [item.conversation_id, item.last_read_at ? new Date(item.last_read_at).getTime() : 0]));
  const otherSide = admin ? "client" : "admin";
  return (messages ?? []).filter(message => message.sender_type === otherSide && new Date(message.created_at).getTime() > (readMap.get(message.conversation_id) ?? 0)).length;
}
