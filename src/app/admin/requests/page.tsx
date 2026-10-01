import { requireAdmin } from "@/backend/supabase/admin";

export default async function AdminRequestsPage() {
  const { supabase, user } = await requireAdmin();
  const { data: requests, error } = await supabase
    .from("project_requests")
    .select("id, service, message, budget, status, created_at, user_id")
    .order("created_at", { ascending: false });
  const userIds = [...new Set(requests?.map(request => request.user_id) ?? [])];
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, company, phone").in("id", userIds)
    : { data: [], error: null };
  const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  const loadError = error ?? profilesError;

  return <section className="section"><div className="container admin-page">
    <div className="eyebrow">Admin workspace</div>
    <h1>Consultation requests.</h1>
    <p className="lead">Private view of customer requests submitted through the website.</p>
    <div className="admin-head"><span>{user.email}</span><span>{requests?.length ?? 0} requests</span></div>
    {loadError ? <div className="empty-state"><h2>Requests unavailable.</h2><p>Confirm the admin RLS policy has been applied in Supabase.</p></div> :
      requests?.length ? <div className="admin-requests">{requests.map(request => {
        const profile = profileById.get(request.user_id);
        return <article className="admin-request" key={request.id}>
          <div className="admin-request-top"><div><div className="project-tag">{request.status}</div><h2>{request.service}</h2></div><time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString("en-IN")}</time></div>
          <p className="admin-message">{request.message}</p>
          {request.budget && <p><strong>Budget:</strong> {request.budget}</p>}
          <div className="admin-customer"><strong>{profile?.full_name ?? "Unknown customer"}</strong><span>{profile?.company ?? "Independent project"}</span>{profile?.phone && <span>{profile.phone}</span>}</div>
        </article>;
      })}</div> : <div className="empty-state"><h2>No requests yet.</h2><p>New consultation requests will appear here.</p></div>}
  </div></section>;
}
