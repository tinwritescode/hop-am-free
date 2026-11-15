// Small one-shot Lottie effects, generated like Mầm's loader: `pnpm lottie` writes src/lottie/fx-<id>.json.
import { keys, note, still } from "./build";
import { svgToShapes, type ShapeItem } from "./svg";

const FPS = 60;
export const EFFECT_IDS = ["notes", "confetti"] as const;
export type EffectId = (typeof EFFECT_IDS)[number];

/** Gold, green and coral: the colours Mầm's lantern notes already use. */
const NOTE_COLOURS = ["#F7B538", "#6DBF7B", "#E8664A"];
const CONFETTI_COLOURS = ["#F7B538", "#6DBF7B", "#E8664A", "#4FA3D9", "#B5485A", "#FFFFFF"];

type Fade = ReturnType<typeof keys>;
type Layer = { ind: number; ks: { o: Fade } & Record<string, unknown>; shapes: ShapeItem[] } & Record<string, unknown>;

const layer = ({ ind, nm, op, ks, shapes }: { ind: number; nm: string; op: number; ks: { o: Fade } & Record<string, unknown>; shapes: ShapeItem[] }): Layer => ({
  ddd: 0,
  ind,
  ty: 4,
  nm,
  sr: 1,
  ks: { r: still(0), a: still([0, 0]), s: still([100, 100]), ...ks },
  ao: 0,
  ip: 0,
  op,
  st: 0,
  bm: 0,
  shapes,
});

/** Repeatable "random" numbers in [0, 1), so the generated file only changes when the code does. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

/** Six ♪ burst out of the tapped chord and fade: 0.6 s on a 100×100 stage. */
function notes() {
  const op = 36;
  const layers = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * 2 * Math.PI - Math.PI / 2 + 0.3;
    const [x, y] = [50 + Math.cos(angle) * 38, 50 + Math.sin(angle) * 38];
    return layer({
      ind: i + 1,
      nm: `note ${i + 1}`,
      op,
      shapes: note({ fill: NOTE_COLOURS[i % NOTE_COLOURS.length] }),
      ks: {
        p: keys([
          [0, [50, 50]],
          [op, [x, y]],
        ]),
        r: keys([
          [0, i % 2 ? -20 : 20],
          [op, i % 2 ? 15 : -15],
        ]),
        s: keys([
          [0, [30, 30]],
          [12, [110, 110]],
          [op, [90, 90]],
        ]),
        o: keys([
          [0, 0],
          [6, 100],
          [22, 100],
          [op, 0],
        ]),
      },
    });
  });
  return { w: 100, h: 100, op, layers };
}

/** Paper confetti thrown up from the button, then tumbling down and fading: 1.5 s on a 320×320 stage. */
function confetti() {
  const op = 90;
  const rand = seeded(7);
  const layers = Array.from({ length: 28 }, (_, i) => {
    const spread = (rand() - 0.5) * 2; // -1 left … 1 right
    const lift = 90 + rand() * 90;
    const peakAt = 22 + Math.round(rand() * 10);
    const [x0, y0] = [160, 210];
    const peak = [x0 + spread * 110, y0 - lift];
    const land = [x0 + spread * 150, y0 - lift + 90 + rand() * 60];
    const spin = (rand() > 0.5 ? 1 : -1) * (360 + Math.round(rand() * 360));
    const [w, h] = rand() > 0.5 ? [8, 4] : [5, 5];
    return layer({
      ind: i + 1,
      nm: `bit ${i + 1}`,
      op,
      shapes: svgToShapes(`<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${CONFETTI_COLOURS[i % CONFETTI_COLOURS.length]}" stroke="#3A1B3E" stroke-width=".6"/>`),
      ks: {
        p: keys([
          [0, [x0, y0]],
          [peakAt, peak],
          [op, land],
        ]),
        r: keys([
          [0, 0],
          [op, spin],
        ]),
        s: keys([
          [0, [40, 40]],
          [10, [120, 120]],
          [op, [100, 100]],
        ]),
        o: keys([
          [0, 0],
          [4, 100],
          [60, 100],
          [op, 0],
        ]),
      },
    });
  });
  return { w: 320, h: 320, op, layers };
}

export function effectLottie(id: EffectId) {
  const { w, h, op, layers } = id === "notes" ? notes() : confetti();
  return { v: "5.12.0", fr: FPS, ip: 0, op, w, h, nm: id, ddd: 0, assets: [], layers };
}
