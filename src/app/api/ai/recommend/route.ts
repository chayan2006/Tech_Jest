import { NextResponse } from "next/server";
import { createClient } from "@/backend/supabase/server";
import { getServices } from "@/backend/supabase/services";

export async function POST(request: Request) {
  const supabase = await createClient();
  const services = await getServices({ fallbackOnMissingTable: false });
  if (!services.length) return NextResponse.json({ error: "The service catalog is temporarily unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const prompt = typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
  if (prompt.length < 10) return NextResponse.json({ error: "Describe your project in at least 10 characters." }, { status: 400 });
  const words = prompt.toLowerCase().split(/\W+/).filter(Boolean);
  const ranked = services.map(service => ({ service, score: words.reduce((score, word) => score + (service.name.toLowerCase().includes(word) || service.description.toLowerCase().includes(word) || service.category.toLowerCase().includes(word) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score || a.service.popular ? -1 : 1).slice(0, 5);
  return NextResponse.json({ recommendations: ranked.map(({ service }) => ({ slug: service.slug, name: service.name, category: service.category, reason: `Relevant to your ${service.category.toLowerCase()} requirement.` })) });
}
