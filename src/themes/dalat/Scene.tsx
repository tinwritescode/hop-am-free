// Đà Lạt scene strip: layered pine hills in drifting mist, two pastel villas and swaying dã quỳ, pale sun by day, moon and stars by night.
// Day/night differences come only from the scene tokens (--sky1/2, --orb, --star, --mist, --mist-o, --hill, --pine-far, --pine, --wall, --wall2, --roof, --win, --flower).

const TILE = 1440; // the art repeats every 1440px so wide screens never show an empty edge
const OFFSETS = [0, TILE, 2 * TILE];

const FAR_RIDGE = "M0 80C110 66 210 64 320 74S520 86 640 72S860 56 980 66S1230 86 1330 74S1420 78 1440 80V132H0Z";
const NEAR_RIDGE = "M0 112C140 108 260 100 380 106S600 116 720 108S940 96 1060 102S1300 116 1440 112V132H0Z";

// [x, base y, height]. Each base sits a little under its ridge line, so the ridge drawn after it hides the trunk.
const FAR_PINES = [
  [18, 88, 26],
  [40, 86, 36],
  [60, 84, 28],
  [96, 80, 32],
  [118, 78, 24],
  [200, 77, 30],
  [222, 77, 38],
  [246, 77, 26],
  [290, 80, 30],
  [530, 85, 28],
  [556, 85, 36],
  [590, 82, 26],
  [700, 76, 32],
  [724, 74, 40],
  [748, 72, 30],
  [790, 70, 36],
  [816, 70, 44],
  [840, 70, 30],
  [880, 71, 34],
  [940, 72, 28],
  [1060, 79, 30],
  [1090, 81, 36],
  [1118, 83, 26],
  [1270, 85, 30],
  [1296, 84, 38],
  [1324, 82, 28],
  [1380, 85, 32],
  [1416, 87, 26],
];
const NEAR_PINES = [
  [14, 120, 52],
  [44, 118, 66],
  [76, 117, 44],
  [230, 112, 58],
  [262, 112, 46],
  [300, 112, 40],
  [420, 116, 48],
  [452, 117, 38],
  [566, 120, 44],
  [740, 116, 56],
  [772, 114, 42],
  [860, 110, 50],
  [892, 108, 66],
  [924, 108, 48],
  [1020, 108, 60],
  [1052, 110, 44],
  [1240, 118, 40],
  [1300, 120, 56],
  [1330, 120, 44],
  [1412, 120, 48],
];
const MIST_HIGH = [
  [210, 84, 200, 9],
  [620, 80, 230, 10],
  [1060, 88, 210, 8],
  [1380, 82, 170, 8],
];
const MIST_LOW = [
  [120, 122, 180, 7],
  [560, 124, 220, 6],
  [960, 120, 200, 7],
  [1340, 124, 170, 6],
];
const STARS = [
  [40, 30],
  [170, 14],
  [330, 40],
  [480, 20],
  [640, 46],
  [820, 16],
  [990, 36],
  [1180, 12],
  [1290, 44],
  [1420, 22],
];
// Dã quỳ clusters on the near slope: [x, sway delay].
const FLOWERS = [
  [150, "0s"],
  [330, "-1.6s"],
  [600, "-0.8s"],
  [830, "-2.4s"],
  [1160, "-1.1s"],
  [1360, "-3s"],
] as const;
const BLOOMS = [
  { dx: -7, h: 14 },
  { dx: 0, h: 21 },
  { dx: 7, h: 11 },
];

/** A three-tier pine silhouette standing on (x, y). */
function pinePath([x, y, h]: number[]) {
  const w = h * 0.45;
  return (
    `M${x} ${y - h}L${x + w * 0.3} ${y - h * 0.66}H${x + w * 0.16}L${x + w * 0.42} ${y - h * 0.34}H${x + w * 0.26}` +
    `L${x + w * 0.5} ${y - h * 0.06}H${x + w * 0.06}V${y}H${x - w * 0.06}V${y - h * 0.06}H${x - w * 0.5}` +
    `L${x - w * 0.26} ${y - h * 0.34}H${x - w * 0.42}L${x - w * 0.16} ${y - h * 0.66}H${x - w * 0.3}Z`
  );
}

function Mist({ bands, reverse }: { bands: number[][]; reverse?: boolean }) {
  return (
    <g className="anim-drift" style={{ opacity: "var(--mist-o)", animationDirection: reverse ? "alternate-reverse" : undefined }}>
      {bands.map(([cx, cy, rx, ry]) => (
        <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#dalat-mist)" />
      ))}
    </g>
  );
}

/** A French villa: mansard roof, chimney, dormer and three tall windows. Origin is the bottom-left corner. */
function Villa({ x, y, scale, wall }: { x: number; y: number; scale: number; wall: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="38" y="-50" width="6" height="14" style={{ fill: "var(--roof)" }} />
      <path d="M-3-26L9-44H47L59-26Z" style={{ fill: "var(--roof)" }} />
      <rect y="-28" width="56" height="28" style={{ fill: wall }} />
      <g style={{ fill: "var(--win)" }}>
        <rect x="24" y="-39" width="8" height="8" rx="4" />
        <rect x="7" y="-22" width="8" height="12" rx="3" />
        <rect x="24" y="-22" width="8" height="12" rx="3" />
        <rect x="41" y="-22" width="8" height="12" rx="3" />
      </g>
    </g>
  );
}

function Flowers({ x, delay }: { x: number; delay: string }) {
  const ground = 128;
  return (
    <g className="anim-sway" style={{ transformOrigin: `${x}px ${ground}px`, animationDelay: delay }}>
      {BLOOMS.map(({ dx, h }) => (
        <g key={dx}>
          <path d={`M${x} ${ground}Q${x + dx * 0.4} ${ground - h / 2} ${x + dx} ${ground - h}`} fill="none" stroke="#5E8A4E" strokeWidth="1.4" />
          <circle cx={x + dx} cy={ground - h} r="3.4" fill="none" strokeWidth="3.6" strokeDasharray="1.9 1.2" style={{ stroke: "var(--flower)" }} />
          <circle cx={x + dx} cy={ground - h} r="1.9" fill="#7A4A12" />
        </g>
      ))}
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
      <path d={FAR_PINES.map(pinePath).join("")} style={{ fill: "var(--pine-far)" }} />
      <path d={FAR_RIDGE} style={{ fill: "var(--hill)" }} />
      <Mist bands={MIST_HIGH} />
      <Villa x={650} y={117} scale={0.85} wall="var(--wall)" />
      <Villa x={1170} y={115} scale={0.65} wall="var(--wall2)" />
      <path d={NEAR_PINES.map(pinePath).join("")} style={{ fill: "var(--pine)" }} />
      <path d={NEAR_RIDGE} style={{ fill: "var(--pine)" }} />
      {FLOWERS.map(([x, delay]) => (
        <Flowers key={x} x={x} delay={delay} />
      ))}
      <Mist bands={MIST_LOW} reverse />
    </g>
  );
}

export function DalatScene() {
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(var(--sky1), var(--sky2))" }}>
      <svg
        width={OFFSETS.length * TILE}
        height="132"
        viewBox={`0 0 ${OFFSETS.length * TILE} 132`}
        className="absolute top-0 left-1/2 max-w-none -translate-x-1/2"
      >
        <defs>
          <radialGradient id="dalat-mist">
            <stop offset="0" style={{ stopColor: "var(--mist)" }} />
            <stop offset="1" style={{ stopColor: "var(--mist)", stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <circle className="anim-lit" cx={TILE + 1100} cy="34" r="16" style={{ fill: "var(--orb)" }} />
        {OFFSETS.map((dx) => (
          <Tile key={dx} dx={dx} />
        ))}
      </svg>
    </div>
  );
}
