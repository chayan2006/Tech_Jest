import { safeNextPath } from "./safe-next-path";

// Where to go after signing in: the requested same-site path, except that admins
// land in the console instead of the client dashboard they have no use for.
export function getLoginDestination(user: unknown, next: string | null | undefined) {
  const requestedPath = safeNextPath(next);
  const metadata = typeof user === "object" && user !== null && "app_metadata" in user ? user.app_metadata : null;
  const role = typeof metadata === "object" && metadata !== null && "role" in metadata ? metadata.role : null;
  return role === "admin" && requestedPath === "/dashboard" ? "/admin" : requestedPath;
}
