import { NextResponse } from "next/server";
import { requireAdmin } from "@/backend/supabase/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  if (id === user.id) return NextResponse.json({ error: "You cannot delete your own admin profile." }, { status: 400 });
  const { error: requestsError } = await supabase.from("project_requests").delete().eq("user_id", id);
  if (requestsError) return NextResponse.json({ error: "Could not remove the user's requests." }, { status: 500 });
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not remove the user's profile." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
