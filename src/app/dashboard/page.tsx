import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { countUnreadMessages } from "@/backend/supabase/unread";
import { statusLabel } from "@/frontend/data/workflow";
import { formatDate, formatMoney } from "@/lib/format";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  // Admins have no client workspace; their home is the admin console.
  if (user.app_metadata?.role === "admin") redirect("/admin");
  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company, phone, purpose")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    const metadata = user.user_metadata ?? {};
    const fullName = String(metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "TechJest client")
      .trim()
      .slice(0, 100);
    const company = typeof metadata.company === "string" ? metadata.company.trim().slice(0, 120) : null;
    const phone = typeof metadata.phone === "string" ? metadata.phone.trim().slice(0, 30) : null;
    const purpose = String(metadata.purpose ?? "Project consultation")
      .trim()
      .slice(0, 500);
    const { data: createdProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fullName.length >= 2 ? fullName : "TechJest client",
        company: company || null,
        phone: phone || null,
        purpose: purpose.length >= 3 ? purpose : "Project consultation",
      })
      .select("full_name, company, phone, purpose")
      .single();
    profile = createdProfile;
  }
  const [{ data: requests }, unreadMessageCount] = await Promise.all([
    supabase
      .from("project_requests")
      .select("id, service, message, budget, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    countUnreadMessages(supabase, user.id, false),
  ]);
  const requestIds = requests?.map((request) => request.id) ?? [];
  // Proposals appear once the team marks them sent; drafts stay internal (also enforced by RLS).
  const [{ data: projects }, { data: proposals }, { data: conversations }] = requestIds.length
    ? await Promise.all([
        supabase
          .from("projects")
          .select("id, request_id, name, status, start_date, target_date")
          .in("request_id", requestIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("proposals")
          .select("id, request_id, title, summary, amount, currency, status, valid_until")
          .in("request_id", requestIds)
          .neq("status", "draft")
          .order("created_at", { ascending: false }),
        supabase.from("conversations").select("id, request_id").eq("client_id", user.id).in("request_id", requestIds),
      ])
    : ([{ data: [] }, { data: [] }, { data: [] }] as const);
  const { data: tasks } = projects?.length
    ? await supabase
        .from("project_tasks")
        .select("id, project_id, title, status, due_date")
        .in(
          "project_id",
          projects.map((project) => project.id),
        )
        .order("created_at", { ascending: true })
    : { data: [] };
  const tasksByProject = new Map<string, NonNullable<typeof tasks>>();
  (tasks ?? []).forEach((task) =>
    tasksByProject.set(task.project_id, [...(tasksByProject.get(task.project_id) ?? []), task]),
  );
  const proposalsByRequest = new Map<string, NonNullable<typeof proposals>>();
  (proposals ?? []).forEach((proposal) =>
    proposalsByRequest.set(proposal.request_id, [...(proposalsByRequest.get(proposal.request_id) ?? []), proposal]),
  );
  const conversationByRequest = new Map((conversations ?? []).map((item) => [item.request_id, item.id]));
  return (
    <section className="section">
      <div className="container dashboard">
        <div className="eyebrow">Private workspace</div>
        <h1>Good to see you, {profile?.full_name?.split(" ")[0] ?? "there"}.</h1>
        <p className="lead">Your account, project requests, and next steps in one place.</p>
        <div className="dashboard-head">
          <div>
            <strong>{user.email}</strong>
            <small className="dashboard-company">{profile?.company ?? "Independent project"}</small>
          </div>
          <div className="dashboard-actions">
            <Link className="btn btn-primary" href="/messages">
              Messages{unreadMessageCount ? ` (${unreadMessageCount})` : ""}
            </Link>
            <Link className="btn btn-primary" href="/contact">
              New project request
            </Link>
            <form action="/auth/signout" method="post">
              <button className="btn btn-ghost">Log out</button>
            </form>
          </div>
        </div>
        <div className="profile-summary">
          <div>
            <span>Company</span>
            <strong>{profile?.company || "Not added"}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{profile?.phone || "Not added"}</strong>
          </div>
          <div>
            <span>Purpose</span>
            <strong>{profile?.purpose || "Project consultation"}</strong>
          </div>
        </div>
        {projects?.length ? (
          <>
            <div className="history-heading">
              <h2>Active projects</h2>
              <span>{projects.length} projects</span>
            </div>
            <div className="history">
              {projects.map((project) => (
                <article className="history-item" key={project.id}>
                  <div>
                    <div className="project-tag">{statusLabel("project", project.status)}</div>
                    <h3>
                      <Link href={`/project/${project.id}`}>{project.name}</Link>
                    </h3>
                    <p>
                      {project.start_date ? `Starts ${formatDate(project.start_date)}` : "Kickoff date to be confirmed"}
                      {project.target_date ? ` · target ${formatDate(project.target_date)}` : ""}
                    </p>
                    {tasksByProject.get(project.id)?.map((task) => (
                      <small className="dashboard-task" key={task.id}>
                        {statusLabel("task", task.status)} · {task.title}
                        {task.due_date ? ` · due ${formatDate(task.due_date)}` : ""}
                      </small>
                    ))}
                    <Link className="text-link" href={`/project/${project.id}`}>
                      Open project →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
        <div className="history-heading">
          <h2>Project history</h2>
          <span>{requests?.length ?? 0} requests</span>
        </div>
        <div className="history">
          {requests?.length ? (
            requests.map((request) => {
              const conversationId = conversationByRequest.get(request.id);
              return (
                <article className="history-item" key={request.id}>
                  <div>
                    <div className="project-tag">{statusLabel("request", request.status)}</div>
                    <h3>{request.service}</h3>
                    <p>{request.message}</p>
                    {request.budget && <small>Budget: {request.budget}</small>}
                    {proposalsByRequest.get(request.id)?.map((proposal) => (
                      <div className="dashboard-proposal" key={proposal.id}>
                        <span className="eyebrow">Proposal · {statusLabel("proposal", proposal.status)}</span>
                        <strong>{proposal.title}</strong>
                        <p>{proposal.summary}</p>
                        <small>
                          {proposal.amount !== null
                            ? formatMoney(proposal.amount, proposal.currency)
                            : "Amount to be confirmed"}
                          {proposal.valid_until ? ` · valid until ${formatDate(proposal.valid_until)}` : ""}
                        </small>
                      </div>
                    ))}
                    {conversationId && (
                      <Link className="text-link" href={`/messages?conversation=${conversationId}`}>
                        View conversation →
                      </Link>
                    )}
                  </div>
                  <time dateTime={request.created_at}>{formatDate(request.created_at)}</time>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <h2>No requests yet.</h2>
              <p>Tell us what you’re building and your project history will appear here.</p>
              <Link className="btn btn-primary" href="/contact">
                Start a project
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
