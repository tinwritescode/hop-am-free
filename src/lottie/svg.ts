// Converts the plain SVG shapes Mầm and the hats are drawn with into Lottie shape groups, so the drawings stay the
// one source of truth. Handles what those drawings use: path (no arcs), ellipse, circle, rect, nested <g> with
// inherited fill, stroke and opacity. Anything else throws, so a new drawing feature is noticed, not dropped.
import { load } from "cheerio";

type Point = [number, number];
type Static<T> = { a: 0; k: T };
/** A Lottie shape-layer item: a group of one shape with its fill, stroke and transform. */
export type ShapeItem = Record<string, unknown> & { ty: string };

const still = <T>(k: T): Static<T> => ({ a: 0, k });

/** One subpath: absolute vertices with absolute in/out control points. */
type Subpath = { v: Point[]; i: Point[]; o: Point[]; closed: boolean };

const NUMBER = /[MmLlHhVvCcSsQqTtZzAa]|-?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/g;

/** Parses SVG path data into subpaths of cubic béziers. */
export function parsePath(d: string): Subpath[] {
  const tokens = d.match(NUMBER) ?? [];
  const paths: Subpath[] = [];
  let at = 0;
  let cmd = "";
  let cur: Point = [0, 0];
  let path: Subpath | null = null;
  let lastCubic: Point | null = null; // the previous segment's second control point, for S
  let lastQuad: Point | null = null; // the previous segment's control point, for T
  const num = () => Number(tokens[at++]);
  const isNum = () => at < tokens.length && !/[a-z]/i.test(tokens[at]);
  const curve = ({ c1, c2, to }: { c1: Point; c2: Point; to: Point }) => {
    if (!path) throw new Error(`path data draws before a move: ${d}`);
    path.o[path.o.length - 1] = c1;
    path.v.push(to);
    path.i.push(c2);
    path.o.push(to);
    cur = to;
  };
  const line = (to: Point) => curve({ c1: cur, c2: to, to });

  while (at < tokens.length) {
    if (!isNum()) cmd = tokens[at++];
    const rel = cmd === cmd.toLowerCase();
    const p = (x: number, y: number): Point => (rel ? [cur[0] + x, cur[1] + y] : [x, y]);
    const C = cmd.toUpperCase();
    let cubic: Point | null = null;
    let quad: Point | null = null;
    if (C === "M") {
      const to = p(num(), num());
      path = { v: [to], i: [to], o: [to], closed: false };
      paths.push(path);
      cur = to;
      cmd = rel ? "l" : "L"; // extra pairs after a move are lines
    } else if (C === "L") line(p(num(), num()));
    else if (C === "H") line([rel ? cur[0] + num() : num(), cur[1]]);
    else if (C === "V") line([cur[0], rel ? cur[1] + num() : num()]);
    else if (C === "C") {
      const [c1, c2, to] = [p(num(), num()), p(num(), num()), p(num(), num())];
      curve({ c1, c2, to });
      cubic = c2;
    } else if (C === "S") {
      const c1: Point = lastCubic ? [2 * cur[0] - lastCubic[0], 2 * cur[1] - lastCubic[1]] : cur;
      const [c2, to] = [p(num(), num()), p(num(), num())];
      curve({ c1, c2, to });
      cubic = c2;
    } else if (C === "Q" || C === "T") {
      const q: Point = C === "Q" ? p(num(), num()) : lastQuad ? [2 * cur[0] - lastQuad[0], 2 * cur[1] - lastQuad[1]] : cur;
      const from = cur;
      const to = p(num(), num());
      const third = (a: Point, b: Point): Point => [a[0] + (2 / 3) * (b[0] - a[0]), a[1] + (2 / 3) * (b[1] - a[1])];
      curve({ c1: third(from, q), c2: third(to, q), to });
      quad = q;
    } else if (C === "Z") {
      if (!path) throw new Error(`path data closes before a move: ${d}`);
      const [first, last] = [path.v[0], path.v[path.v.length - 1]];
      if (path.v.length > 1 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) {
        path.i[0] = path.i[path.i.length - 1];
        path.v.pop();
        path.i.pop();
        path.o.pop();
      }
      path.closed = true;
      cur = path.v[0];
    } else throw new Error(`unsupported path command ${cmd} in ${d}`);
    lastCubic = cubic;
    lastQuad = quad;
  }
  return paths;
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const minus = (a: Point, b: Point): Point => [round(a[0] - b[0]), round(a[1] - b[1])];

function lottiePath(s: Subpath): ShapeItem {
  return {
    ty: "sh",
    ks: still({ v: s.v.map(([x, y]) => [round(x), round(y)]), i: s.i.map((c, n) => minus(c, s.v[n])), o: s.o.map((c, n) => minus(c, s.v[n])), c: s.closed }),
  };
}

function color(value: string): [number, number, number, number] {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1];
  if (!hex) throw new Error(`unsupported colour ${value}`);
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const channel = (n: number) => round(parseInt(full.slice(2 * n, 2 * n + 2), 16) / 255);
  return [channel(0), channel(1), channel(2), 1];
}

const CAP: Record<string, number> = { butt: 1, round: 2, square: 3 };
const JOIN: Record<string, number> = { miter: 1, round: 2, bevel: 3 };

/** An element's attributes, then each ancestor's, nearest first. */
type Lineage = Readonly<Record<string, string>>[];

/** The style an element draws with: its own attributes over its ancestors'. */
function style(lineage: Lineage) {
  const own = (name: string) => lineage.find((a) => name in a)?.[name];
  return {
    fill: own("fill") ?? "#000000",
    stroke: own("stroke"),
    width: Number(own("stroke-width") ?? 1),
    cap: CAP[own("stroke-linecap") ?? "butt"],
    join: JOIN[own("stroke-linejoin") ?? "miter"],
    opacity: lineage.reduce((o, a) => o * Number(a.opacity ?? 1), 1),
  };
}

function geometry({ tag, attrs }: { tag: string; attrs: Readonly<Record<string, string>> }): ShapeItem[] {
  const n = (name: string) => Number(attrs[name] ?? 0);
  switch (tag) {
    case "path":
      return parsePath(attrs.d ?? "").map(lottiePath);
    case "ellipse":
      return [{ ty: "el", d: 1, p: still([n("cx"), n("cy")]), s: still([2 * n("rx"), 2 * n("ry")]) }];
    case "circle":
      return [{ ty: "el", d: 1, p: still([n("cx"), n("cy")]), s: still([2 * n("r"), 2 * n("r")]) }];
    case "rect":
      return [{ ty: "rc", d: 1, p: still([n("x") + n("width") / 2, n("y") + n("height") / 2]), s: still([n("width"), n("height")]), r: still(n("rx")) }];
    default:
      throw new Error(`not a shape: <${tag}>`);
  }
}

/** A Lottie group's own transform, here only ever an identity with an opacity. */
export function groupTransform(opacity = 100): ShapeItem {
  return { ty: "tr", p: still([0, 0]), a: still([0, 0]), s: still([100, 100]), r: still(0), o: still(opacity), sk: still(0), sa: still(0) };
}

/**
 * Lottie items for every drawn shape in `markup` (SVG elements, any nesting), topmost first as Lottie stacks them.
 * Each shape keeps its own group so its fill, stroke and opacity stay its own.
 */
export function svgToShapes(markup: string): ShapeItem[] {
  const $ = load(`<svg>${markup}</svg>`, { xml: true });
  const stray = $("svg *").not("g, path, ellipse, circle, rect").toArray()[0];
  if (stray) throw new Error(`unsupported SVG element <${stray.tagName}>`);
  return $("path, ellipse, circle, rect")
    .toArray()
    .map((node) => {
      const s = style([node.attribs, ...$(node).parents().toArray().map((p) => p.attribs)]);
      const paint: ShapeItem[] = [];
      if (s.stroke && s.stroke !== "none") paint.push({ ty: "st", c: still(color(s.stroke)), o: still(100), w: still(s.width), lc: s.cap, lj: s.join, ml: 4 });
      if (s.fill !== "none") paint.push({ ty: "fl", c: still(color(s.fill)), o: still(100), r: 1 });
      return { ty: "gr", nm: node.tagName, it: [...geometry({ tag: node.tagName, attrs: node.attribs }), ...paint, groupTransform(round(s.opacity * 100))] };
    })
    .reverse();
}
