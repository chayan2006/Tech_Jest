import type { createClient } from "@/backend/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type ProfileSummary = { id: string; full_name: string; company: string | null; phone: string | null };

// Profiles for a set of people, keyed by user id. Admins can read every profile; clients only their own.
export async function profilesById(
  supabase: ServerClient,
  userIds: (string | null | undefined)[],
): Promise<Map<string, ProfileSummary>> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return new Map();
  const { data } = await supabase.from("profiles").select("id, full_name, company, phone").in("id", ids);
  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}
