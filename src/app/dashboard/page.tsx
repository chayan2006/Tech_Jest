import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  let { data: profile } = await supabase.from("profiles").select("full_name, company, phone, purpose").eq("id", user.id).maybeSingle();
  if (!profile) {
    const metadata = user.user_metadata ?? {};
    const fullName = String(metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "TechJest client").trim().slice(0, 100);
    const company = typeof metadata.company === "string" ? metadata.company.trim().slice(0, 120) : null;
    const phone = typeof metadata.phone === "string" ? metadata.phone.trim().slice(0, 30) : null;
    const purpose = String(metadata.purpose ?? "Project consultation").trim().slice(0, 500);
    const { data: createdProfile } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName.length >= 2 ? fullName : "TechJest client",
      company: company || null,
      phone: phone || null,
      purpose: purpose.length >= 3 ? purpose : "Project consultation",
    }).select("full_name, company, phone, purpose").single();
    profile = createdProfile;
  }
  const { data: requests } = await supabase.from("project_requests").select("id, service, message, budget, status, created_at").order("created_at", { ascending: false });
  return <section className="section"><div className="container dashboard"><div className="eyebrow">Private workspace</div><h1>Good to see you, {profile?.full_name?.split(" ")[0] ?? "there"}.</h1><p className="lead">Your account, project requests, and next steps in one place.</p><div className="dashboard-head"><div><strong>{user.email}</strong><small className="dashboard-company">{profile?.company ?? "Independent project"}</small></div><div className="dashboard-actions"><Link className="btn btn-primary" href="/contact">New project request</Link><form action="/auth/signout" method="post"><button className="btn btn-ghost">Log out</button></form></div></div><div className="profile-summary"><div><span>Company</span><strong>{profile?.company || "Not added"}</strong></div><div><span>Phone</span><strong>{profile?.phone || "Not added"}</strong></div><div><span>Purpose</span><strong>{profile?.purpose || "Project consultation"}</strong></div></div><div className="history-heading"><h2>Project history</h2><span>{requests?.length ?? 0} requests</span></div><div className="history">{requests?.length ? requests.map(request=><article className="history-item" key={request.id}><div><div className="project-tag">{request.status}</div><h3>{request.service}</h3><p>{request.message}</p>{request.budget&&<small>Budget: {request.budget}</small>}</div><time dateTime={request.created_at}>{new Date(request.created_at).toLocaleDateString("en-IN")}</time></article>) : <div className="empty-state"><h2>No requests yet.</h2><p>Tell us what you’re building and your project history will appear here.</p><Link className="btn btn-primary" href="/contact">Start a project</Link></div>}</div></div></section>;
}
