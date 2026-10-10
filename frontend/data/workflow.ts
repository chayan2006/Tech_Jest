// Every workflow status, with the label shown in the admin console and the client portal.
// The values match the check constraints in backend/supabase/schema.sql.
export const statusOptions = {
  request: [
    ["received", "Received"],
    ["in_progress", "In progress"],
    ["completed", "Completed"],
    ["declined", "Declined"],
  ],
  lead: [
    ["received", "Received"],
    ["qualified", "Qualified"],
    ["proposal", "Proposal"],
    ["negotiation", "Negotiation"],
    ["won", "Won"],
    ["project", "Project"],
  ],
  proposal: [
    ["draft", "Draft"],
    ["sent", "Sent"],
    ["accepted", "Accepted"],
    ["declined", "Declined"],
    ["expired", "Expired"],
  ],
  project: [
    ["planned", "Planned"],
    ["active", "Active"],
    ["on_hold", "On hold"],
    ["completed", "Completed"],
  ],
  task: [
    ["todo", "To do"],
    ["in_progress", "In progress"],
    ["blocked", "Blocked"],
    ["done", "Done"],
  ],
  invoice: [
    ["draft", "Draft"],
    ["sent", "Sent"],
    ["paid", "Paid"],
    ["void", "Void"],
  ],
  conversation: [
    ["open", "Open"],
    ["waiting_for_admin", "Awaiting TechJest"],
    ["waiting_for_client", "Awaiting client"],
    ["resolved", "Resolved"],
    ["closed", "Closed"],
    ["archived", "Archived"],
  ],
} as const;

export type StatusKind = keyof typeof statusOptions;

// Clients read conversation statuses from their own side.
const clientLabels: Partial<Record<string, string>> = { waiting_for_client: "Awaiting your reply" };

export function statusLabel(kind: StatusKind, value: string, audience: "admin" | "client" = "admin") {
  if (audience === "client" && kind === "conversation" && clientLabels[value]) return clientLabels[value];
  const options: readonly (readonly [string, string])[] = statusOptions[kind];
  return options.find(([option]) => option === value)?.[1] ?? value.replaceAll("_", " ");
}
