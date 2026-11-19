import { describe, expect, it } from "vitest";
import { diagramShapes } from "./chord-diagram";
import type { Position } from "./chords";

const kinds = (position: Position, showFingers = false) => diagramShapes({ position, showFingers }).map((s) => s.kind);

describe("diagramShapes", () => {
  it("draws open C: a thick nut, × on the low E, rings on open strings, a dot per pressed string", () => {
    const c: Position = { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], barres: [], baseFret: 1 };
    const shapes = diagramShapes({ position: c, showFingers: false });
    expect(shapes[0]).toMatchObject({ kind: "rect", height: 4 });
    expect(shapes.filter((s) => s.kind === "text").map((s) => s.kind === "text" && s.text)).toEqual(["×"]);
    expect(kinds(c).filter((k) => k === "ring")).toHaveLength(2);
    expect(kinds(c).filter((k) => k === "dot")).toHaveLength(3);
  });

  it("draws a barre as one bar instead of dots, labels a high base fret, and numbers fingers only when asked", () => {
    const bm: Position = { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barres: [1], baseFret: 2 };
    const shapes = diagramShapes({ position: bm, showFingers: true });
    expect(shapes[0]).toMatchObject({ kind: "rect", height: 1 });
    expect(shapes.filter((s) => s.kind === "rect" && s.rx !== undefined)).toHaveLength(1);
    expect(kinds(bm).filter((k) => k === "dot")).toHaveLength(3);
    const texts = shapes.flatMap((s) => (s.kind === "text" ? [s.text] : []));
    expect(texts).toEqual(["2fr", "1", "×", "3", "4", "2"]);
    expect(kinds(bm, false).filter((k) => k === "text")).toHaveLength(2);
  });
});
