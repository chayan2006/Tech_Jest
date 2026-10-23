// Asks the server to rebuild the cached public pages after an admin edit. If it fails, the pages
// still refresh on their own within 5 minutes, so the admin is told rather than blocked.
export async function refreshPublicPages(): Promise<boolean> {
  try {
    return (await fetch("/api/admin/revalidate", { method: "POST" })).ok;
  } catch {
    return false;
  }
}
