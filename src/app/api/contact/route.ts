import { createClient } from "@/backend/supabase/server";
import { NextResponse } from "next/server";
import { services } from "@/frontend/data/services";

type ContactBody = {
  service?: unknown;
  serviceSlugs?: unknown;
  message?: unknown;
  budget?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  timeline?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in before sending a request." }, { status: 401 });
  let body: ContactBody;
  try {
    body = await request.json() as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const requestedSlugs = Array.isArray(body.serviceSlugs)
    ? [...new Set(body.serviceSlugs.filter((slug): slug is string => typeof slug === "string").map(slug => slug.trim()).filter(Boolean))]
    : [];
  const selectedServices = requestedSlugs.map(slug => services.find(item => item.slug === slug)).filter((item): item is (typeof services)[number] => Boolean(item));
  if (requestedSlugs.length !== selectedServices.length) return NextResponse.json({ error: "One or more selected services are invalid." }, { status: 400 });
  const service = selectedServices.length
    ? selectedServices.map(item => item.name).join(", ")
    : typeof body.service === "string" ? body.service.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const budget = typeof body.budget === "string" ? body.budget.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const timeline = typeof body.timeline === "string" ? body.timeline.trim() : "";
  if (!service || message.length < 20 || message.length > 5000) return NextResponse.json({ error: "Select a service and provide a message between 20 and 5000 characters." }, { status: 400 });
  if (service.length > 1000 || budget.length > 160 || name.length > 100 || email.length > 320 || phone.length > 30 || company.length > 160 || timeline.length > 160) return NextResponse.json({ error: "Some request details are too long." }, { status: 400 });
  if (body.email !== undefined && !email.includes("@")) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
  const { data: createdRequest, error } = await supabase.from("project_requests").insert({
    user_id: user.id,
    company_id: profile?.company_id ?? null,
    service,
    message,
    budget: budget || null,
    name: name || null,
    email: email || user.email || null,
    phone: phone || null,
    company: company || null,
    budget_range: budget || null,
    timeline: timeline || null,
    description: message,
  }).select("id").single();
  if (error) return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  if (selectedServices.length) {
    const { error: servicesError } = await supabase.from("project_request_services").insert(selectedServices.map(item => ({
      request_id: createdRequest.id,
      service_slug: item.slug,
      service_name_snapshot: item.name,
      price_snapshot: item.price,
    })));
    if (servicesError) return NextResponse.json({ error: "We saved the request but could not save its selected services. Please contact TechJest." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
