import { NextResponse } from "next/server";
import { createClient } from "@/backend/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, sender_type, content, message_type, created_at, edited_at")
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  await supabase.from("conversation_participants").upsert({
    conversation_id: id,
    user_id: user.id,
    role: user.app_metadata?.role === "admin" ? "admin" : "client",
    last_read_at: new Date().toISOString(),
  });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { content?: unknown; internal?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const isAdmin = user.app_metadata?.role === "admin";
  if (!content || content.length > 5000)
    return NextResponse.json({ error: "Message must be between 1 and 5000 characters." }, { status: 400 });
  if (body?.internal && !isAdmin)
    return NextResponse.json({ error: "Only admins can create internal notes." }, { status: 403 });
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      sender_type: body?.internal ? "internal" : isAdmin ? "admin" : "client",
      message_type: body?.internal ? "internal_note" : "text",
      content,
    })
    .select("id, conversation_id, sender_id, sender_type, content, message_type, created_at")
    .single();
  if (error) return NextResponse.json({ error: "Could not send message." }, { status: 500 });
  // The messages_touch_conversation trigger updates the conversation's status and ordering,
  // and leaves both alone for internal notes.
  return NextResponse.json(data, { status: 201 });
}
