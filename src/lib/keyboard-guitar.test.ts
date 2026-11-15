import { describe, expect, it } from "vitest";
import { parseChordSheet } from "./chordsheet";
import { chordSteps, keyAction, pluckSamples, strumOrder } from "./keyboard-guitar";

describe("keyAction", () => {
  it("maps the number row, then the Q row, to the song's chords in order", () => {
    expect(keyAction({ key: "1", chordCount: 5 })).toEqual({ kind: "chord", index: 0 });
    expect(keyAction({ key: "0", chordCount: 12 })).toEqual({ kind: "chord", index: 9 });
    expect(keyAction({ key: "w", chordCount: 12 })).toEqual({ kind: "chord", index: 11 });
    expect(keyAction({ key: "W", chordCount: 12 })).toEqual({ kind: "chord", index: 11 });
  });

  it("ignores a chord key past the song's last chord", () => {
    expect(keyAction({ key: "6", chordCount: 5 })).toBeNull();
  });

  it("strums with Space and the up/down arrows, and walks the song with left/right", () => {
    expect(keyAction({ key: " ", chordCount: 3 })).toEqual({ kind: "strum", dir: "down" });
    expect(keyAction({ key: "ArrowDown", chordCount: 3 })).toEqual({ kind: "strum", dir: "down" });
    expect(keyAction({ key: "ArrowUp", chordCount: 3 })).toEqual({ kind: "strum", dir: "up" });
    expect(keyAction({ key: "ArrowRight", chordCount: 3 })).toEqual({ kind: "step", by: 1 });
    expect(keyAction({ key: "ArrowLeft", chordCount: 3 })).toEqual({ kind: "step", by: -1 });
    expect(keyAction({ key: "x", chordCount: 3 })).toBeNull();
  });
});

describe("chordSteps", () => {
  it("lists every chord in the lyrics in reading order, repeats included", () => {
    const sheet = parseChordSheet("## Verse\n[C] Một [G] hai\n[Am] ba\n\n[C] bốn");
    expect(chordSteps(sheet)).toEqual([
      { line: 0, token: 0, chord: "C" },
      { line: 0, token: 1, chord: "G" },
      { line: 1, token: 0, chord: "Am" },
      { line: 2, token: 0, chord: "C" },
    ]);
  });
});

describe("strumOrder", () => {
  const midi = [48, 52, 55, 60, 64]; // C major, string 5 to 1
  it("plays every string low to high on a down strum", () => {
    expect(strumOrder({ midi, dir: "down" })).toEqual([48, 52, 55, 60, 64]);
  });
  it("plays the top strings high to low on an up strum", () => {
    expect(strumOrder({ midi, dir: "up" })).toEqual([64, 60, 55, 52]);
  });
});

describe("pluckSamples", () => {
  const sampleRate = 8000;
  const energy = (s: Float32Array) => s.reduce((sum, x) => sum + x * x, 0);
  it("rings at the note's pitch and dies away", () => {
    const samples = pluckSamples({ midi: 57, sampleRate, seconds: 2 }); // A3, 220 Hz
    expect(samples.length).toBe(16000);
    const tenth = samples.length / 10;
    expect(energy(samples.subarray(-tenth))).toBeLessThan(energy(samples.subarray(0, tenth)) / 20);
    // One period of 220 Hz is ~36 samples: the wave repeats itself there, not half a period later.
    const window = samples.subarray(800, 1600);
    const lagCorrelation = (lag: number) => window.subarray(0, 700).reduce((s, x, i) => s + x * window[i + lag], 0);
    expect(lagCorrelation(36)).toBeGreaterThan(lagCorrelation(18));
  });
});
