import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminUserActions } from "@/frontend/components/admin-user-actions";
import { formatDate } from "@/lib/format";

export default async function AdminUsersPage() {
  const { supabase, user } = await requireAdmin();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, company, phone, purpose, created_at")
    .order("created_at", { ascending: false });
  const ids = profiles?.map((profile) => profile.id) ?? [];
  const { data: requests } = ids.length
    ? await supabase
        .from("project_requests")
        .select("user_id, email")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] };
  // Profiles hold no email address, so the most recent request supplies it.
  const requestCounts = new Map<string, number>();
  const emails = new Map<string, string>();
  (requests ?? []).forEach((request) => {
    requestCounts.set(request.user_id, (requestCounts.get(request.user_id) ?? 0) + 1);
    if (request.email && !emails.has(request.user_id)) emails.set(request.user_id, request.email);
  });
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">People directory</div>
          <h1>Everyone using TechJest.</h1>
          <p className="lead">Customer profiles, contact details, and their request history.</p>
        </div>
        <span className="admin-count">{profiles?.length ?? 0} people</span>
      </div>
      {error ? (
        <div className="empty-state">
          <h2>People unavailable.</h2>
          <p>Run the latest Supabase schema and check the admin RLS policy.</p>
        </div>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Requests</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((profile) => (
                <tr key={profile.id}>
                  <td>
                    <strong>
                      {profile.full_name}
                      {profile.id === user.id ? " (you)" : ""}
                    </strong>
                    <small>{profile.purpose}</small>
                  </td>
                  <td>{profile.company ?? "Independent"}</td>
                  <td>
                    {emails.get(profile.id) ?? (profile.id === user.id ? user.email : null) ?? "—"}
                    {profile.phone && <small>{profile.phone}</small>}
                  </td>
                  <td>{requestCounts.get(profile.id) ?? 0}</td>
                  <td>{formatDate(profile.created_at)}</td>
                  <td>
                    {profile.id === user.id ? (
                      <small>—</small>
                    ) : (
                      <AdminUserActions userId={profile.id} name={profile.full_name} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profiles?.length && (
            <div className="empty-state">
              <h2>No people yet.</h2>
              <p>New registered users will appear here.</p>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
