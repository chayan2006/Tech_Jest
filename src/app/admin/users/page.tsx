import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminUserActions } from "@/frontend/components/admin-user-actions";

export default async function AdminUsersPage() {
  const { supabase, user } = await requireAdmin();
  const { data: profiles, error } = await supabase.from("profiles").select("id, full_name, company, phone, purpose, created_at").order("created_at", { ascending: false });
  const ids = profiles?.map(profile => profile.id) ?? [];
  const { data: requests } = ids.length ? await supabase.from("project_requests").select("user_id").in("user_id", ids) : { data: [] };
  const requestCounts = new Map<string, number>();
  (requests ?? []).forEach(request => requestCounts.set(request.user_id, (requestCounts.get(request.user_id) ?? 0) + 1));
  return <AdminShell email={user.email}><div className="eyebrow">People directory</div><h1>Everyone using TechJest.</h1><p className="lead">Customer profiles, contact details, and their request history.</p>{error ? <div className="empty-state"><h2>People unavailable.</h2><p>Run the latest Supabase schema and check the admin RLS policy.</p></div> : <div className="admin-panel admin-table-wrap"><table className="admin-table"><thead><tr><th>Person</th><th>Company</th><th>Contact</th><th>Requests</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{(profiles ?? []).map(profile => <tr key={profile.id}><td><strong>{profile.full_name}</strong><small>{profile.purpose}</small></td><td>{profile.company ?? "Independent"}</td><td>{profile.phone ?? "—"}</td><td>{requestCounts.get(profile.id) ?? 0}</td><td>{new Date(profile.created_at).toLocaleDateString("en-IN")}</td><td><AdminUserActions userId={profile.id} name={profile.full_name} /></td></tr>)}</tbody></table>{!profiles?.length && <div className="empty-state"><h2>No people yet.</h2><p>New registered users will appear here.</p></div>}</div>}</AdminShell>;
}
