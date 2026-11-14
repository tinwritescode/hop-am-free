import { describe, expect, it } from "vitest";
import { transposeChord, lookupChord, difficultyOf, voicingsFor, midiOf, tabOf, handHint } from "./chords";

describe("transposeChord", () => {
  it("moves root and bass by semitones using the database spelling", () => {
    expect(transposeChord({ name: "G", semitones: 2 })).toBe("A");
    expect(transposeChord({ name: "Cmaj7", semitones: -2 })).toBe("Bbmaj7");
    expect(transposeChord({ name: "G/B", semitones: 1 })).toBe("Ab/C");
    expect(transposeChord({ name: "A#m7", semitones: 0 })).toBe("Bbm7");
  });

  it("leaves names it cannot parse untouched", () => {
    expect(transposeChord({ name: "N.C.", semitones: 3 })).toBe("N.C.");
  });
});

describe("lookupChord", () => {
  it("finds common chords, including slash chords and aliases", () => {
    expect(lookupChord("G/B")?.suffix).toBe("/B");
    expect(lookupChord("Bbmaj7")?.suffix).toBe("maj7");
    expect(lookupChord("Am7")?.suffix).toBe("m7");
    expect(lookupChord("C#m")?.suffix).toBe("minor");
    expect(lookupChord("D")?.suffix).toBe("major");
  });

  it("returns null for chords the database does not have", () => {
    expect(lookupChord("Xyz")).toBeNull();
  });

  it("never answers a coloured slash chord with a plain one", () => {
    expect(lookupChord("Gadd9/B")).toBeNull();
    expect(lookupChord("Am/G")?.suffix).toBe("m/G");
  });
});

describe("midiOf / tabOf / handHint", () => {
  const bbBarre = { frets: [-1, 1, 3, 3, 3, 1], barres: [1], baseFret: 1 };
  const highBarre = { frets: [1, 3, 3, 2, 1, 1], barres: [1], baseFret: 4 };

  it("converts relative frets to absolute notes and tab", () => {
    expect(midiOf({ frets: [-1, 3, 2, 0, 1, 0], barres: [], baseFret: 1 })).toEqual([48, 52, 55, 60, 64]);
    expect(tabOf(highBarre)).toBe("4 6 6 5 4 4");
  });

  it("describes the hand shape", () => {
    expect(handHint(bbBarre)).toContain("chặn cả cần ở ngăn 1");
    expect(handHint(highBarre)).toContain("ngăn 4");
    expect(handHint({ frets: [-1, 3, 2, 0, 1, 0], barres: [], baseFret: 1 })).toContain("không cần chặn");
  });
});

describe("difficultyOf / voicingsFor", () => {
  it("rates open shapes easy and full barres hard", () => {
    expect(difficultyOf({ frets: [-1, 3, 2, 0, 1, 0], barres: [], baseFret: 1 })).toBe("easy");
    expect(difficultyOf({ frets: [-1, 1, 3, 3, 3, 1], barres: [1], baseFret: 1 })).toBe("hard");
    expect(difficultyOf({ frets: [-1, -1, 1, 1, 1, 3], barres: [1], baseFret: 3 })).toBe("medium");
  });

  it("can order voicings easiest first", () => {
    const [first] = voicingsFor({ name: "Bbmaj7", easiestFirst: true });
    expect(difficultyOf(first)).not.toBe("hard");
  });
});
