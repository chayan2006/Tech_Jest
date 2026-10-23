import { expect, test } from "@playwright/test";
import { admin, browserlessClient, createUser, signedInClient, uniqueEmail } from "./helpers";

// Database rules, checked through the same API the browser uses (no page needed).

const request = (userId: string, extra: Record<string, unknown> = {}) => ({
  user_id: userId,
  service: "Web",
  message: "x".repeat(25),
  ...extra,
});

test("clients cannot write what only the team may", async () => {
  const alice = await createUser({ prefix: "rls-alice" });
  const bob = await createUser({ prefix: "rls-bob" });
  const a = await signedInClient(alice.email, alice.password);
  const b = await signedInClient(bob.email, bob.password);

  expect((await a.from("project_requests").insert(request(alice.id, { status: "completed" }))).error).not.toBeNull();
  expect((await a.from("project_requests").insert(request(alice.id, { lead_stage: "won" }))).error).not.toBeNull();
  const own = await a.from("project_requests").insert(request(alice.id)).select("id").single();
  const other = await b.from("project_requests").insert(request(bob.id)).select("id").single();
  expect(own.error).toBeNull();

  // Sign-ins are logged by the database only.
  expect((await a.from("audit_logs").insert({ user_id: alice.id, event: "admin_login" })).error).not.toBeNull();
  expect((await a.from("audit_logs").insert({ user_id: alice.id, event: "login" })).error).not.toBeNull();

  const conversation = (extra: Record<string, unknown>) =>
    a
      .from("conversations")
      .insert({ client_id: alice.id, created_by: alice.id, title: "x", ...extra })
      .select("id")
      .single();
  expect((await conversation({ request_id: other.data!.id })).error).not.toBeNull();
  expect((await conversation({ request_id: own.data!.id, priority: "urgent" })).error).not.toBeNull();
  const mine = await conversation({ request_id: own.data!.id });
  expect(mine.error).toBeNull();

  const join = (role: string) =>
    a.from("conversation_participants").insert({ conversation_id: mine.data!.id, user_id: alice.id, role });
  expect((await join("admin")).error).not.toBeNull();
  expect((await join("client")).error).toBeNull();

  const { data: bobProfile } = await admin.from("profiles").select("company_id").eq("id", bob.id).single();
  expect(
    (await a.from("profiles").update({ company_id: bobProfile!.company_id }).eq("id", alice.id)).error,
  ).not.toBeNull();
  const edit = await a.from("profiles").update({ phone: "123" }).eq("id", alice.id).select("id");
  expect(edit.data).toHaveLength(1);
  const hijack = await b.from("profiles").update({ full_name: "hijack" }).eq("id", alice.id).select("id");
  expect(hijack.data).toHaveLength(0);
});

test("a request is saved completely or not at all", async () => {
  const user = await createUser({ prefix: "atomic" });
  const client = await signedInClient(user.email, user.password);
  const args = (extra: Record<string, unknown> = {}) => ({
    p_service: "Web Development",
    p_message: "We need a booking website for our clinic.",
    p_email: user.email,
    ...extra,
  });
  const ok = await client.rpc("submit_project_request", args());
  expect(ok.error).toBeNull();
  const { data: conversation } = await admin.from("conversations").select("status").eq("request_id", ok.data).single();
  expect(conversation?.status).toBe("waiting_for_admin");

  const countMine = async () =>
    (await admin.from("project_requests").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count;
  const before = await countMine();
  const broken = await client.rpc(
    "submit_project_request",
    args({ p_services: [{ slug: "", name: "Broken", price: 1 }] }),
  );
  expect(broken.error).not.toBeNull();
  expect(await countMine()).toBe(before);
  expect((await browserlessClient().rpc("submit_project_request", args())).error).not.toBeNull();
});

test("a client may send at most 10 requests an hour", async () => {
  const user = await createUser({ prefix: "limit" });
  const client = await signedInClient(user.email, user.password);
  for (let index = 0; index < 10; index += 1) {
    const { error } = await client.rpc("submit_project_request", {
      p_service: "Web Development",
      p_message: "We need a booking website for our clinic.",
    });
    expect(error).toBeNull();
  }
  const eleventh = await client.rpc("submit_project_request", {
    p_service: "Web Development",
    p_message: "We need a booking website for our clinic.",
  });
  expect(eleventh.error?.code).toBe("TJ429");
  expect((await client.from("project_requests").insert(request(user.id))).error?.code).toBe("TJ429");
});

test("sign-ups and logins are recorded by the database", async () => {
  const user = await createUser({ prefix: "audit" });
  const team = await createUser({ prefix: "audit-admin", role: "admin" });
  const client = await signedInClient(user.email, user.password);
  await signedInClient(team.email, team.password);
  const events = async (id: string) =>
    ((await admin.from("audit_logs").select("event").eq("user_id", id)).data ?? []).map((row) => row.event);
  expect(await events(user.id)).toEqual(expect.arrayContaining(["signup", "login"]));
  expect(await events(team.id)).toContain("admin_login");
  const before = (await events(user.id)).length;
  await client.auth.refreshSession();
  expect((await events(user.id)).length).toBe(before);
});

test("unread counts are exact, and internal notes are never counted", async () => {
  const user = await createUser({ prefix: "unread" });
  const team = await createUser({ prefix: "unread-admin", role: "admin" });
  const client = await signedInClient(user.email, user.password);
  const staff = await signedInClient(team.email, team.password);
  const { data: requestId } = await client.rpc("submit_project_request", {
    p_service: "Web Development",
    p_message: "We need a booking website for our clinic.",
  });
  const { data: conversation } = await admin.from("conversations").select("id").eq("request_id", requestId).single();
  const unread = async (who: typeof client) =>
    Object.fromEntries(
      ((await who.rpc("unread_message_counts")).data ?? []).map((row: { conversation_id: string; unread: number }) => [
        row.conversation_id,
        Number(row.unread),
      ]),
    )[conversation!.id] ?? 0;

  expect(await unread(staff)).toBe(1);
  await staff.from("messages").insert([
    {
      conversation_id: conversation!.id,
      sender_id: team.id,
      sender_type: "admin",
      content: "Thanks",
      message_type: "text",
    },
    {
      conversation_id: conversation!.id,
      sender_id: team.id,
      sender_type: "internal",
      content: "note",
      message_type: "internal_note",
    },
  ]);
  expect(await unread(client)).toBe(1);
  await client.from("conversation_participants").upsert({
    conversation_id: conversation!.id,
    user_id: user.id,
    role: "client",
    last_read_at: new Date(Date.now() + 1000).toISOString(),
  });
  expect(await unread(client)).toBe(0);

  // Past 1,000 rows the old count came out low.
  await admin.from("messages").insert(
    Array.from({ length: 1200 }, (_, index) => ({
      conversation_id: conversation!.id,
      sender_id: user.id,
      sender_type: "client",
      content: `m${index}`,
      message_type: "text",
    })),
  );
  expect(await unread(staff)).toBe(1201);
});

test("guest enquiries are checked, limited, and kept private", async () => {
  const guest = browserlessClient();
  const email = uniqueEmail("guest-db");
  const { data: catalog } = await admin
    .from("service_catalog")
    .select("slug, name, price")
    .eq("is_active", true)
    .limit(2);
  const args = (extra: Record<string, unknown> = {}) => ({
    p_name: "Guest Person",
    p_email: email,
    p_message: "Please build us a booking website for our clinic.",
    p_service: "Web Development",
    ...extra,
  });

  const saved = await guest.rpc("submit_guest_request", args({ p_service_slugs: catalog!.map((item) => item.slug) }));
  expect(saved.error).toBeNull();
  const { data: row } = await admin.from("project_requests").select("user_id, service").eq("id", saved.data).single();
  expect(row?.user_id).toBeNull();
  for (const item of catalog!) expect(row?.service).toContain(item.name);
  const { data: services } = await admin
    .from("project_request_services")
    .select("service_slug, price_snapshot")
    .eq("request_id", saved.data);
  for (const item of services!)
    expect(Number(item.price_snapshot)).toBe(Number(catalog!.find((c) => c.slug === item.service_slug)!.price));
  expect((await admin.from("conversations").select("id").eq("request_id", saved.data)).data).toEqual([]);

  for (const bad of [
    { p_service_slugs: ["no-such-service"] },
    { p_email: "not-an-email" },
    { p_message: "short" },
    { p_name: "x" },
  ])
    expect((await guest.rpc("submit_guest_request", args(bad))).error?.code).toBe("TJ400");
  await guest.rpc("submit_guest_request", args());
  await guest.rpc("submit_guest_request", args());
  expect((await guest.rpc("submit_guest_request", args())).error?.code).toBe("TJ429");

  expect((await guest.from("project_requests").insert({ service: "x", message: "x".repeat(30) })).error).not.toBeNull();
  expect((await guest.from("project_requests").select("id").eq("id", saved.data)).data ?? []).toEqual([]);
  const user = await createUser({ prefix: "guest-db-client" });
  const client = await signedInClient(user.email, user.password);
  expect((await client.rpc("submit_guest_request", args({ p_email: uniqueEmail("other") }))).error).not.toBeNull();
  expect((await client.from("project_requests").select("id").eq("id", saved.data)).data).toEqual([]);
});

test("guest enquiries stop at 50 an hour across the site", async () => {
  const marker = `cap-${Date.now()}`;
  const { count } = await admin
    .from("project_requests")
    .select("*", { count: "exact", head: true })
    .is("user_id", null);
  const filler = Array.from({ length: Math.max(0, 50 - count!) }, (_, index) => ({
    user_id: null,
    service: marker,
    message: "x".repeat(25),
    email: `${marker}-${index}@example.test`,
  }));
  try {
    if (filler.length) await admin.from("project_requests").insert(filler);
    const { error } = await browserlessClient().rpc("submit_guest_request", {
      p_name: "Late Guest",
      p_email: uniqueEmail("late"),
      p_message: "Please build us a booking website for our clinic.",
      p_service: "Web Development",
    });
    expect(error?.code).toBe("TJ429");
  } finally {
    // Later tests send guest enquiries of their own.
    await admin.from("project_requests").delete().eq("service", marker);
  }
});
