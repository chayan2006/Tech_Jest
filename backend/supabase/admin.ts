import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import type { User } from "@supabase/supabase-js";

export function isAdmin(user: User | null): user is User {
  // app_metadata is managed by Supabase/server tooling and cannot be changed by
  // a user through the client (unlike user_metadata).
  return user?.app_metadata?.role === "admin";
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdmin(user)) redirect("/dashboard");
  return { supabase, user };
}
