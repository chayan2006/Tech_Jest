import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminForApi } from "@/backend/supabase/admin";

// Public pages are cached for up to 5 minutes. After an admin saves website settings or services,
// this marks every page stale so the next visitor gets the new content straight away.
export async function POST() {
  const admin = await getAdminForApi();
  if (admin.error) return NextResponse.json({ error: admin.error.message }, { status: admin.error.status });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
