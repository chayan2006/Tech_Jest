import { NextResponse } from "next/server";
import { createClient } from "@/backend/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const isAdmin = user.app_metadata?.role === "admin";
  const query = supabase
    .from("conversations")
    .select("id, title, status, priority, client_id, request_id, project_id, last_message_at, updated_at")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  const { data, error } = isAdmin ? await query : await query.eq("client_id", user.id);
  if (error) return NextResponse.json({ error: "Could not load conversations." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    requestId?: unknown;
    projectId?: unknown;
  } | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 160) : "TechJest conversation";
  const requestId = typeof body?.requestId === "string" ? body.requestId : null;
  const projectId = typeof body?.projectId === "string" ? body.projectId : null;
  if (requestId) {
    const { data: requestRow, error: requestError } = await supabase
      .from("project_requests")
      .select("id")
      .eq("id", requestId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (requestError) return NextResponse.json({ error: "Could not verify the project request." }, { status: 500 });
    if (!requestRow)
      return NextResponse.json({ error: "You can only start a conversation for your own request." }, { status: 403 });
  }
  if (projectId) {
    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select("id, request_id")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) return NextResponse.json({ error: "Could not verify the project." }, { status: 500 });
    if (!projectRow) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (!projectRow.request_id)
      return NextResponse.json({ error: "This project is not linked to a client request." }, { status: 403 });
    const { data: requestRow } = await supabase
      .from("project_requests")
      .select("id")
      .eq("id", projectRow.request_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!requestRow)
      return NextResponse.json({ error: "You can only start a conversation for your own project." }, { status: 403 });
  }
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      title,
      request_id: requestId,
      project_id: projectId,
      client_id: user.id,
      created_by: user.id,
    })
    .select("id, title, status, priority")
    .single();
  if (error) return NextResponse.json({ error: "Could not create conversation." }, { status: 500 });
  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: data.id, user_id: user.id, role: "client" });
  if (participantError) {
    console.error("Could not add conversation participant", participantError);
    return NextResponse.json({ error: "Conversation created but could not add you to it." }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
