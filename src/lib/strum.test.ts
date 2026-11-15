import { describe, expect, it } from "vitest";
import { strumGlyph } from "./strum";

describe("strumGlyph", () => {
  it("matches rhythm names however they are written", () => {
    expect(strumGlyph("Ballad")).toBe(strumGlyph("ballad"));
    expect(strumGlyph("Rhumba")).toBe(strumGlyph("Rumba"));
    expect(strumGlyph("Valse")).toBe(strumGlyph("Waltz"));
  });

  it("tells Slow Rock from Slow", () => {
    expect(strumGlyph("Slow Rock")).not.toBe(strumGlyph("Slow"));
  });

  it("has a generic pattern for a rhythm it does not know", () => {
    expect(strumGlyph("Điệu lạ")).toMatch(/^[↓↑ ]+$/);
  });
});
