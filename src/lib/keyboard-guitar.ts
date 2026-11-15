// Playing a song on the laptop keyboard: the left hand picks a chord, the right hand strums.
import type { ChordSheet } from "./chordsheet";

/** The song's chords in order go on the number row, then the Q row. */
export const CHORD_KEYS = [..."1234567890qwertyuiop"];

export type StrumDir = "down" | "up";
export type KeyAction = { kind: "chord"; index: number } | { kind: "strum"; dir: StrumDir } | { kind: "step"; by: 1 | -1 };

export function keyAction({ key, chordCount }: { key: string; chordCount: number }): KeyAction | null {
  switch (key) {
    case " ":
    case "ArrowDown":
      return { kind: "strum", dir: "down" };
    case "ArrowUp":
      return { kind: "strum", dir: "up" };
    case "ArrowRight":
      return { kind: "step", by: 1 };
    case "ArrowLeft":
      return { kind: "step", by: -1 };
  }
  const index = CHORD_KEYS.indexOf(key.toLowerCase());
  return index >= 0 && index < chordCount ? { kind: "chord", index } : null;
}

/** One chord mark in the lyrics: the line (`Line.index`) and the token it sits on. */
export type ChordStep = { line: number; token: number; chord: string };

export function chordSteps(sheet: ChordSheet): ChordStep[] {
  return sheet.flatMap((section) =>
    section.lines.flatMap((line) => line.tokens.flatMap((t, token) => (t.chord ? [{ line: line.index, token, chord: t.chord }] : []))),
  );
}

/** A down strum sounds every string low to high; an up strum catches only the top four, high to low. */
export function strumOrder({ midi, dir }: { midi: number[]; dir: StrumDir }): number[] {
  const low = [...midi].sort((x, y) => x - y);
  return dir === "down" ? low : low.slice(-4).reverse();
}

const FADE_SECONDS = 2.5; // until a string has faded by 60 dB

/**
 * A plucked string by Karplus-Strong: a burst of noise fed around a delay line one period long, averaged on each pass,
 * so the high harmonics die first and the note fades like a real string.
 */
export function pluckSamples({ midi, sampleRate, seconds }: { midi: number; sampleRate: number; seconds: number }): Float32Array<ArrayBuffer> {
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const period = Math.max(2, Math.round(sampleRate / freq));
  const loss = 0.001 ** (1 / (FADE_SECONDS * freq)); // per pass round the loop
  const out = new Float32Array(Math.round(sampleRate * seconds));
  let soft = 0;
  for (let i = 0; i < Math.min(period, out.length); i++) {
    soft = 0.6 * soft + 0.4 * (Math.random() * 2 - 1); // a softened noise burst sounds like a pick, not a scrape
    out[i] = soft;
  }
  for (let i = period; i < out.length; i++) out[i] = loss * 0.5 * (out[i - period] + out[Math.max(0, i - period - 1)]);
  return out;
}
