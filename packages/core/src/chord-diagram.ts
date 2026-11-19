// A chord diagram as plain shapes, so the web (SVG) and the app (react-native-svg) draw the same picture.
import { barreRanges, type Position } from "./chords";

const SX = 24; // string spacing
const FY = 26; // fret spacing
const LEFT = 24; // room for the "5fr" label
const TOP = 22; // room for × / ○ marks
const ROWS = 5;
const R = 8.5;

/** What a shape is painted with; each renderer maps these to its own colours. `color` is the chord's highlight. */
export type Paint = "ink" | "soft" | "surface" | "color";

export type Shape =
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx?: number; paint: Paint }
  | { kind: "dot"; cx: number; cy: number; r: number; paint: Paint }
  | { kind: "ring"; cx: number; cy: number; r: number; paint: Paint }
  | { kind: "text"; x: number; y: number; text: string; size: number; weight?: number; anchor: "middle" | "end"; paint: Paint };

export const DIAGRAM_WIDTH = LEFT + 5 * SX + 12;
export const DIAGRAM_HEIGHT = TOP + ROWS * FY + 8;

export function diagramShapes({ position, showFingers }: { position: Position; showFingers: boolean }): Shape[] {
  const { frets, fingers = [], baseFret } = position;
  const spans = barreRanges(position);
  const underBarre = (i: number, f: number) => spans.some((s) => s.fret === f && i >= s.from && i <= s.to);
  const finger = (i: number, x: number, y: number): Shape[] =>
    showFingers && fingers[i] > 0 ? [{ kind: "text", x, y: y + 4, text: String(fingers[i]), size: 11, weight: 800, anchor: "middle", paint: "surface" }] : [];
  const nut = baseFret === 1;

  return [
    ...Array.from({ length: ROWS + 1 }, (_, j): Shape => ({
      kind: "rect",
      x: LEFT,
      y: TOP + j * FY - (j === 0 && nut ? 2 : 0.5),
      width: 5 * SX,
      height: j === 0 && nut ? 4 : 1,
      paint: "ink",
    })),
    ...Array.from({ length: 6 }, (_, i): Shape => ({ kind: "rect", x: LEFT + i * SX - 0.6, y: TOP, width: 1.2, height: ROWS * FY, paint: "ink" })),
    ...(nut ? [] : [{ kind: "text", x: LEFT - 6, y: TOP + FY / 2 + 4, text: `${baseFret}fr`, size: 11, weight: 700, anchor: "end", paint: "soft" } satisfies Shape]),
    ...spans.flatMap((s): Shape[] => {
      const y = TOP + (s.fret - 0.5) * FY;
      return [{ kind: "rect", x: LEFT + s.from * SX - R, y: y - R, width: (s.to - s.from) * SX + 2 * R, height: 2 * R, rx: R, paint: "color" }, ...finger(s.from, LEFT + s.from * SX, y)];
    }),
    ...frets.flatMap((f, i): Shape[] => {
      const x = LEFT + i * SX;
      if (f < 0) return [{ kind: "text", x, y: TOP - 7, text: "×", size: 13, anchor: "middle", paint: "soft" }];
      if (f === 0) return [{ kind: "ring", cx: x, cy: TOP - 11, r: 4.5, paint: "soft" }];
      if (underBarre(i, f)) return [];
      const y = TOP + (f - 0.5) * FY;
      return [{ kind: "dot", cx: x, cy: y, r: R, paint: "color" }, ...finger(i, x, y)];
    }),
  ];
}
