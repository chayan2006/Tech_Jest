import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { formatDateTime } from "@/lib/format";

const eventLabels: Record<string, string> = { login: "Client login", admin_login: "Admin login", signup: "Sign-up" };

export default async function AdminActivityPage() {
  const { supabase, user } = await requireAdmin();
  const { data: events, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, event, email, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Audit trail</div>
          <h1>Who logged in and when.</h1>
          <p className="lead">The latest 100 sign-ins and sign-ups recorded by the website.</p>
        </div>
      </div>
      {error ? (
        <div className="empty-state">
          <h2>Activity unavailable.</h2>
          <p>Run the latest Supabase schema to enable login tracking.</p>
        </div>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Email</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((event) => (
                <tr key={event.id}>
                  <td>
                    <span className="admin-status">{eventLabels[event.event] ?? event.event}</span>
                  </td>
                  <td>{event.email ?? event.user_id}</td>
                  <td>{formatDateTime(event.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!events?.length && (
            <div className="empty-state">
              <h2>No activity yet.</h2>
              <p>Successful sign-ins will be recorded here.</p>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
