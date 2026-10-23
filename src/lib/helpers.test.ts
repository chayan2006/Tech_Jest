import { describe, it, expect } from "vitest";
import { isUuid } from "./uuid";
import { jsonLd } from "./json-ld";
import { pageFromParam, pageRange } from "./pagination";
import { requestAlertEmail } from "@/backend/email/team-alert";

describe("isUuid", () => {
  it("accepts database ids", () => {
    expect(isUuid("2f1c7a5e-9b3d-4c1a-8e2f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("2F1C7A5E-9B3D-4C1A-8E2F-0A1B2C3D4E5F")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("2f1c7a5e-9b3d-4c1a-8e2f-0a1b2c3d4e5f,id.neq.x")).toBe(false);
    expect(isUuid(42)).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe("jsonLd", () => {
  it("cannot close the surrounding script tag", () => {
    const output = jsonLd({ name: "Web apps</script><script>alert(1)</script>" });
    expect(output).not.toContain("</script>");
    expect(JSON.parse(output)).toEqual({ name: "Web apps</script><script>alert(1)</script>" });
  });
});

describe("admin pagination", () => {
  it("reads ?page= safely", () => {
    expect(pageFromParam(undefined)).toBe(1);
    expect(pageFromParam("3")).toBe(3);
    expect(pageFromParam(["2", "9"])).toBe(2);
    expect(pageFromParam("0")).toBe(1);
    expect(pageFromParam("-4")).toBe(1);
    expect(pageFromParam("2.5")).toBe(1);
    expect(pageFromParam("abc")).toBe(1);
  });

  it("turns a page into a row range", () => {
    expect(pageRange(1)).toEqual([0, 24]);
    expect(pageRange(3)).toEqual([50, 74]);
  });
});

describe("requestAlertEmail", () => {
  const base = {
    requestId: "33333333-3333-4333-8333-333333333333",
    service: "Web Development",
    message: "Line one\nLine two",
    name: "Asha Rao",
    email: "asha@example.com",
  };

  it("says how to reply and links to the request", () => {
    const guest = requestAlertEmail({ ...base, guest: true });
    expect(guest.subject).toBe("New guest enquiry: Web Development from Asha Rao");
    expect(guest.text).toContain("Reply to this email");
    expect(guest.text).toContain("/admin/requests/33333333-3333-4333-8333-333333333333");
    expect(guest.replyTo).toBe("asha@example.com");
    expect(requestAlertEmail({ ...base, guest: false }).text).toContain("Reply in the admin console");
  });

  it("keeps the subject on one line and ignores a malformed reply address", () => {
    const email = requestAlertEmail({ ...base, guest: true, name: "Eve\r\nBcc: x@y.z", email: "not-an-email" });
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.replyTo).toBeUndefined();
  });
});
