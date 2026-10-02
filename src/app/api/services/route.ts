import { NextResponse } from "next/server";
import { getServices } from "@/backend/supabase/services";

export async function GET() {
  return NextResponse.json(await getServices());
}
