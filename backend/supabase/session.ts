import type { createClient } from "@/backend/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type SessionUser = {
  id: string;
  email?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
};

// The signed-in person, read from their verified access token. The project signs tokens with an
// asymmetric (ES256) key, so getClaims() checks the signature locally instead of calling Supabase Auth
// on every request the way getUser() does. Role changes apply when the token next refreshes (within
// an hour), the same moment row-level security sees them.
export async function getSessionUser(supabase: ServerClient): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" && claims.email ? claims.email : undefined,
    app_metadata: claims.app_metadata ?? {},
    user_metadata: claims.user_metadata ?? {},
  };
}
