import { describe, expect, it } from "vitest";
import { type Capo, capoColumns, mayReplace, capoForTranspose, capoFromColumns, CapoDraftSchema, CapoGuessSchema, checkCapoGuess, parseCapoMention, soundingKey } from "./capo";

describe("parseCapoMention", () => {
  it.each([
    ["Capo 3", 3],
    ["capo: 2", 2],
    ["(Capo 5)", 5],
    ["CAPO ngăn 3", 3],
    ["kẹp capo 2 cho dễ hát", 2],
    ["Kẹp Capo ở ngăn số 4", 4],
    ["capo phím 1", 1],
    ["Capo on 2nd fret", 2],
    ["capo at the 3rd fret", 3],
    ["Capo fret 7", 7],
    ["capo 0", 0],
    ["## Intro\n[Capo 2]\n[C]Lời bài [G]hát", 2],
  ])("%s → %d", (text, fret) => {
    expect(parseCapoMention(text)).toBe(fret);
  });

  it.each([
    ["no mention", "[C]Lời bài [G]hát"],
    ["out of range", "Capo 12"],
    ["two digits glued", "capo 30"],
    ["a word, not capo", "capon 3"],
    ["conflicting values", "Capo 2 hoặc capo 4"],
  ])("%s → null", (_, text) => {
    expect(parseCapoMention(text)).toBeNull();
  });

  it("accepts the same value stated twice", () => {
    expect(parseCapoMention("Capo 3\n...\n(capo 3)")).toBe(3);
  });
});

describe("soundingKey", () => {
  it("adds the capo to the shape key", () => {
    expect(soundingKey({ key: "C", fret: 3 })).toBe("Eb");
    expect(soundingKey({ key: "Am", fret: 2 })).toBe("Bm");
    expect(soundingKey({ key: "G", fret: 0 })).toBe("G");
    expect(soundingKey({ key: "A", fret: 5 })).toBe("D");
  });
});

describe("capoForTranspose", () => {
  it("keeps the sounding key when the chords move", () => {
    expect(capoForTranspose({ fret: 3, semitones: 0 })).toBe(3);
    expect(capoForTranspose({ fret: 3, semitones: -3 })).toBe(6);
    expect(capoForTranspose({ fret: 3, semitones: 3 })).toBe(0);
    expect(capoForTranspose({ fret: 0, semitones: -5 })).toBe(5);
  });

  it("is null when no capo between 0 and 11 keeps the pitch", () => {
    expect(capoForTranspose({ fret: 3, semitones: 4 })).toBeNull();
    expect(capoForTranspose({ fret: 0, semitones: -12 })).toBeNull();
  });

  it("C shapes with capo 3 sound like A shapes with the capo it returns", () => {
    const fret = capoForTranspose({ fret: 3, semitones: -3 });
    expect(fret).not.toBeNull();
    expect(soundingKey({ key: "A", fret: fret ?? -1 })).toBe(soundingKey({ key: "C", fret: 3 }));
  });
});

describe("columns", () => {
  it("round-trips a known capo", () => {
    const capo: Capo = { fret: 4, source: "ai" };
    expect(capoFromColumns(capoColumns(capo))).toEqual(capo);
  });

  it("reads unknown and editor-cleared rows as unknown", () => {
    expect(capoFromColumns({ capo: null, capoSource: null })).toBeNull();
    expect(capoFromColumns({ capo: null, capoSource: "editor" })).toBeNull();
    expect(capoColumns(null)).toEqual({ capo: null, capoSource: null });
  });

  it("rejects rows the database constraint forbids", () => {
    expect(() => capoFromColumns({ capo: 3, capoSource: null })).toThrow();
    expect(() => capoFromColumns({ capo: null, capoSource: "ai" })).toThrow();
    expect(() => capoFromColumns({ capo: 12, capoSource: "sheet" })).toThrow();
  });
});

describe("CapoDraftSchema", () => {
  it("reads a bare number as set by the editor", () => {
    expect(CapoDraftSchema.parse(3)).toEqual({ fret: 3, source: "editor" });
  });

  it("keeps a capo the source sheet states", () => {
    expect(CapoDraftSchema.parse({ fret: 2, source: "sheet" })).toEqual({ fret: 2, source: "sheet" });
  });

  it("defaults to unknown and refuses AI as a draft source", () => {
    expect(CapoDraftSchema.parse(undefined)).toBeNull();
    expect(CapoDraftSchema.safeParse({ fret: 2, source: "ai" }).success).toBe(false);
    expect(CapoDraftSchema.safeParse(12).success).toBe(false);
    expect(CapoDraftSchema.safeParse(1.5).success).toBe(false);
  });
});

describe("checkCapoGuess", () => {
  const guess = (over: object) => CapoGuessSchema.parse({ capo: 3, confidence: "high", soundingKey: "Eb", reason: "bản thu ở Eb", ...over });

  it("keeps high and medium guesses whose sounding key matches", () => {
    expect(checkCapoGuess({ key: "C", guess: guess({}) })).toEqual({ kind: "store", fret: 3 });
    expect(checkCapoGuess({ key: "C", guess: guess({ confidence: "medium", soundingKey: "D#" }) })).toEqual({ kind: "store", fret: 3 });
  });

  it("skips low confidence, unknown recordings and inconsistent keys", () => {
    expect(checkCapoGuess({ key: "C", guess: guess({ confidence: "low" }) })).toEqual({ kind: "skip", why: "low" });
    expect(checkCapoGuess({ key: "C", guess: guess({ capo: null, soundingKey: null }) })).toEqual({ kind: "skip", why: "unknown" });
    expect(checkCapoGuess({ key: "C", guess: guess({ soundingKey: "E" }) })).toEqual({ kind: "skip", why: "mismatch" });
    expect(checkCapoGuess({ key: "Am", guess: guess({ soundingKey: "Eb" }) })).toEqual({ kind: "skip", why: "mismatch" });
  });
});

describe("mayReplace", () => {
  it("lets an editor override anything, the sheet override AI, and AI fill only unknowns", () => {
    expect(mayReplace({ existing: null, incoming: "ai" })).toBe(true);
    expect(mayReplace({ existing: "ai", incoming: "ai" })).toBe(false);
    expect(mayReplace({ existing: "ai", incoming: "sheet" })).toBe(true);
    expect(mayReplace({ existing: "sheet", incoming: "sheet" })).toBe(false);
    expect(mayReplace({ existing: "editor", incoming: "sheet" })).toBe(false);
    expect(mayReplace({ existing: "sheet", incoming: "editor" })).toBe(true);
    expect(mayReplace({ existing: "editor", incoming: "editor" })).toBe(true);
  });
});
