import { describe, expect, it } from "vitest";
import { capoAt, columnAt, noteMidi, stepIndexAt } from "./timeline";

describe("capoAt", () => {
  const capos = [
    { at: 0, fret: 3 },
    { at: 20, fret: 1 },
    { at: 26, fret: 3 },
  ];
  it("uses the arrangement's capo before any change, then the latest change at or before the column", () => {
    expect(capoAt({ capos: [], at: 50, initial: 2 })).toBe(2);
    expect(capoAt({ capos, at: 19, initial: 0 })).toBe(3);
    expect(capoAt({ capos, at: 20, initial: 0 })).toBe(1);
    expect(capoAt({ capos, at: 30, initial: 0 })).toBe(3);
  });
});

describe("noteMidi", () => {
  it("adds the capo and the fret to the open string", () => {
    expect(noteMidi({ strings: [40, 45, 50, 55, 59, 64], string: 0, fret: 0, capo: 3 })).toBe(43);
    expect(noteMidi({ strings: [40, 45, 50, 55, 59, 64], string: 5, fret: 12, capo: 1 })).toBe(77);
  });
});

describe("columnAt", () => {
  it("moves from the start column and stops at the end of the range", () => {
    expect(columnAt({ from: 10, lo: 0, hi: 40, loop: false, elapsed: 5 })).toBe(15);
    expect(columnAt({ from: 10, lo: 0, hi: 40, loop: false, elapsed: -1 })).toBe(10);
    expect(columnAt({ from: 10, lo: 0, hi: 40, loop: false, elapsed: 30 })).toBeNull();
  });
  it("wraps back to the start of the range when looping, even when it began mid-range", () => {
    expect(columnAt({ from: 30, lo: 20, hi: 40, loop: true, elapsed: 12 })).toBe(22);
    expect(columnAt({ from: 30, lo: 20, hi: 40, loop: true, elapsed: 35 })).toBe(25);
  });
});

describe("stepIndexAt", () => {
  const steps = [{ at: 1 }, { at: 3 }, { at: 9 }];
  it("finds the last step at or before the column, or -1 before the first", () => {
    expect(stepIndexAt({ steps, at: 0 })).toBe(-1);
    expect(stepIndexAt({ steps, at: 3 })).toBe(1);
    expect(stepIndexAt({ steps, at: 8.5 })).toBe(1);
    expect(stepIndexAt({ steps, at: 100 })).toBe(2);
  });
});
