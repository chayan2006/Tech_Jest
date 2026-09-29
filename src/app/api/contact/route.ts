import { createClient } from "@/backend/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in before sending a request." }, { status: 401 });
  const body = await request.json() as { service?: string; message?: string; budget?: string };
  if (!body.service || !body.message || body.message.trim().length < 20) return NextResponse.json({ error: "Select a service and provide at least 20 characters." }, { status: 400 });
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("project_requests").insert({
    user_id: user.id,
    company_id: profile?.company_id ?? null,
    service: body.service.trim(),
    message: body.message.trim(),
    budget: body.budget?.trim() || null,
  });
  if (error) return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
