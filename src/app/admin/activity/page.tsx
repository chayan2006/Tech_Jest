import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";

export default async function AdminActivityPage() {
  const { supabase, user } = await requireAdmin();
  const { data: events, error } = await supabase.from("audit_logs").select("id, user_id, event, email, ip_address, created_at").order("created_at", { ascending: false }).limit(100);
  return <AdminShell email={user.email}><div className="eyebrow">Audit trail</div><h1>Who logged in and what happened.</h1><p className="lead">Recent authentication and account events recorded by the website.</p>{error ? <div className="empty-state"><h2>Activity unavailable.</h2><p>Run the latest Supabase schema to enable login tracking.</p></div> : <div className="admin-panel admin-table-wrap"><table className="admin-table"><thead><tr><th>Event</th><th>Email</th><th>IP address</th><th>When</th></tr></thead><tbody>{(events ?? []).map(event => <tr key={event.id}><td><span className="admin-status status-received">{event.event.replace("_", " ")}</span></td><td>{event.email ?? event.user_id}</td><td>{event.ip_address ?? "Not available"}</td><td>{new Date(event.created_at).toLocaleString("en-IN")}</td></tr>)}</tbody></table>{!events?.length && <div className="empty-state"><h2>No activity yet.</h2><p>Successful sign-ins will be recorded here.</p></div>}</div>}</AdminShell>;
}
