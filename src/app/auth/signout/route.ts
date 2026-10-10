import { createClient } from "@/backend/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 makes the browser follow with a GET; the default 307 would re-send the POST to the homepage.
  return NextResponse.redirect(new URL("/", request.url), 303);
}
