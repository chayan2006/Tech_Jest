import { createClient } from "@/backend/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in before sending a request." }, { status: 401 });
  let body: { service?: unknown; message?: unknown; budget?: unknown };
  try {
    body = await request.json() as { service?: unknown; message?: unknown; budget?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const budget = typeof body.budget === "string" ? body.budget.trim() : "";
  if (!service || message.length < 20 || message.length > 5000) return NextResponse.json({ error: "Select a service and provide a message between 20 and 5000 characters." }, { status: 400 });
  if (service.length > 1000 || budget.length > 160) return NextResponse.json({ error: "Some request details are too long." }, { status: 400 });
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("project_requests").insert({
    user_id: user.id,
    company_id: profile?.company_id ?? null,
    service,
    message,
    budget: budget || null,
  });
  if (error) return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
