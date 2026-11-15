import { barreRanges, tabOf, type Position } from "@/lib/chords";

const SX = 24; // string spacing
const FY = 26; // fret spacing
const LEFT = 24; // room for the "5fr" label
const TOP = 22; // room for × / ○ marks
const ROWS = 5;
const R = 8.5;
const W = LEFT + 5 * SX + 12;
const H = TOP + ROWS * FY + 8;

export function ChordDiagram({
  name,
  position,
  scale = 1,
  color = "var(--link)",
  showFingers = false,
}: {
  name: string;
  position: Position;
  scale?: number;
  color?: string;
  showFingers?: boolean;
}) {
  const { frets, fingers = [], baseFret } = position;
  const spans = barreRanges(position);
  const underBarre = (i: number, f: number) => spans.some((s) => s.fret === f && i >= s.from && i <= s.to);
  const ink = "var(--ink)";

  return (
    <svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Thế bấm ${name}: ${tabOf(position)}`}>
      {Array.from({ length: ROWS + 1 }, (_, j) => (
        <rect key={`f${j}`} x={LEFT} y={TOP + j * FY - (j === 0 && baseFret === 1 ? 2 : 0.5)} width={5 * SX} height={j === 0 && baseFret === 1 ? 4 : 1} style={{ fill: ink }} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`s${i}`} x={LEFT + i * SX - 0.6} y={TOP} width={1.2} height={ROWS * FY} style={{ fill: ink }} />
      ))}
      {baseFret > 1 && (
        <text x={LEFT - 6} y={TOP + FY / 2 + 4} textAnchor="end" fontSize="11" fontWeight="700" style={{ fill: "var(--soft)" }}>
          {baseFret}fr
        </text>
      )}
      {spans.map((s) => (
        <g key={`b${s.fret}`}>
          <rect x={LEFT + s.from * SX - R} y={TOP + (s.fret - 0.5) * FY - R} width={(s.to - s.from) * SX + 2 * R} height={2 * R} rx={R} style={{ fill: color }} />
          {showFingers && fingers[s.from] > 0 && (
            <text x={LEFT + s.from * SX} y={TOP + (s.fret - 0.5) * FY + 4} textAnchor="middle" fontSize="11" fontWeight="800" style={{ fill: "var(--surface)" }}>
              {fingers[s.from]}
            </text>
          )}
        </g>
      ))}
      {frets.map((f, i) => {
        const x = LEFT + i * SX;
        if (f < 0)
          return (
            <text key={i} x={x} y={TOP - 7} textAnchor="middle" fontSize="13" style={{ fill: "var(--soft)" }}>
              ×
            </text>
          );
        if (f === 0) return <circle key={i} cx={x} cy={TOP - 11} r={4.5} fill="none" style={{ stroke: "var(--soft)" }} strokeWidth="1.4" />;
        if (underBarre(i, f)) return null;
        const y = TOP + (f - 0.5) * FY;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={R} style={{ fill: color }} />
            {showFingers && fingers[i] > 0 && (
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" style={{ fill: "var(--surface)" }}>
                {fingers[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
