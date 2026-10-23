import type { createClient } from "@/backend/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Messages from the other side (client ↔ admin) that arrived after the signed-in user last opened each
// conversation, counted per conversation id. The database adds them up (unread_message_counts), and
// works out from the session whether the reader is a client or an admin.
export async function unreadByConversation(supabase: ServerClient): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("unread_message_counts");
  if (error) {
    console.error("Could not count unread messages", { code: error.code, message: error.message });
    return new Map();
  }
  return new Map(
    ((data ?? []) as { conversation_id: string; unread: number | string }[]).map((row) => [
      row.conversation_id,
      Number(row.unread),
    ]),
  );
}

export async function countUnreadMessages(supabase: ServerClient): Promise<number> {
  let total = 0;
  for (const count of (await unreadByConversation(supabase)).values()) total += count;
  return total;
}
