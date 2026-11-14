import { tabOf, type Position } from "@/lib/chords";

const SX = 24; // string spacing
const FY = 26; // fret spacing
const LEFT = 24; // room for the "5fr" label
const TOP = 22; // room for × / ○ marks
const ROWS = 5;
const R = 8.5;
const W = LEFT + 5 * SX + 12;
const H = TOP + ROWS * FY + 8;

function barreSpan(frets: number[], fret: number): [number, number] | null {
  const idx = frets.flatMap((f, i) => (f === fret ? [i] : []));
  return idx.length > 1 ? [idx[0], idx[idx.length - 1]] : null;
}

export function ChordDiagram({
  name,
  position,
  scale = 1,
  color = "#2f6b47",
  showFingers = false,
}: {
  name: string;
  position: Position;
  scale?: number;
  color?: string;
  showFingers?: boolean;
}) {
  const { frets, fingers = [], barres, baseFret } = position;
  const spans = barres.flatMap((b) => {
    const s = barreSpan(frets, b);
    return s ? [{ fret: b, from: s[0], to: s[1] }] : [];
  });
  const underBarre = (i: number, f: number) => spans.some((s) => s.fret === f && i >= s.from && i <= s.to);
  const ink = "#2a3b31";

  return (
    <svg width={W * scale} height={H * scale} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Thế bấm ${name}: ${tabOf(position)}`}>
      {Array.from({ length: ROWS + 1 }, (_, j) => (
        <rect key={`f${j}`} x={LEFT} y={TOP + j * FY - (j === 0 && baseFret === 1 ? 2 : 0.5)} width={5 * SX} height={j === 0 && baseFret === 1 ? 4 : 1} fill={ink} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`s${i}`} x={LEFT + i * SX - 0.6} y={TOP} width={1.2} height={ROWS * FY} fill={ink} />
      ))}
      {baseFret > 1 && (
        <text x={LEFT - 6} y={TOP + FY / 2 + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="#52675a">
          {baseFret}fr
        </text>
      )}
      {spans.map((s) => (
        <g key={`b${s.fret}`}>
          <rect x={LEFT + s.from * SX - R} y={TOP + (s.fret - 0.5) * FY - R} width={(s.to - s.from) * SX + 2 * R} height={2 * R} rx={R} fill={color} />
          {showFingers && fingers[s.from] > 0 && (
            <text x={LEFT + s.from * SX} y={TOP + (s.fret - 0.5) * FY + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
              {fingers[s.from]}
            </text>
          )}
        </g>
      ))}
      {frets.map((f, i) => {
        const x = LEFT + i * SX;
        if (f < 0)
          return (
            <text key={i} x={x} y={TOP - 7} textAnchor="middle" fontSize="13" fill="#52675a">
              ×
            </text>
          );
        if (f === 0) return <circle key={i} cx={x} cy={TOP - 11} r={4.5} fill="none" stroke="#52675a" strokeWidth="1.4" />;
        if (underBarre(i, f)) return null;
        const y = TOP + (f - 0.5) * FY;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={R} fill={color} />
            {showFingers && fingers[i] > 0 && (
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
                {fingers[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
