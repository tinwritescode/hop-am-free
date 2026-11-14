import { describe, expect, it } from "vitest";
import { bearerToken, hashSecret, newSecret, newUserCode, normalizeUserCode, safeReturnTo } from "./cli-auth";

describe("user codes", () => {
  it("look like ABCD-EFGH without look-alike characters", () => {
    for (let i = 0; i < 50; i++) expect(newUserCode()).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("normalize what people type", () => {
    expect(normalizeUserCode(" abcd efgh ")).toBe("ABCD-EFGH");
    expect(normalizeUserCode("abcd-efgh")).toBe("ABCD-EFGH");
    expect(normalizeUserCode("ABCD-EFG")).toBeNull();
    expect(normalizeUserCode("ABCD-EFG0")).toBeNull(); // 0 is not in the alphabet
  });
});

describe("secrets", () => {
  it("are prefixed, unguessable and hashed deterministically", () => {
    const a = newSecret("haf_");
    expect(a).toMatch(/^haf_[A-Za-z0-9_-]{43}$/);
    expect(newSecret("haf_")).not.toBe(a);
    expect(hashSecret(a)).toBe(hashSecret(a));
    expect(hashSecret(a)).not.toContain(a);
  });

  it("reads bearer tokens from an Authorization header", () => {
    expect(bearerToken("Bearer haf_abc")).toBe("haf_abc");
    expect(bearerToken("bearer   haf_abc ")).toBe("haf_abc");
    expect(bearerToken("Basic xyz")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});

describe("safeReturnTo", () => {
  it("keeps same-site paths only", () => {
    expect(safeReturnTo("/cli?code=ABCD-EFGH")).toBe("/cli?code=ABCD-EFGH");
    expect(safeReturnTo("//evil.com/x")).toBeNull();
    expect(safeReturnTo("/\\evil.com")).toBeNull();
    expect(safeReturnTo("https://evil.com")).toBeNull();
    expect(safeReturnTo(null)).toBeNull();
  });
});
