import { NextResponse } from "next/server";
import { createClient } from "@/backend/supabase/server";
import { safeNextPath } from "@/lib/safe-next-path";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=oauth_callback", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=oauth_callback&next=${encodeURIComponent(nextPath)}`, url.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const metadata = user.user_metadata ?? {};
    const fullName = String(
      metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "TechJest client",
    ).trim();
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName.length >= 2 ? fullName.slice(0, 100) : "TechJest client",
        company: typeof metadata.company === "string" ? metadata.company.trim().slice(0, 120) || null : null,
        phone: typeof metadata.phone === "string" ? metadata.phone.trim().slice(0, 30) || null : null,
        purpose:
          typeof metadata.purpose === "string" && metadata.purpose.trim().length >= 3
            ? metadata.purpose.trim().slice(0, 500)
            : "Project consultation",
      },
      { onConflict: "id" },
    );
    if (profileError) {
      console.error("Auth profile provisioning failed", {
        userId: user.id,
        code: profileError.code,
        message: profileError.message,
      });
      return NextResponse.redirect(
        new URL(`/auth?error=profile_setup&next=${encodeURIComponent(nextPath)}`, url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
