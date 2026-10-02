import { NextResponse } from "next/server";
import { getServices } from "@/backend/supabase/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(await getServices(), {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
