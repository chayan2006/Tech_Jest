import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import type { User } from "@supabase/supabase-js";

function isAdmin(user: User | null): user is User {
  // app_metadata is managed by Supabase/server tooling and cannot be changed by
  // a user through the client (unlike user_metadata).
  return user?.app_metadata?.role === "admin";
}

async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// For admin pages: sends visitors to the right login screen.
export async function requireAdmin() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user)) redirect("/dashboard");
  return { supabase, user };
}

// For admin API routes: a JSON 401/403 instead of an HTML redirect.
export async function getAdminForApi() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: { message: "Sign in required.", status: 401 } } as const;
  if (!isAdmin(user)) return { error: { message: "Admin access required.", status: 403 } } as const;
  return { supabase, user } as const;
}
