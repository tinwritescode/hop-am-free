import { describe, expect, it } from "vitest";
import { describeStep, FINGERS, fingerOf } from "./describe";

describe("fingerOf", () => {
  it("gives the thumb the three bass strings and i, m, a the rest", () => {
    expect([0, 1, 2, 3, 4, 5].map(fingerOf)).toEqual(["p", "p", "p", "i", "m", "a"]);
    expect(FINGERS.p.name).toBe("Ngón cái");
  });
});

describe("describeStep", () => {
  it("says which finger plays which string and fret, in guitar string numbers", () => {
    expect(
      describeStep({
        at: 0,
        thump: false,
        notes: [
          { kind: "fret", string: 0, fret: 0, via: null },
          { kind: "fret", string: 3, fret: 2, via: "hammer" },
        ],
      }),
    ).toEqual(["Ngón cái: dây 6 buông", "Ngón trỏ: dây 3 phím 2, luyến lên (h)"]);
  });

  it("explains slides, pull-offs, dead notes and the wrist thump", () => {
    expect(
      describeStep({
        at: 0,
        thump: true,
        notes: [
          { kind: "dead", string: 1 },
          { kind: "fret", string: 4, fret: 9, via: "slide-up" },
          { kind: "fret", string: 5, fret: 6, via: "pull" },
        ],
      }),
    ).toEqual(["Ngón cái: chặn tiếng dây 5 (x)", "Ngón giữa: dây 2 phím 9, vuốt lên (/)", "Ngón áp út: dây 1 phím 6, luyến xuống (p)", "Đập cổ tay xuống dây (o)"]);
    expect(describeStep({ at: 0, thump: false, notes: [{ kind: "fret", string: 2, fret: 7, via: "slide-down" }] })).toEqual(["Ngón cái: dây 4 phím 7, vuốt xuống (\\)"]);
  });
});
