// Tab steps in words, for players who do not read tab yet.
import type { TabStep, Technique } from "./parse";

/** Right-hand fingers in classical naming: p thumb, i index, m middle, a ring. */
export const FINGERS = {
  p: { name: "Ngón cái", strings: "dây 6, 5, 4" },
  i: { name: "Ngón trỏ", strings: "dây 3" },
  m: { name: "Ngón giữa", strings: "dây 2" },
  a: { name: "Ngón áp út", strings: "dây 1" },
} as const;
export type Finger = keyof typeof FINGERS;
export const FINGER_ORDER: readonly Finger[] = ["p", "i", "m", "a"];

/** The usual fingerstyle split: thumb on the bass strings, one finger per treble string. */
export const fingerOf = (string: number): Finger => (string <= 2 ? "p" : string === 3 ? "i" : string === 4 ? "m" : "a");

/** Guitarists count strings from the high e (dây 1) to the low E (dây 6). */
export const stringNumber = (string: number) => 6 - string;

export const TECHNIQUE: Record<Technique, { says: string; mark: string }> = {
  hammer: { says: "luyến lên", mark: "h" },
  pull: { says: "luyến xuống", mark: "p" },
  "slide-up": { says: "vuốt lên", mark: "/" },
  "slide-down": { says: "vuốt xuống", mark: "\\" },
};

export function describeStep(step: TabStep): string[] {
  const lines = step.notes.map((n) => {
    const who = FINGERS[fingerOf(n.string)].name;
    if (n.kind === "dead") return `${who}: chặn tiếng dây ${stringNumber(n.string)} (x)`;
    const where = `dây ${stringNumber(n.string)} ${n.fret === 0 ? "buông" : `phím ${n.fret}`}`;
    return `${who}: ${where}${n.via ? `, ${TECHNIQUE[n.via].says} (${TECHNIQUE[n.via].mark})` : ""}`;
  });
  return step.thump ? [...lines, "Đập cổ tay xuống dây (o)"] : lines;
}
