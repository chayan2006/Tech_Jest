import type { createClient } from "@/backend/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Messages from the other side (client ↔ admin) that arrived after this user last opened each
// conversation, counted per conversation id.
export async function unreadByConversation(
  supabase: ServerClient,
  userId: string,
  admin: boolean,
): Promise<Map<string, number>> {
  const unread = new Map<string, number>();
  const conversationsQuery = supabase.from("conversations").select("id").neq("status", "archived");
  const { data: conversations } = admin ? await conversationsQuery : await conversationsQuery.eq("client_id", userId);
  const ids = conversations?.map((item) => item.id) ?? [];
  if (!ids.length) return unread;
  const [{ data: messages }, { data: reads }] = await Promise.all([
    supabase
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", ids)
      .eq("sender_type", admin ? "client" : "admin")
      .is("deleted_at", null),
    supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId)
      .in("conversation_id", ids),
  ]);
  const lastRead = new Map(
    (reads ?? []).map((item) => [item.conversation_id, item.last_read_at ? new Date(item.last_read_at).getTime() : 0]),
  );
  for (const message of messages ?? []) {
    if (new Date(message.created_at).getTime() > (lastRead.get(message.conversation_id) ?? 0)) {
      unread.set(message.conversation_id, (unread.get(message.conversation_id) ?? 0) + 1);
    }
  }
  return unread;
}

export async function countUnreadMessages(supabase: ServerClient, userId: string, admin: boolean): Promise<number> {
  let total = 0;
  for (const count of (await unreadByConversation(supabase, userId, admin)).values()) total += count;
  return total;
}
