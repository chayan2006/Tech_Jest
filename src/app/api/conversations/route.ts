import { NextResponse } from "next/server";
import { createClient } from "@/backend/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const isAdmin = user.app_metadata?.role === "admin";
  const query = supabase.from("conversations").select("id, title, status, priority, client_id, request_id, project_id, last_message_at, updated_at").order("last_message_at", { ascending: false, nullsFirst: false });
  const { data, error } = isAdmin ? await query : await query.eq("client_id", user.id);
  if (error) return NextResponse.json({ error: "Could not load conversations." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { title?: unknown; requestId?: unknown; projectId?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 160) : "TechJest conversation";
  const { data, error } = await supabase.from("conversations").insert({
    title,
    request_id: typeof body?.requestId === "string" ? body.requestId : null,
    project_id: typeof body?.projectId === "string" ? body.projectId : null,
    client_id: user.id,
    created_by: user.id,
  }).select("id, title, status, priority").single();
  if (error) return NextResponse.json({ error: "Could not create conversation." }, { status: 500 });
  await supabase.from("conversation_participants").insert({ conversation_id: data.id, user_id: user.id, role: "client" });
  return NextResponse.json(data, { status: 201 });
}
