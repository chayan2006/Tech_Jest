import { describe, it, expect } from "vitest";
import { safeNextPath } from "./safe-next-path";
import { formatMoney, formatDate } from "./format";
import { getSiteUrl } from "./site-url";

describe("safeNextPath", () => {
  it("allows safe internal paths", () => {
    expect(safeNextPath("/cart")).toBe("/cart");
    expect(safeNextPath("/services?query=web")).toBe("/services?query=web");
  });

  it("blocks external and protocol-relative URLs", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});

describe("formatMoney", () => {
  it("formats integer amounts without fraction digits", () => {
    const formatted = formatMoney(50000, "INR");
    expect(formatted).toContain("50,000");
  });

  it("formats float amounts with 2 fraction digits", () => {
    const formatted = formatMoney(1200.5, "USD");
    expect(formatted).toContain("1,200.50");
  });
});

describe("getSiteUrl", () => {
  it("returns a trimmed URL without trailing slashes", () => {
    const url = getSiteUrl();
    expect(url.endsWith("/")).toBe(false);
  });
});
