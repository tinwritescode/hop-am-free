// Builds the page-loading Lottie of Mầm for one skin, from the same drawings the site renders
// (MascotArt and the skin's Hat), so the animation never drifts from the mascot. Regenerate with `pnpm lottie`.
import { load } from "cheerio";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MascotArt } from "@/components/MascotArt";
import type { Skin } from "@/themes/types";
import { keys, note, still, type Value } from "./build";
import { INTRO, PAD } from "./frame";
import { svgToShapes, type ShapeItem } from "./svg";

const FPS = 60;
const LOOP = 120; // two strides
const END = INTRO + LOOP;

/**
 * A looping wave: `values` in turn every `step` frames, the first at loop frame `phase`. Keys start before the loop
 * and run past its end, so the seam lands mid-motion with the same pose and speed on both sides.
 */
function cycle({ values, step, phase = 0 }: { values: Value[]; step: number; phase?: number }) {
  if (LOOP % (step * values.length)) throw new Error(`a ${step}-frame cycle of ${values.length} does not divide the loop`);
  const list: [number, Value][] = [];
  for (let k = -1; phase + (k - 1) * step <= LOOP; k++) list.push([INTRO + phase + k * step, values[k < 0 ? values.length - 1 : k % values.length]]);
  return keys(list);
}

/** Keeps a point of the drawing where it is while the layer turns or scales around it. */
const pin = ([x, y]: [number, number]) => ({ a: still([x, y]), p: still([x, y]) });

let nextInd = 1;
function layer({ nm, parent, ks, shapes, ind = nextInd++ }: { nm: string; parent?: number; ks: Record<string, unknown>; shapes?: ShapeItem[]; ind?: number }) {
  const base = { o: still(100), r: still(0), p: still([0, 0]), a: still([0, 0]), s: still([100, 100]) };
  return { ddd: 0, ind, ty: shapes ? 4 : 3, nm, sr: 1, ks: { ...base, ...ks }, ao: 0, ip: 0, op: END, st: 0, bm: 0, ...(parent ? { parent } : {}), ...(shapes ? { shapes } : {}) };
}

/** Mầm's drawing split into the parts that move on their own. */
function parts() {
  const $ = load(renderToStaticMarkup(createElement(MascotArt, { hat: null })), { xml: true });
  const kids = $("svg").children().toArray();
  const tags = kids.map((k) => k.tagName).join(" ");
  if (tags !== "ellipse ellipse ellipse g path circle circle path g g") throw new Error(`MascotArt changed shape (${tags}); update parts()`);
  const [footL, footR, body, eyes, mouth, cheekL, cheekR, arm, lantern, sprout] = kids.map((k) => $.xml(k));
  return { footL, footR, face: body + mouth + cheekL + cheekR + arm, eyes, lantern, sprout };
}

/** One ♪ rising from the lantern and fading, starting at loop frame `at`. */
function rising({ nm, parent, at, fill, drift }: { nm: string; parent: number; at: number; fill: string; drift: number }) {
  const t = INTRO + at;
  return layer({
    nm,
    parent,
    shapes: note({ fill }),
    ks: {
      p: keys([
        [t, [76, 80]],
        [t + 50, [80 + drift, 38]],
      ]),
      r: keys([
        [t, -14],
        [t + 50, 12],
      ]),
      s: keys([
        [t, [40, 40]],
        [t + 16, [100, 100]],
      ]),
      o: keys([
        [t, 0],
        [t + 12, 100],
        [t + 36, 100],
        [t + 50, 0],
      ]),
    },
  });
}

/** The loading animation: Mầm pops up, the sprout grows, then it trots in place swinging its lantern while notes rise. */
export function mamLottie(skin: Skin) {
  nextInd = 1;
  const p = parts();
  const root = layer({
    nm: "Mầm",
    ks: {
      a: still([40, 92]),
      p: still([40 + PAD.left, 92 + PAD.top]),
      s: keys([
        [0, [0, 0]],
        [12, [108, 94]],
        [18, [96, 104]],
        [INTRO, [100, 100]],
      ]),
    },
  });
  const body = layer({
    nm: "body",
    parent: root.ind,
    shapes: svgToShapes(p.face),
    ks: {
      a: still([40, 88]),
      p: cycle({ values: [[40, 89], [40, 85]], step: 15 }),
      s: cycle({ values: [[104, 96], [98, 103]], step: 15 }),
      r: cycle({ values: [3, -3], step: 30, phase: 15 }),
    },
  });
  const hat = layer({ nm: "hat", parent: body.ind, shapes: svgToShapes(renderToStaticMarkup(createElement(skin.Hat))), ks: { ...pin([40, 40]), r: cycle({ values: [-2, 2], step: 30, phase: 19 }) } });
  const sprout = layer({
    nm: "sprout",
    parent: hat.ind,
    shapes: svgToShapes(p.sprout),
    ks: {
      ...pin([40, 16]),
      r: cycle({ values: [-9, 9], step: 30, phase: 23 }),
      s: keys([
        [0, [0, 0]],
        [6, [0, 0]],
        [20, [125, 125]],
        [28, [92, 92]],
        [34, [100, 100]],
      ]),
    },
  });
  const glow = svgToShapes(`<g fill="#F7B538"><ellipse cx="71" cy="84" rx="12" ry="13" opacity=".18"/><ellipse cx="71" cy="84" rx="9" ry="10" opacity=".3"/></g>`);
  const pulse = { ty: "tr", ...pin([71, 84]), s: cycle({ values: [[100, 100], [135, 135]], step: 15, phase: 2 }), r: still(0), o: cycle({ values: [55, 100], step: 15, phase: 2 }), sk: still(0), sa: still(0) };
  const lantern = layer({
    nm: "lantern",
    parent: body.ind,
    shapes: [...svgToShapes(p.lantern), { ty: "gr", nm: "glow", it: [...glow, pulse] }],
    ks: { ...pin([71, 76]), r: cycle({ values: [-16, 16], step: 30, phase: 2 }) },
  });
  const eyes = layer({
    nm: "eyes",
    parent: body.ind,
    shapes: svgToShapes(p.eyes),
    ks: {
      ...pin([40, 58]),
      s: keys([
        [0, [100, 100]],
        [INTRO + 92, [100, 100]],
        [INTRO + 96, [100, 10]],
        [INTRO + 100, [100, 100]],
      ]),
    },
  });
  const foot = ({ nm, svg, x, phase }: { nm: string; svg: string; x: number; phase: number }) =>
    layer({ nm, parent: root.ind, shapes: svgToShapes(svg), ks: { a: still([x, 89]), p: cycle({ values: [[x, 89], [x, 85.5], [x, 89], [x, 89]], step: 15, phase }) } });
  const shadow = layer({
    nm: "shadow",
    parent: root.ind,
    shapes: svgToShapes(`<ellipse cx="40" cy="92" rx="20" ry="3" fill="#3A1B3E" opacity=".14"/>`),
    ks: { ...pin([40, 92]), s: cycle({ values: [[100, 100], [84, 100]], step: 15 }) },
  });
  const layers = [
    rising({ nm: "note 2", parent: root.ind, at: 66, fill: "#6DBF7B", drift: 12 }),
    rising({ nm: "note 1", parent: root.ind, at: 6, fill: "#F7B538", drift: 6 }),
    sprout,
    hat,
    lantern,
    eyes,
    body,
    foot({ nm: "right foot", svg: p.footR, x: 48, phase: 30 }),
    foot({ nm: "left foot", svg: p.footL, x: 32, phase: 0 }),
    shadow,
    root,
  ];
  return {
    v: "5.12.0",
    fr: FPS,
    ip: 0,
    op: END,
    w: 80 + PAD.left + PAD.right,
    h: 96 + PAD.top + PAD.bottom,
    nm: `Mầm (${skin.name})`,
    ddd: 0,
    assets: [],
    layers,
  };
}
