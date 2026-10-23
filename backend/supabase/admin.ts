import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { getSessionUser, type SessionUser } from "@/backend/supabase/session";

function isAdmin(user: SessionUser | null): user is SessionUser {
  // app_metadata is managed by Supabase/server tooling and cannot be changed by
  // a user through the client (unlike user_metadata).
  return user?.app_metadata?.role === "admin";
}

async function getClientAndUser() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  return { supabase, user };
}

// For admin pages: sends visitors to the right login screen.
export async function requireAdmin() {
  const { supabase, user } = await getClientAndUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user)) redirect("/dashboard");
  return { supabase, user };
}

// For admin API routes: a JSON 401/403 instead of an HTML redirect.
export async function getAdminForApi() {
  const { supabase, user } = await getClientAndUser();
  if (!user) return { error: { message: "Sign in required.", status: 401 } } as const;
  if (!isAdmin(user)) return { error: { message: "Admin access required.", status: 403 } } as const;
  return { supabase, user } as const;
}
