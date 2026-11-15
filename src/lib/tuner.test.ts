import { describe, expect, it } from "vitest";
import { centsOff, median, midiHz, nearestString, TUNINGS, verdict } from "./tuner";

const standard = TUNINGS[0].strings;

describe("TUNINGS", () => {
  it("lists standard tuning first, low E to high E", () => {
    expect(TUNINGS[0].id).toBe("standard");
    expect(standard).toEqual([40, 45, 50, 55, 59, 64]);
  });
});

describe("centsOff", () => {
  it("is zero on the note, +100 a semitone sharp, −1200 an octave flat", () => {
    expect(centsOff({ hz: 110, midi: 45 })).toBeCloseTo(0);
    expect(centsOff({ hz: midiHz(46), midi: 45 })).toBeCloseTo(100);
    expect(centsOff({ hz: 55, midi: 45 })).toBeCloseTo(-1200);
  });
});

describe("nearestString", () => {
  it("picks the string whose note is closest, even when the pitch is well off", () => {
    expect(nearestString({ hz: 82.4, strings: standard })).toBe(0);
    expect(nearestString({ hz: 104, strings: standard })).toBe(1); // a flat A string
    expect(nearestString({ hz: 330, strings: standard })).toBe(5);
    expect(nearestString({ hz: 240, strings: standard })).toBe(4); // closer to B3 than G3
  });
});

describe("verdict", () => {
  it("calls ±5 cents in tune, below that low, above that high", () => {
    expect(verdict(-4.9)).toBe("in-tune");
    expect(verdict(5)).toBe("in-tune");
    expect(verdict(-6)).toBe("low");
    expect(verdict(30)).toBe("high");
  });
});

describe("median", () => {
  it("ignores one stray reading among steady ones", () => {
    expect(median([110, 110.4, 220, 109.8, 110.1])).toBe(110.1);
    expect(median([2, 1])).toBe(1.5);
  });
});
