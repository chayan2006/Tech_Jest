import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { profilesById } from "@/backend/supabase/profiles";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminStatusSelect } from "@/frontend/components/admin-status-select";
import { formatDateTime } from "@/lib/format";

export default async function AdminRequestsPage() {
  const { supabase, user } = await requireAdmin();
  const { data: requests, error } = await supabase
    .from("project_requests")
    .select(
      "id, service, message, budget, name, email, phone, company, budget_range, timeline, description, status, created_at, user_id",
    )
    .order("created_at", { ascending: false });
  const requestIds = requests?.map((request) => request.id) ?? [];
  const [profiles, { data: requestServices, error: requestServicesError }] = await Promise.all([
    profilesById(supabase, requests?.map((request) => request.user_id) ?? []),
    requestIds.length
      ? supabase
          .from("project_request_services")
          .select("request_id, service_name_snapshot, price_snapshot")
          .in("request_id", requestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const servicesByRequest = new Map<string, string[]>();
  (requestServices ?? []).forEach((item) => {
    servicesByRequest.set(item.request_id, [
      ...(servicesByRequest.get(item.request_id) ?? []),
      item.service_name_snapshot,
    ]);
  });
  const loadError = error ?? requestServicesError;
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Lead management</div>
          <h1>Consultation requests.</h1>
          <p className="lead">Every enquiry submitted through the TechJest website.</p>
        </div>
        <span className="admin-count">{requests?.length ?? 0} total</span>
      </div>
      {loadError ? (
        <div className="empty-state">
          <h2>Requests unavailable.</h2>
          <p>Confirm the latest schema and admin RLS policies are applied.</p>
        </div>
      ) : requests?.length ? (
        <div className="admin-requests">
          {requests.map((request) => {
            const profile = profiles.get(request.user_id);
            const selectedServices = servicesByRequest.get(request.id) ?? [];
            const clientName = request.name ?? profile?.full_name ?? "Unknown client";
            return (
              <article className="admin-request" key={request.id}>
                <div className="admin-request-top">
                  <div>
                    <AdminStatusSelect kind="request" id={request.id} value={request.status} name={request.service} />
                    <h2>
                      <Link href={`/admin/requests/${request.id}`}>{request.service}</Link>
                    </h2>
                  </div>
                  <time dateTime={request.created_at}>{formatDateTime(request.created_at)}</time>
                </div>
                <p className="admin-message">{request.description ?? request.message}</p>
                {(request.budget_range ?? request.budget) && (
                  <p>
                    <strong>Budget:</strong> {request.budget_range ?? request.budget}
                  </p>
                )}
                {request.timeline && (
                  <p>
                    <strong>Timeline:</strong> {request.timeline}
                  </p>
                )}
                {selectedServices.length > 0 && (
                  <p>
                    <strong>Selected services:</strong> {selectedServices.join(", ")}
                  </p>
                )}
                <div className="admin-customer">
                  <strong>{clientName}</strong>
                  <span>{request.email ?? "Email unavailable"}</span>
                  <span>{request.company ?? profile?.company ?? "Independent project"}</span>
                  {(request.phone ?? profile?.phone) ? <span>{request.phone ?? profile?.phone}</span> : null}
                  <Link className="text-link" href={`/admin/requests/${request.id}`}>
                    Open request →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No requests yet.</h2>
          <p>New consultation requests will appear here.</p>
        </div>
      )}
    </AdminShell>
  );
}
