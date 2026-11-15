import { describe, expect, it } from "vitest";
import { parsePath, svgToShapes } from "./svg";

describe("parsePath", () => {
  it("turns a relative quadratic into a cubic with control points two thirds of the way to the quad's", () => {
    expect(parsePath("M34 67q6 5 12 0")).toEqual([
      { v: [[34, 67], [46, 67]], i: [[34, 67], [42, 70 + 1 / 3]], o: [[38, 70 + 1 / 3], [46, 67]], closed: false },
    ]);
  });

  it("closes a path that returns to its start without a doubled vertex", () => {
    const [leaf] = parsePath("M40 9q-9 1-11-7 9-1 11 7z");
    expect(leaf.closed).toBe(true);
    expect(leaf.v).toEqual([[40, 9], [29, 2]]);
  });

  it("reads H, V, and pairs after a move as lines", () => {
    expect(parsePath("M0 0 10 0V5H2").map((s) => s.v)).toEqual([[[0, 0], [10, 0], [10, 5], [2, 5]]]);
  });

  it("refuses arcs rather than dropping them", () => {
    expect(() => parsePath("M0 0a5 5 0 0 1 10 0")).toThrow(/unsupported path command a/);
  });
});

describe("svgToShapes", () => {
  it("stacks the last-drawn shape first, with styles inherited from its group", () => {
    const [top, bottom] = svgToShapes(`<g stroke="#3A1B3E" opacity=".5"><circle cx="1" cy="2" r="3" fill="#fff"/><rect x="0" y="0" width="4" height="2" rx="1" fill="none"/></g>`);
    expect(top.it).toEqual([
      { ty: "rc", d: 1, p: { a: 0, k: [2, 1] }, s: { a: 0, k: [4, 2] }, r: { a: 0, k: 1 } },
      expect.objectContaining({ ty: "st", c: { a: 0, k: [0.227, 0.106, 0.243, 1] } }),
      expect.objectContaining({ ty: "tr", o: { a: 0, k: 50 } }),
    ]);
    expect(bottom.it).toContainEqual(expect.objectContaining({ ty: "fl", c: { a: 0, k: [1, 1, 1, 1] } }));
  });

  it("refuses elements it cannot draw", () => {
    expect(() => svgToShapes(`<text>hi</text>`)).toThrow(/<text>/);
  });
});
