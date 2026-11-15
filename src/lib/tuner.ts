// Tuning a guitar by ear-free numbers: which string a pitch belongs to and how far off it is.

/** Open strings as MIDI notes, low (6th string) to high (1st). */
export const TUNINGS = [
  { id: "standard", name: "Chuẩn (EADGBE)", strings: [40, 45, 50, 55, 59, 64] },
  { id: "drop-d", name: "Drop D (DADGBE)", strings: [38, 45, 50, 55, 59, 64] },
  { id: "half-down", name: "Hạ nửa cung (Eb)", strings: [39, 44, 49, 54, 58, 63] },
  { id: "dadgad", name: "DADGAD", strings: [38, 45, 50, 55, 57, 62] },
] as const;
export type Tuning = (typeof TUNINGS)[number];

/** Closer than this and the ear cannot tell a guitar string from in tune. */
export const IN_TUNE_CENTS = 5;

export const midiHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export const centsOff = ({ hz, midi }: { hz: number; midi: number }) => 1200 * Math.log2(hz / midiHz(midi));

/** Index of the string in `strings` whose open note is closest to `hz`. */
export function nearestString({ hz, strings }: { hz: number; strings: readonly number[] }): number {
  let best = 0;
  strings.forEach((midi, i) => {
    if (Math.abs(centsOff({ hz, midi })) < Math.abs(centsOff({ hz, midi: strings[best] }))) best = i;
  });
  return best;
}

export type Verdict = "low" | "high" | "in-tune";

export function verdict(cents: number): Verdict {
  if (Math.abs(cents) <= IN_TUNE_CENTS) return "in-tune";
  return cents < 0 ? "low" : "high";
}

/** Middle of the readings: one octave slip or pluck transient does not move it. */
export function median(xs: readonly number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
