import { describe, expect, it } from "vitest";
import { isAdmin } from "./admin";

describe("isAdmin", () => {
  const allowlist = " Boss@Example.com , other@example.com";

  it("accepts a verified email on the list, ignoring case and spaces", () => {
    expect(isAdmin({ email: "boss@example.com", emailVerified: true, allowlist })).toBe(true);
  });

  it("rejects unverified emails, unlisted emails and an empty list", () => {
    expect(isAdmin({ email: "boss@example.com", emailVerified: false, allowlist })).toBe(false);
    expect(isAdmin({ email: "x@example.com", emailVerified: true, allowlist })).toBe(false);
    expect(isAdmin({ email: "boss@example.com", emailVerified: true, allowlist: undefined })).toBe(false);
  });
});
