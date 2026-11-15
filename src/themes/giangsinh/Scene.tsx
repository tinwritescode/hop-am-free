// Giáng Sinh scene strip: snowy hills, snow-capped pines, a cottage with a warm window and a lit Christmas tree, snow falling.
// Day/night differences come only from the scene tokens (--sky1/2, --orb, --star, --hill, --hill-far, --pine, --pine-far, --wall, --roof, --win, --lights, --snow, --snow-o).

const TILE = 1440; // the art repeats every 1440px so wide screens never show an empty edge
const OFFSETS = [0, TILE, 2 * TILE];

const FAR_HILL = "M0 92C120 76 240 74 360 84S600 98 720 86S960 68 1080 78S1320 96 1440 92V132H0Z";
const NEAR_HILL = "M0 116C160 108 300 104 440 110S700 122 860 114S1160 100 1300 108S1420 116 1440 116V132H0Z";

// [x, base y, height]
const FAR_PINES = [
  [60, 88, 30],
  [86, 86, 38],
  [300, 84, 32],
  [326, 85, 26],
  [610, 90, 34],
  [980, 76, 36],
  [1006, 78, 28],
  [1250, 90, 32],
  [1276, 92, 40],
];
const NEAR_PINES = [
  [30, 120, 54],
  [70, 118, 40],
  [470, 116, 50],
  [760, 122, 46],
  [800, 120, 60],
  [1150, 112, 52],
  [1390, 120, 48],
];
const STARS = [
  [50, 26],
  [190, 12],
  [350, 36],
  [520, 18],
  [690, 42],
  [870, 14],
  [1030, 32],
  [1210, 10],
  [1330, 40],
  [1410, 20],
];
const LIGHT_COLOURS = ["#FF5A5A", "#FFD23F", "#5AC8FF", "#8EE07A"];
// [x, y] of the bulbs on the big tree, relative to its base.
const BULBS = [
  [-6, -52],
  [5, -44],
  [-10, -36],
  [8, -28],
  [-14, -20],
  [13, -14],
  [-3, -24],
  [2, -9],
];
// Repeatable scatter for the snowflakes: [x, r, fall seconds, delay seconds]. Negative delays spread them down the strip from the first frame.
const FLAKES = Array.from({ length: 48 }, (_, i) => [(i * 211) % TILE, 1 + (i % 3) * 0.6, 7 + (i % 5) * 1.5, -((i * 0.73 * 7) % 11)]);

/** A snow-capped pine standing on (x, y). */
function Pine({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) {
  const w = h * 0.42;
  return (
    <g>
      <path d={`M${x} ${y - h}L${x + w} ${y - h * 0.08}H${x - w}Z`} style={{ fill }} />
      <path d={`M${x} ${y - h}L${x + w * 0.32} ${y - h * 0.7}q-${w * 0.16} 3-${w * 0.32} 0q-${w * 0.16} 3-${w * 0.32} 0Z`} style={{ fill: "var(--hill)" }} />
      <rect x={x - w * 0.12} y={y - h * 0.08} width={w * 0.24} height={h * 0.08} fill="#5B3A24" />
    </g>
  );
}

function Cottage({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="40" y="-48" width="8" height="16" style={{ fill: "var(--wall)" }} />
      <rect y="-26" width="60" height="26" style={{ fill: "var(--wall)" }} />
      <path d="M-6-24L30-46L66-24Z" style={{ fill: "var(--roof)" }} />
      <rect x="10" y="-18" width="12" height="11" rx="1.5" style={{ fill: "var(--win)" }} />
      <rect x="38" y="-18" width="12" height="18" rx="1.5" fill="#5B3A24" />
    </g>
  );
}

function ChristmasTree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0-62L14-40H8L20-20H12L24 0H-24L-12-20H-20L-8-40H-14Z" style={{ fill: "var(--pine)" }} />
      <g style={{ opacity: "var(--lights)" }}>
        {BULBS.map(([bx, by], i) => (
          <circle key={i} className="anim-twinkle" style={{ animationDelay: `${-0.3 * i}s` }} cx={bx} cy={by} r="2.2" fill={LIGHT_COLOURS[i % LIGHT_COLOURS.length]} />
        ))}
      </g>
      <path d="M0-71l2 4.4 4.8.5-3.6 3.2 1 4.7L0-60.6l-4.2 2.4 1-4.7-3.6-3.2 4.8-.5z" className="anim-lit" fill="#F2C14E" />
    </g>
  );
}

function Tile({ dx }: { dx: number }) {
  return (
    <g transform={`translate(${dx},0)`}>
      <g style={{ opacity: "var(--star)" }}>
        {STARS.map(([cx, cy], i) => (
          <circle key={i} className="anim-twinkle" style={{ animationDelay: `${-0.41 * i}s` }} cx={cx} cy={cy} r="1.3" fill="#F3EED8" />
        ))}
      </g>
      <path d={FAR_HILL} style={{ fill: "var(--hill-far)" }} />
      {FAR_PINES.map(([x, y, h]) => (
        <Pine key={x} x={x} y={y} h={h} fill="var(--pine-far)" />
      ))}
      <Cottage x={560} y={112} />
      <path d={NEAR_HILL} style={{ fill: "var(--hill)" }} />
      {NEAR_PINES.map(([x, y, h]) => (
        <Pine key={x} x={x} y={y} h={h} fill="var(--pine)" />
      ))}
      <ChristmasTree x={660} y={114} />
      <g style={{ fill: "var(--snow)", opacity: "var(--snow-o)" }}>
        {FLAKES.map(([x, r, fall, delay]) => (
          <circle key={x} className="anim-snow" style={{ animationDuration: `${fall}s`, animationDelay: `${delay}s` }} cx={x} cy="-6" r={r} />
        ))}
      </g>
    </g>
  );
}

export function GiangsinhScene() {
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(var(--sky1), var(--sky2))" }}>
      <svg
        width={OFFSETS.length * TILE}
        height="132"
        viewBox={`0 0 ${OFFSETS.length * TILE} 132`}
        className="absolute top-0 left-1/2 max-w-none -translate-x-1/2"
      >
        <circle className="anim-lit" cx={TILE + 1100} cy="32" r="15" style={{ fill: "var(--orb)" }} />
        {OFFSETS.map((dx) => (
          <Tile key={dx} dx={dx} />
        ))}
      </svg>
    </div>
  );
}
