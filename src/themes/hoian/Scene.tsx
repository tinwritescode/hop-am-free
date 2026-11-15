// Hội An scene strip: swaying lanterns, sun and clouds by day, moon and stars by night, over a repeating old-town roofline.
// Day/night differences come only from the scene tokens (--orb, --cloud, --star, --wall, --roof, --win, --sky1/2).

const TILE = 1440; // the sky art repeats every 1440px so wide screens never show an empty edge
const OFFSETS = [0, TILE, 2 * TILE];

const LANTERNS = [
  { x: 110, cord: 18, color: "#F7B538", delay: "0s" },
  { x: 290, cord: 34, color: "#F2785C", delay: "-1.3s" },
  { x: 470, cord: 14, color: "#F6B8CC", delay: "-2.1s" },
  { x: 660, cord: 30, color: "#F7B538", delay: "-0.7s" },
  { x: 850, cord: 12, color: "#F2785C", delay: "-2.8s" },
  { x: 1030, cord: 36, color: "#F7B538", delay: "-1.9s" },
  { x: 1330, cord: 20, color: "#F6B8CC", delay: "-0.4s" },
];
const STARS = [
  [60, 50],
  [210, 22],
  [380, 60],
  [560, 18],
  [760, 54],
  [940, 24],
  [1110, 62],
  [1260, 14],
  [1400, 48],
];
const CLOUDS = [
  [240, 52, 46, 12],
  [272, 44, 30, 12],
  [760, 34, 40, 10],
  [790, 27, 26, 10],
  [1340, 70, 36, 9],
];

function Lantern({ x, cord, color, delay }: (typeof LANTERNS)[number]) {
  const cy = cord + 14;
  return (
    <g className="anim-sway" style={{ transformOrigin: `${x}px 0px`, animationDelay: delay }}>
      <path d={`M${x} 0v${cord}`} stroke="#8C5A86" strokeWidth="1.2" />
      <g className="anim-lit" style={{ animationDelay: delay }}>
        <ellipse cx={x} cy={cy} rx="11" ry="14" fill={color} />
        <path d={`M${x - 5} ${cord + 3}q5 11 0 22M${x + 5} ${cord + 3}q-5 11 0 22`} fill="none" stroke="#3A1B3E" strokeOpacity=".25" />
      </g>
      <rect x={x - 5} y={cord - 1} width="10" height="3" rx="1" fill="#522A57" />
      <rect x={x - 5} y={cord + 26} width="10" height="3" rx="1" fill="#522A57" />
      <path d={`M${x} ${cord + 29}v10`} stroke={color} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function SkyTile({ dx }: { dx: number }) {
  return (
    <g transform={`translate(${dx},0)`}>
      <g style={{ opacity: "var(--star)" }}>
        {STARS.map(([cx, cy], i) => (
          <circle key={i} className="anim-twinkle" style={{ animationDelay: `${-0.37 * i}s` }} cx={cx} cy={cy} r="1.4" fill="#FBEFD9" />
        ))}
      </g>
      <g className="anim-drift" style={{ opacity: "var(--cloud)" }} fill="#FFFFFF">
        {CLOUDS.map(([cx, cy, rx, ry], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />
        ))}
      </g>
      {LANTERNS.map((l) => (
        <Lantern key={l.x} {...l} />
      ))}
    </g>
  );
}

export function HoianScene() {
  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(var(--sky1), var(--sky2))" }}>
      <svg
        width={OFFSETS.length * TILE}
        height="132"
        viewBox={`0 0 ${OFFSETS.length * TILE} 132`}
        className="absolute top-0 left-1/2 max-w-none -translate-x-1/2"
      >
        <circle className="anim-lit" cx={TILE + 1190} cy="46" r="22" style={{ fill: "var(--orb)" }} />
        {OFFSETS.map((dx) => (
          <SkyTile key={dx} dx={dx} />
        ))}
      </svg>
      <svg width="100%" height="56" className="absolute bottom-0 left-0">
        <defs>
          <pattern id="hoian-roofline" width="1194" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M0 56V40l30-12 30 12v-6h60l24-10 24 10h50V30l40-14 40 14v10h70l28-12 28 12v-4h80l34-14 34 14v8h60V32l30-10 30 10v8h90l24-12 24 12V32h70l36-14 36 14v8h50l26-10 26 10V34h60l30-12 30 12v22z"
              style={{ fill: "var(--wall)" }}
            />
            <path
              d="M0 40l30-12 30 12zM120 34l24-10 24 10zM218 30l40-14 40 14zM368 40l28-12 28 12zM504 36l34-14 34 14zM632 32l30-10 30 10zM782 40l24-12 24 12zM900 32l36-14 36 14zM1022 40l26-10 26 10zM1134 34l30-12 30 12z"
              style={{ fill: "var(--roof)" }}
            />
            <g style={{ fill: "var(--win)" }}>
              <rect x="244" y="36" width="8" height="10" />
              <rect x="264" y="36" width="8" height="10" />
              <rect x="530" y="40" width="8" height="10" />
              <rect x="928" y="38" width="8" height="10" />
              <rect x="948" y="38" width="8" height="10" />
              <rect x="1158" y="40" width="8" height="10" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="56" fill="url(#hoian-roofline)" />
      </svg>
    </div>
  );
}
