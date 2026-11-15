// Phú Yên scene strip: the sun rising out of the sea by day, a moon, stars and squid-boat lights by night; Gành Đá Đĩa's basalt
// columns, thúng chai bobbing on the water, Mũi Điện's lighthouse on a grassy headland and Tháp Nhạn on its hill, yellow flowers on green grass.
// Day/night differences come only from the scene tokens (--sky1/2, --orb, --sun, --star, --gull, --far, --sea1/2, --wave, --wave-o, --sand,
// --grass, --grass2, --rock, --rock-top, --tower, --band, --lamp, --beam, --brick, --brick-dark, --boat, --weave, --lamp-o, --flower).
// Phones see only the middle ~360px of a tile (x ≈ 540–900), so the columns, the sunrise, a thúng chai and the lighthouse sit there.

const TILE = 1440; // the art repeats every 1440px so wide screens never show an empty edge
const OFFSETS = [0, TILE, 2 * TILE];
const HORIZON = 70;

const FAR_HILLS = "M30 70C70 62 100 52 140 50S210 58 250 64S300 68 320 70ZM1180 70C1210 66 1240 60 1270 61S1330 67 1360 70Z";
const SAND = "M0 126C120 122 240 128 360 125S600 122 720 126S960 129 1080 125S1320 122 1440 126V132H0Z";
const FOAM = "M0 125C120 121 240 127 360 124S600 121 720 125S960 128 1080 124S1320 121 1440 125";
const HEADLAND = "M752 132C784 120 804 104 834 98C856 93 886 91 906 97C932 105 954 120 996 132Z";
const TOWER_HILL = "M1030 132C1074 112 1112 100 1160 99S1252 110 1300 132Z";

const LIGHTHOUSE = { x: 870, base: 93 };
const LAMP_Y = 56;
const TOWER = { x: 1160, base: 100 };

// Gành Đá Đĩa: [x, top y, width] of each basalt column, left to right.
const COLUMNS = [
  [546, 106, 12],
  [557, 97, 13],
  [569, 90, 12],
  [580, 99, 13],
  [592, 93, 12],
  [603, 103, 13],
  [615, 110, 12],
  [626, 116, 12],
  [1318, 112, 11],
  [1328, 104, 12],
  [1339, 109, 11],
  [1349, 116, 11],
];
// Thúng chai (round basket boats): [x, waterline y, bob delay].
const BASKETS = [
  [728, 108, "0s"],
  [452, 100, "-1.1s"],
  [1004, 112, "-1.9s"],
] as const;
const STARS = [
  [36, 18],
  [150, 40],
  [282, 14],
  [404, 34],
  [520, 12],
  [690, 22],
  [760, 44],
  [946, 16],
  [1072, 38],
  [1212, 14],
  [1300, 40],
  [1412, 24],
];
// Squid boats' lamps strung along the horizon at night.
const BOAT_LIGHTS = [96, 208, 352, 520, 660, 790, 1060, 1236, 1388];
const GLINTS = [
  [672, 80, 36],
  [680, 88, 22],
  [664, 96, 30],
  [690, 104, 16],
];
const WAVES = [
  [40, 84, 60],
  [230, 96, 48],
  [420, 82, 40],
  [560, 78, 44],
  [760, 86, 52],
  [930, 80, 40],
  [1100, 92, 56],
  [1290, 84, 44],
  [380, 114, 50],
  [1180, 116, 46],
];
const GULLS = [
  [300, 30],
  [324, 40],
  [610, 34],
  [1000, 24],
  [1250, 34],
];
// Yellow flowers scattered on the grass: [x, y].
const SPECKS = [
  [790, 118],
  [806, 110],
  [822, 122],
  [846, 104],
  [902, 104],
  [920, 112],
  [936, 120],
  [954, 126],
  [1066, 122],
  [1094, 114],
  [1120, 108],
  [1200, 106],
  [1228, 112],
  [1256, 120],
  [1278, 127],
];
// Taller flower clumps that sway: [x, ground y, sway delay].
const CLUMPS = [
  [814, 124, "0s"],
  [894, 112, "-1.4s"],
  [940, 128, "-2.6s"],
  [1104, 122, "-0.9s"],
  [1244, 124, "-2s"],
] as const;
const BLOOMS = [
  { dx: -5, h: 10 },
  { dx: 1, h: 15 },
  { dx: 6, h: 8 },
];
const PETALS = [0, 72, 144, 216, 288].map((deg) => [Math.sin((deg * Math.PI) / 180) * 2, -Math.cos((deg * Math.PI) / 180) * 2]);

/** A hexagonal basalt column: flattened hexagon top, shaded right face, running down past the strip. */
function Column({ x, top, w }: { x: number; top: number; w: number }) {
  return (
    <g>
      <rect x={x} y={top} width={w} height={132 - top} style={{ fill: "var(--rock)" }} />
      <rect x={x + w * 0.7} y={top} width={w * 0.3} height={132 - top} fill="#000000" fillOpacity=".18" />
      <path
        d={`M${x} ${top}L${x + w * 0.25} ${top - 3}H${x + w * 0.75}L${x + w} ${top}L${x + w * 0.75} ${top + 3}H${x + w * 0.25}Z`}
        style={{ fill: "var(--rock-top)" }}
      />
    </g>
  );
}

/** A thúng chai with a fisherman and a lamp that lights up at night, bobbing on the water. */
function Basket({ x, y, delay }: { x: number; y: number; delay: string }) {
  return (
    <g>
      <path d={`M${x - 10} ${y + 4}h20`} strokeWidth="1.6" strokeLinecap="round" style={{ stroke: "var(--lamp)", opacity: "calc(var(--lamp-o) * .5)" }} />
      <g className="anim-bob" style={{ animationDelay: delay }}>
        <path d={`M${x + 8} ${y - 1}V${y - 17}`} stroke="#2B2A28" strokeWidth="1" />
        <circle className="anim-lit" cx={x + 8} cy={y - 18} r="2.2" style={{ fill: "var(--lamp)", opacity: "var(--lamp-o)", animationDelay: delay }} />
        <circle cx={x - 2} cy={y - 13} r="2.4" fill="#2B2A28" />
        <path d={`M${x - 6} ${y - 11}l4-3 4 3z`} fill="#E9C46A" />
        <path d={`M${x - 2} ${y - 10}V${y - 2}M${x - 2} ${y - 7}L${x + 5} ${y - 4}L${x + 9} ${y + 6}`} stroke="#2B2A28" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d={`M${x - 13} ${y - 2}Q${x} ${y + 12} ${x + 13} ${y - 2}Z`} style={{ fill: "var(--boat)" }} />
        <path d={`M${x - 8} ${y + 1}l6 5M${x - 2} ${y}l6 6M${x + 4} ${y}l5 4M${x + 8} ${y}l-6 6M${x + 2} ${y}l-6 6`} strokeWidth=".9" style={{ stroke: "var(--weave)" }} />
        <ellipse cx={x} cy={y - 2} rx="13" ry="2.4" style={{ fill: "var(--weave)" }} />
      </g>
    </g>
  );
}

/** Mũi Điện's lighthouse and its keeper's house; at night the lamp glows and two beams sway gently. */
function Lighthouse() {
  const { x, base } = LIGHTHOUSE;
  // The tower tapers from 12px wide at its base to 8px under the gallery (y 62).
  const half = (y: number) => 4 + ((y - 62) / (base - 62)) * 2;
  const band = (y1: number, y2: number) => `M${x - half(y1)} ${y1}H${x + half(y1)}L${x + half(y2)} ${y2}H${x - half(y2)}Z`;
  return (
    <g>
      <g className="anim-sway" style={{ transformOrigin: `${x}px ${LAMP_Y}px`, opacity: "var(--beam)" }}>
        <path d={`M${x} ${LAMP_Y - 2}L${x - 210} ${LAMP_Y - 18}V${LAMP_Y + 12}Z`} fill="url(#phuyen-beam-l)" />
        <path d={`M${x} ${LAMP_Y - 2}L${x + 170} ${LAMP_Y - 16}V${LAMP_Y + 10}Z`} fill="url(#phuyen-beam-r)" />
      </g>
      <rect x={x + 9} y={base - 9} width="16" height="10" style={{ fill: "var(--tower)" }} />
      <path d={`M${x + 7} ${base - 8}l10-6 10 6z`} style={{ fill: "var(--band)" }} />
      <rect x={x + 15} y={base - 6} width="4" height="4" style={{ fill: "var(--lamp)", opacity: "var(--lamp-o)" }} />
      <path d={`M${x - 6} ${base}L${x - 4} 62H${x + 4}L${x + 6} ${base}Z`} style={{ fill: "var(--tower)" }} />
      <g style={{ fill: "var(--band)" }}>
        <path d={band(70, 75)} />
        <path d={band(81, 86)} />
      </g>
      <rect x={x - 2} y={base - 6} width="4" height="6" rx="2" fill="#2B3A44" />
      <rect x={x - 6} y="60" width="12" height="2.5" fill="#2B3A44" />
      <rect className="anim-lit" x={x - 3.5} y={LAMP_Y - 3} width="7" height="7" style={{ fill: "var(--lamp)" }} />
      <path d={`M${x - 5} ${LAMP_Y - 3}Q${x} ${LAMP_Y - 10} ${x + 5} ${LAMP_Y - 3}Z`} fill="#2B3A44" />
    </g>
  );
}

/** Tháp Nhạn: a Cham brick tower with three diminishing tiers. */
function ChamTower() {
  const { x, base } = TOWER;
  return (
    <g>
      <path d={`M${x - 10} ${base}V${base - 24}H${x + 10}V${base}Z`} style={{ fill: "var(--brick)" }} />
      <path d={`M${x - 8} ${base - 24}V${base - 32}H${x + 8}V${base - 24}ZM${x - 6} ${base - 32}V${base - 38}H${x + 6}V${base - 32}ZM${x - 4} ${base - 38}V${base - 43}H${x + 4}V${base - 38}ZM${x - 2.5} ${base - 43}L${x} ${base - 50}L${x + 2.5} ${base - 43}Z`} style={{ fill: "var(--brick)" }} />
      <g style={{ fill: "var(--brick-dark)" }}>
        <path d={`M${x - 3.5} ${base}V${base - 10}Q${x} ${base - 15} ${x + 3.5} ${base - 10}V${base}Z`} />
        <rect x={x - 10} y={base - 25} width="20" height="2" />
        <rect x={x - 8} y={base - 33} width="16" height="1.6" />
        <rect x={x - 6} y={base - 39} width="12" height="1.4" />
        <rect x={x - 8} y={base - 22} width="1.6" height="22" />
        <rect x={x + 6.4} y={base - 22} width="1.6" height="22" />
      </g>
    </g>
  );
}

function Flowers({ x, ground, delay }: { x: number; ground: number; delay: string }) {
  return (
    <g className="anim-sway" style={{ transformOrigin: `${x}px ${ground}px`, animationDelay: delay }}>
      {BLOOMS.map(({ dx, h }) => (
        <g key={dx}>
          <path d={`M${x} ${ground}Q${x + dx * 0.3} ${ground - h / 2} ${x + dx} ${ground - h}`} fill="none" stroke="#3F7F35" strokeWidth="1.2" />
          <g style={{ fill: "var(--flower)" }}>
            {PETALS.map(([px, py]) => (
              <circle key={`${px}${py}`} cx={x + dx + px} cy={ground - h + py} r="1.5" />
            ))}
          </g>
          <circle cx={x + dx} cy={ground - h} r="1" fill="#E8664A" />
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
          <circle key={i} className="anim-twinkle" style={{ animationDelay: `${-0.43 * i}s` }} cx={cx} cy={cy} r="1.3" fill="#F4F1DE" />
        ))}
      </g>
      <g className="anim-drift" style={{ opacity: "var(--gull)" }} fill="none" stroke="#3E5A63" strokeWidth="1.3" strokeLinecap="round">
        {GULLS.map(([x, y]) => (
          <path key={x} d={`M${x} ${y}q4-4 7 0q3-4 7 0`} />
        ))}
      </g>
      <path d={FAR_HILLS} style={{ fill: "var(--far)" }} />
      <rect y={HORIZON} width={TILE} height={132 - HORIZON} fill="url(#phuyen-sea)" />
      <g style={{ opacity: "var(--star)" }}>
        {BOAT_LIGHTS.map((x, i) => (
          <circle key={x} className="anim-twinkle" style={{ animationDelay: `${-0.6 * i}s`, fill: "var(--lamp)" }} cx={x} cy={HORIZON + 3} r="1.2" />
        ))}
      </g>
      <g style={{ opacity: "var(--sun)" }} stroke="#FFF1D6" strokeWidth="2" strokeLinecap="round">
        {GLINTS.map(([x, y, w], i) => (
          <path key={y} className="anim-twinkle" style={{ animationDelay: `${-0.6 * i}s` }} d={`M${x} ${y}h${w}`} />
        ))}
      </g>
      <g className="anim-drift" style={{ opacity: "var(--wave-o)" }} fill="none" strokeWidth="1.4" strokeLinecap="round">
        {WAVES.map(([x, y, w]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y}q${w / 4}-3 ${w / 2} 0t${w / 2} 0`} style={{ stroke: "var(--wave)" }} />
        ))}
      </g>
      {BASKETS.map(([x, y, delay]) => (
        <Basket key={x} x={x} y={y} delay={delay} />
      ))}
      <path d={SAND} style={{ fill: "var(--sand)" }} />
      <path d={FOAM} fill="none" strokeWidth="1.6" style={{ stroke: "var(--wave)", opacity: "var(--wave-o)" }} />
      {COLUMNS.map(([x, top, w]) => (
        <Column key={x} x={x} top={top} w={w} />
      ))}
      <path d={TOWER_HILL} style={{ fill: "var(--grass2)" }} />
      <ChamTower />
      <Lighthouse />
      <path d={HEADLAND} style={{ fill: "var(--grass)" }} />
      <g style={{ fill: "var(--flower)" }}>
        {SPECKS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="1.6" />
        ))}
      </g>
      {CLUMPS.map(([x, ground, delay]) => (
        <Flowers key={x} x={x} ground={ground} delay={delay} />
      ))}
    </g>
  );
}

export function PhuyenScene() {
  return (
    <div className="absolute inset-0" style={{ background: `linear-gradient(var(--sky1), var(--sky2) ${HORIZON}px)` }}>
      <svg
        width={OFFSETS.length * TILE}
        height="132"
        viewBox={`0 0 ${OFFSETS.length * TILE} 132`}
        className="absolute top-0 left-1/2 max-w-none -translate-x-1/2"
      >
        <defs>
          <linearGradient id="phuyen-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--sea1)" }} />
            <stop offset="1" style={{ stopColor: "var(--sea2)" }} />
          </linearGradient>
          <linearGradient id="phuyen-beam-l" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" style={{ stopColor: "var(--lamp)", stopOpacity: 0.9 }} />
            <stop offset="1" style={{ stopColor: "var(--lamp)", stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="phuyen-beam-r" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "var(--lamp)", stopOpacity: 0.9 }} />
            <stop offset="1" style={{ stopColor: "var(--lamp)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <circle cx={TILE + 600} cy="26" r="11" fill="#F4F1DE" style={{ opacity: "var(--star)" }} />
        {/* The first sunrise: the sea, drawn over it by the tiles, hides its lower half. */}
        <circle className="anim-lit" cx={TILE + 690} cy={HORIZON} r="20" style={{ fill: "var(--orb)", opacity: "var(--sun)" }} />
        {OFFSETS.map((dx) => (
          <Tile key={dx} dx={dx} />
        ))}
      </svg>
    </div>
  );
}
