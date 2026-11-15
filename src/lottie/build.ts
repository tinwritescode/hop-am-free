// Lottie building blocks shared by the generators (Mầm's loader and the small effects).
import { svgToShapes } from "./svg";

export type Value = number | number[];
export const still = (k: Value) => ({ a: 0, k });
const EASE = { o: { x: [0.45], y: [0] }, i: { x: [0.55], y: [1] } };

/** An animated property through `list` of [frame, value], eased in and out at every key. */
export function keys(list: [number, Value][]) {
  return {
    a: 1,
    k: list.map(([t, v], n) => {
      const s = typeof v === "number" ? [v] : v;
      return n === list.length - 1 ? { t, s } : { t, s, ...EASE };
    }),
  };
}

/** A ♪ with its head at (0, 0), the same note Mầm's lantern sends up. */
export const note = ({ fill }: { fill: string }) =>
  svgToShapes(
    `<g fill="${fill}" stroke="#3A1B3E" stroke-width="1" stroke-linejoin="round"><path d="M2.6 0V-11q5 1 5 6-2-2.5-5-2.5"/><ellipse cx="0" cy="0" rx="3.4" ry="2.6"/></g>`,
  );
