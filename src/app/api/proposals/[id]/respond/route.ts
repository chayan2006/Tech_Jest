import { after, NextResponse } from "next/server";
import { createClient } from "@/backend/supabase/server";
import { getSessionUser } from "@/backend/supabase/session";
import { sendTeamAlert, teamNoticeEmail } from "@/backend/email/team-alert";
import { isUuid } from "@/lib/uuid";

// A client accepts or declines a proposal the team sent them.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { accept?: unknown } | null;
  if (typeof body?.accept !== "boolean")
    return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const { data: status, error } = await supabase.rpc("respond_to_proposal", {
    p_proposal_id: id,
    p_accept: body.accept,
  });
  if (error) {
    // TJ404/TJ409 messages are written for clients in the database function.
    if (error.code === "TJ404") return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.code === "TJ409") return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Could not record proposal answer", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Your answer could not be saved. Please try again." }, { status: 500 });
  }
  after(async () => {
    const { data: proposal } = await supabase.from("proposals").select("title, request_id").eq("id", id).maybeSingle();
    const name =
      typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : (user.email ?? "A client");
    await sendTeamAlert(
      teamNoticeEmail(
        `Proposal ${status}: ${proposal?.title ?? "a proposal"} (${name})`,
        [`${name} ${status} the proposal “${proposal?.title ?? ""}”.`],
        proposal?.request_id ? `/admin/requests/${proposal.request_id}` : "/admin/proposals",
        user.email,
      ),
    );
  });
  return NextResponse.json({ status });
}
