import { createClient } from "@/backend/supabase/server";
import { NextResponse } from "next/server";
import { getServices } from "@/backend/supabase/services";
import { findServiceArea, notSureService } from "@/frontend/data/service-areas";

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
  const services = await getServices({ fallbackOnMissingTable: false });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in before sending a request." }, { status: 401 });
  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const requestedSlugs = Array.isArray(body.serviceSlugs)
    ? [
        ...new Set(
          body.serviceSlugs
            .filter((slug): slug is string => typeof slug === "string")
            .map((slug) => slug.trim())
            .filter(Boolean),
        ),
      ]
    : [];
  const requestedService = typeof body.service === "string" ? body.service.trim() : "";
  const matchingArea = findServiceArea(requestedService);
  const notSure = requestedService.toLowerCase() === notSureService.toLowerCase();
  if (!services.length && (requestedSlugs.length > 0 || (requestedService && !matchingArea && !notSure))) {
    return NextResponse.json(
      { error: "The service catalog is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
  const selectedServices = requestedSlugs
    .map((slug) => services.find((item) => item.slug === slug))
    .filter((item): item is (typeof services)[number] => Boolean(item));
  if (requestedSlugs.length !== selectedServices.length)
    return NextResponse.json({ error: "One or more selected services are invalid." }, { status: 400 });
  const matchingService = services.find(
    (item) =>
      item.name.toLowerCase() === requestedService.toLowerCase() ||
      item.category.toLowerCase() === requestedService.toLowerCase(),
  );
  if (!selectedServices.length && requestedService && !notSure && !matchingArea && !matchingService) {
    return NextResponse.json({ error: "Please select an available service." }, { status: 400 });
  }
  const service = selectedServices.length
    ? selectedServices.map((item) => item.name).join(", ")
    : (matchingArea?.title ?? matchingService?.category ?? requestedService);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const budget = typeof body.budget === "string" ? body.budget.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const timeline = typeof body.timeline === "string" ? body.timeline.trim() : "";
  if (!service || message.length < 20 || message.length > 5000)
    return NextResponse.json(
      { error: "Select a service and provide a message between 20 and 5000 characters." },
      { status: 400 },
    );
  if (
    service.length > 1000 ||
    budget.length > 160 ||
    name.length > 100 ||
    email.length > 320 ||
    phone.length > 30 ||
    company.length > 160 ||
    timeline.length > 160
  )
    return NextResponse.json({ error: "Some request details are too long." }, { status: 400 });
  if (body.email !== undefined && !email.includes("@"))
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  // The contact form sends no contact details, so the profile fills them in for the admin team.
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name, phone, company")
    .eq("id", user.id)
    .maybeSingle();
  const { data: createdRequest, error } = await supabase
    .from("project_requests")
    .insert({
      user_id: user.id,
      company_id: profile?.company_id ?? null,
      service,
      message,
      budget: budget || null,
      name: name || profile?.full_name || null,
      email: email || user.email || null,
      phone: phone || profile?.phone || null,
      company: company || profile?.company || null,
      budget_range: budget || null,
      timeline: timeline || null,
      description: message,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  if (selectedServices.length) {
    const { error: servicesError } = await supabase.from("project_request_services").insert(
      selectedServices.map((item) => ({
        request_id: createdRequest.id,
        service_slug: item.slug,
        service_name_snapshot: item.name,
        price_snapshot: item.price,
      })),
    );
    if (servicesError)
      return NextResponse.json(
        { error: "We saved the request but could not save its selected services. Please contact TechJest." },
        { status: 500 },
      );
  }
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      request_id: createdRequest.id,
      client_id: user.id,
      created_by: user.id,
      title: service.length > 70 ? `${service.slice(0, 67)}...` : service,
    })
    .select("id")
    .single();
  if (conversationError || !conversation) {
    return NextResponse.json(
      { error: "We saved the request but could not open its conversation. Please contact TechJest." },
      { status: 500 },
    );
  }
  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conversation.id, user_id: user.id, role: "client" });
  // The messages_touch_conversation trigger marks the conversation as waiting for the team.
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    sender_type: "client",
    content: message,
    message_type: "text",
  });
  if (participantError || messageError) {
    console.error("Could not finish request conversation setup", { participantError, messageError });
    return NextResponse.json(
      { error: "We saved the request but could not finish its conversation setup. Please contact TechJest." },
      { status: 500 },
    );
  }
  const { error: notificationError } = await supabase.from("admin_notifications").insert({
    type: "service_request",
    title: "New service request",
    body: `${(name || profile?.full_name || email || user.email || "A client").slice(0, 100)} requested ${service}.`.slice(
      0,
      500,
    ),
    request_id: createdRequest.id,
    conversation_id: conversation?.id ?? null,
  });
  if (notificationError) {
    console.error("Could not create request notification", notificationError);
    return NextResponse.json(
      { error: "We saved the request but could not notify the admin team. Please contact TechJest." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
